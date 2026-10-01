# Returns Manager · Demo Video Script

**Target Duration**: 2 minutes 30 seconds  
**Target Audience**: Cube Buildathon Round 2 Judges & Technical Evaluators  
**Goal**: Demonstrate real-world warehouse returns inspection, automated visual verification, plain-language decision output, and supervisor override auditability.

---

## Recording Setup & Tips
- **Resolution**: 1080p (1920x1080) or 1440p in a clean browser window (no bookmarks bar or extraneous tabs).
- **Browser Zoom**: Set browser zoom to 100% or 110% so Space Grotesk headings and badges are crisp.
- **Pacing**: Speak at a steady, professional pace without wandering the mouse cursor.
- **Preparation**: Ensure the dev server or deployed application is open at `http://localhost:5173/` or your production URL.

---

## Video Timeline

### 0:00–0:15 — The Problem
**Visual**: Operator view showing a warehouse returns desk with parcel intake.  
**Narrator**:
> "In e-commerce returns fulfillment, operators have mere seconds to examine a returned parcel. They have to verify if the right product came back, check if cables and accessories are missing, assess physical wear, and decide whether to restock, repair, or scrap the item. Today, this manual process is slow, inconsistent, and causes millions in return fraud and inventory write-downs."

---

### 0:15–0:35 — Product Overview
**Visual**: Show Returns Manager home screen (Returns Inspection Station) in clean industrial theme. Point out the top counters (*Returns today*, *Waiting for checking*, *Needs your attention*, *Completed*) and the active facility badge (*Facility Alpha*).  
**Narrator**:
> "This is Returns Manager—an operational AI inspection assistant built specifically for warehouse intake stations. It translates complex multimodal vision and condition assessment into clear, 5-second human decisions that any warehouse operator can understand immediately, with zero AI jargon."

---

### 0:35–1:20 — Live Inspection Workflow
**Visual**:
1. In the Intake & Inspection card, click **Sample Return Case #2: Headphone (Missing Cable)** or select the AeroSound Headphones SKU.
2. Point out the attached inspection photographs (front view showing headphones, accessory view showing case and 3.5mm cord with the USB-C slot visibly empty).
3. Click the primary button: **"Check this return"**.
4. Show the clean processing indicator and step progression.

**Narrator**:
> "Let's inspect a real returned parcel. Here we have a pair of AeroSound Pro wireless headphones. We attach photos of the unit and the open accessory tray. When we click 'Check this return', Returns Manager sends the images to Google Gemini Vision in a single batched multimodal call. The AI inspects product markings, checks every expected accessory against the master Bill of Materials, and evaluates surface condition."

---

### 1:20–1:50 — The 5-Second Recommendation Screen
**Visual**: Zoom slightly to highlight the Result Card:
- Top Recommendation Hero: 🔧 **Send for repair**
- Clear "Why?" box: *"The product matches the expected item, but USB-C Charging Cable was missing. Sending it for repair or repackaging is recommended before selling again."*
- 4 Core Cards: Product check (✅), Items included (❌ Missing: USB-C Cable), Condition (✅ Like new), Photos (✅ Clear).
- "How sure are we?" traffic-light confidence: 🟢 **High** certainty.

**Narrator**:
> "In under two seconds, the operator gets a clear recommendation: 'Send for repair'. Why? The headphones are genuine and like new, but the USB-C cable is missing. Rather than returning an incomplete box to stock or scrapping an expensive item, the system routes it to the repair bay for cable replenishment. Notice how there is no raw AI jargon or floating percentages—just plain, actionable warehouse language."

---

### 1:50–2:15 — Human Review & Override Audit Trail
**Visual**:
1. Click the **"Change decision"** button.
2. In the modal, select a revised action (e.g., **Put back in stock**).
3. Select an operational reason: *"Customer enclosed alternative compatible braided cable in box"*.
4. Click **"Confirm & Save Return"**.
5. Show the updated hero banner reflecting the operator change and audit notice.
6. Click the **Completed** tab to show the return logged into the facility ledger.

**Narrator**:
> "Warehouse staff retain final authority. If an operator verifies that an acceptable substitute cable was enclosed, they click 'Change decision', select the revised action, and log the reason. The system preserves the original AI recommendation alongside the supervisor override in an immutable audit ledger, guaranteeing complete compliance and accountability."

---

### 2:15–2:30 — Architecture & Closing
**Visual**: Switch briefly to the **Architecture** or **Cryptographic Contract** viewer showing the 14-field JSON schema and verified SHA-256 hash.  
**Narrator**:
> "Under the hood, the AI is strictly responsible for visual evidence extraction, while deterministic business rules derive the routing disposition. Every completed case generates a FIPS 180-4 SHA-256 evidence contract for downstream accounting systems. Returns Manager delivers fast, trustworthy returns triage at scale. Thank you."
