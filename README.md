# Returns Manager · Automated AI Return Inspection Agent

**Cube Buildathon · Round 2 · Step 04: Customer Return**  
*Production-ready multi-tenant returns grading, condition assessment, and cryptographic evidence generation powered by Google Gemini Vision.*

---

## 1. Overview: What Was Built

When an e-commerce returns warehouse receives a parcel, operators have seconds to make high-impact decisions:
1. **Did the buyer return the genuine product, an empty box, or a counterfeit substitution?**
2. **Are all expected cables, manuals, and accessories present in the box?**
3. **What is the true physical condition according to Amazon's published grading scale?**
4. **What is the next operational routing disposition (`restock`, `refurbish`, `liquidate`, `dispose`, or `pending_review`)?

The **Returns Manager** automates this triage workflow using **Google Gemini Vision multimodal AI** in a single batched inference pass, generates an immutable 14-field evidence contract compliant with downstream Recovery Manager systems, enforces strict query-level multi-tenant isolation, and guarantees **fail-open resilience** so no return case is ever lost or dropped.

---

## 2. The Four Core Checks

The inspection engine executes four rigorous checks for every returned parcel:

| Check | Objective | Method / Scale Used | Verdict Outcomes |
| :--- | :--- | :--- | :---: |
| **1. Identity Check** | Matches the returned unit's visual geometry, logos, port placement, and physical specs against the canonical master catalogue. | Multimodal feature alignment against reference SKU specifications. | `PASS` · `FAIL` · `UNCERTAIN` |
| **2. Completeness Check** | Verifies the presence of every required component, cable, power brick, and documentation specified in the Bill of Materials (BOM). | Multi-object visual detection against canonical expected parts list. | `PASS` · `FAIL` · `UNCERTAIN` |
| **3. Condition Grading** | Classifies the item's physical state using Amazon's official published condition scale (distinct from raw observation). | Official Amazon Condition Taxonomy: `New`, `Used - Like New`, `Used - Very Good`, `Used - Good`, `Used - Acceptable`, `Unacceptable`, `Uncertain`. | Grade + detailed visual basis |
| **4. Routing Disposition** | Derives operational routing in code (deterministic business rules) to maximize gross margin recovery and prevent fraud. | 5 Dispositions: `restock` (100% margin), `refurbish` (prep bay), `liquidate` (secondary lot), `dispose` (scrap), `pending_review` (human review). | 5 Canonical states |

> [!IMPORTANT]
> **UNCERTAIN Governance**: `UNCERTAIN` is treated as a first-class, valid decision. If optical conditions (glare, blur, low contrast) prevent definitive proof, or if an item resembles a close clone, the system never guesses. Any `UNCERTAIN` verdict strictly forces routing to `pending_review`.

---

## 3. Setup Instructions

### Prerequisites
- Node.js (v18 or higher recommended; v20/v24 tested)
- A Google Gemini API Key (from [Google AI Studio](https://aistudio.google.com/))

### Installation
```bash
# 1. Clone repository
git clone https://github.com/Shanmukhaaa4096/cube26-rtn-0231-shanmukhaaa4096.git
cd cube26-rtn-0231-shanmukhaaa4096

# 2. Install dependencies
npm install
```

### Configuring the Gemini API Key
1. Copy the example environment template:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and insert your Gemini API Key:
   ```env
   VITE_GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```
   > [!NOTE]
   > `.env` and `key.env` are strictly included in `.gitignore` to prevent any accidental secret exposure.
3. **Demo Mode (No API Key)**: If no API key is configured, the application automatically activates **Demo Mode**, utilizing calibrated offline benchmarks and deterministic heuristics clearly labeled in the user interface and evidence contracts.

---

## 4. Running the Application

### Development Server
```bash
npm run dev
```
Open your browser to `http://localhost:5173`. You can:
- Switch tenants between `org_demo_alpha` and `org_demo_bravo` (query-level isolated).
- Test with 10 pre-loaded PRD benchmark scenarios.
- Upload custom inspection photos (drag-and-drop or camera capture).
- Inspect the generated 14-field JSON evidence contract with SHA-256 integrity hash.
- Record supervisor manual overrides with preserved audit history.

### Production Build & Validation
```bash
npm run build
npm test
```
The test suite validates 71 security, tenancy isolation, schema compliance, and fail-open test cases.

---

## 5. Running the Evaluation Harness

An offline evaluation harness is provided under `/eval` to test the agent on real test image fixtures and calculate rigorous quantitative metrics against human annotator ground truth.

### Directory Layout
- `eval/fixtures/`: 10 subdirectories for scenario test images:
  - `correct-product/`
  - `wrong-product/`
  - `missing-accessory/`
  - `missing-multiple/`
  - `new/`
  - `lightly-used/`
  - `damaged/`
  - `heavily-damaged/`
  - `ambiguous-condition/`
  - `similar-lookalike/`
- `eval/labels.csv`: Ground-truth template with columns for dual-annotator verification (`human_label_1_*` and `human_label_2_*`).
- `eval/run_eval.mjs`: Automated evaluation script.

### Running the Evaluator
```bash
node eval/run_eval.mjs
```

### Metrics Generated in `eval/results.md`
- **Per-Check Accuracy (%)**: Proportion of model verdicts matching consensus human labels across Identity, Completeness, Condition, and Disposition.
- **False Positive Rate (FPR)**: Rate of incorrectly declaring an illegitimate or incomplete return as `PASS`.
- **False Negative Rate (FNR)**: Rate of incorrectly rejecting a legitimate return.
- **UNCERTAIN Rate (%)**: Frequency of flagging ambiguous evidence for human review.
- **Inter-Annotator Agreement (Cohen's $\kappa$)**: Measures statistical agreement between Human Labeler 1 and Human Labeler 2 ($k = \frac{P_o - P_e}{1 - P_e}$).
- **Average Inference Latency (ms)**: Real measured end-to-end inference latency.

---

## 6. Assumptions & Limitations

### Explicit Assumptions
1. **Authoritative Catalogue**: The product master catalogue (`src/data/catalogue.js`) is canonical and authoritative for specifications, Bill of Materials (BOM), and key visual features.
2. **Reasonable Lighting & Perspective**: High-confidence automated grading assumes photos are captured under warehouse station lighting with the product and accessories placed within view.
3. **Official Amazon Taxonomy**: Condition grading strictly follows Amazon's published 7-tier scale (`New`, `Used - Like New`, `Used - Very Good`, `Used - Good`, `Used - Acceptable`, `Unacceptable`, `Uncertain`). Custom scales are prohibited.
4. **Conservative Safety Policy**: Whenever evidence is ambiguous or contradictory, routing to human supervisor review (`pending_review`) is always preferred over making an erroneous automated claim.

### Known Limitations
1. **Single-Perspective Occlusion**: If a required accessory (e.g. charging cable) is hidden underneath packaging or inside an unzipped pouch not captured in the photos, the vision model may grade it as missing (`FAIL`) or `UNCERTAIN`. Operators can override this via the supervisor Override modal.
2. **Microscopic Electronic Defects**: Vision models can detect physical scratches, dents, and missing parts, but cannot measure battery health percentage or internal circuit continuity without physical test jigs.
3. **Rate Limits on Free API Tiers**: High-concurrency spikes on free Gemini API quotas may return 503 errors. The engine incorporates automatic retry and a **fail-open resilience net** that routes affected parcels to `pending_review` without dropping any data.

---

## 7. Chain Position & Downstream Integration

Returns Manager is **Step 04** in the operational chain:
```
[01 Receiving] ──▶ [02 Prep] ──▶ [03 Pack] ──▶ [04 Returns Manager] ──▶ [05 Recovery Manager]
```
The canonical 14-field JSON evidence record produced by this agent contains verified image references, check-level confidence scores, audit trail notes, operator labels, and an immutable SHA-256 payload hash, enabling the downstream **Recovery Manager** to file seller reimbursement and customer carrier claims with zero manual re-entry.
