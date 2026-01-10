// Homeowner profile validation utilities

export interface HomeownerProfileData {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  address?: string | {
    address: string;
    city: string | null;
    province: string | null;
    postalCode: string | null;
    latitude: number | null;
    longitude: number | null;
    country?: string;
  };
  city?: string;
  province?: string;
  postal_code?: string;
  government_id?: any;
  government_id_verified?: boolean;
}

export interface HomeownerProfileValidationResult {
  isComplete: boolean;
  missingFields: string[];
  missingFieldsBySection: {
    personal: string[];
    contact: string[];
    location: string[];
    verification: string[];
  };
}

// Helper function to check if a field is empty
const isFieldEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
};

// Main validation function for homeowner profile completeness
export const validateHomeownerProfileForVerification = (
  profileData: HomeownerProfileData
): HomeownerProfileValidationResult => {
  const missingFields: string[] = [];
  const missingFieldsBySection = {
    personal: [] as string[],
    contact: [] as string[],
    location: [] as string[],
    verification: [] as string[]
  };

  // Personal Information
  if (isFieldEmpty(profileData.first_name)) {
    missingFields.push('first_name');
    missingFieldsBySection.personal.push('First Name');
  }
  if (isFieldEmpty(profileData.last_name)) {
    missingFields.push('last_name');
    missingFieldsBySection.personal.push('Last Name');
  }

  // Contact Information
  if (isFieldEmpty(profileData.phone_number)) {
    missingFields.push('phone_number');
    missingFieldsBySection.contact.push('Phone Number');
  }

  // Location Information
  if (typeof profileData.address === 'string') {
    if (isFieldEmpty(profileData.address)) {
      missingFields.push('address');
      missingFieldsBySection.location.push('Address');
    }
  } else if (typeof profileData.address === 'object' && profileData.address !== null) {
    if (isFieldEmpty(profileData.address.address)) {
      missingFields.push('address');
      missingFieldsBySection.location.push('Address');
    }
  } else {
    missingFields.push('address');
    missingFieldsBySection.location.push('Address');
  }
  // Note: City, Province, and Postal Code are now optional fields
  // Removed from required validation as per user request

  // Verification Information - only require if not already verified
  if (isFieldEmpty(profileData.government_id) && !profileData.government_id_verified) {
    missingFields.push('government_id');
    missingFieldsBySection.verification.push('Government ID');
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields,
    missingFieldsBySection
  };
};

// Helper function to get user-friendly completion message
export const getHomeownerProfileCompletionMessage = (
  validationResult: HomeownerProfileValidationResult
): string => {
  if (validationResult.isComplete) {
    return 'Your profile is complete!';
  }

  const totalMissing = validationResult.missingFields.length;
  if (totalMissing === 1) {
    return 'Please complete 1 missing field to finish your profile.';
  }
  return `Please complete ${totalMissing} missing fields to finish your profile.`;
};

// Helper function to get missing fields organized by section
export const getHomeownerMissingFieldsBySection = (
  validationResult: HomeownerProfileValidationResult
) => {
  return validationResult.missingFieldsBySection;
};

// Helper function to check if a specific section is complete
export const isHomeownerSectionComplete = (
  validationResult: HomeownerProfileValidationResult,
  section: 'personal' | 'contact' | 'location' | 'verification'
): boolean => {
  return validationResult.missingFieldsBySection[section].length === 0;
};

// Helper function to get completion percentage
export const getHomeownerProfileCompletionPercentage = (
  validationResult: HomeownerProfileValidationResult
): number => {
  const totalFields = 5; // first_name, last_name, phone_number, address, government_id
  const completedFields = totalFields - validationResult.missingFields.length;
  return Math.round((completedFields / totalFields) * 100);
};