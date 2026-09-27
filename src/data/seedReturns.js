// Seed returns dataset with official Amazon condition taxonomy, raw observations,
// 5 disposition outcomes (including pending_review), and isolated tenant image stores.

export const OBSERVED_STATES = [
  { id: "factory_sealed", label: "factory_sealed", desc: "Original manufacturer tape/shrinkwrap intact." },
  { id: "opened_unused", label: "opened_unused", desc: "Package opened but product never handled or activated." },
  { id: "signs_of_use", label: "signs_of_use", desc: "Visible signs of handling, wear, or usage." },
  { id: "damaged", label: "damaged", desc: "Physical damage to product casing or components." },
  { id: "empty_box", label: "empty_box", desc: "Package missing core product entirely." },
  { id: "uncertain", label: "uncertain", desc: "Observation inconclusive or obscured by packaging/glare." }
];

export const AMAZON_CONDITIONS = [
  { id: "New", label: "New", desc: "Unopened in original packaging with all original materials included." },
  { id: "Used - Like New", label: "Used - Like New", desc: "Perfect condition. Packaging may have damage or be open, but zero wear and all accessories present." },
  { id: "Used - Very Good", label: "Used - Very Good", desc: "Well cared for with minor cosmetic blemishes, fully functional." },
  { id: "Used - Good", label: "Used - Good", desc: "Shows wear from consistent use, fully functional, minor scuffs/scratches." },
  { id: "Used - Acceptable", label: "Used - Acceptable", desc: "Fairly worn, cosmetic aesthetic wear, fully functional." },
  { id: "Unacceptable", label: "Unacceptable", desc: "Defective, broken, unhygienic, or missing essential components required to function." },
  { id: "Uncertain", label: "Uncertain", desc: "Cannot be reliably assessed from available photographic evidence." }
];

// Official 5 Dispositions per spec
export const DISPOSITION_DEFINITIONS = {
  restock: {
    id: "restock",
    label: "restock",
    badgeClass: "badge-restock",
    bgClass: "bg-restock",
    borderClass: "border-restock",
    desc: "Eligible for immediate re-inventorying and fulfillment. Meets 100% margin recovery standard.",
    color: "#059669"
  },
  refurbish: {
    id: "refurbish",
    label: "refurbish",
    badgeClass: "badge-refurbish",
    bgClass: "bg-refurbish",
    borderClass: "border-refurbish",
    desc: "Requires accessory kit replenishment, cleaning, or repackaging before resale.",
    color: "#d97706"
  },
  liquidate: {
    id: "liquidate",
    label: "liquidate",
    badgeClass: "badge-liquidate",
    bgClass: "bg-liquidate",
    borderClass: "border-liquidate",
    desc: "Does not qualify for prime A-grade; route to B2B liquidation pallet / secondary market.",
    color: "#ea580c"
  },
  dispose: {
    id: "dispose",
    label: "dispose",
    badgeClass: "badge-dispose",
    bgClass: "bg-dispose",
    borderClass: "border-dispose",
    desc: "Unrecoverable physical failure, safety hazard, or sanitary write-off. Scrap / recycle.",
    color: "#dc2626"
  },
  pending_review: {
    id: "pending_review",
    label: "pending_review",
    badgeClass: "badge-review",
    bgClass: "bg-review",
    borderClass: "border-review",
    desc: "Mandatory human review state triggered when identity, completeness, or condition is UNCERTAIN, or on fail-open.",
    color: "#475569"
  }
};

// Generates an isolated, non-guessable tenant-scoped image URI
export function generateTenantImageUri(orgId, unitId, photoIndex, tokenSalt = "sec") {
  // Deterministic tenant token hash preventing cross-tenant guessing
  const tenantHash = (orgId === "org_demo_alpha" ? "tok_a78f1e" : "tok_b42c9d");
  return `tenants/${orgId}/vault/${tenantHash}/${unitId}_img${photoIndex}.jpg`;
}

export const INITIAL_RETURNS_LOG = [
  {
    record_id: "RTN-0003",
    unit_id: "UNIT-0003",
    org_id: "org_demo_bravo",
    order_id: "ORD-DUMMY-50003",
    ordered_sku: "SKU-PUZZLE-500",
    ordered_asin: "B0DUMMY729",
    product_name: "Nordic Fjord Landscape 500-Piece Art Jigsaw Puzzle",
    identity: "PASS",
    completeness: "PASS",
    missing: [],
    observed_state: "signs_of_use",
    amazon_condition: "Used - Good",
    disposition: "liquidate",
    evidence: [
      "Visual match: Box cover matches Nordic Fjord artwork (98.4% match)",
      "Observed state 'signs_of_use': Box lid corners creased and internal bag opened",
      "Amazon condition: Graded as 'Used - Good' per packaging scuff guidelines",
      "Full reference poster present with minor fold creases"
    ],
    confidence_note: null,
    photo_urls: [
      generateTenantImageUri("org_demo_bravo", "UNIT-0003", 1),
      generateTenantImageUri("org_demo_bravo", "UNIT-0003", 2)
    ],
    photo_display_urls: [
      "https://images.unsplash.com/photo-1585336261026-77894d010cfa?w=600&auto=format&fit=crop&q=60"
    ],
    operator_id: "op_chen",
    captured_at: "2026-07-10T15:54:00Z",
    status: "FINALIZED",
    overrides: null
  },
  {
    record_id: "RTN-0009",
    unit_id: "UNIT-0009",
    org_id: "org_demo_bravo",
    order_id: "ORD-DUMMY-50009",
    ordered_sku: "SKU-PUZZLE-500",
    ordered_asin: "B0DUMMY729",
    product_name: "Nordic Fjord Landscape 500-Piece Art Jigsaw Puzzle",
    identity: "PASS",
    completeness: "PASS",
    missing: [],
    observed_state: "opened_unused",
    amazon_condition: "Used - Like New",
    disposition: "refurbish",
    evidence: [
      "Product artwork and barcode verified against SKU-PUZZLE-500",
      "Observed state 'opened_unused': Outer shrinkwrap removed, puzzle pieces still sealed in internal polybag",
      "Amazon condition: Graded as 'Used - Like New' (unopened internal contents, missing outer cellophane)",
      "Requires re-shrinkwrap before prime shelf stocking"
    ],
    confidence_note: null,
    photo_urls: [
      generateTenantImageUri("org_demo_bravo", "UNIT-0009", 1)
    ],
    photo_display_urls: [
      "https://images.unsplash.com/photo-1585336261026-77894d010cfa?w=600&auto=format&fit=crop&q=60"
    ],
    operator_id: "op_fatima",
    captured_at: "2026-06-24T23:36:00Z",
    status: "FINALIZED",
    overrides: null
  },
  {
    record_id: "RTN-0014",
    unit_id: "UNIT-0014",
    org_id: "org_demo_alpha",
    order_id: "ORD-DUMMY-50014",
    ordered_sku: "SKU-LAMP-LED",
    ordered_asin: "B0DUMMY357",
    product_name: "LuminaCraft Minimalist Dimmable LED Desk Lamp",
    identity: "PASS",
    completeness: "PASS",
    missing: [],
    observed_state: "signs_of_use",
    amazon_condition: "Used - Acceptable",
    disposition: "liquidate",
    evidence: [
      "LuminaCraft laser etching present on aluminum swivel base",
      "Observed state 'signs_of_use': Base plate shows cosmetic circular hairline scratches",
      "Amazon condition: 'Used - Acceptable' due to prominent surface scuffs on anodized metal",
      "Cables and power adapter operational, routed to liquidation lot"
    ],
    confidence_note: null,
    photo_urls: [
      generateTenantImageUri("org_demo_alpha", "UNIT-0014", 1)
    ],
    photo_display_urls: [
      "https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?w=600&auto=format&fit=crop&q=60"
    ],
    operator_id: "op_eli",
    captured_at: "2026-07-18T07:36:00Z",
    status: "FINALIZED",
    overrides: null
  },
  {
    record_id: "RTN-0016",
    unit_id: "UNIT-0016",
    org_id: "org_demo_alpha",
    order_id: "ORD-DUMMY-50016",
    ordered_sku: "SKU-TOWEL-BLU",
    ordered_asin: "B0DUMMY600",
    product_name: "SereneLoft Organic Turkish Cotton Bath Towel (Navy Blue)",
    identity: "PASS",
    completeness: "PASS",
    missing: [],
    observed_state: "opened_unused",
    amazon_condition: "Used - Like New",
    disposition: "restock",
    evidence: [
      "SereneLoft brand tag attached to hem; correct navy dye color lot",
      "Observed state 'opened_unused': Polybag seal opened, towel unhandled with zero wash history",
      "Amazon condition: 'Used - Like New'",
      "Re-bagged into protective sleeve and approved for restock"
    ],
    confidence_note: null,
    photo_urls: [
      generateTenantImageUri("org_demo_alpha", "UNIT-0016", 1)
    ],
    photo_display_urls: [
      "https://images.unsplash.com/photo-1616627547584-bf28cee262db?w=600&auto=format&fit=crop&q=60"
    ],
    operator_id: "op_ben",
    captured_at: "2026-06-25T07:31:00Z",
    status: "FINALIZED",
    overrides: null
  },
  {
    record_id: "RTN-0018",
    unit_id: "UNIT-0018",
    org_id: "org_demo_bravo",
    order_id: "ORD-DUMMY-50018",
    ordered_sku: "SKU-BOTTLE-750",
    ordered_asin: "B0DUMMY622",
    product_name: "HydroPure 750ml Vacuum-Insulated Thermal Bottle",
    identity: "PASS",
    completeness: "PASS",
    missing: [],
    observed_state: "factory_sealed",
    amazon_condition: "New",
    disposition: "restock",
    evidence: [
      "Factory seal sticker unbroken on cylindrical outer retail box",
      "Observed state 'factory_sealed'",
      "Amazon condition: 'New'",
      "100% margin recovery: Returned to primary warehouse bin"
    ],
    confidence_note: null,
    photo_urls: [
      generateTenantImageUri("org_demo_bravo", "UNIT-0018", 1)
    ],
    photo_display_urls: [
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=60"
    ],
    operator_id: "op_fatima",
    captured_at: "2026-07-18T04:44:00Z",
    status: "FINALIZED",
    overrides: null
  },
  {
    record_id: "RTN-0021",
    unit_id: "UNIT-0021",
    org_id: "org_demo_bravo",
    order_id: "ORD-DUMMY-50021",
    ordered_sku: "SKU-PUZZLE-500",
    ordered_asin: "B0DUMMY729",
    product_name: "Nordic Fjord Landscape 500-Piece Art Jigsaw Puzzle",
    identity: "PASS",
    completeness: "FAIL",
    missing: ["500 Puzzle Pieces"],
    observed_state: "damaged",
    amazon_condition: "Unacceptable",
    disposition: "dispose",
    evidence: [
      "Outer box matches Nordic Fjord artwork but lid is torn along left seam",
      "Observed state 'damaged'",
      "CRITICAL: Puzzle piece bag completely absent from box interior; only poster remains",
      "Amazon condition: 'Unacceptable' (missing core functional components)"
    ],
    confidence_note: "Major core component missing; unrecoverable scrap.",
    photo_urls: [
      generateTenantImageUri("org_demo_bravo", "UNIT-0021", 1)
    ],
    photo_display_urls: [
      "https://images.unsplash.com/photo-1585336261026-77894d010cfa?w=600&auto=format&fit=crop&q=60"
    ],
    operator_id: "op_ben",
    captured_at: "2026-07-31T01:24:00Z",
    status: "FINALIZED",
    overrides: null
  },
  {
    record_id: "RTN-0092",
    unit_id: "UNIT-0092",
    org_id: "org_demo_alpha",
    order_id: "ORD-DUMMY-50092",
    ordered_sku: "SKU-SERUM-30",
    ordered_asin: "B0DUMMY031",
    product_name: "Botanica Radiant Glow 10% Vitamin C Facial Serum (30ml)",
    identity: "PASS",
    completeness: "FAIL",
    missing: ["Graduated Glass Pipette Dropper"],
    observed_state: "uncertain",
    amazon_condition: "Uncertain",
    disposition: "pending_review",
    evidence: [
      "Bottle matches Botanica 30ml dimensions and branding",
      "Observed state 'uncertain': Dropper cap appears substituted and liquid meniscus is darkened",
      "Amazon condition 'Uncertain': Hygiene integrity cannot be verified from photos",
      "Disposition: pending_review (mandatory human supervisor QA hold)"
    ],
    confidence_note: "UNCERTAIN on hygiene integrity; liquid discoloration suspected behind amber glass. Forwarded to QA specialist.",
    photo_urls: [
      generateTenantImageUri("org_demo_alpha", "UNIT-0092", 1)
    ],
    photo_display_urls: [
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=60"
    ],
    operator_id: "op_fatima",
    captured_at: "2026-06-20T12:15:00Z",
    status: "PENDING_REVIEW",
    overrides: null
  },
  {
    record_id: "RTN-0097",
    unit_id: "UNIT-0097",
    org_id: "org_demo_alpha",
    order_id: "ORD-DUMMY-50097",
    ordered_sku: "SKU-PROT-1KG",
    ordered_asin: "B0DUMMY357",
    product_name: "ApexFuel 100% Whey Isolate Powder (1kg Vanilla)",
    identity: "PASS",
    completeness: "FAIL",
    missing: ["Plastic Measuring Scoop (30g)"],
    observed_state: "signs_of_use",
    amazon_condition: "Used - Good",
    disposition: "refurbish",
    evidence: [
      "ApexFuel 1kg tub label and barcode confirmed",
      "Observed state 'signs_of_use': Induction foil seal partially peeled",
      "Missing: 30g plastic measuring scoop",
      "Amazon condition: 'Used - Good' (powder intact, requires replenishment scoop)"
    ],
    confidence_note: null,
    photo_urls: [
      generateTenantImageUri("org_demo_alpha", "UNIT-0097", 1)
    ],
    photo_display_urls: [
      "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=600&auto=format&fit=crop&q=60"
    ],
    operator_id: "op_chen",
    captured_at: "2026-07-03T22:04:00Z",
    status: "FINALIZED",
    overrides: null
  },
  {
    record_id: "RTN-0099",
    unit_id: "UNIT-0099",
    org_id: "org_demo_bravo",
    order_id: "ORD-DUMMY-50099",
    ordered_sku: "SKU-TOWEL-BLU",
    ordered_asin: "B0DUMMY600",
    product_name: "SereneLoft Organic Turkish Cotton Bath Towel (Navy Blue)",
    identity: "PASS",
    completeness: "PASS",
    missing: [],
    observed_state: "damaged",
    amazon_condition: "Unacceptable",
    disposition: "dispose",
    evidence: [
      "Navy cotton bath towel verified as SereneLoft model",
      "Observed state 'damaged': Severe bleach discoloration and snags",
      "Amazon condition 'Unacceptable': Permanent chemical bleach degradation of organic cotton fibers",
      "Scrap disposal required"
    ],
    confidence_note: "Permanent chemical bleach degradation of organic cotton fibers.",
    photo_urls: [
      generateTenantImageUri("org_demo_bravo", "UNIT-0099", 1)
    ],
    photo_display_urls: [
      "https://images.unsplash.com/photo-1616627547584-bf28cee262db?w=600&auto=format&fit=crop&q=60"
    ],
    operator_id: "op_eli",
    captured_at: "2026-06-29T08:06:00Z",
    status: "FINALIZED",
    overrides: null
  }
];
