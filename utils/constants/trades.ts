export const TRADE_CATEGORIES = {
  GENERAL_CONTRACTOR: "General Contractor",
  CARPENTER: "Carpenter",
  FINISH_CARPENTER: "Finish Carpenter",
  CABINET_MAKER: "Cabinet Maker",
  CONSTRUCTION_ELECTRICIAN: "Construction Electrician",
  PLUMBER: "Plumber",
  GASFITTER: "Gasfitter",
  ROOFER: "Roofer",
  HVAC_REFRIGERATION: "HVAC / Refrigeration",
  STEAMFITTER_PIPEFITTER: "Steamfitter / Pipefitter",
  SPRINKLER_SYSTEM_INSTALL: "Sprinkler System Install",
  SHEET_METAL_WORKER: "Sheet-Metal Worker",
  GLAZIER: "Glazier",
  INSULATION_INSTALLER: "Insulation Installer",
  BRICKLAYER_MASONRY: "Bricklayer / Masonry",
  CONCRETE_CARPENTER: "Concrete Carpenter",
  CONCRETE_FINISHER: "Concrete Finisher",
  TILESETTER: "Tilesetter",
  DRYWALLER: "Drywaller",
  DRYWALL_FINISHER: "Drywall Finisher",
  PAINTER: "Painter",
  FLOORCOVERING_INSTALLER: "Floorcovering Installer",
  EXCAVATION_EARTHWORK: "Excavation / Earthwork",
  IRONWORKER_STRUCTURAL: "Ironworker / Structural",
  BOILERMAKER: "Boilermaker",
  LANDSCAPER: "Landscaper",
  ENGINEER: "Engineer",
  ARCHITECT: "Architect",
  ELECTRICIAN: "Electrician",
  CLEANER: "Cleaner",
  MOVER: "Mover",
  JUNK_REMOVAL: "Junk Removal",
} as const;

export type TradeCategory =
  (typeof TRADE_CATEGORIES)[keyof typeof TRADE_CATEGORIES];

export const TRADE_CATEGORY_VALUES = Object.values(TRADE_CATEGORIES);

// Available trade categories (excluding disabled ones)
export const AVAILABLE_TRADE_CATEGORIES = [
  "Carpenter",
  "Finish Carpenter",
  "Cabinet Maker",
  "Construction Electrician",
  "Plumber",
  "Gasfitter",
  "Roofer",
  "HVAC / Refrigeration",
  "Steamfitter / Pipefitter",
  "Sprinkler System Install",
  "Sheet-Metal Worker",
  "Glazier",
  "Insulation Installer",
  "Bricklayer / Masonry",
  "Concrete Carpenter",
  "Concrete Finisher",
  "Tilesetter",
  "Drywaller",
  "Drywall Finisher",
  "Painter",
  "Floorcovering Installer",
  "Excavation / Earthwork",
  "Ironworker / Structural",
  "Boilermaker",
  "Landscaper",
  "Engineer",
  "Architect",
  "Electrician",
  "Cleaner",
  "Mover",
  "Junk Removal",
];

// Disabled trade categories with "Coming Soon" label
export const DISABLED_TRADE_CATEGORIES = [
  "General Contractor (Coming Soon)",
];

// All trade categories including disabled ones for display purposes
export const ALL_TRADE_CATEGORY_VALUES = [
  ...DISABLED_TRADE_CATEGORIES,
  ...AVAILABLE_TRADE_CATEGORIES,
];

export const TRADE_CATEGORY_DESCRIPTIONS: Record<TradeCategory, string> = {
  [TRADE_CATEGORIES.GENERAL_CONTRACTOR]:
    "Coordinates and oversees multi-trade projects.",
  [TRADE_CATEGORIES.CARPENTER]: "Performs framing and structural woodwork.",
  [TRADE_CATEGORIES.FINISH_CARPENTER]:
    "Specializes in trim, mouldings, cabinetry installation.",
  [TRADE_CATEGORIES.CABINET_MAKER]:
    "Builds and installs custom cabinets and built-ins.",
  [TRADE_CATEGORIES.CONSTRUCTION_ELECTRICIAN]:
    "Installs and wires residential electrical systems.",
  [TRADE_CATEGORIES.PLUMBER]: "Installs water supply and drainage systems.",
  [TRADE_CATEGORIES.GASFITTER]:
    "Handles gas lines, appliances, and heating systems.",
  [TRADE_CATEGORIES.ROOFER]: "Installs or repairs roofing systems.",
  [TRADE_CATEGORIES.HVAC_REFRIGERATION]:
    "Installs and services heating, ventilation, air conditioning.",
  [TRADE_CATEGORIES.STEAMFITTER_PIPEFITTER]:
    "Works on high-pressure pipe systems.",
  [TRADE_CATEGORIES.SPRINKLER_SYSTEM_INSTALL]:
    "Installs fire protection sprinkler systems.",
  [TRADE_CATEGORIES.SHEET_METAL_WORKER]:
    "Builds and installs ducting or custom metalwork.",
  [TRADE_CATEGORIES.GLAZIER]: "Installs glass windows, doors, and partitions.",
  [TRADE_CATEGORIES.INSULATION_INSTALLER]:
    "Applies thermal, sound, or vapor barrier insulation.",
  [TRADE_CATEGORIES.BRICKLAYER_MASONRY]:
    "Works with brick, stone, and concrete blocks.",
  [TRADE_CATEGORIES.CONCRETE_CARPENTER]:
    "Forming and framing for concrete structures and pads.",
  [TRADE_CATEGORIES.CONCRETE_FINISHER]:
    "Smooths and finishes concrete surfaces.",
  [TRADE_CATEGORIES.TILESETTER]: "Lays ceramic, porcelain, or stone tiles.",
  [TRADE_CATEGORIES.DRYWALLER]: "Installs drywall panels.",
  [TRADE_CATEGORIES.DRYWALL_FINISHER]: "Tapes and muds drywall seams.",
  [TRADE_CATEGORIES.PAINTER]: "Preps and paints interior/exterior surfaces.",
  [TRADE_CATEGORIES.FLOORCOVERING_INSTALLER]:
    "Installs hardwood, laminate, carpet, or vinyl flooring.",
  [TRADE_CATEGORIES.EXCAVATION_EARTHWORK]:
    "Performs site grading, trenching, and digging.",
  [TRADE_CATEGORIES.IRONWORKER_STRUCTURAL]:
    "Installs rebar, steel beams, and structural components.",
  [TRADE_CATEGORIES.BOILERMAKER]:
    "Constructs or repairs boilers, tanks, and pressure vessels.",
  [TRADE_CATEGORIES.LANDSCAPER]:
    "Provides hardscape and softscape installation.",
  [TRADE_CATEGORIES.ENGINEER]:
    "Offers structural, civil, or mechanical engineering services.",
  [TRADE_CATEGORIES.ARCHITECT]:
    "Provides architectural plans and compliance drawings.",
  [TRADE_CATEGORIES.ELECTRICIAN]:
    "Licensed for general residential or commercial electrical work.",
  [TRADE_CATEGORIES.CLEANER]:
    "Cleaning services for construction, residential and short-term rentals.",
  [TRADE_CATEGORIES.MOVER]:
    "Preparing, taking, transporting and delivering items from one place to the other.",
  [TRADE_CATEGORIES.JUNK_REMOVAL]:
    "Collecting, transporting, and disposing of larger, bulkier, or specialized items in a safe, eco-friendly manner.",
};
