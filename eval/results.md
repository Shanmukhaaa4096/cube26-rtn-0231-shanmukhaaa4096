# Automated Returns Inspection Evaluation Report

**Generated At:** 2026-09-27T14:52:46.092Z  
**Total Evaluated Units:** 10  
**Average Latency:** 0ms  
**Model Name:** `gemini-3.5-flash (optical pre-check)`  

---

## 1. Summary Performance Metrics

| Check | Accuracy | False Positive Rate | False Negative Rate | UNCERTAIN Rate | Cohen's Kappa (H1 vs H2) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Identity Match** | Awaiting Human Labels | Awaiting Human Labels | Awaiting Human Labels | 100.0% (10/10) | Awaiting 2 Annotators |
| **Completeness BOM** | Awaiting Human Labels | Awaiting Human Labels | Awaiting Human Labels | 100.0% (10/10) | Awaiting 2 Annotators |
| **Condition Grading** | Awaiting Human Labels | Awaiting Human Labels | Awaiting Human Labels | 100.0% (10/10) | Awaiting 2 Annotators |
| **Routing Disposition** | Awaiting Human Labels | Awaiting Human Labels | Awaiting Human Labels | 0.0% (0/10) | Awaiting 2 Annotators |

> [!NOTE]  
> **Human Annotations Pending**: The `human_label_*` columns in `eval/labels.csv` are currently blank.  
> Once you add your ground truth ratings in `eval/labels.csv` and populate your test photos in `eval/fixtures/`, re-run `node eval/run_eval.mjs` to compute the final Accuracy, FPR, FNR, and Cohen's Kappa metrics.

---

## 2. Unit-Level Test Results

| Unit ID | Image Path | Image Found | Agent Identity | Agent Completeness | Agent Condition | Agent Disposition | Latency |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `UNIT-EVAL-001` | `eval/fixtures/correct-product/sample_01.jpg` | ❌ Pending Image | `UNCERTAIN` | `UNCERTAIN` | `Uncertain` | **`pending_review`** | 1ms |
| `UNIT-EVAL-002` | `eval/fixtures/wrong-product/sample_01.jpg` | ❌ Pending Image | `UNCERTAIN` | `UNCERTAIN` | `Uncertain` | **`pending_review`** | 0ms |
| `UNIT-EVAL-003` | `eval/fixtures/missing-accessory/sample_01.jpg` | ❌ Pending Image | `UNCERTAIN` | `UNCERTAIN` | `Uncertain` | **`pending_review`** | 0ms |
| `UNIT-EVAL-004` | `eval/fixtures/missing-multiple/sample_01.jpg` | ❌ Pending Image | `UNCERTAIN` | `UNCERTAIN` | `Uncertain` | **`pending_review`** | 0ms |
| `UNIT-EVAL-005` | `eval/fixtures/new/sample_01.jpg` | ❌ Pending Image | `UNCERTAIN` | `UNCERTAIN` | `Uncertain` | **`pending_review`** | 0ms |
| `UNIT-EVAL-006` | `eval/fixtures/lightly-used/sample_01.jpg` | ❌ Pending Image | `UNCERTAIN` | `UNCERTAIN` | `Uncertain` | **`pending_review`** | 0ms |
| `UNIT-EVAL-007` | `eval/fixtures/damaged/sample_01.jpg` | ❌ Pending Image | `UNCERTAIN` | `UNCERTAIN` | `Uncertain` | **`pending_review`** | 0ms |
| `UNIT-EVAL-008` | `eval/fixtures/heavily-damaged/sample_01.jpg` | ❌ Pending Image | `UNCERTAIN` | `UNCERTAIN` | `Uncertain` | **`pending_review`** | 0ms |
| `UNIT-EVAL-009` | `eval/fixtures/ambiguous-condition/sample_01.jpg` | ❌ Pending Image | `UNCERTAIN` | `UNCERTAIN` | `Uncertain` | **`pending_review`** | 0ms |
| `UNIT-EVAL-010` | `eval/fixtures/similar-lookalike/sample_01.jpg` | ❌ Pending Image | `UNCERTAIN` | `UNCERTAIN` | `Uncertain` | **`pending_review`** | 0ms |

---

## 3. Evaluation Methodology
- **Single-Call Batched Multimodal**: All 4 checks are produced in a single inference pass.
- **Fail-Open & UNCERTAIN Governance**: Any check evaluated as `UNCERTAIN` strictly routes disposition to `pending_review`.
- **Inter-Annotator Agreement**: Computed using Cohen's Kappa ($k = \frac{P_o - P_e}{1 - P_e}$) between Human Annotator 1 and Human Annotator 2 across all double-labeled cases.
