// Comprehensive Security, Tenancy Isolation & Specification Compliance Test Suite
// Tests:
// - Rate limiting on authentication endpoints
// - Role & Tenant-bound session verification
// - Query-level tenancy isolation (zero row leakage between org_demo_alpha & org_demo_bravo)
// - Cross-tenant direct access prevention & 403 PERMISSION_DENIED detection
// - Secure file upload validation (MIME whitelisting, 10MB limit, non-guessable paths)
// - Input sanitization preventing XSS / script injection
// - 5 Dispositions (restock, refurbish, liquidate, dispose, pending_review)
// - Amazon condition scale vs raw observed_state separation
// - Fail-open resilience & model timeout handling
// - Single batched model call efficiency
// - Official 14-field evidence contract validation with sha256 hash

import { batchInspectReturn } from './src/services/aiInspector.js';
import { PRD_TEST_SCENARIOS } from './src/data/testScenarios.js';
import { PRODUCT_CATALOGUE } from './src/data/catalogue.js';
import { generateEvidenceRecord } from './src/services/evidenceContract.js';
import { INITIAL_RETURNS_LOG, OBSERVED_STATES, AMAZON_CONDITIONS, DISPOSITION_DEFINITIONS } from './src/data/seedReturns.js';
import {
  authenticateUser,
  verifySession,
  getTenantReturns,
  getTenantReturnById,
  verifyTenantImageAccess,
  validateAndStageUpload,
  sanitizeInput
} from './src/services/authAndStorage.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function runTests() {
  console.log("\n================================================================================");
  console.log("RETURNS MANAGER: SECURITY, TENANCY ISOLATION & COMPLIANCE TEST SUITE");
  console.log("================================================================================\n");

  // 1. Security: Authentication & Rate Limiting
  console.log("1. Testing Authentication & Rate Limiting Security (Section 1)...");
  const authSuccess = authenticateUser("op_fatima", "OperatorPass123!");
  assert(authSuccess.success === true, "Valid operator credentials authenticate successfully");
  assert(authSuccess.session.org_id === "org_demo_alpha", "Session is cryptographically bound to org_demo_alpha");
  assert(authSuccess.session.role === "operator", "Session role correctly reflects 'operator'");

  const badAuth = authenticateUser("op_fatima", "WrongPassword!");
  assert(badAuth.success === false, "Bad password rejected");

  // Rate limiting check
  let lockedOut = false;
  for (let i = 0; i < 6; i++) {
    const res = authenticateUser("attacker_test", "BadPass123!");
    if (!res.success && res.error.includes("Locked out")) {
      lockedOut = true;
    }
  }
  assert(lockedOut, "Rate limiting active: multiple consecutive failed attempts lock account");

  // 2. Query-Level Tenancy Isolation (Priority 0 & Section 1)
  console.log("\n2. Testing Query-Level Tenancy Isolation (org_demo_alpha vs org_demo_bravo)...");
  const alphaSession = authSuccess.session;
  const bravoAuth = authenticateUser("op_chen", "OperatorPass123!");
  const bravoSession = bravoAuth.session;

  const alphaData = getTenantReturns(alphaSession, INITIAL_RETURNS_LOG);
  const bravoData = getTenantReturns(bravoSession, INITIAL_RETURNS_LOG);

  assert(alphaData.error === null && alphaData.records.length > 0, "Alpha session retrieves alpha returns");
  assert(bravoData.error === null && bravoData.records.length > 0, "Bravo session retrieves bravo returns");

  // Verify ZERO row leakage
  assert(alphaData.records.every(r => r.org_id === "org_demo_alpha"), "Zero leakage: alpha query returns 100% alpha records");
  assert(bravoData.records.every(r => r.org_id === "org_demo_bravo"), "Zero leakage: bravo query returns 100% bravo records");

  // 3. Cross-Tenant Direct ID & Image Guessing Prevention (Section 1: Permission Denied)
  console.log("\n3. Testing Cross-Tenant Direct Key/Path Guessing Prevention...");
  // Attempting to access Bravo record RTN-0003 while signed into Alpha
  const crossTenantAttempt = getTenantReturnById(alphaSession, "RTN-0003", INITIAL_RETURNS_LOG);
  assert(crossTenantAttempt.status === 403, "Cross-tenant direct record lookup returns HTTP 403");
  assert(crossTenantAttempt.error === "PERMISSION_DENIED", "Triggers PERMISSION_DENIED security error");

  // Attempting to access Bravo image path while signed into Alpha
  const imageAccessCheck = verifyTenantImageAccess(alphaSession, "tenants/org_demo_bravo/vault/tok_b42c9d/UNIT-0003_img1.jpg");
  assert(imageAccessCheck.allowed === false, "Cross-tenant image path guessing blocked");
  assert(imageAccessCheck.reason.includes("PERMISSION_DENIED"), "Reason explicitly cites PERMISSION_DENIED");

  // Authorized image access check
  const authorizedImageCheck = verifyTenantImageAccess(alphaSession, "tenants/org_demo_alpha/vault/tok_a78f1e/UNIT-0014_img1.jpg");
  assert(authorizedImageCheck.allowed === true, "Authorized same-tenant image access allowed");

  // 4. Secure File Upload Validation (MIME Whitelist & 10MB limit)
  console.log("\n4. Testing File Upload Validation & Per-Org Storage...");
  // Valid file
  const validFile = { name: "return_box.jpg", type: "image/jpeg", size: 1024 * 1024 };
  const uploadValid = validateAndStageUpload(validFile, alphaSession, "UNIT-001");
  assert(uploadValid.valid === true, "Valid JPEG within size limit accepted");
  assert(uploadValid.tenant_path.startsWith("tenants/org_demo_alpha/"), "Image routed to tenant-isolated storage vault");

  // Oversized file (> 10MB)
  const oversizedFile = { name: "huge_scan.png", type: "image/png", size: 12 * 1024 * 1024 };
  const uploadOversized = validateAndStageUpload(oversizedFile, alphaSession, "UNIT-001");
  assert(uploadOversized.valid === false, "Oversized file (>10MB) rejected");
  assert(uploadOversized.error.includes("exceeds 10MB limit"), "Error explicitly mentions 10MB limit");

  // Disallowed MIME type (e.g. text/html, application/pdf, exe)
  const badMimeFile = { name: "exploit.exe", type: "application/x-msdownload", size: 5000 };
  const uploadBadMime = validateAndStageUpload(badMimeFile, alphaSession, "UNIT-001");
  assert(uploadBadMime.valid === false, "Unauthorized MIME type rejected");

  // 5. Input Sanitization (XSS Prevention)
  console.log("\n5. Testing Input Sanitization (XSS Protection)...");
  const dangerousScript = "<script>alert('xss')</script>";
  const cleanScript = sanitizeInput(dangerousScript);
  assert(!cleanScript.includes("<script>"), "Input sanitizer neutralizes <script> tags");
  assert(cleanScript.includes("&lt;script&gt;"), "Tags converted to safe HTML entities");

  // 6. 5 Dispositions Verification
  console.log("\n6. Checking 5 Valid Dispositions (including pending_review)...");
  const dispKeys = Object.keys(DISPOSITION_DEFINITIONS);
  assert(dispKeys.length === 5, "Exact 5 dispositions configured");
  assert(dispKeys.includes("restock"), "Includes 'restock'");
  assert(dispKeys.includes("refurbish"), "Includes 'refurbish'");
  assert(dispKeys.includes("liquidate"), "Includes 'liquidate'");
  assert(dispKeys.includes("dispose"), "Includes 'dispose'");
  assert(dispKeys.includes("pending_review"), "Includes 'pending_review'");

  // 7. Batched Model Execution Across PRD Scenarios
  console.log("\n7. Testing Batched Multimodal Analysis on All 10 Scenarios...");
  for (const scen of PRD_TEST_SCENARIOS) {
    const result = await batchInspectReturn({
      sku: scen.sku,
      orderId: scen.orderId,
      photos: scen.photos,
      scenarioId: scen.id
    });

    assert(result.batched_call === true, `Scenario ${scen.id}: Single batched model call executed`);
    assert(result.observed_state !== result.amazon_condition, `Scenario ${scen.id}: observed_state and amazon_condition are separated`);

    if (scen.id === 9) {
      assert(result.amazon_condition === "Uncertain", "Scenario 9 (Ambiguity): Yields amazon_condition 'Uncertain'");
      assert(result.disposition === "pending_review", "Scenario 9 (Ambiguity): Yields disposition 'pending_review'");
    } else if (scen.id === 10) {
      assert(result.identity === "UNCERTAIN", "Scenario 10 (Clone/Similar): Yields UNCERTAIN identity");
      assert(result.disposition === "pending_review", "Scenario 10: Inconclusive identity routes to pending_review");
    }
  }

  // 8. Fail-Open Architecture Testing (Rule 3)
  console.log("\n8. Testing Fail-Open Resilience (No Case Loss)...");
  const failOpen = await batchInspectReturn({
    sku: "SKU-HEADPHONE-BT",
    orderId: "ORD-FAILOPEN-01",
    photos: [{ url: "https://example.com/test.jpg" }],
    simulateFailure: true
  });
  assert(failOpen.disposition === "pending_review", "Fail-open moves case to 'pending_review'");
  assert(failOpen.confidence_note.includes("FAIL_OPEN"), "Fail-open preserves audit trail note");

  // 9. Official 14-Field Evidence Contract Schema Validation
  console.log("\n9. Testing Official 14-Field Evidence Contract Schema...");
  const contract = generateEvidenceRecord({
    recordId: "RTN-SEC-101",
    unitId: "UNIT-SEC-101",
    orgId: "org_demo_alpha",
    orderId: "ORD-SEC-101",
    sku: "SKU-HEADPHONE-BT",
    asin: "B09HEADPH1",
    productName: "AeroSound Pro Headphones",
    operatorId: "op_fatima",
    photos: [{ url: "https://example.com/f.jpg", tenant_path: "tenants/org_demo_alpha/vault/tok_a78f1e/img1.jpg" }],
    inspectionResult: {
      identity: "PASS",
      identity_basis: "Verified specs",
      completeness: "PASS",
      missing: [],
      observed_state: "factory_sealed",
      amazon_condition: "New",
      condition_basis: "Pristine",
      disposition: "restock",
      evidence: ["Visual alignment confirmed"]
    }
  });

  const officialFields = [
    "record_id", "schema_version", "organization_id", "client_id", "agent",
    "subject", "captured_at", "operator_label", "images", "checks",
    "outcome", "overrides", "status", "content_hash"
  ];

  for (const field of officialFields) {
    assert(contract[field] !== undefined, `Contract includes official field: '${field}'`);
  }

  // 10. Immutable Overrides History
  console.log("\n10. Testing Immutable Override History...");
  const overriddenContract = generateEvidenceRecord({
    recordId: "RTN-OVER-999",
    unitId: "UNIT-OVER-999",
    orgId: "org_demo_alpha",
    orderId: "ORD-OVER-999",
    sku: "SKU-HEADPHONE-BT",
    productName: "AeroSound Pro Headphones",
    operatorId: "op_fatima",
    inspectionResult: {
      identity: "PASS",
      completeness: "PASS",
      missing: [],
      observed_state: "factory_sealed",
      amazon_condition: "New",
      disposition: "restock",
      evidence: ["Match confirmed"]
    },
    overrides: {
      original_verdict: "restock",
      revised_verdict: "refurbish",
      reason: "Outer sleeve shows handling scuffs, needs clean polybag",
      operator_id: "op_chen",
      timestamp: "2026-09-26T00:45:00Z"
    }
  });

  assert(overriddenContract.status === "OVERRIDDEN", "Status is 'OVERRIDDEN'");
  assert(overriddenContract.overrides.original_verdict === "restock", "Preserved original verdict");
  assert(overriddenContract.overrides.revised_verdict === "refurbish", "Preserved revised verdict");
  assert(overriddenContract.overrides.reason.includes("sleeve"), "Preserved reason");

  console.log("\n================================================================================");
  console.log(`TOTAL SECURITY & COMPLIANCE TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
