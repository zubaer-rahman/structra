"use client";

import { Button } from "@/components/ui/button";
import { VerificationBadge } from "@/components/shared";
import { AdminVerificationBadge } from "@/components/shared/AdminVerificationBadge";
import { Save, Shield } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import toast from "react-hot-toast";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { useAuth } from "@/contexts/AuthContext";
import { generateContractorSlug, generateUniqueSlug } from '@/utils/helpers/slugUtils';
import { LegalEntityType } from "@/utils/constants/business";
import { trpc } from "@/utils/trpc";
import { VerificationModal } from "@/components/shared/modals/VerificationModal";
import { validateContractorProfileForVerification, getProfileCompletionMessage, getMissingFieldsBySection } from "@/utils/validation";
import { FileReference } from "@/server/database/schemas/base";
import { PersonalInfoSection } from "./PersonalInfoSection";
import { BusinessInfoSection } from "./BusinessInfoSection";
import { InsuranceSection } from "./InsuranceSection";
import { ServiceLocationSection } from "./ServiceLocationSection";
import { ProfilePictureUpload } from "@/components/shared/form-input/ProfilePictureUpload";
import ProfileSignatureSection from "@/components/shared/form-input/ProfileSignatureSection";
import { GovernmentIdUpload } from "@/components/shared/form-input/GovernmentIdUpload";
import { AlertCircle, CheckCircle } from "lucide-react";

interface AddressType {
  address: string;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  country?: string;
}

export function ContractorProfile() {
  const { user, userRole, loading: authLoading, fetchUserProfile } = useAuth();
  const searchParams = useSearchParams();
  // All React hooks must be called at the top level, before any conditional returns
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [processingVerification, setProcessingVerification] = useState(false);
  
  // Check verification status
  const { data: verificationStatus, isLoading: verificationLoading, refetch: refetchVerificationStatus } = trpc.users.checkVerificationStatus.useQuery(undefined, {
    enabled: !!user?.id,
    retry: false
  });

  
  // User profile data (basic user info)
  const [userFormData, setUserFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    address: "",
    profile_photo: "",
    government_id: null as {
      id: string
      filename: string
      url: string
      size?: number
      mimeType?: string
      uploadedAt?: Date
    } | null,
    government_id_verified: false,
  });

  // Contractor profile data (business info) - aligned with database schema
  const [contractorFormData, setContractorFormData] = useState<{
    business_name: string;
    bio: string;
    legal_entity_type: LegalEntityType | "";
    gst_hst_number: string;
    wcb_number: string;
    // service_location: string | AddressType; // REMOVED: Field requires exact address
    trade_category: string[];
    logo: string;
    portfolio: string[];
    portfolio_file?: FileReference[];
    licenses: string[];
    license_file?: FileReference[];
    insurance_general_liability: number;
    insurance_builders_risk: number;
    insurance_expiry: string | null;
    insurance_upload: string | object;
    work_guarantee: number;
    work_guarantee_statement: string;
    contractor_contacts: string[];
    address: AddressType;
    is_featured_contractor: boolean;
    featured_contractor_expiry?: string | null;
    gst_hst_clearance_document?: string | object;
    wcb_clearance_document?: string | object;
    insurance_certificate?: string | object;
    company_logo_image?: FileReference | null;
    is_admin_verified?: boolean;
    is_insurance_verified?: boolean;
  }>({
    business_name: "",
    bio: "",
    legal_entity_type: "" as LegalEntityType | "",
    gst_hst_number: "",
    wcb_number: "",
    // service_location: "", // REMOVED: Field requires exact address
    trade_category: [] as string[],
    logo: "",
    portfolio: [] as string[],
    portfolio_file: [] as FileReference[],
    licenses: [] as string[],
    license_file: [] as FileReference[],
    insurance_general_liability: 0,
    insurance_builders_risk: 0,
    insurance_expiry: null,
    insurance_upload: "" as string | object,
    work_guarantee: 0,
    work_guarantee_statement: "",
    contractor_contacts: [] as string[],
    address: {
      address: "",
      latitude: 0,
      longitude: 0,
      city: null,
      province: null,
      postalCode: null,
      country: "",
    },
    is_featured_contractor: false,
    featured_contractor_expiry: null,
    gst_hst_clearance_document: "",
    wcb_clearance_document: "",
    company_logo_image: null,
    is_admin_verified: false,
  });

  // State for profile data
  const [userProfile, setUserProfile] = useState<Record<string, unknown> | null>(null);
  const [contractorProfile, setContractorProfile] = useState<Record<string, unknown> | null>(null);
  const [userError, setUserError] = useState<string | null>(null);
  const [contractorError, setContractorError] = useState<string | null>(null);

  // Fetch user and contractor profile data using Supabase
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.id) return;

      try {
        const supabase = createClient();
        
        // Fetch user profile
        const { data: userData, error: userErr } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (userErr) {
          console.error("Error fetching user data:", userErr);
          setUserError(userErr.message);
        } else {
          setUserProfile(userData);
          setUserError(null);
        }

        // Fetch contractor profile
        const { data: contractorData, error: contractorErr } = await supabase
          .from("contractor_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (contractorErr) {
          if (contractorErr.code === 'PGRST116') {
            // No contractor profile found, this is okay
            setContractorProfile(null);
            setContractorError(null);
          } else {
            console.error("Error fetching contractor data:", contractorErr);
            setContractorError(contractorErr.message);
          }
        } else {
          setContractorProfile(contractorData);
          setContractorError(null);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user?.id]);

  useEffect(() => {
    if (userProfile) {
      const newFormData = {
        first_name: (userProfile.first_name as string) || "",
        last_name: (userProfile.last_name as string) || "",
        phone_number: (userProfile.phone_number as string) || "",
        address: (userProfile.address as string) || "",
        profile_photo: (userProfile.profile_photo as string) || "",
        government_id: (userProfile.government_id as {
          id: string
          filename: string
          url: string
          size?: number
          mimeType?: string
          uploadedAt?: Date
        }) || null,
        government_id_verified: (userProfile.government_id_verified as boolean) || false,
      };
      setUserFormData(newFormData);
    }
  }, [userProfile]);

  useEffect(() => {
    if (contractorProfile) {
      
      setContractorFormData({
        business_name: (contractorProfile.business_name as string) || "",
        bio: (contractorProfile.bio as string) || "",
        legal_entity_type: (contractorProfile.legal_entity_type as LegalEntityType | "") || "",
        gst_hst_number: (contractorProfile.gst_hst_number as string) || "",
        wcb_number: (contractorProfile.wcb_number as string) || "",
        // service_location: (contractorProfile.service_location as string) || "", // REMOVED: Field requires exact address
        trade_category: (contractorProfile.trade_category as string[]) || [],
        logo: (contractorProfile.logo as string) || "",
        portfolio: (contractorProfile.portfolio as string[]) || [],
        portfolio_file: (contractorProfile.portfolio_file as FileReference[]) || [],
        licenses: (contractorProfile.licenses as string[]) || [],
        license_file: (contractorProfile.license_file as FileReference[]) || [],
        insurance_general_liability: (contractorProfile.insurance_general_liability as number) || 0,
        insurance_builders_risk: (contractorProfile.insurance_builders_risk as number) || 0,
        insurance_expiry: (contractorProfile.insurance_expiry as string) || null,
        insurance_upload: (contractorProfile.insurance_upload as string | object) || "",
        work_guarantee: (contractorProfile.work_guarantee as number) || 0,
        work_guarantee_statement: (contractorProfile.work_guarantee_statement as string) || "",
        contractor_contacts: (contractorProfile.contractor_contacts as string[]) || [],
        address: {
          address: (contractorProfile.address as AddressType)?.address || "",
          latitude: (contractorProfile.address as AddressType)?.latitude || 0,
          longitude: (contractorProfile.address as AddressType)?.longitude || 0,
          city: (contractorProfile.address as AddressType)?.city || null,
          province: (contractorProfile.address as AddressType)?.province || null,
          postalCode: (contractorProfile.address as AddressType)?.postalCode || null,
          country: (contractorProfile.address as AddressType)?.country || ""
        },
        is_featured_contractor: (contractorProfile.is_featured_contractor as boolean) || false,
        featured_contractor_expiry: (contractorProfile.featured_contractor_expiry as string) || null,
        gst_hst_clearance_document: contractorProfile.gst_hst_clearance_document || "",
        wcb_clearance_document: contractorProfile.wcb_clearance_document || "",
        insurance_certificate: contractorProfile.insurance_certificate || "",
        company_logo_image: (contractorProfile.company_logo_image as FileReference) || null,
        is_admin_verified: (contractorProfile.is_admin_verified as boolean) || false,
        is_insurance_verified: (contractorProfile.is_insurance_verified as boolean) || false,
      });
    }
  }, [contractorProfile]);

  const handleVerificationSuccess = useCallback(async (sessionId?: string | null) => {
    if (processingVerification || !user?.id) return;
    
    setProcessingVerification(true);
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      // Call the verify-success API to handle pending -> succeeded transaction update
      const response = await fetch('/api/verify-success', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          userId: user.id,
          sessionId: sessionId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process verification');
      }

      if (data.success) {
        toast.success('Contractor verification completed successfully!');
        
        // Refetch verification status
        await refetchVerificationStatus();
        
        // Clean up URL
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('verification');
        window.history.replaceState({}, document.title, newUrl.pathname + newUrl.search);
      } else {
        throw new Error(data.message || 'Verification failed');
      }
      
    } catch (error) {
      console.error('Error processing verification success:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process verification');
    } finally {
      setProcessingVerification(false);
    }
  }, [processingVerification, user?.id, refetchVerificationStatus]);

  const handleVerificationCancel = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      // Call the verify-cancel API to clean up pending transactions
      const response = await fetch('/api/verify-cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Verification cancelled successfully
      } else {
        console.error('Failed to cancel verification:', data.error);
      }
    } catch (error) {
      console.error('Error cancelling verification:', error);
    }
  }, [user?.id]);

  // Handle verification success/cancelled from URL parameter
  useEffect(() => {
    const verification = searchParams.get('verification');
    const sessionId = searchParams.get('session_id');
    if (verification === 'success' && user?.id && !processingVerification) {
      handleVerificationSuccess(sessionId);
    } else if (verification === 'cancelled' && user?.id) {
      // Clean up pending transactions and show cancellation message
      handleVerificationCancel();
      toast.error('Payment was cancelled. You can try again anytime.');
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('verification');
      window.history.replaceState({}, document.title, newUrl.pathname + newUrl.search);
    }
  }, [searchParams, user?.id, processingVerification, handleVerificationSuccess, handleVerificationCancel]);

  // Ensure user is authenticated - moved to render logic
  if (!user?.id) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border bg-card text-card-foreground">
          <div className="p-6">
            <div className="text-center">Authentication required. Please sign in.</div>
          </div>
        </div>
      </div>
    );
  }

  const handleContractorInputChange = (field: string, value: string | number | string[] | boolean | object) => {
    setContractorFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleProfilePhotoChange = async (photoUrl: string | null) => {
    if (!user?.id) return;
    
    setUserFormData(prev => ({
      ...prev,
      profile_photo: photoUrl || ""
    }));

    // Save to database immediately
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("users")
        .update({ profile_photo: photoUrl })
        .eq("id", user.id);

      if (error) {
        console.error("Error updating profile photo:", error);
        toast.error("Failed to save profile picture. Please try again.");
        return;
      }

      // Refetch user profile to ensure consistency
      await fetchUserProfile();
    } catch (error) {
      console.error("Error saving profile photo:", error);
      toast.error("Failed to save profile picture. Please try again.");
    }
  };

  // Specialized handlers for array fields
  const handleTradeCategoryChange = (value: string) => {
    const categories = value.split(',').map(cat => cat.trim()).filter(cat => cat);
    setContractorFormData((prev) => ({
      ...prev,
      trade_category: categories,
    }));
  };

  const handlePortfolioChange = (value: string) => {
    const urls = value.split(',').map(url => url.trim()).filter(url => url);
    setContractorFormData((prev) => ({ ...prev, portfolio: urls }));
  };

  const handleLicensesChange = (value: string) => {
    const urls = value.split(',').map(url => url.trim()).filter(url => url);
    setContractorFormData((prev) => ({ ...prev, licenses: urls }));
  };

  const handlePortfolioFileChange = (files: FileReference[]) => {
    setContractorFormData((prev) => ({ ...prev, portfolio_file: files }));
  };

  const handleLicenseFileChange = (files: FileReference[]) => {
    setContractorFormData((prev) => ({ ...prev, license_file: files }));
  };

  const handleGovernmentIdChange = async (idFile: {
    id: string
    filename: string
    url: string
    size?: number
    mimeType?: string
    uploadedAt?: Date
  } | null) => {
    if (!user?.id) return;
    
    setUserFormData(prev => ({
      ...prev,
      government_id: idFile
    }));

    // Save to database immediately
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("users")
        .update({ government_id: idFile })
        .eq("id", user.id);

      if (error) {
        console.error("Error updating government ID:", error);
        toast.error("Failed to save government ID. Please try again.");
        return;
      }

      // Refetch user profile to ensure consistency
      await fetchUserProfile();
    } catch (error) {
      console.error("Error saving government ID:", error);
      toast.error("Failed to save government ID. Please try again.");
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const supabase = createClient();

      // Update user profile
      const { error: userUpdateError } = await supabase
        .from("users")
        .update(userFormData)
        .eq("id", user.id);

      if (userUpdateError) {
        throw userUpdateError;
      }
      
      // Handle insurance_upload - if it's a file object, extract the URL, otherwise use as string
      const insuranceUploadUrl = typeof contractorFormData.insurance_upload === 'object' && contractorFormData.insurance_upload !== null 
        ? (contractorFormData.insurance_upload as { url: string }).url 
        : contractorFormData.insurance_upload || null;

      // If no insurance document is uploaded, set amounts to $0
      const hasInsuranceDocument = insuranceUploadUrl && insuranceUploadUrl !== '';
      const insuranceGeneralLiability = hasInsuranceDocument ? (contractorFormData.insurance_general_liability || 0) : 0;
      const insuranceBuildersRisk = hasInsuranceDocument ? (contractorFormData.insurance_builders_risk || 0) : 0;
      const insuranceExpiry = hasInsuranceDocument ? (contractorFormData.insurance_expiry || null) : null;

      // Generate unique slug for the contractor profile
      const baseSlug = generateContractorSlug(
        user.full_name || 'contractor'
      );
      
      // Get existing slugs to ensure uniqueness
      const { data: existingProfiles } = await supabase
        .from('contractor_profiles')
        .select('slug')
        .not('slug', 'is', null)
        .neq('user_id', user.id); // Exclude current profile if updating
      
      const existingSlugs = existingProfiles?.map(p => p.slug) || [];
      const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs);

      // Normalize admin-managed document fields to avoid persisting empty-string placeholders.
      const normalizedGstHstClearanceDocument =
        contractorFormData.gst_hst_clearance_document && contractorFormData.gst_hst_clearance_document !== ''
          ? contractorFormData.gst_hst_clearance_document
          : null;
      const normalizedWcbClearanceDocument =
        contractorFormData.wcb_clearance_document && contractorFormData.wcb_clearance_document !== ''
          ? contractorFormData.wcb_clearance_document
          : null;
      const normalizedInsuranceCertificate =
        contractorFormData.insurance_certificate && contractorFormData.insurance_certificate !== ''
          ? contractorFormData.insurance_certificate
          : null;

      // Prepare contractor profile data
      const contractorData = {
        ...contractorFormData,
        user_id: user.id,
        legal_entity_type: contractorFormData.legal_entity_type && contractorFormData.legal_entity_type.trim() !== '' ? contractorFormData.legal_entity_type : null,
        insurance_expiry: insuranceExpiry,
        insurance_general_liability: insuranceGeneralLiability,
        insurance_builders_risk: insuranceBuildersRisk,
        work_guarantee: contractorFormData.work_guarantee || null,
        work_guarantee_statement: contractorFormData.work_guarantee_statement || null,
        insurance_upload: insuranceUploadUrl,
        company_logo_image: contractorFormData.company_logo_image || null,
        // Handle address - only include if it has meaningful data
        address: contractorFormData.address?.address ? contractorFormData.address : null,
        // Handle service_location - set to null since field is removed
        service_location: null,
        gst_hst_clearance_document: normalizedGstHstClearanceDocument,
        wcb_clearance_document: normalizedWcbClearanceDocument,
        insurance_certificate: normalizedInsuranceCertificate,
        slug: uniqueSlug,
      };
      
      // Update or create contractor profile
      if (contractorProfile) {
        const { error: contractorUpdateError } = await supabase
          .from("contractor_profiles")
          .update(contractorData)
          .eq("user_id", user.id);

        if (contractorUpdateError) {
          throw contractorUpdateError;
        }
      } else {
        const { error: contractorCreateError } = await supabase
          .from("contractor_profiles")
          .insert(contractorData);

        if (contractorCreateError) {
          throw contractorCreateError;
        }
      }

      // Refetch data by calling the fetch function again
      const { data: updatedUserData } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();
      
      const { data: updatedContractorData } = await supabase
        .from("contractor_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      // Update local state with refetched data
      setUserProfile(updatedUserData);
      setContractorProfile(updatedContractorData);
      
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error && typeof error === "object" && "message" in error) {
        toast.error(`Failed to update profile: ${error.message}`);
      } else {
        toast.error("Failed to update profile. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="p-6 text-center">
          <div>Loading profile...</div>
        </div>
      </div>
    );
  }

  if (userError || contractorError) {
    return (
      <div className="space-y-6">
        <div className="p-6 text-center">
          <div className="text-red-600 mb-2">Error loading profile</div>
          {userError && (
            <div className="text-sm text-red-500">User profile error: {userError}</div>
          )}
          {contractorError && (
            <div className="text-sm text-red-500">Contractor profile error: {contractorError}</div>
          )}
        </div>
      </div>
    );
  }

  // Don't render if auth is still loading or user role is not available
  if (authLoading || !userRole) {
    return (
      <div className="min-h-screen bg-white relative">
        <div className="relative flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Contractor Profile</h1>
            </div>
            <div className="space-y-1">
              <p className="text-gray-600">Manage your contractor account and business information</p>
              {!verificationLoading && verificationStatus?.isVerified && verificationStatus?.expiryDate && (
                <p className="text-sm text-green-600 font-medium">
                  Verification valid until: {new Date(verificationStatus.expiryDate).toLocaleDateString('en-CA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Verification Button */}
        {!verificationLoading && !verificationStatus?.isVerified && (
          <Button 
            onClick={() => setShowVerificationModal(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2"
          >
            <Shield className="h-4 w-4" />
            Get Verified
          </Button>
        )}
      </div>

      {/* Profile Completeness Warning */}
      {(() => {
        const profileValidation = validateContractorProfileForVerification(userFormData, contractorFormData);
        const missingFieldsBySection = getMissingFieldsBySection(profileValidation);
        
        if (!profileValidation.isComplete) {
          return (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-amber-800 mb-2">
                    Profile Incomplete - Complete to Enable Verification
                  </h3>
                  <p className="text-sm text-amber-700 mb-3">
                    {getProfileCompletionMessage(profileValidation)}
                  </p>
                  
                  {/* Missing Fields by Section */}
                  <div className="space-y-2">
                    {Object.entries(missingFieldsBySection).map(([section, fields]) => (
                      <div key={section} className="text-sm">
                        <span className="font-medium text-amber-800 capitalize">{section}:</span>
                        <span className="text-amber-700 ml-1">{fields.join(', ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Profile Picture Section */}
      <div className="rounded-lg bg-white border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Profile Picture</h3>
            <p className="text-sm text-gray-600">Upload a professional photo for your profile</p>
          </div>
        </div>
        <ProfilePictureUpload
          currentPhoto={userFormData.profile_photo}
          onPhotoChange={handleProfilePhotoChange}
          size={120}
        />
      </div>

      {/* Digital Signature Section */}
      <ProfileSignatureSection
        userId={user?.id || ''}
        userRole="contractor"
        userName={`${userFormData.first_name} ${userFormData.last_name}`.trim()}
        userEmail={user?.email}
        className="mb-6"
      />

      {/* Government ID Section */}
      <div className="rounded-lg bg-white border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Government Issued Photo ID</h3>
            <p className="text-sm text-gray-600">
              {userFormData.government_id_verified 
                ? "Your government ID has been verified by admin" 
                : "Upload your government-issued photo ID for verification"
              }
            </p>
          </div>
          {userFormData.government_id_verified && (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Verified by Admin</span>
            </div>
          )}
        </div>
        {userFormData.government_id_verified ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">Government ID Verified</p>
                <p className="text-xs text-green-700">
                  Your government-issued photo ID has been reviewed and approved by our admin team.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <GovernmentIdUpload
            currentIdFile={userFormData.government_id}
            onIdFileChange={handleGovernmentIdChange}
          />
        )}
      </div>

      {/* Profile Sections */}
      <div className="space-y-6">
        {/* Personal Information Section */}
        <div className="rounded-lg bg-white border border-gray-200 p-6 shadow-sm">
          <PersonalInfoSection
            formData={{
              first_name: userFormData.first_name,
              last_name: userFormData.last_name,
            }}
            user={user}
            onInputChange={(field, value) => {
              if (field === 'first_name') {
                setUserFormData(prev => ({ ...prev, first_name: value }));
              } else if (field === 'last_name') {
                setUserFormData(prev => ({ ...prev, last_name: value }));
              }
            }}
            missingFields={(() => {
              const validation = validateContractorProfileForVerification(userFormData, contractorFormData);
              const missing = getMissingFieldsBySection(validation);
              return missing.personal || [];
            })()}
          />
        </div>

        {/* Business Information Section */}
        <div className="rounded-lg bg-white border border-gray-200 p-6 shadow-sm">
          <BusinessInfoSection
            formData={{
              business_name: contractorFormData.business_name,
              phone_number: userFormData.phone_number,
              bio: contractorFormData.bio,
              trade_category: contractorFormData.trade_category,
              portfolio: contractorFormData.portfolio,
              portfolio_file: contractorFormData.portfolio_file,
              licenses: contractorFormData.licenses,
              license_file: contractorFormData.license_file,
              work_guarantee_statement: contractorFormData.work_guarantee_statement,
              company_logo_image: contractorFormData.company_logo_image,
            }}
            onInputChange={(field, value) => {
              if (field === 'phone_number') {
                setUserFormData(prev => ({ ...prev, phone_number: value as string }));
              } else if (field === 'bio') {
                setContractorFormData(prev => ({ ...prev, bio: value as string }));
              } else {
                handleContractorInputChange(field, value);
              }
            }}
            onTradeCategoryChange={handleTradeCategoryChange}
            onPortfolioChange={handlePortfolioChange}
            onPortfolioFileChange={handlePortfolioFileChange}
            onLicensesChange={handleLicensesChange}
            onLicenseFileChange={handleLicenseFileChange}
            onCompanyLogoChange={(file) => setContractorFormData(prev => ({ ...prev, company_logo_image: file }))}
            missingFields={(() => {
              const validation = validateContractorProfileForVerification(userFormData, contractorFormData);
              const missing = getMissingFieldsBySection(validation);
              return missing.business || [];
            })()}
            isVerified={verificationStatus?.isVerified || false}
          />
        </div>

        {/* Insurance & Compliance Section */}
        <div className="rounded-lg bg-white border border-gray-200 p-6 shadow-sm">
          <InsuranceSection
            formData={{
              legal_entity_type: contractorFormData.legal_entity_type,
              gst_hst_number: contractorFormData.gst_hst_number,
              wcb_number: contractorFormData.wcb_number,
              work_guarantee: contractorFormData.work_guarantee,
              insurance_general_liability: contractorFormData.insurance_general_liability,
              insurance_builders_risk: contractorFormData.insurance_builders_risk,
              insurance_expiry: contractorFormData.insurance_expiry,
              insurance_upload: typeof contractorFormData.insurance_upload === 'object' && contractorFormData.insurance_upload !== null 
                ? (contractorFormData.insurance_upload as { id: string; filename: string; url: string; size?: number; mimeType?: string; uploadedAt?: Date })
                : contractorFormData.insurance_upload || '',
              gst_hst_clearance_document:
                typeof contractorFormData.gst_hst_clearance_document === 'object' &&
                contractorFormData.gst_hst_clearance_document !== null
                  ? (contractorFormData.gst_hst_clearance_document as {
                      id: string;
                      filename: string;
                      url: string;
                      size?: number;
                      mimeType?: string;
                      uploadedAt?: Date;
                    })
                  : contractorFormData.gst_hst_clearance_document || '',
              wcb_clearance_document:
                typeof contractorFormData.wcb_clearance_document === 'object' &&
                contractorFormData.wcb_clearance_document !== null
                  ? (contractorFormData.wcb_clearance_document as {
                      id: string;
                      filename: string;
                      url: string;
                      size?: number;
                      mimeType?: string;
                      uploadedAt?: Date;
                    })
                  : contractorFormData.wcb_clearance_document || '',
              insurance_certificate: typeof contractorFormData.insurance_certificate === 'object' && contractorFormData.insurance_certificate !== null 
                ? (contractorFormData.insurance_certificate as { id: string; filename: string; url: string; size?: number; mimeType?: string; uploadedAt?: Date })
                : contractorFormData.insurance_certificate || '',
              is_admin_verified: contractorFormData.is_admin_verified,
              is_insurance_verified: contractorFormData.is_insurance_verified,
              user_id: user?.id,
            }}
            onInputChange={(field, value) => {
              if (field === 'work_guarantee') {
                setContractorFormData(prev => ({ ...prev, work_guarantee: value as number }));
              } else if (field === 'insurance_expiry') {
                setContractorFormData(prev => ({ ...prev, insurance_expiry: value && typeof value === 'string' && value.trim() !== '' ? value : null }));
              } else if (field === 'insurance_upload') {
                setContractorFormData(prev => ({ ...prev, insurance_upload: value as string | object }));
              } else {
                handleContractorInputChange(field, value);
              }
            }}
            missingFields={(() => {
              const validation = validateContractorProfileForVerification(userFormData, contractorFormData);
              const missing = getMissingFieldsBySection(validation);
              return missing.insurance || [];
            })()}
            isVerified={verificationStatus?.isVerified || false}
            isAdmin={user?.user_role === 'admin'}
          />
        </div>

        {/* Service Location Section */}
        <div className="rounded-lg bg-white border border-gray-200 p-6 shadow-sm">
          <ServiceLocationSection
            formData={{
              address: contractorFormData.address?.latitude && contractorFormData.address?.longitude 
                ? {
                    address: contractorFormData.address.address,
                    latitude: contractorFormData.address.latitude,
                    longitude: contractorFormData.address.longitude,
                    city: contractorFormData.address.city,
                    province: contractorFormData.address.province,
                    postalCode: contractorFormData.address.postalCode,
                    country: contractorFormData.address.country
                  }
                : {
                    address: contractorFormData.address?.address || "",
                    latitude: 0,
                    longitude: 0,
                    city: contractorFormData.address?.city || null,
                    province: contractorFormData.address?.province || null,
                    postalCode: contractorFormData.address?.postalCode || null,
                    country: contractorFormData.address?.country
                  }
            }}
            onInputChange={(field, value) => {
              if (field === 'address') {
                setContractorFormData(prev => ({ ...prev, address: value as AddressType }));
              }
            }}
            missingFields={(() => {
              const validation = validateContractorProfileForVerification(userFormData, contractorFormData);
              const missing = getMissingFieldsBySection(validation);
              return missing.business || [];
            })()}
          />
        </div>


        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="gap-2 bg-orange-500 hover:bg-orange-600 text-white">
            <Save className="h-4 w-4" />
            {saving ? "Saving Changes..." : "Save Changes"}
          </Button>
        </div>
      </div>
      
      {/* Verification Modal */}
      <VerificationModal 
        isOpen={showVerificationModal} 
        onClose={() => setShowVerificationModal(false)}
        user={user ? { id: user.id, email: user.email } : undefined}
        userProfile={userProfile}
        contractorProfile={contractorProfile}
      />
    </div>
  );
}