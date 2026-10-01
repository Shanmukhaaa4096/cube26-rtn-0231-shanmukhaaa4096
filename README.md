# Returns Manager

> An AI-powered returns inspection agent that analyzes returned products, identifies issues, evaluates condition and completeness, and recommends the appropriate next action.

**Live Deployment**: [https://cube26-rtn-0231-shanmukhaaa4096.vercel.app](https://cube26-rtn-0231-shanmukhaaa4096.vercel.app)  
**GitHub Repository**: [https://github.com/Shanmukhaaa4096/cube26-rtn-0231-shanmukhaaa4096](https://github.com/Shanmukhaaa4096/cube26-rtn-0231-shanmukhaaa4096)

---

## Problem Understanding

When an e-commerce returns warehouse receives a parcel, staff must quickly inspect it to determine what should happen next. Today, manual returns inspection requires operators to rapidly answer several questions:

- **Product Identity**: Did the customer return the genuine ordered item, an empty package, or an incorrect product / counterfeit lookalike?
- **Items Included**: Are all expected accessories, cables, power bricks, and user manuals present in the box?
- **Condition Grading**: Does the item exhibit signs of use, cosmetic scratches, packaging tears, or severe physical damage?
- **Next Operational Action**: Should the item be put back into inventory, sent to a repair/prep bay, sold through a clearance channel, disposed of safely, or escalated to a supervisor?

In high-volume fulfillment centers, manual triage is often:
1. **Slow and labor-intensive**: Manual cross-referencing against product catalogues creates severe bottlenecks during peak return periods.
2. **Inconsistent**: Different operators apply subjective standards when evaluating cosmetic wear and missing accessories.
3. **Difficult to scale**: Training warehouse staff on thousands of fast-changing SKUs with varying bill-of-materials (BOM) specifications is costly and error-prone.

---

## Solution Overview

**Returns Manager** acts as an operational co-pilot for warehouse return intake stations. It streamlines the physical inspection workflow by combining AI visual evidence extraction with deterministic business rules:

```text
Returned Item
      ↓
Product Images
      ↓
AI Inspection (Gemini Vision)
      ↓
Structured Findings (Product, Items, Condition, Quality)
      ↓
Deterministic Decision Engine
      ↓
Clear Human Recommendation ("Put back in stock", "Send for repair", etc.)
      ↓
Human Approval / Override with Audit Trail
```

### Core Architecture Principle
**The AI observes; the decision engine decides.**
- The AI vision model is strictly responsible for **observing what is physically visible in the images** (matching markings, detecting accessories, spotting scratches/dents, evaluating photo clarity).
- A deterministic business rule engine evaluates these structured findings to produce the recommended disposition.
- The AI never hallucinates or directly invents business actions.

---

## Key Features

### 1. AI Visual Inspection
- **Product Verification**: Compares logos, port layouts, materials, and form factor against master catalogue specifications.
- **Accessory & Completeness Check**: Compares detected items against the expected Bill of Materials (BOM) for that SKU.
- **Condition Grading**: Evaluates physical wear into standard operational grades (*Like new*, *Lightly used*, *Used*, *Heavily used*, *Damaged*).
- **Photo Quality & Guidance**: Checks whether images are blurry, too dark, or missing essential angles, offering plain-language guidance (e.g., *"Photo is too blurry — please upload a clearer photo of the front"*).
- **Uncertainty & Contradiction Detection**: Detects conflicting evidence across multiple photos or lookalike items and routes them to human checking.

### 2. Deterministic Decision Engine
The application enforces predictable, business-grounded routing rules:
- **Put back in stock** (`restock`): Correct product + all required accessories present + Like new condition.
- **Send for repair** (`refurbish`): Genuine product with minor cosmetic wear or missing non-critical accessories that can be repackaged.
- **Sell through clearance** (`liquidate`): Usable product with noticeable signs of use, unsuitable for full-price resale.
- **Dispose of item** (`dispose`): Severe structural damage, wrong product returned, or unhygienic/broken item.
- **Needs human checking** (`pending_review`): Unclear photos, lookalike models with uncertain markings, conflicting images, or low optical confidence.

### 3. Human Review & Audit Logging
- **Operator Authority**: Warehouse operators can approve the recommended action or change the decision with one click.
- **Mandatory Justification**: When changing a recommendation, operators select the new action and provide a brief operational reason.
- **Immutable Audit Trail**: The original AI recommendation, revised decision, operator ID, and timestamp are preserved in the return record.
- **Cryptographic Evidence Contract**: Generates a 14-field evidence contract hashed with real FIPS 180-4 SHA-256 for downstream accounting.

### 4. Simplified Operations UI (Industrial Editorial)
- **Zero Jargon**: Strictly avoids exposing raw enums (`PASS`, `FAIL`, `UNCERTAIN`, `observed_state`, `confidence_score`, raw JSON).
- **5-Second Comprehension**: Clear visual cards answer: *What came back?*, *What did we find?*, *Why?*, and *What should I do?*.
- **Responsive Layout**: Designed for desktop workstations, tablets, and mobile barcode-scanner handhelds with responsive stacked cards.

---

## AI & Model Usage

Returns Manager uses **Google Gemini Vision** (`gemini-2.0-flash` with automatic fallback to `gemini-1.5-flash`) via the official `@google/generative-ai` SDK.

### Inspection Pipeline Details
```text
Uploaded Photos (Base64 / URL) + Master Product Specification
                        ↓
Single Batched Gemini Multimodal Prompt
                        ↓
Strict JSON Structured Output (Product match, parts present/missing, condition, photo quality)
                        ↓
JSON Schema Validation & Fallback Safety
                        ↓
Deterministic Decision Engine
```

- **Batched Multimodal Call**: All visual checks (product identity, accessory count, surface condition, image clarity) are performed in a single vision call to minimize warehouse station latency.
- **Untrusted AI Handling**: Model output is treated as untrusted input. Responses are parsed and validated against strict schemas. If a response is malformed or times out, the system **fails open** to `Needs human checking` without dropping the return.
- **Offline / Calibrated Fallback**: If no Gemini API key is configured or the network is unavailable, the application activates an offline vision analyzer with deterministic heuristics.

---

## Demo & Benchmark Mode

The repository includes pre-loaded sample return cases based on real warehouse return scenarios:
- **Pristine item** (Unopened retail box)
- **Missing cable / accessory** (Complete device, missing USB-C lead)
- **Cosmetic wear** (Minor scuffs, usable)
- **Severe physical damage** (Shattered casing / torn components)
- **Wrong item returned** (Substituted lookalike)
- **Unclear / blurry photography** (Poor warehouse lighting)
- **Contradictory evidence** (Package shows pristine seal, but unit shows wear)

> [!IMPORTANT]
> **Benchmark Isolation**: Predefined scenario data and expected outcomes are strictly isolated to evaluation and demonstration. When an operator runs an inspection or uploads photos, the analysis executes through the live AI vision and decision engine pipeline; expected outcomes never bypass the decision rules.

---

## Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **React 18** | Frontend user interface and component architecture |
| **Vite 6** | Modern development server and fast production bundler |
| **@google/generative-ai** | Official Google Gemini SDK for multimodal vision inference |
| **Space Grotesk** | Primary typography for editorial clarity and operational contrast |
| **IBM Plex Mono** | Monospace typography for identifiers, timestamps, and audit codes |
| **Vanilla CSS** | Ergonomic, zero-dependency styling with light and dark themes |
| **Node.js (ESM)** | Test runner, validation harness, and evaluation tooling |

---

## Setup Instructions

### Prerequisites
- Node.js (v18.0.0 or higher; tested on v20 and v24)
- npm (v9.0.0 or higher)
- *(Optional)* Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/Shanmukhaaa4096/cube26-rtn-0231-shanmukhaaa4096.git
cd cube26-rtn-0231-shanmukhaaa4096

# 2. Install dependencies
npm install

# 3. Configure environment (Optional for live Gemini API)
cp .env.example .env
```

### Environment Configuration
In `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
> [!NOTE]
> `GEMINI_API_KEY` is kept strictly server-side (no `VITE_` prefix) and is called exclusively via the secure `/api/inspect` endpoint (with in-memory rate limiting and server-side file validation). It is never bundled into public browser JS.
> If `GEMINI_API_KEY` is not provided, the application automatically runs in calibrated offline demonstration mode so all features and workflows remain fully testable.
> `.env` and `key.env` are strictly included in `.gitignore` to prevent secret leakage.

### Running Locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Running the Test Suite
```bash
npm test
```
Executes the comprehensive test suite validating 83 compliance, tenancy isolation, decision engine, and cryptographic contract checks.

### Building for Production
```bash
npm run build
```
Generates an optimized production bundle in `/dist`.

---

## Usage Instructions

1. **Open Returns Manager**: Access the application on a desktop browser or mobile terminal.
2. **Select Expected Product / Order**: Choose an existing return order or select the expected SKU from the master catalogue.
3. **Upload Product Photos**: Attach photos of the returned item, its packaging, and its accessories via file upload or camera capture.
4. **Start Inspection**: Click **"Check this return"**.
5. **Review What We Found**:
   - **Product check**: Verified against genuine catalogue specifications.
   - **Items included**: Expected parts verified with ✅ and ❌ badges.
   - **Condition**: Graded in everyday terms (*Like new*, *Lightly used*, *Used*, *Heavily used*, *Damaged*).
   - **Photos**: Photographic clarity notice.
6. **Review Recommendation**: Inspect the clear recommendation banner (e.g. 🔧 **Send for repair**) and the 1–2 sentence "Why?" explanation.
7. **Approve or Change**:
   - Click **Approve recommendation** to finalize and save to the facility ledger.
   - Click **Change decision** to override with a human decision and documented reason.

---

## Assumptions

- **Sufficient Photography**: The inspection assumes uploaded photographs provide adequate visual resolution and lighting to discern product markings, serial numbers, ports, and accessory contents.
- **Catalogue Availability**: A central master catalogue defines the expected product specifications, Bill of Materials, and reference images.
- **Visual-Only Scope**: The prototype focuses on non-invasive visual inspection. Internal electronic faults, battery cycle counts, or hidden liquid damage cannot be detected by external vision alone.
- **Human Authority**: Operators retain final authority; AI recommendations serve as decision support, not an unmonitored autonomous actor.

---

## Limitations

- **Internal Defects**: Invisible internal electrical failures, speaker driver damage, or software bricks cannot be assessed through photos.
- **Image Quality Dependence**: Heavy glare, motion blur, or occluded items reduce certainty and appropriately trigger human review.
- **Single-Station Prototype**: Current authentication and storage utilize browser-isolated storage with query-level tenancy simulation rather than a distributed cloud SQL database.
- **Catalogue Scope**: Master catalogue currently contains 11 curated consumer electronics, apparel, and lifestyle items. Additional items require catalogue registration.

---

## Security & Privacy

- **Server-Side Secret Isolation**: Private keys (`GEMINI_API_KEY`) remain strictly on the backend and are accessed exclusively through `/api/inspect`. No secret is shipped in client JavaScript bundles.
- **Server-Side Rate Limiting & Validation**: The `/api/inspect` endpoint enforces facility rate limiting (max 20 req/min per org/IP) and validates file uploads server-side (10MB limit, JPEG/PNG/WEBP only, rejecting malformed files).
- **Query-Level Tenancy Isolation**: Return records, image vaults, and queries are cryptographically partitioned by organization ID (`org_demo_alpha` vs `org_demo_bravo`), blocking cross-tenant record guessing with HTTP 403 `PERMISSION_DENIED`.
- **FIPS 180-4 Cryptographic Integrity**: Evidence contracts calculate SHA-256 hashes using a deterministic pure JavaScript implementation for verifiable tamper detection.
- **Immutable Override History**: Changing an AI decision preserves the original model verdict, operator name, timestamp, and justification reason.
- **Data Minimization**: No customer PII (credit cards, phone numbers, home addresses) is stored in the return inspection records.

---

## Project Structure

```text
cube26-rtn-0231-shanmukhaaa4096/
├── src/
│   ├── components/            # User interface components
│   │   ├── Header.jsx         # Operational stats, facility badge, theme toggle
│   │   ├── ResultCard.jsx     # 5-second result screen with recommendations
│   │   ├── InspectionUpload.jsx # Intake, SKU picker, photo dropzone
│   │   ├── HistoryLog.jsx     # Responsive returns ledger (desktop table & mobile cards)
│   │   ├── OverrideModal.jsx  # Human decision override dialog
│   │   ├── DetailModal.jsx    # Complete inspection audit viewer
│   │   ├── ContractModal.jsx  # Cryptographic 14-field JSON contract viewer
│   │   ├── ScenariosStrip.jsx # Sample benchmark return cases
│   │   ├── AuthModal.jsx      # Warehouse staff authentication
│   │   ├── FooterModals.jsx   # FAQ, Guidelines, and Privacy modals
│   │   └── Icons.jsx          # SVG icon collection
│   ├── services/              # Core business and AI logic
│   │   ├── aiInspector.js     # Gemini Vision API integration & multimodal parsing
│   │   ├── decisionEngine.js  # Deterministic business rules & confidence gating
│   │   ├── evidenceContract.js# FIPS 180-4 SHA-256 evidence schema builder
│   │   ├── authAndStorage.js  # Tenancy isolation, rate limiting, upload validation
│   │   └── inspectionService.js # Inspection orchestration service
│   ├── utils/
│   │   └── userFacingText.js  # Central human-language translation layer
│   ├── data/
│   │   ├── catalogue.js       # Master product catalogue (BOM & specifications)
│   │   ├── testScenarios.js   # 10 PRD benchmark return scenarios
│   │   └── seedReturns.js     # Seed returns log
│   ├── styles/
│   │   └── index.css          # Industrial Editorial + Soft Brutalism stylesheet
│   ├── App.jsx                # Main application shell and tab routing
│   └── main.jsx               # React entry point
├── eval/                      # Offline evaluation harness & test fixtures
├── test_suite.mjs             # 83-test compliance, tenancy, and security test suite
├── test_user_facing_text.mjs  # Presentation translation verification script
├── index.html                 # HTML shell with Space Grotesk & IBM Plex Mono
├── vite.config.js             # Vite configuration
└── package.json               # Dependencies and scripts
```
