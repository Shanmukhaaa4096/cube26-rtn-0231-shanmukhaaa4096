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

  // 11. Operational Verification of Specification #16 (Real AI Agent Behavior)
  console.log("\n11. Testing Specification #16 Operational Real-World Scenarios...");

  // Case 1: Correct product + complete + pristine -> restock
  const op1 = await batchInspectReturn({
    sku: "SKU-HEADPHONE-BT",
    orderId: "ORD-OP-01",
    photos: [
      { url: "https://example.com/p1.jpg", label: "Front view sealed retail box with unbroken factory seals" },
      { url: "https://example.com/p2.jpg", label: "Accessory check - USB-C, 3.5mm cable, manual laid out" }
    ]
  });
  assert(op1.identity === "PASS" && op1.completeness === "PASS" && op1.disposition === "restock", "OpCase 1: Pristine + Complete -> restock");

  // Case 2: Correct product + missing accessory -> refurbish
  const op2 = await batchInspectReturn({
    sku: "SKU-HEADPHONE-BT",
    orderId: "ORD-OP-02",
    photos: [
      { url: "https://example.com/p1.jpg", label: "Headphones in opened box, clean condition" },
      { url: "https://example.com/p2.jpg", label: "Missing USB-C cable, empty cable pocket in case" }
    ]
  });
  assert(op2.identity === "PASS" && op2.completeness === "FAIL" && op2.disposition === "refurbish", "OpCase 2: Correct product + missing accessory -> refurbish");

  // Case 3: Correct product + cosmetic wear -> used-grade disposition
  const op3 = await batchInspectReturn({
    sku: "SKU-LAMP-LED",
    orderId: "ORD-OP-03",
    photos: [
      { url: "https://example.com/p1.jpg", label: "Lamp base showing noticeable cosmetic scratches and scuffs from heavy use" },
      { url: "https://example.com/p2.jpg", label: "All cables and power adapter laid out" }
    ]
  });
  assert(op3.identity === "PASS" && ["Used - Very Good", "Used - Good", "Used - Acceptable"].includes(op3.amazon_condition), "OpCase 3: Cosmetic wear graded appropriately");

  // Case 4: Severe physical damage -> dispose
  const op4 = await batchInspectReturn({
    sku: "SKU-PUZZLE-500",
    orderId: "ORD-OP-04",
    photos: [
      { url: "https://example.com/p1.jpg", label: "Crushed box top and ruptured seam with broken pieces" }
    ]
  });
  assert(op4.observed_state === "damaged" && op4.disposition === "dispose", "OpCase 4: Severe physical damage -> dispose");

  // Case 5: Wrong product -> identity failure
  const op5 = await batchInspectReturn({
    sku: "SKU-HEADPHONE-BT",
    orderId: "ORD-OP-05",
    photos: [
      { url: "https://example.com/p1.jpg", label: "Wrong product: cheap generic unbranded plastic earbuds returned" }
    ]
  });
  assert(op5.identity === "FAIL" && op5.contradictions.length > 0, "OpCase 5: Wrong product -> identity failure with contradiction");

  // Case 6: Visually similar product -> uncertain identity -> pending_review
  const op6 = await batchInspectReturn({
    sku: "SKU-LAMP-LED",
    orderId: "ORD-OP-06",
    photos: [
      { url: "https://example.com/p1.jpg", label: "Lookalike clone: Lamp base showing mechanical toggle switch instead of capacitive touch icons" }
    ]
  });
  assert(op6.identity === "UNCERTAIN" && op6.disposition === "pending_review", "OpCase 6: Visually similar lookalike -> pending_review");

  // Case 7: Blurry / low contrast image -> pending_review
  const op7 = await batchInspectReturn({
    sku: "SKU-SERUM-30",
    orderId: "ORD-OP-07",
    photos: [
      { url: "https://example.com/p1.jpg", label: "Blurry low-contrast serial label with heavy flash glare" }
    ]
  });
  assert((op7.image_quality.blur || op7.image_quality.insufficient_evidence) && op7.disposition === "pending_review", "OpCase 7: Blurry/glare image -> pending_review");

  // Case 8: Missing camera angle / zero photos -> pending_review
  const op8 = await batchInspectReturn({
    sku: "SKU-HEADPHONE-BT",
    orderId: "ORD-OP-08",
    photos: []
  });
  assert(op8.disposition === "pending_review" && op8.image_quality.missing_views.length > 0, "OpCase 8: Missing camera angle -> pending_review with missing views guidance");

  // Case 9: Contradictory evidence -> pending_review
  const op9 = await batchInspectReturn({
    sku: "SKU-HEADPHONE-BT",
    orderId: "ORD-OP-09",
    photos: [
      { url: "https://example.com/p1.jpg", label: "Packaging shows AeroSound Pro but returned item shows generic unbranded plastic in-ear buds" }
    ]
  });
  assert(op9.contradictions.length > 0 && op9.disposition !== "restock", "OpCase 9: Contradictory evidence prevents automatic restock");

  // Case 10: Gemini / API failure -> pending_review with preserved case
  const op10 = await batchInspectReturn({
    sku: "SKU-HEADPHONE-BT",
    orderId: "ORD-OP-10",
    photos: [{ url: "https://example.com/p1.jpg", label: "Normal view" }],
    simulateFailure: true
  });
  assert(op10.disposition === "pending_review" && op10.confidence_note.includes("FAIL_OPEN"), "OpCase 10: API failure triggers fail-open pending_review");

  // Case 11: Supervisor override -> original AI preserved + override recorded
  const op11Contract = generateEvidenceRecord({
    recordId: "RTN-OP-11",
    unitId: "UNIT-OP-11",
    orgId: "org_demo_alpha",
    orderId: "ORD-OP-11",
    sku: "SKU-HEADPHONE-BT",
    productName: "AeroSound Pro Headphones",
    operatorId: "supervisor_dan",
    photos: [{ url: "https://example.com/p1.jpg" }],
    inspectionResult: op1,
    overrides: {
      original_verdict: op1.disposition,
      revised_verdict: "refurbish",
      reason: "Outer plastic sleeve has handling mark, requires clean packaging",
      operator_id: "supervisor_dan",
      timestamp: new Date().toISOString()
    }
  });
  assert(op11Contract.status === "OVERRIDDEN" && op11Contract.outcome.recommended_disposition === "restock" && op11Contract.outcome.final_disposition === "refurbish", "OpCase 11: Supervisor override preserves original AI decision & records override");

  // Case 12: Changing an image changes the AI result (No scenarioId secret forcing)
  const imgA = [{ url: "https://example.com/imgA.jpg", label: "Sealed box with factory cellophane reflection" }];
  const imgB = [{ url: "https://example.com/imgB.jpg", label: "Severed nylon strands and warped clasp with severe damage" }];
  const resA = await batchInspectReturn({ sku: "SKU-PUZZLE-500", orderId: "ORD-A", photos: imgA });
  const resB = await batchInspectReturn({ sku: "SKU-PUZZLE-500", orderId: "ORD-B", photos: imgB });
  assert(resA.disposition !== resB.disposition && resA.condition !== resB.condition, `OpCase 12: Changing image changes AI verdict ('${resA.disposition}' vs '${resB.disposition}')`);

  console.log("\n================================================================================");
  console.log(`TOTAL SECURITY & COMPLIANCE TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
