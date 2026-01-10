import { z } from 'zod';

// Define the required fields for contractor verification
export interface ContractorProfileValidation {
  isComplete: boolean;
  missingFields: string[];
  missingFieldsDisplay: string[];
}

// Required fields for contractor verification (excluding logos and images)
const REQUIRED_FIELDS = {
  // Personal Information
  first_name: 'First Name',
  last_name: 'Last Name',
  phone_number: 'Phone Number',
  
  // Business Information
  business_name: 'Business Name',
  bio: 'Business Description/Bio',
  legal_entity_type: 'Legal Entity Type',
  trade_category: 'Trade Category',
  // service_location: 'Service Location', // REMOVED: Field requires exact address, doesn't work with city/province only
  
  // Compliance Information
  gst_hst_number: 'GST/HST Number',
  wcb_number: 'WCB Number',
  
  // Work Guarantee Information
  work_guarantee: 'Work Guarantee Amount',
  work_guarantee_statement: 'Work Guarantee Statement'
} as const;

type RequiredFieldKey = keyof typeof REQUIRED_FIELDS;

/**
 * Validates if a contractor profile is complete enough for verification
 * @param userProfile - User profile data (first_name, last_name, phone_number, address)
 * @param contractorProfile - Contractor profile data
 * @returns Validation result with completion status and missing fields
 */
export function validateContractorProfileForVerification(
  userProfile: {
    first_name?: string | null;
    last_name?: string | null;
    phone_number?: string | null;
    address?: string | null;
  } | null,
  contractorProfile: {
    business_name?: string | null;
    bio?: string | null;
    legal_entity_type?: string | null;
    trade_category?: string[] | null;
    service_location?: string | { address: string; [key: string]: any } | null;
    gst_hst_number?: string | null;
    wcb_number?: string | null;
    insurance_general_liability?: number | null;
    insurance_builders_risk?: number | null;
    insurance_expiry?: string | null;
    work_guarantee?: number | null;
    work_guarantee_statement?: string | null;
  } | null
): ContractorProfileValidation {
  const missingFields: string[] = [];
  const missingFieldsDisplay: string[] = [];

  // Combine user and contractor profile data
  const combinedProfile = {
    first_name: userProfile?.first_name,
    last_name: userProfile?.last_name,
    phone_number: userProfile?.phone_number,
    business_name: contractorProfile?.business_name,
    bio: contractorProfile?.bio,
    legal_entity_type: contractorProfile?.legal_entity_type,
    trade_category: contractorProfile?.trade_category,
    service_location: contractorProfile?.service_location,
    gst_hst_number: contractorProfile?.gst_hst_number,
    wcb_number: contractorProfile?.wcb_number,
    insurance_general_liability: contractorProfile?.insurance_general_liability,
    insurance_builders_risk: contractorProfile?.insurance_builders_risk,
    insurance_expiry: contractorProfile?.insurance_expiry,
    work_guarantee: contractorProfile?.work_guarantee,
    work_guarantee_statement: contractorProfile?.work_guarantee_statement,
  };

  // Check each required field
  Object.entries(REQUIRED_FIELDS).forEach(([fieldKey, displayName]) => {
    const key = fieldKey as RequiredFieldKey;
    const value = combinedProfile[key];
    
    // Check if field is missing or empty
    if (isFieldEmpty(value)) {
      missingFields.push(key);
      missingFieldsDisplay.push(displayName);
    }
  });

  return {
    isComplete: missingFields.length === 0,
    missingFields,
    missingFieldsDisplay,
  };
}

/**
 * Helper function to check if a field is considered empty
 */
function isFieldEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'number' && (isNaN(value) || value === 0)) return true;
  // Handle location objects
  if (typeof value === 'object' && value !== null && 'address' in value) {
    return !value.address || value.address.trim() === '';
  }
  return false;
}

/**
 * Get a user-friendly message about missing fields
 */
export function getProfileCompletionMessage(validation: ContractorProfileValidation): string {
  if (validation.isComplete) {
    return 'Your contractor profile is complete and ready for verification.';
  }

  const fieldCount = validation.missingFieldsDisplay.length;
  const fieldList = validation.missingFieldsDisplay.join(', ');
  
  return `Please complete your contractor profile before proceeding with verification. Missing ${fieldCount} required field${fieldCount > 1 ? 's' : ''}: ${fieldList}.`;
}

/**
 * Get missing fields grouped by section for better UX
 */
export function getMissingFieldsBySection(validation: ContractorProfileValidation) {
  const sections = {
    personal: [] as string[],
    business: [] as string[],
    compliance: [] as string[],
    insurance: [] as string[],
  };

  validation.missingFields.forEach((field) => {
    const displayName = REQUIRED_FIELDS[field as RequiredFieldKey];
    
    if (['first_name', 'last_name', 'phone_number'].includes(field)) {
      sections.personal.push(displayName);
    } else if (['business_name', 'bio', 'legal_entity_type', 'trade_category', 'service_location'].includes(field)) {
      sections.business.push(displayName);
    } else if (['gst_hst_number', 'wcb_number'].includes(field)) {
      sections.compliance.push(displayName);
    } else if (['work_guarantee', 'work_guarantee_statement'].includes(field)) {
      sections.insurance.push(displayName);
    }
  });

  return sections;
}