// Canonical Product Catalogue for Returns Manager
// Provides reference data, expected components, and identity specifications

export const PRODUCT_CATALOGUE = [
  {
    sku: "SKU-HEADPHONE-BT",
    asin: "B09HEADPH1",
    name: "AeroSound Pro Wireless Noise-Cancelling Headphones",
    category: "Electronics",
    expectedParts: ["Headphones", "Carrying Case", "USB-C Charging Cable", "3.5mm Audio Cable", "User Manual"],
    retailPrice: 199.99,
    description: "Over-ear matte black wireless headphones with active noise cancellation and memory foam earcups.",
    keyVisualFeatures: [
      "Subtle AeroSound logo laser-etched on left hinge",
      "USB-C port on right ear cup bottom with LED indicator",
      "Black hardshell zip carrying case with custom molded interior",
      "Braided 1.2m USB-A to USB-C black cable"
    ],
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60"
  },
  {
    sku: "SKU-PUZZLE-500",
    asin: "B0DUMMY729",
    name: "Nordic Fjord Landscape 500-Piece Art Jigsaw Puzzle",
    category: "Toys & Games",
    expectedParts: ["500 Puzzle Pieces", "Full-Size Reference Poster", "Storage Box with Lid"],
    retailPrice: 24.99,
    description: "High-grade recycled cardboard 500-piece puzzle featuring scenic Nordic fjord photography.",
    keyVisualFeatures: [
      "Glossy two-piece rigid cardboard box with UV spot varnish on title",
      "Folded glossy 18x24 inch reference poster included inside",
      "Dust-free sealed plastic bag containing exact 500 die-cut pieces"
    ],
    imageUrl: "https://images.unsplash.com/photo-1585336261026-77894d010cfa?w=500&auto=format&fit=crop&q=60"
  },
  {
    sku: "SKU-LAMP-LED",
    asin: "B0DUMMY357",
    name: "LuminaCraft Minimalist Dimmable LED Desk Lamp",
    category: "Home & Office",
    expectedParts: ["Desk Lamp Unit", "USB Power Cable (1.5m)", "5V 2A Power Adapter", "User Manual"],
    retailPrice: 49.95,
    description: "Anodized space-gray aluminum swivel lamp with 5-stage touch capacitive dimmer.",
    keyVisualFeatures: [
      "Circular brushed aluminum weighted base with etched capacitive touch icons",
      "360-degree flexible gooseneck covered in matte silicone",
      "LuminaCraft logo printed on base rear near USB-C power input port"
    ],
    imageUrl: "https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?w=500&auto=format&fit=crop&q=60"
  },
  {
    sku: "SKU-BOTTLE-750",
    asin: "B0DUMMY622",
    name: "HydroPure 750ml Vacuum-Insulated Thermal Bottle",
    category: "Sports & Outdoors",
    expectedParts: ["Stainless Steel Bottle (750ml)", "Leakproof Spout Lid", "Silicone Gasket"],
    retailPrice: 32.00,
    description: "Double-wall food-grade 18/8 stainless steel bottle with powder-coat matte cobalt finish.",
    keyVisualFeatures: [
      "Embossed HydroPure mountain logo on lower half",
      "Matte black twist-on lid with integrated finger carry loop",
      "Removable silicone sealing O-ring ring inside lid channel"
    ],
    imageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=60"
  },
  {
    sku: "SKU-SERUM-30",
    asin: "B0DUMMY031",
    name: "Botanica Radiant Glow 10% Vitamin C Facial Serum (30ml)",
    category: "Beauty & Personal Care",
    expectedParts: ["Amber Glass Dropper Bottle (30ml)", "Graduated Glass Pipette Dropper", "Safety Tamper-Evident Neck Ring", "Product Leaflet"],
    retailPrice: 38.50,
    description: "Active Vitamin C brightening serum in UV-protective amber glass bottle with tamper seal.",
    keyVisualFeatures: [
      "Dark amber glass bottle to prevent oxidation of active L-Ascorbic acid",
      "White rubber bulb dropper cap with clear plastic tamper-evident shrink sleeve",
      "Printed batch lot number and expiry date stamped on underside of glass"
    ],
    imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&auto=format&fit=crop&q=60"
  },
  {
    sku: "SKU-PROT-1KG",
    asin: "B0DUMMY357",
    name: "ApexFuel 100% Whey Isolate Powder (1kg Vanilla)",
    category: "Health & Nutrition",
    expectedParts: ["Plastic Tub with Screw Cap", "Induction Heat Inner Seal", "Plastic Measuring Scoop (30g)"],
    retailPrice: 54.99,
    description: "1kg white HDPE nutrition container with tamper-evident foil hermetic seal under lid.",
    keyVisualFeatures: [
      "White screw lid with blue safety tear-strip",
      "Silver airtight foil induction seal directly over container mouth",
      "Clear embossed measuring scoop buried or placed on top of powder"
    ],
    imageUrl: "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=500&auto=format&fit=crop&q=60"
  },
  {
    sku: "SKU-TOWEL-BLU",
    asin: "B0DUMMY600",
    name: "SereneLoft Organic Turkish Cotton Bath Towel (Navy Blue)",
    category: "Home & Kitchen",
    expectedParts: ["Bath Towel (30x58 inches)", "Fabric Care Tag", "Recyclable Kraft Ribbon"],
    retailPrice: 28.00,
    description: "700 GSM combed Aegean organic cotton towel with ribbed border band.",
    keyVisualFeatures: [
      "Woven fabric care label sewn into side seam with SereneLoft emblem",
      "Signature 2-inch ribbed decorative dobby hem on both short ends",
      "Deep navy blue color throughout with no discoloration"
    ],
    imageUrl: "https://images.unsplash.com/photo-1616627547584-bf28cee262db?w=500&auto=format&fit=crop&q=60"
  },
  {
    sku: "SKU-LEASH-6FT",
    asin: "B0DUMMY205",
    name: "TrailHound Heavy-Duty Reflective Dog Leash (6ft)",
    category: "Pet Supplies",
    expectedParts: ["6ft Braided Nylon Leash", "Zinc-Alloy Swivel Snap Hook", "Padded Neoprene Handle"],
    retailPrice: 21.99,
    description: "Double-layered 1-inch nylon mountain rope leash with 3M reflective threading.",
    keyVisualFeatures: [
      "Heavy duty black gunmetal 360-degree rotating clasp",
      "Dual reflective stitched stripes running full length of red rope",
      "Comfort-cushioned neoprene inner lining on the handle loop"
    ],
    imageUrl: "https://images.unsplash.com/photo-1535294435445-d7249524ef2e?w=500&auto=format&fit=crop&q=60"
  },
  {
    sku: "SKU-CANDLE-3",
    asin: "B0DUMMY964",
    name: "Lumiere Botanica Aromatherapy Candle Trio Gift Set",
    category: "Home Decor",
    expectedParts: ["Soy Candle - Lavender (4oz)", "Soy Candle - Cedarwood (4oz)", "Soy Candle - Citrus (4oz)", "Magnetic Presentation Gift Box"],
    retailPrice: 42.00,
    description: "Three 4oz hand-poured 100% natural soy wax candles in matte amber glass jars with metal lids.",
    keyVisualFeatures: [
      "Embossed black rigid gift box with magnetic closure flap and custom foam insert",
      "Gold foil typography on three distinct scent labels",
      "Natural unbleached cotton braided wicks centered in each jar"
    ],
    imageUrl: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500&auto=format&fit=crop&q=60"
  },
  {
    sku: "SKU-MUG-11",
    asin: "B0DUMMY351",
    name: "Artisan Stoneware Ceramic Coffee Mug Set of 2 (11oz)",
    category: "Kitchen & Dining",
    expectedParts: ["Ceramic Mug 1 (Speckled Oat)", "Ceramic Mug 2 (Matte Terracotta)", "Molded Pulp Packaging"],
    retailPrice: 29.95,
    description: "Handcrafted reactive glaze 11-ounce ceramic mugs with ergonomic thumb-rest handles.",
    keyVisualFeatures: [
      "Dual complementary colors: one cream speckled, one warm terracotta",
      "Raw unglazed exposed ceramic ring on bottom with embossed potter's mark",
      "Thick heat-retaining clay wall with wide rounded rim"
    ],
    imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60"
  },
  {
    sku: "SKU-CABLE-USBC",
    asin: "B0DUMMY261",
    name: "VoltLink Ultra-Durable 100W USB-C to USB-C Fast Charging Cable (2m)",
    category: "Electronics Accessories",
    expectedParts: ["2m Braided Cable", "Silicone Cable Organizer Wrap", "Warranty Card"],
    retailPrice: 16.99,
    description: "Reinforced aramid fiber braided 100W PD 5A charging cable with anodized aluminum plug connectors.",
    keyVisualFeatures: [
      "Gunmetal grey anodized aluminum connector housings with laser-etched 100W symbol",
      "Extended flexible TPE strain relief boots tested to 25,000+ bends",
      "Included integrated snap-button black silicone cable tidy tie"
    ],
    imageUrl: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=500&auto=format&fit=crop&q=60"
  }
];

// Helper to find catalogue product by SKU or ASIN
export function getProductBySku(sku) {
  return PRODUCT_CATALOGUE.find(p => p.sku === sku || p.asin === sku) || null;
}
