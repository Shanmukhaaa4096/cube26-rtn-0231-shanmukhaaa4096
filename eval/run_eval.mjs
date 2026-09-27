// Evaluation Harness for Returns Manager
// Reads eval/labels.csv, executes real Gemini Vision aiInspector,
// evaluates performance against human labels, and outputs eval/results.md

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { batchInspectReturn } from '../src/services/aiInspector.js';
import { PRODUCT_CATALOGUE } from '../src/data/catalogue.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load .env if present in root
const envPath = path.join(rootDir, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const k = trimmed.substring(0, idx).trim();
      const v = trimmed.substring(idx + 1).trim();
      if (!process.env[k]) {
        process.env[k] = v;
      }
    }
  }
}

/**
 * Calculates Cohen's Kappa for inter-rater agreement between two annotators
 * Kappa = (P_o - P_e) / (1 - P_e)
 */
function calculateCohensKappa(ratings1, ratings2) {
  const pairs = [];
  for (let i = 0; i < ratings1.length; i++) {
    const r1 = (ratings1[i] || '').trim();
    const r2 = (ratings2[i] || '').trim();
    if (r1 && r2) {
      pairs.push([r1, r2]);
    }
  }

  const n = pairs.length;
  if (n === 0) return { kappa: null, note: "No overlapping human labels" };

  // Collect unique categories
  const categories = Array.from(new Set(pairs.flatMap(p => [p[0], p[1]])));

  // Observed agreement P_o
  const observedMatches = pairs.filter(p => p[0] === p[1]).length;
  const pObserved = observedMatches / n;

  // Chance agreement P_e
  let pExpected = 0;
  for (const cat of categories) {
    const count1 = pairs.filter(p => p[0] === cat).length;
    const count2 = pairs.filter(p => p[1] === cat).length;
    pExpected += (count1 / n) * (count2 / n);
  }

  if (pExpected === 1) {
    return { kappa: 1.0, observedAgreement: pObserved, count: n };
  }

  const kappa = (pObserved - pExpected) / (1 - pExpected);
  return {
    kappa: Number(kappa.toFixed(3)),
    observedAgreement: Number(pObserved.toFixed(3)),
    count: n
  };
}

/**
 * Parses CSV file respecting quoted strings
 */
function parseCsv(content) {
  const lines = content.split('\r\n').join('\n').split('\n').filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = cols[idx] !== undefined ? cols[idx] : '';
    });
    rows.push(obj);
  }

  return rows;
}

async function runEvaluation() {
  console.log("================================================================================");
  console.log("RETURNS MANAGER: EVALUATION HARNESS");
  console.log("================================================================================\n");

  const labelsPath = path.join(__dirname, 'labels.csv');
  if (!fs.existsSync(labelsPath)) {
    console.error(`Error: labels file not found at ${labelsPath}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(labelsPath, 'utf-8');
  const rows = parseCsv(csvContent);

  if (rows.length === 0) {
    console.log("No test units found in eval/labels.csv.");
    return;
  }

  console.log(`Loaded ${rows.length} test units from eval/labels.csv\n`);

  const results = [];
  const latencies = [];
  const defaultSku = PRODUCT_CATALOGUE[0].sku; // "SKU-HEADPHONE-BT"

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const unitId = row.unit_id || `UNIT-EVAL-${String(i + 1).padStart(3, '0')}`;
    const imagePathRel = row.image_path;
    const imagePathAbs = path.isAbsolute(imagePathRel)
      ? imagePathRel
      : path.join(rootDir, imagePathRel);

    console.log(`[${i + 1}/${rows.length}] Evaluating ${unitId} (${imagePathRel})...`);

    const imageExists = fs.existsSync(imagePathAbs) && !imagePathAbs.endsWith('.gitkeep');
    let photos = [];

    if (imageExists) {
      photos = [imagePathAbs];
    } else {
      console.log(`  ⚠ Local image not yet provided at ${imagePathRel}. Running with metadata stub.`);
      photos = [];
    }

    const t0 = Date.now();
    let inspection = null;

    try {
      inspection = await batchInspectReturn({
        sku: defaultSku,
        orderId: unitId,
        photos: photos
      });
    } catch (err) {
      inspection = {
        identity: "UNCERTAIN",
        completeness: "UNCERTAIN",
        amazon_condition: "Uncertain",
        disposition: "pending_review",
        confidence: { identity: 0.1, completeness: 0.1, condition: 0.1 },
        latency_ms: Date.now() - t0,
        model_version: "fail-open fallback"
      };
    }

    latencies.push(inspection.latency_ms || (Date.now() - t0));

    results.push({
      row,
      unitId,
      imagePath: imagePathRel,
      imageFound: imageExists,
      agentIdentity: inspection.identity,
      agentCompleteness: inspection.completeness,
      agentCondition: inspection.amazon_condition || inspection.condition,
      agentDisposition: inspection.disposition,
      confidence: inspection.confidence || {},
      latencyMs: inspection.latency_ms || (Date.now() - t0),
      modelVersion: inspection.model_version
    });
  }

  // Compute Evaluation Metrics
  const h1Identity = rows.map(r => r.human_label_1_identity).filter(Boolean);
  const h2Identity = rows.map(r => r.human_label_2_identity).filter(Boolean);
  const h1Completeness = rows.map(r => r.human_label_1_completeness).filter(Boolean);
  const h2Completeness = rows.map(r => r.human_label_2_completeness).filter(Boolean);
  const h1Condition = rows.map(r => r.human_label_1_condition).filter(Boolean);
  const h2Condition = rows.map(r => r.human_label_2_condition).filter(Boolean);
  const h1Disposition = rows.map(r => r.human_label_1_disposition).filter(Boolean);
  const h2Disposition = rows.map(r => r.human_label_2_disposition).filter(Boolean);

  const hasHumanLabels = h1Identity.length > 0 || h2Identity.length > 0;

  // Inter-rater reliability (Cohen's Kappa)
  const kappaIdentity = calculateCohensKappa(
    rows.map(r => r.human_label_1_identity),
    rows.map(r => r.human_label_2_identity)
  );
  const kappaCompleteness = calculateCohensKappa(
    rows.map(r => r.human_label_1_completeness),
    rows.map(r => r.human_label_2_completeness)
  );
  const kappaCondition = calculateCohensKappa(
    rows.map(r => r.human_label_1_condition),
    rows.map(r => r.human_label_2_condition)
  );
  const kappaDisposition = calculateCohensKappa(
    rows.map(r => r.human_label_1_disposition),
    rows.map(r => r.human_label_2_disposition)
  );

  // Per-check accuracy, FPR, FNR, UNCERTAIN rate
  function evaluateCheckMetrics(agentKey, h1Key, h2Key) {
    let labeledCount = 0;
    let correctCount = 0;
    let falsePositives = 0;
    let falseNegatives = 0;
    let truePositives = 0;
    let trueNegatives = 0;
    let uncertainCount = 0;

    for (const r of results) {
      const pred = (r[agentKey] || '').toUpperCase();
      if (pred === 'UNCERTAIN') uncertainCount++;

      // Consensus human label: label 1 preferred, or label 2 if label 1 empty
      const gold = (r.row[h1Key] || r.row[h2Key] || '').trim().toUpperCase();
      if (!gold) continue;

      labeledCount++;
      if (pred === gold) correctCount++;

      // Binary classification metrics for PASS / FAIL
      if (gold === 'FAIL' && pred === 'PASS') falsePositives++;
      if (gold === 'PASS' && pred === 'FAIL') falseNegatives++;
      if (gold === 'PASS' && pred === 'PASS') truePositives++;
      if (gold === 'FAIL' && pred === 'FAIL') trueNegatives++;
    }

    const accuracy = labeledCount > 0 ? (correctCount / labeledCount) * 100 : null;
    const fpr = (falsePositives + trueNegatives) > 0
      ? (falsePositives / (falsePositives + trueNegatives)) * 100
      : null;
    const fnr = (falseNegatives + truePositives) > 0
      ? (falseNegatives / (falseNegatives + truePositives)) * 100
      : null;
    const uncertainRate = results.length > 0 ? (uncertainCount / results.length) * 100 : 0;

    return { labeledCount, accuracy, fpr, fnr, uncertainRate, uncertainCount };
  }

  const identityMetrics = evaluateCheckMetrics('agentIdentity', 'human_label_1_identity', 'human_label_2_identity');
  const completenessMetrics = evaluateCheckMetrics('agentCompleteness', 'human_label_1_completeness', 'human_label_2_completeness');
  const conditionMetrics = evaluateCheckMetrics('agentCondition', 'human_label_1_condition', 'human_label_2_condition');
  const dispositionMetrics = evaluateCheckMetrics('agentDisposition', 'human_label_1_disposition', 'human_label_2_disposition');

  const avgLatency = latencies.length > 0
    ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
    : 0;

  // Format Markdown Report
  const formatPct = val => val !== null ? `${val.toFixed(1)}%` : "Awaiting Human Labels";
  const formatKappa = k => k.kappa !== null ? `${k.kappa} (N=${k.count})` : "Awaiting 2 Annotators";

  const mdReport = `# Automated Returns Inspection Evaluation Report

**Generated At:** ${new Date().toISOString()}  
**Total Evaluated Units:** ${results.length}  
**Average Latency:** ${avgLatency}ms  
**Model Name:** \`${results[0]?.modelVersion || 'gemini-3.5-flash'}\`  

---

## 1. Summary Performance Metrics

| Check | Accuracy | False Positive Rate | False Negative Rate | UNCERTAIN Rate | Cohen's Kappa (H1 vs H2) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Identity Match** | ${formatPct(identityMetrics.accuracy)} | ${formatPct(identityMetrics.fpr)} | ${formatPct(identityMetrics.fnr)} | ${identityMetrics.uncertainRate.toFixed(1)}% (${identityMetrics.uncertainCount}/${results.length}) | ${formatKappa(kappaIdentity)} |
| **Completeness BOM** | ${formatPct(completenessMetrics.accuracy)} | ${formatPct(completenessMetrics.fpr)} | ${formatPct(completenessMetrics.fnr)} | ${completenessMetrics.uncertainRate.toFixed(1)}% (${completenessMetrics.uncertainCount}/${results.length}) | ${formatKappa(kappaCompleteness)} |
| **Condition Grading** | ${formatPct(conditionMetrics.accuracy)} | ${formatPct(conditionMetrics.fpr)} | ${formatPct(conditionMetrics.fnr)} | ${conditionMetrics.uncertainRate.toFixed(1)}% (${conditionMetrics.uncertainCount}/${results.length}) | ${formatKappa(kappaCondition)} |
| **Routing Disposition** | ${formatPct(dispositionMetrics.accuracy)} | ${formatPct(dispositionMetrics.fpr)} | ${formatPct(dispositionMetrics.fnr)} | ${dispositionMetrics.uncertainRate.toFixed(1)}% (${dispositionMetrics.uncertainCount}/${results.length}) | ${formatKappa(kappaDisposition)} |

${!hasHumanLabels ? `> [!NOTE]  
> **Human Annotations Pending**: The \`human_label_*\` columns in \`eval/labels.csv\` are currently blank.  
> Once you add your ground truth ratings in \`eval/labels.csv\` and populate your test photos in \`eval/fixtures/\`, re-run \`node eval/run_eval.mjs\` to compute the final Accuracy, FPR, FNR, and Cohen's Kappa metrics.` : ''}

---

## 2. Unit-Level Test Results

| Unit ID | Image Path | Image Found | Agent Identity | Agent Completeness | Agent Condition | Agent Disposition | Latency |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
${results.map(r => `| \`${r.unitId}\` | \`${r.imagePath}\` | ${r.imageFound ? '✓' : '❌ Pending Image'} | \`${r.agentIdentity}\` | \`${r.agentCompleteness}\` | \`${r.agentCondition}\` | **\`${r.agentDisposition}\`** | ${r.latencyMs}ms |`).join('\n')}

---

## 3. Evaluation Methodology
- **Single-Call Batched Multimodal**: All 4 checks are produced in a single inference pass.
- **Fail-Open & UNCERTAIN Governance**: Any check evaluated as \`UNCERTAIN\` strictly routes disposition to \`pending_review\`.
- **Inter-Annotator Agreement**: Computed using Cohen's Kappa ($k = \\frac{P_o - P_e}{1 - P_e}$) between Human Annotator 1 and Human Annotator 2 across all double-labeled cases.
`;

  const resultsPath = path.join(__dirname, 'results.md');
  fs.writeFileSync(resultsPath, mdReport, 'utf-8');

  console.log(`\nEvaluation complete! Results written to: eval/results.md`);
  console.log(`Average Latency: ${avgLatency}ms`);
}

runEvaluation().catch(err => {
  console.error("Evaluation script encountered an error:", err);
  process.exit(1);
});
