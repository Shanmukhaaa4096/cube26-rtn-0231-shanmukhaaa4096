// Verification script for User Facing Text & Translation Layer
import {
  translateVerdict,
  translateDisposition,
  translateCondition,
  translateConfidence,
  translatePhotoQuality,
  generateRecommendationWhy,
  buildWhatWeFound,
  buildInspectionActivity
} from './src/utils/userFacingText.js';
import { PRD_TEST_SCENARIOS } from './src/data/testScenarios.js';
import { PRODUCT_CATALOGUE } from './src/data/catalogue.js';

console.log("================================================================================");
console.log("RETURNS MANAGER: USER-FACING PRESENTATION LAYER VERIFICATION");
console.log("================================================================================");

const FORBIDDEN_WORDS = [
  "UNCERTAIN",
  "PASS",
  "FAIL",
  "pending_review",
  "disposition",
  "observed_state",
  "completeness",
  "identity_verdict",
  "confidence_score",
  "business_rule",
  "evidence_contract",
  "model_version",
  "latency"
];

let errors = 0;

function assertClean(text, context) {
  if (typeof text !== 'string') return;
  for (const forbidden of FORBIDDEN_WORDS) {
    const regex = new RegExp(`\\b${forbidden}\\b`, 'i');
    if (regex.test(text)) {
      console.error(`❌ LEAK FOUND in ${context}: "${text}" contains forbidden term "${forbidden}"`);
      errors++;
    }
  }
}

console.log("\n1. Testing Verdict Translations...");
const verdicts = ['PASS', 'FAIL', 'UNCERTAIN', 'COMPLETE', 'INCOMPLETE', 'MATCH', 'MISMATCH', 'LOOKALIKE', 'BLURRY'];
for (const v of verdicts) {
  const trans = translateVerdict(v);
  console.log(`  ${v} -> "${trans.label}" (${trans.icon})`);
  assertClean(trans.label, `translateVerdict(${v})`);
}

console.log("\n2. Testing Disposition Translations...");
const disps = ['restock', 'refurbish', 'liquidate', 'dispose', 'pending_review'];
for (const d of disps) {
  const trans = translateDisposition(d);
  console.log(`  ${d} -> "${trans.title}" (${trans.icon}) - ${trans.defaultWhy}`);
  assertClean(trans.title, `translateDisposition(${d}).title`);
  assertClean(trans.defaultWhy, `translateDisposition(${d}).defaultWhy`);
}

console.log("\n3. Testing Condition Translations...");
const conditions = ['New', 'Used - Like New', 'Used - Very Good', 'Used - Good', 'Used - Acceptable', 'Unacceptable', 'Uncertain', 'Damaged'];
for (const c of conditions) {
  const trans = translateCondition(c);
  console.log(`  ${c} -> "${trans.title}" - ${trans.description}`);
  assertClean(trans.title, `translateCondition(${c}).title`);
  assertClean(trans.description, `translateCondition(${c}).description`);
}

console.log("\n4. Testing Confidence Translations...");
const confValues = [0.98, 0.85, 0.65, 0.40, 0.2];
for (const val of confValues) {
  const trans = translateConfidence(val);
  console.log(`  ${val} -> ${trans.icon} "${trans.label}" - ${trans.description}`);
  assertClean(trans.label, `translateConfidence(${val}).label`);
  assertClean(trans.description, `translateConfidence(${val}).description`);
  if (trans.label.includes("0.") || trans.label.includes("%")) {
    console.error(`❌ Raw number found in confidence label: ${trans.label}`);
    errors++;
  }
}

console.log("\n5. Testing 10 PRD Scenarios translation output...");
for (const s of PRD_TEST_SCENARIOS) {
  const v = s.expectedVerdict || {};
  const product = PRODUCT_CATALOGUE.find(p => p.sku === s.sku) || { name: s.product_name, expectedParts: [] };
  const mockResult = {
    identity: v.identity,
    identity_basis: v.identity_basis,
    completeness: v.completeness,
    missing: v.missing || [],
    observed_state: v.observed_state,
    amazon_condition: v.amazon_condition || v.condition,
    condition: v.amazon_condition || v.condition,
    condition_basis: v.condition_basis,
    disposition: v.disposition,
    disposition_basis: v.disposition_basis,
    confidence: v.confidence || 0.95,
    evidence: v.evidence || [],
    image_quality: {
      blur_score: s.id === 7 ? 0.35 : 0.85,
      is_blurry: s.id === 7,
      glare_detected: false,
      dark_lighting: s.id === 9,
      sufficient_for_verdict: s.id !== 7 && s.id !== 9
    }
  };

  const why = generateRecommendationWhy(mockResult, mockResult.disposition, null, product);
  const findingsObj = buildWhatWeFound(mockResult, product);
  const activity = buildInspectionActivity(mockResult, s.photos?.length || 1, product);
  const photoQuality = translatePhotoQuality(mockResult.image_quality);

  console.log(`  Case ${s.id} (${product.name}):`);
  console.log(`    Recommendation Why: "${why}"`);
  console.log(`    Core Cards: ${findingsObj.coreCards.length}, Observations: ${findingsObj.detailedObservations.length}`);
  console.log(`    Activity Steps: ${activity.length}`);

  assertClean(why, `Case ${s.id} why`);
  for (const card of findingsObj.coreCards) {
    assertClean(card.title, `Case ${s.id} coreCard title`);
    assertClean(card.summary, `Case ${s.id} coreCard summary`);
    assertClean(card.detail, `Case ${s.id} coreCard detail`);
  }
  for (const obs of findingsObj.detailedObservations) {
    assertClean(obs.label, `Case ${s.id} observation label`);
    assertClean(obs.subtext, `Case ${s.id} observation subtext`);
  }
  for (const act of activity) {
    assertClean(act.text, `Case ${s.id} activity text`);
  }
  for (const notice of photoQuality.notices) {
    assertClean(notice.headline, `Case ${s.id} photo notice headline`);
    assertClean(notice.action, `Case ${s.id} photo notice action`);
  }
}

console.log("\n6. Checking Product Catalogue Single Source of Truth...");
console.log(`  Total Products in Catalogue: ${PRODUCT_CATALOGUE.length}`);
for (const p of PRODUCT_CATALOGUE) {
  if (!p.sku || !p.name || !Array.isArray(p.expectedParts)) {
    console.error(`❌ Invalid product entry:`, p);
    errors++;
  }
}

console.log("================================================================================");
if (errors === 0) {
  console.log("✅ ALL USER-FACING TRANSLATIONS & PRESENTATIONS PASSED WITH ZERO LEAKAGE!");
  process.exit(0);
} else {
  console.error(`❌ FAILED WITH ${errors} ERRORS`);
  process.exit(1);
}
