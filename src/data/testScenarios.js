// 10 PRD Scenarios mapped to the official specification
// - 5 Dispositions: restock, refurbish, liquidate, dispose, pending_review
// - Separate raw observed_state and official amazon_condition
// - Tenant-isolated image namespaces

import { generateTenantImageUri } from './seedReturns.js';

export const PRD_TEST_SCENARIOS = [
  {
    id: 1,
    title: "Scenario 1: Correct Returned Product",
    subtitle: "AeroSound Pro Headphones - Fully intact, original accessories present",
    orderId: "ORD-SCEN-10001",
    sku: "SKU-HEADPHONE-BT",
    unitId: "UNIT-SCEN-001",
    orgId: "org_demo_alpha",
    photos: [
      {
        url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80",
        tenant_path: generateTenantImageUri("org_demo_alpha", "UNIT-SCEN-001", 1),
        label: "Front view - Headphone and molded hardshell case"
      },
      {
        url: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=700&auto=format&fit=crop&q=80",
        tenant_path: generateTenantImageUri("org_demo_alpha", "UNIT-SCEN-001", 2),
        label: "Accessory check - USB-C, 3.5mm cable, manual laid out"
      }
    ],
    expectedVerdict: {
      identity: "PASS",
      identity_basis: "Laser-etched AeroSound logo on hinge matches catalogue specification; USB-C geometry and headband padding conform to SKU-HEADPHONE-BT.",
      completeness: "PASS",
      missing: [],
      observed_state: "factory_sealed",
      observed_state_basis: "Manufacturer clear seal stickers on box ends are unbroken; protective film intact.",
      condition: "New",
      amazon_condition: "New",
      condition_basis: "Unopened in original retail packaging with all original materials included.",
      disposition: "restock",
      evidence: [
        "Visual match: 100% feature alignment with AeroSound Pro reference model",
        "Raw observed_state: 'factory_sealed' with undisturbed seals",
        "Amazon condition: 'New' (meets full restock standard)",
        "Hardware check: Carrying case, USB-C braided cable, 3.5mm cord, and manual all verified"
      ],
      confidence_note: null
    }
  },
  {
    id: 2,
    title: "Scenario 2: Wrong Returned Product",
    subtitle: "Customer returned cheap generic unbranded plastic earbuds instead of AeroSound Pro",
    orderId: "ORD-SCEN-10002",
    sku: "SKU-HEADPHONE-BT",
    unitId: "UNIT-SCEN-002",
    orgId: "org_demo_alpha",
    photos: [
      {
        url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=700&auto=format&fit=crop&q=80",
        tenant_path: generateTenantImageUri("org_demo_alpha", "UNIT-SCEN-002", 1),
        label: "Returned item - Unbranded in-ear buds with micro-USB charging case"
      }
    ],
    expectedVerdict: {
      identity: "FAIL",
      identity_basis: "Critical mismatch: Expected over-ear wireless headphones with metal swivel hinges (SKU-HEADPHONE-BT). Returned item is unbranded white plastic in-ear buds.",
      completeness: "FAIL",
      missing: ["Headphones", "Carrying Case", "USB-C Charging Cable", "3.5mm Audio Cable", "User Manual"],
      observed_state: "signs_of_use",
      observed_state_basis: "Substituted product exhibits surface dust, fingerprints, and micro-USB port wear.",
      condition: "Unacceptable",
      amazon_condition: "Unacceptable",
      condition_basis: "Substituted fraudulent merchandise does not correspond to catalogue SKU.",
      disposition: "dispose",
      evidence: [
        "Product identity failed: Form factor mismatch (in-ear vs over-ear)",
        "Zero matching components from AeroSound Pro BOM found in package",
        "Raw observed state: 'signs_of_use' on counterfeit/substituted goods",
        "Amazon condition: 'Unacceptable' -> Routed to DISPOSE / FRAUD_HOLD"
      ],
      confidence_note: "Immediate failure: Item returned does not correspond to catalogue SKU-HEADPHONE-BT in any visual dimension."
    }
  },
  {
    id: 3,
    title: "Scenario 3: Missing Single Accessory",
    subtitle: "AeroSound Pro Headphones returned complete except USB-C braided cable is missing",
    orderId: "ORD-SCEN-10003",
    sku: "SKU-HEADPHONE-BT",
    unitId: "UNIT-SCEN-003",
    orgId: "org_demo_bravo",
    photos: [
      {
        url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80",
        tenant_path: generateTenantImageUri("org_demo_bravo", "UNIT-SCEN-003", 1),
        label: "Headphones + Case + 3.5mm cable + manual (empty cable pocket)"
      }
    ],
    expectedVerdict: {
      identity: "PASS",
      identity_basis: "AeroSound Pro headphones correctly identified by serial number and ear cup markings.",
      completeness: "FAIL",
      missing: ["USB-C Charging Cable"],
      observed_state: "opened_unused",
      observed_state_basis: "Retail box opened, headphone body clean with zero skin contact marks.",
      condition: "Used - Like New",
      amazon_condition: "Used - Like New",
      condition_basis: "Unit is in perfect physical shape but missing one non-essential charging cable; packaging opened.",
      disposition: "refurbish",
      evidence: [
        "Headphone unit matches catalogue SKU-HEADPHONE-BT",
        "Observed state: 'opened_unused'",
        "Amazon condition: 'Used - Like New'",
        "Missing accessory detected: USB-C braided charging cable compartment is empty",
        "Action: Replenish standard USB-C cable from prep stock, re-box for secondary tier restock"
      ],
      confidence_note: null
    }
  },
  {
    id: 4,
    title: "Scenario 4: Missing Multiple Accessories",
    subtitle: "LuminaCraft LED Desk Lamp - Missing power adapter & USB power cable",
    orderId: "ORD-SCEN-10004",
    sku: "SKU-LAMP-LED",
    unitId: "UNIT-SCEN-004",
    orgId: "org_demo_alpha",
    photos: [
      {
        url: "https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?w=700&auto=format&fit=crop&q=80",
        tenant_path: generateTenantImageUri("org_demo_alpha", "UNIT-SCEN-004", 1),
        label: "Desk lamp unit only; bare styrofoam slots where power block & cord belong"
      }
    ],
    expectedVerdict: {
      identity: "PASS",
      identity_basis: "LuminaCraft anodized aluminum gooseneck and touch base correctly identified.",
      completeness: "FAIL",
      missing: ["USB Power Cable (1.5m)", "5V 2A Power Adapter"],
      observed_state: "signs_of_use",
      observed_state_basis: "Base plate shows minor scuff marks; internal power accessory cutouts are empty.",
      condition: "Used - Good",
      amazon_condition: "Used - Good",
      condition_basis: "Lamp functions but requires power accessory replenishment before resale.",
      disposition: "refurbish",
      evidence: [
        "Lamp hardware matches LuminaCraft specs",
        "Observed state: 'signs_of_use'",
        "Amazon condition: 'Used - Good'",
        "Accessory inventory: 2 mandatory power items missing from carton inserts",
        "Route to refurbishment bay for power adapter replenishment kit"
      ],
      confidence_note: "Unit requires electrical power kit restoration before re-grading."
    }
  },
  {
    id: 5,
    title: "Scenario 5: New-Looking Return",
    subtitle: "Nordic Fjord 500-Piece Puzzle in pristine, unopened factory shrink-wrap",
    orderId: "ORD-SCEN-10005",
    sku: "SKU-PUZZLE-500",
    unitId: "UNIT-SCEN-005",
    orgId: "org_demo_bravo",
    photos: [
      {
        url: "https://images.unsplash.com/photo-1585336261026-77894d010cfa?w=700&auto=format&fit=crop&q=80",
        tenant_path: generateTenantImageUri("org_demo_bravo", "UNIT-SCEN-005", 1),
        label: "Sealed box with factory cellophane reflection"
      }
    ],
    expectedVerdict: {
      identity: "PASS",
      identity_basis: "Title, artwork, and ISBN barcode match catalogue entry for Nordic Fjord 500-pc puzzle.",
      completeness: "PASS",
      missing: [],
      observed_state: "factory_sealed",
      observed_state_basis: "Factory heat-sealed cellophane undisturbed; sharp 90-degree corners with no crush.",
      condition: "New",
      amazon_condition: "New",
      condition_basis: "Pristine unopened original manufacturer packaging.",
      disposition: "restock",
      evidence: [
        "Factory shrink wrap intact with original manufacturer micro-perforations",
        "Observed state: 'factory_sealed'",
        "Amazon condition: 'New'",
        "Direct margin recovery: Return to primary inventory bin"
      ],
      confidence_note: null
    }
  },
  {
    id: 6,
    title: "Scenario 6: Lightly Used Return",
    subtitle: "SereneLoft Turkish Cotton Bath Towel - Opened packaging, inspected but unused",
    orderId: "ORD-SCEN-10006",
    sku: "SKU-TOWEL-BLU",
    unitId: "UNIT-SCEN-006",
    orgId: "org_demo_alpha",
    photos: [
      {
        url: "https://images.unsplash.com/photo-1616627547584-bf28cee262db?w=700&auto=format&fit=crop&q=80",
        tenant_path: generateTenantImageUri("org_demo_alpha", "UNIT-SCEN-006", 1),
        label: "Unfolded towel on inspection table, brand label visible"
      }
    ],
    expectedVerdict: {
      identity: "PASS",
      identity_basis: "Navy Turkish Aegean cotton weave and SereneLoft sewn tag match SKU-TOWEL-BLU.",
      completeness: "PASS",
      missing: [],
      observed_state: "opened_unused",
      observed_state_basis: "Towel unsealed and unfolded, terry loops plush with zero laundry fragrance or water exposure.",
      condition: "Used - Like New",
      amazon_condition: "Used - Like New",
      condition_basis: "Pristine condition; packaging was unsealed but item has zero wear.",
      disposition: "restock",
      evidence: [
        "Product identity verified against SereneLoft catalogue specification",
        "Observed state: 'opened_unused'",
        "Amazon condition: 'Used - Like New'",
        "Refold to standard specification and re-insert into protective clear polybag"
      ],
      confidence_note: null
    }
  },
  {
    id: 7,
    title: "Scenario 7: Damaged Return",
    subtitle: "Nordic Fjord Puzzle - Box corner crushed, torn lid, pieces spilled in shipping box",
    orderId: "ORD-SCEN-10007",
    sku: "SKU-PUZZLE-500",
    unitId: "UNIT-SCEN-007",
    orgId: "org_demo_bravo",
    photos: [
      {
        url: "https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=700&auto=format&fit=crop&q=80",
        tenant_path: generateTenantImageUri("org_demo_bravo", "UNIT-SCEN-007", 1),
        label: "Crushed box top and ruptured seam"
      }
    ],
    expectedVerdict: {
      identity: "PASS",
      identity_basis: "Box artwork identifies product as SKU-PUZZLE-500.",
      completeness: "FAIL",
      missing: ["Storage Box with Lid (Structural Failure)"],
      observed_state: "damaged",
      observed_state_basis: "Severe diagonal crease across lid; bottom tray split at corner; piece bag burst.",
      condition: "Unacceptable",
      amazon_condition: "Unacceptable",
      condition_basis: "Severe physical box damage; piece integrity compromised.",
      disposition: "dispose",
      evidence: [
        "Cardboard packaging structurally compromised",
        "Observed state: 'damaged'",
        "Amazon condition: 'Unacceptable'",
        "Piece count cannot be guaranteed; write off unit value and recycle cardboard"
      ],
      confidence_note: "Physical box destruction + opened piece seal prevents refurbishment."
    }
  },
  {
    id: 8,
    title: "Scenario 8: Heavily Damaged Return",
    subtitle: "TrailHound Heavy-Duty Leash - Nylon rope severed/chewed through, snap hook bent",
    orderId: "ORD-SCEN-10008",
    sku: "SKU-LEASH-6FT",
    unitId: "UNIT-SCEN-008",
    orgId: "org_demo_alpha",
    photos: [
      {
        url: "https://images.unsplash.com/photo-1535294435445-d7249524ef2e?w=700&auto=format&fit=crop&q=80",
        tenant_path: generateTenantImageUri("org_demo_alpha", "UNIT-SCEN-008", 1),
        label: "Severed nylon strands and warped zinc clasp"
      }
    ],
    expectedVerdict: {
      identity: "PASS",
      identity_basis: "Reflective red weave and molded rubber joint match TrailHound 6ft leash.",
      completeness: "FAIL",
      missing: ["6ft Braided Nylon Leash (Intact Segment)"],
      observed_state: "damaged",
      observed_state_basis: "Rope cross-section severed by over 70%; metal hook bent beyond closure latch.",
      condition: "Unacceptable",
      amazon_condition: "Unacceptable",
      condition_basis: "Defective and dangerous structural failure.",
      disposition: "dispose",
      evidence: [
        "Product identity confirmed via rubber sheath logo",
        "Observed state: 'damaged'",
        "Amazon condition: 'Unacceptable' (critical safety hazard)",
        "Immediate scrap disposal required under safety compliance guidelines"
      ],
      confidence_note: "Total structural write-off. Safety equipment cannot be refurbished or liquidated."
    }
  },
  {
    id: 9,
    title: "Scenario 9: Ambiguous Condition (UNCERTAIN / pending_review)",
    subtitle: "Botanica Vitamin C Serum - Amber bottle intact, cloudy residue, unclear if opened or oxidized",
    orderId: "ORD-SCEN-10009",
    sku: "SKU-SERUM-30",
    unitId: "UNIT-SCEN-009",
    orgId: "org_demo_bravo",
    photos: [
      {
        url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=700&auto=format&fit=crop&q=80",
        tenant_path: generateTenantImageUri("org_demo_bravo", "UNIT-SCEN-009", 1),
        label: "Backlit bottle showing murky fluid and partially stripped neck sleeve"
      }
    ],
    expectedVerdict: {
      identity: "PASS",
      identity_basis: "Botanica label, amber glass bottle, and graduated dropper verified.",
      completeness: "PASS",
      missing: [],
      observed_state: "uncertain",
      observed_state_basis: "Tamper shrink band has hairline tear; dark glass obscures true liquid oxidation state.",
      condition: "Uncertain",
      amazon_condition: "Uncertain",
      condition_basis: "Cannot determine whether formulation has degraded without opening seal. Unclear if New or Unacceptable.",
      disposition: "pending_review",
      evidence: [
        "Container and dropper visually match catalogue SKU-SERUM-30",
        "Observed state: 'uncertain'",
        "Amazon condition: 'Uncertain' (ambiguous hygiene boundary)",
        "Disposition routed to: pending_review (first-class audit state, never forced guess)"
      ],
      confidence_note: "FLAGGED UNCERTAIN: Evidence is ambiguous between 'Intact Cosmetic Formulation' vs 'Opened/Oxidized'. Routed to pending_review for physical QA inspection."
    }
  },
  {
    id: 10,
    title: "Scenario 10: Visually Similar Products (UNCERTAIN Identity / pending_review)",
    subtitle: "LuminaCraft Lamp vs Non-Dimmable Clone - Exterior looks identical, missing touch control panel",
    orderId: "ORD-SCEN-10010",
    sku: "SKU-LAMP-LED",
    unitId: "UNIT-SCEN-010",
    orgId: "org_demo_alpha",
    photos: [
      {
        url: "https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?w=700&auto=format&fit=crop&q=80",
        tenant_path: generateTenantImageUri("org_demo_alpha", "UNIT-SCEN-010", 1),
        label: "Lamp base showing mechanical toggle switch instead of capacitive touch icons"
      }
    ],
    expectedVerdict: {
      identity: "UNCERTAIN",
      identity_basis: "Visual inspection detected physical discrepancy: Ordered SKU-LAMP-LED features capacitive touch markings and smooth aluminum base; returned unit has mechanical plastic rocker switch.",
      completeness: "PASS",
      missing: [],
      observed_state: "opened_unused",
      observed_state_basis: "Unit is unblemished but switch configuration differs from master spec.",
      condition: "Used - Like New",
      amazon_condition: "Used - Like New",
      condition_basis: "Item is clean and functional, but uncertain identity prevents immediate restock.",
      disposition: "pending_review",
      evidence: [
        "Base shape matches LuminaCraft silhouette, but control interface diverges from spec",
        "Identity check: UNCERTAIN (suspected model revision or 3rd party generic clone)",
        "Amazon condition: 'Used - Like New'",
        "Disposition routed to: pending_review per Rule 4"
      ],
      confidence_note: "IDENTITY UNCERTAIN: High visual similarity to SKU-LAMP-LED, but control typography does not match authoritative catalogue photo. Flagged for pending_review."
    }
  }
];
