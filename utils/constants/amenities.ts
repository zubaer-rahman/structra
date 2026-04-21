// Site Amenities Constants - Similar to Airbnb's "What this place offers"
// These constants define all available amenities for each category

export const AMENITY_CATEGORIES = {
  POWER: 'power',
  SANITATION: 'sanitation', 
  WATER: 'water',
  PARKING: 'parking',
  COMFORT: 'comfort',
  SAFETY: 'safety',
  SECURITY: 'security',
  LOGISTICS: 'logistics'
} as const;

export const POWER_AMENITIES = {
  INDOOR_RECEPTACLE: 'indoor_receptacle',
  TWO_PLUS_INDOOR_RECEPTACLES: '2_plus_indoor_receptacles',
  OUTDOOR_RECEPTACLE: 'outdoor_receptacle', 
  TWO_PLUS_OUTDOOR_RECEPTACLES: '2_plus_outdoor_receptacles',
  TWENTY_AMP_RECEPTACLE: '20_amp_receptacle',
  THIRTY_AMP_RECEPTACLE: '30_amp_receptacle',
  FIFTY_AMP_RECEPTACLE: '50_amp_receptacle'
} as const;

export const SANITATION_AMENITIES = {
  FLUSHING_TOILETS: 'flushing_toilets',
  PORTABLE_TOILETS: 'portable_toilets'
} as const;

export const WATER_AMENITIES = {
  INDOOR_TAP: 'indoor_tap',
  OUTDOOR_TAP: 'outdoor_tap'
} as const;

export const PARKING_AMENITIES = {
  ONE_SPACE: '1_space',
  TWO_SPACES: '2_spaces',
  THREE_SPACES: '3_spaces', 
  FOUR_SPACES: '4_spaces',
  FIVE_PLUS_SPACES: '5_plus_spaces'
} as const;

export const COMFORT_AMENITIES = {
  INDOOR_BREAK_AREA: 'indoor_break_area',
  OUTDOOR_SHELTERED_BREAK_AREA: 'outdoor_sheltered_break_area',
  DESIGNATED_SMOKING_AREA: 'designated_smoking_area',
  WIFI: 'wifi',
  CELL_RECEPTION: 'cell_reception',
  FRIDGE: 'fridge'
} as const;

export const SAFETY_AMENITIES = {
  FIRST_AID_KIT: 'first_aid_kit',
  FIRE_EXTINGUISHER: 'fire_extinguisher',
  SPILL_KIT: 'spill_kit'
} as const;

export const SECURITY_AMENITIES = {
  KEY_TO_BE_PROVIDED: 'key_to_be_provided',
  HOMEOWNER_MANAGED: 'homeowner_managed',
  SECURITY_GUARDS: 'security_guards',
  SECURITY_CAMERAS: 'security_cameras'
} as const;

export const LOGISTICS_AMENITIES = {
  TRAILER_STORAGE: 'trailer_storage',
  MATERIALS_STORAGE: 'materials_storage',
  CONTRACTOR_SIGNAGE_ALLOWED: 'contractor_signage_allowed',
  CONSTRUCTION_WASTE_BIN: 'construction_waste_bin',
  HOUSEHOLD_WASTE_BIN: 'household_waste_bin',
  RESTRICTED_MATERIALS_WASTE_BIN: 'restricted_materials_waste_bin'
} as const;

// All amenities grouped by category
export const ALL_AMENITIES: Record<string, string[]> = {
  [AMENITY_CATEGORIES.POWER]: Object.values(POWER_AMENITIES),
  [AMENITY_CATEGORIES.SANITATION]: Object.values(SANITATION_AMENITIES),
  [AMENITY_CATEGORIES.WATER]: Object.values(WATER_AMENITIES),
  [AMENITY_CATEGORIES.PARKING]: Object.values(PARKING_AMENITIES),
  [AMENITY_CATEGORIES.COMFORT]: Object.values(COMFORT_AMENITIES),
  [AMENITY_CATEGORIES.SAFETY]: Object.values(SAFETY_AMENITIES),
  [AMENITY_CATEGORIES.SECURITY]: Object.values(SECURITY_AMENITIES),
  [AMENITY_CATEGORIES.LOGISTICS]: Object.values(LOGISTICS_AMENITIES)
} as const;

// Human-readable labels for amenities
export const AMENITY_LABELS = {
  // Power
  [POWER_AMENITIES.INDOOR_RECEPTACLE]: 'Indoor Receptacle',
  [POWER_AMENITIES.TWO_PLUS_INDOOR_RECEPTACLES]: '2+ Indoor Receptacles',
  [POWER_AMENITIES.OUTDOOR_RECEPTACLE]: 'Outdoor Receptacle',
  [POWER_AMENITIES.TWO_PLUS_OUTDOOR_RECEPTACLES]: '2+ Outdoor Receptacles',
  [POWER_AMENITIES.TWENTY_AMP_RECEPTACLE]: '20 Amp Receptacle',
  [POWER_AMENITIES.THIRTY_AMP_RECEPTACLE]: '30 Amp Receptacle',
  [POWER_AMENITIES.FIFTY_AMP_RECEPTACLE]: '50 Amp Receptacle',
  
  // Sanitation
  [SANITATION_AMENITIES.FLUSHING_TOILETS]: 'Flushing Toilets',
  [SANITATION_AMENITIES.PORTABLE_TOILETS]: 'Portable Toilets',
  
  // Water
  [WATER_AMENITIES.INDOOR_TAP]: 'Indoor Tap',
  [WATER_AMENITIES.OUTDOOR_TAP]: 'Outdoor Tap',
  
  // Parking
  [PARKING_AMENITIES.ONE_SPACE]: '1 Space',
  [PARKING_AMENITIES.TWO_SPACES]: '2 Spaces',
  [PARKING_AMENITIES.THREE_SPACES]: '3 Spaces',
  [PARKING_AMENITIES.FOUR_SPACES]: '4 Spaces',
  [PARKING_AMENITIES.FIVE_PLUS_SPACES]: '5+ Spaces',
  
  // Comfort
  [COMFORT_AMENITIES.INDOOR_BREAK_AREA]: 'Indoor Break Area',
  [COMFORT_AMENITIES.OUTDOOR_SHELTERED_BREAK_AREA]: 'Outdoor Sheltered Break Area',
  [COMFORT_AMENITIES.DESIGNATED_SMOKING_AREA]: 'Designated Smoking Area',
  [COMFORT_AMENITIES.WIFI]: 'WiFi',
  [COMFORT_AMENITIES.CELL_RECEPTION]: 'Cell Reception',
  [COMFORT_AMENITIES.FRIDGE]: 'Fridge',
  
  // Safety
  [SAFETY_AMENITIES.FIRST_AID_KIT]: 'First Aid Kit',
  [SAFETY_AMENITIES.FIRE_EXTINGUISHER]: 'Fire Extinguisher',
  [SAFETY_AMENITIES.SPILL_KIT]: 'Spill Kit',
  
  // Security
  [SECURITY_AMENITIES.KEY_TO_BE_PROVIDED]: 'Key to be Provided',
  [SECURITY_AMENITIES.HOMEOWNER_MANAGED]: 'Homeowner Managed',
  [SECURITY_AMENITIES.SECURITY_GUARDS]: 'Security Guards',
  [SECURITY_AMENITIES.SECURITY_CAMERAS]: 'Security Cameras',
  
  // Logistics
  [LOGISTICS_AMENITIES.TRAILER_STORAGE]: 'Trailer Storage',
  [LOGISTICS_AMENITIES.MATERIALS_STORAGE]: 'Materials Storage',
  [LOGISTICS_AMENITIES.CONTRACTOR_SIGNAGE_ALLOWED]: 'Contractor Signage Allowed',
  [LOGISTICS_AMENITIES.CONSTRUCTION_WASTE_BIN]: 'Construction Waste Bin',
  [LOGISTICS_AMENITIES.HOUSEHOLD_WASTE_BIN]: 'Household Waste Bin',
  [LOGISTICS_AMENITIES.RESTRICTED_MATERIALS_WASTE_BIN]: 'Restricted Materials Waste Bin'
} as const;

// Category labels
export const CATEGORY_LABELS = {
  [AMENITY_CATEGORIES.POWER]: 'Power',
  [AMENITY_CATEGORIES.SANITATION]: 'Sanitation',
  [AMENITY_CATEGORIES.WATER]: 'Water',
  [AMENITY_CATEGORIES.PARKING]: 'Parking',
  [AMENITY_CATEGORIES.COMFORT]: 'Comfort',
  [AMENITY_CATEGORIES.SAFETY]: 'Safety',
  [AMENITY_CATEGORIES.SECURITY]: 'Security',
  [AMENITY_CATEGORIES.LOGISTICS]: 'Logistics'
} as const;

// Default "not included" amenities that should be shown unless explicitly selected
export const DEFAULT_NOT_INCLUDED_AMENITIES = {
  [AMENITY_CATEGORIES.POWER]: Object.values(POWER_AMENITIES),
  [AMENITY_CATEGORIES.SANITATION]: Object.values(SANITATION_AMENITIES),
  [AMENITY_CATEGORIES.WATER]: Object.values(WATER_AMENITIES),
  [AMENITY_CATEGORIES.PARKING]: Object.values(PARKING_AMENITIES)
} as const;

// Helper function to get amenities that are NOT included
export function getNotIncludedAmenities(selectedAmenities: SiteAmenities) {
  const notIncluded: Record<string, string[]> = {};
  
  Object.entries(DEFAULT_NOT_INCLUDED_AMENITIES).forEach(([category, defaultAmenities]) => {
    const selected = selectedAmenities[category as keyof SiteAmenities] || [];
    notIncluded[category] = defaultAmenities.filter(amenity => !selected.includes(amenity));
  });
  
  return notIncluded;
}

// Helper function to check if sanitation is properly handled
export function validateSanitationAmenities(amenities: SiteAmenities) {
  // If no sanitation amenities are selected, it's valid (will show as not included)
  const sanitation = amenities[AMENITY_CATEGORIES.SANITATION as keyof SiteAmenities] || [];
  return Array.isArray(sanitation);
}

// Helper function to get amenity label
export function getAmenityLabel(amenityKey: string): string {
  return AMENITY_LABELS[amenityKey as keyof typeof AMENITY_LABELS] || amenityKey;
}

// Helper function to get category label
export function getCategoryLabel(categoryKey: string): string {
  return CATEGORY_LABELS[categoryKey as keyof typeof CATEGORY_LABELS] || categoryKey;
}

// Export the SiteAmenities type
export interface SiteAmenities {
  power: string[];
  sanitation: string[];
  water: string[];
  parking: string[];
  comfort: string[];
  safety: string[];
  security: string[];
  logistics: string[];
}
