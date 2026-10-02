"use client";

import { Button } from "@/components/ui/button";
import { VerificationBadge } from "@/components/shared";
import { AdminVerificationBadge } from "@/components/shared/AdminVerificationBadge";
import { 
  Save, 
  Shield, 
  ShieldCheck, 
  CheckCircle, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  User, 
  Briefcase, 
  Check, 
  Loader2 
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
import { cn } from "@/lib/utils";

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [processingVerification, setProcessingVerification] = useState(false);
  const hasProcessedVerificationRef = useRef(false);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };
  
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

  const [initialUserFormData, setInitialUserFormData] = useState<typeof userFormData | null>(null);

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

  const [initialContractorFormData, setInitialContractorFormData] = useState<typeof contractorFormData | null>(null);

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
      setInitialUserFormData(newFormData);
    } else if (!loading) {
      setInitialUserFormData(userFormData);
    }
  }, [userProfile, loading]);

  useEffect(() => {
    if (contractorProfile) {
      
      const newContractorData = {
        business_name: (contractorProfile.business_name as string) || "",
        bio: (contractorProfile.bio as string) || "",
        legal_entity_type: ((contractorProfile.legal_entity_type as LegalEntityType | "") || "") as LegalEntityType | "",
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
      };
      setContractorFormData(newContractorData);
      setInitialContractorFormData(newContractorData);
    } else if (!loading) {
      setInitialContractorFormData(contractorFormData);
    }
  }, [contractorProfile, loading]);

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
        
        // Refetch user profile so is_verified_contractor updates immediately
        await fetchUserProfile();
      } else {
        throw new Error(data.message || 'Verification failed');
      }
      
    } catch (error) {
      console.error('Error processing verification success:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process verification');
    } finally {
      // Always clean up URL params so it never loops
      try {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('verification');
        newUrl.searchParams.delete('session_id');
        window.history.replaceState({}, document.title, newUrl.pathname + newUrl.search);
      } catch {
        // ignore
      }
      setProcessingVerification(false);
    }
  }, [processingVerification, user?.id, refetchVerificationStatus, fetchUserProfile]);

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
    if (verification === 'success' && user?.id && !hasProcessedVerificationRef.current) {
      hasProcessedVerificationRef.current = true;
      handleVerificationSuccess(sessionId);
    } else if (verification === 'cancelled' && user?.id && !hasProcessedVerificationRef.current) {
      hasProcessedVerificationRef.current = true;
      // Clean up pending transactions and show cancellation message
      handleVerificationCancel();
      toast.error('Payment was cancelled. You can try again anytime.');
      try {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('verification');
        newUrl.searchParams.delete('session_id');
        window.history.replaceState({}, document.title, newUrl.pathname + newUrl.search);
      } catch {
        // ignore
      }
    }
  }, [searchParams, user?.id, handleVerificationSuccess, handleVerificationCancel]);

  const isDirty = useMemo(() => {
    if (!initialUserFormData || !initialContractorFormData) return false;

    const userDirty =
      userFormData.first_name.trim() !== initialUserFormData.first_name.trim() ||
      userFormData.last_name.trim() !== initialUserFormData.last_name.trim() ||
      userFormData.phone_number.trim() !== initialUserFormData.phone_number.trim();

    const contractorDirty =
      JSON.stringify(contractorFormData) !== JSON.stringify(initialContractorFormData);

    return userDirty || contractorDirty;
  }, [userFormData, initialUserFormData, contractorFormData, initialContractorFormData]);

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

      // Mark required fields as touched on save
      setTouched({
        first_name: true,
        last_name: true,
        phone_number: true,
        business_name: true,
        trade_category: true,
        address: true,
      });

      // Generate unique slug for the contractor profile safely
      const baseSlug = generateContractorSlug(
        user.full_name || 'contractor'
      );
      
      let uniqueSlug: string | null = null;
      try {
        const { data: existingProfiles, error: slugQueryError } = await supabase
          .from('contractor_profiles')
          .select('slug')
          .not('slug', 'is', null)
          .neq('user_id', user.id);
        
        if (!slugQueryError && existingProfiles) {
          const existingSlugs = existingProfiles?.map(p => p.slug).filter(Boolean) || [];
          uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs);
        }
      } catch (slugErr) {
        console.warn("Could not query slugs (column may not exist in database yet):", slugErr);
      }

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

      // Extract logo string from company_logo_image object or string
      const logoUrl = typeof contractorFormData.company_logo_image === 'object' && contractorFormData.company_logo_image !== null
        ? (contractorFormData.company_logo_image as { url?: string }).url || null
        : typeof contractorFormData.company_logo_image === 'string'
        ? contractorFormData.company_logo_image
        : null;

      // Prepare contractor profile data
      const contractorData: Record<string, any> = {
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
        logo: logoUrl || contractorFormData.logo || null,
        // Handle address - only include if it has meaningful data
        address: contractorFormData.address?.address ? contractorFormData.address : null,
        // Handle service_location - set to null since field is removed
        service_location: null,
        gst_hst_clearance_document: normalizedGstHstClearanceDocument,
        wcb_clearance_document: normalizedWcbClearanceDocument,
        insurance_certificate: normalizedInsuranceCertificate,
      };

      if (uniqueSlug) {
        contractorData.slug = uniqueSlug;
      }
      
      // Update or create contractor profile with automatic resilience to missing schema columns
      const savePayload: Record<string, any> = { ...contractorData };
      let saveSuccess = false;
      let lastSaveError: any = null;

      for (let attempt = 0; attempt < 15; attempt++) {
        const query = contractorProfile
          ? supabase.from("contractor_profiles").update(savePayload).eq("user_id", user.id)
          : supabase.from("contractor_profiles").insert(savePayload);

        const { error: saveError } = await query;
        if (!saveError) {
          saveSuccess = true;
          break;
        }

        lastSaveError = saveError;
        // Check for missing column in schema cache (PGRST204)
        if (saveError.code === "PGRST204" || saveError.message?.includes("in the schema cache")) {
          const match = saveError.message?.match(/Could not find the '([^']+)' column/);
          if (match && match[1] && match[1] in savePayload) {
            console.warn(`Column '${match[1]}' does not exist in remote contractor_profiles schema cache. Stripping and retrying.`);
            delete savePayload[match[1]];
            continue;
          }
        }
        break;
      }

      if (!saveSuccess && lastSaveError) {
        throw lastSaveError;
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
      setInitialUserFormData(userFormData);
      setInitialContractorFormData(contractorFormData);
      
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
      <div className="space-y-6" suppressHydrationWarning>
        <div className="text-center py-12" suppressHydrationWarning>
          <div className="text-gray-600 dark:text-gray-400" suppressHydrationWarning>Loading profile...</div>
        </div>
      </div>
    );
  }

  if (userError || contractorError) {
    return (
      <div className="space-y-6" suppressHydrationWarning>
        <div className="p-6 text-center" suppressHydrationWarning>
          <div className="text-red-600 dark:text-red-400 mb-2 font-semibold">Error loading profile</div>
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
      <div className="min-h-[50vh] bg-gray-50 dark:bg-black flex items-center justify-center" suppressHydrationWarning>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  const profileValidation = validateContractorProfileForVerification(userFormData, contractorFormData);
  const missingFieldsBySection = getMissingFieldsBySection(profileValidation);

  const isFirstNameValid = (userFormData.first_name || "").trim().length > 0;
  const isLastNameValid = (userFormData.last_name || "").trim().length > 0;
  const isBusinessNameValid = (contractorFormData.business_name || "").trim().length > 0;
  const isPhoneValid = (userFormData.phone_number || "").trim().length >= 7;
  const isTradeCategoryValid = (contractorFormData.trade_category || []).length > 0;
  const isAddressValid = Boolean((contractorFormData.address?.address || "").trim().length > 0);
  const isInsuranceValid = Boolean(contractorFormData.insurance_upload || contractorFormData.legal_entity_type);
  const isGovIdValid = Boolean(userFormData.government_id);

  const contractorRequiredFields = [
    { key: 'personal', label: 'Personal Name', valid: isFirstNameValid && isLastNameValid },
    { key: 'business_name', label: 'Business Name', valid: isBusinessNameValid },
    { key: 'phone_number', label: 'Phone Number', valid: isPhoneValid },
    { key: 'trade_category', label: 'Trade Category', valid: isTradeCategoryValid },
    { key: 'address', label: 'Business Address', valid: isAddressValid },
    { key: 'insurance', label: 'Insurance & Legal', valid: isInsuranceValid },
    { key: 'government_id', label: 'Government ID', valid: isGovIdValid },
  ];

  const completedCount = contractorRequiredFields.filter(f => f.valid).length;
  const completionPercentage = Math.round((completedCount / contractorRequiredFields.length) * 100);

  return (
    <div className="space-y-8 pb-20">
      {/* Breadcrumb Navigation */}
      <Breadcrumbs />

      {/* Hero / Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-100 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2.5 py-0.5 rounded-full border border-orange-100 dark:border-orange-500/20">
              Contractor Account
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white mt-1">
            Contractor Profile
          </h1>
          <div className="space-y-0.5 mt-0.5">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage your contractor account, business details, credentials, and verification status.
            </p>
            {!verificationLoading && verificationStatus?.isVerified && verificationStatus?.expiryDate && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Verification valid until: {new Date(verificationStatus.expiryDate).toLocaleDateString('en-CA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            )}
          </div>
        </div>

        {/* Verification & Role Status Badges & Action */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 border border-gray-200/60 dark:border-white/10 shadow-xs">
            <Briefcase className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
            Contractor
          </span>

          {verificationStatus?.isVerified ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-500/30 shadow-xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Verified Contractor
            </span>
          ) : userFormData.government_id ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-500/30 shadow-xs">
              <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              Pending Review
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 shadow-xs">
              <Shield className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
              Unverified
            </span>
          )}

          {!verificationLoading && !verificationStatus?.isVerified && (
            <Button 
              onClick={() => setShowVerificationModal(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white font-medium text-xs h-8 px-3.5 rounded-full flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Shield className="h-3.5 w-3.5" />
              Get Verified
            </Button>
          )}
        </div>
      </div>

      {/* Profile Completeness Warning Banner */}
      {!profileValidation.isComplete && (
        <div className="rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-500/30 p-4 sm:p-5 shadow-xs">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200 mb-1">
                Profile Incomplete - Complete Required Fields to Enable Verification
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-300 mb-3 leading-relaxed">
                {getProfileCompletionMessage(profileValidation)}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-amber-200/60 dark:border-amber-500/20 text-xs">
                {Object.entries(missingFieldsBySection).map(([section, fields]) => (
                  fields.length > 0 ? (
                    <div key={section} className="text-amber-800 dark:text-amber-300">
                      <span className="font-semibold capitalize">{section}: </span>
                      <span className="text-amber-700 dark:text-amber-400">{fields.join(', ')}</span>
                    </div>
                  ) : null
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main 2-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Identity, Completion & Escrow Guarantee (Sticky on Desktop) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
          {/* Identity & Avatar Card */}
          <div className="bg-white dark:bg-[#141414] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-xs p-6 text-center space-y-4">
            <div className="flex justify-center">
              <ProfilePictureUpload
                currentPhoto={userFormData.profile_photo}
                onPhotoChange={handleProfilePhotoChange}
                size={110}
                compact={true}
              />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                {contractorFormData.business_name || `${userFormData.first_name} ${userFormData.last_name}`.trim() || user?.user_metadata?.full_name || "Contractor"}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate" title={user?.email || ""}>
                {user?.email || "No email linked"}
              </p>
            </div>

            <div className="border-t border-gray-100 dark:border-white/10 pt-4">
              {/* Profile Strength Progress Bar */}
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Profile Completion</span>
                <span className="font-bold text-orange-600 dark:text-orange-400">
                  {completionPercentage}%
                </span>
              </div>
              <div className="h-2 w-full bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-600 dark:bg-orange-500 transition-all duration-300 rounded-full"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>

              {/* Requirement Checklist */}
              <div className="mt-4 space-y-2 text-left">
                {contractorRequiredFields.map((field) => (
                  <div key={field.key} className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                    <span className="flex items-center gap-2">
                      {field.valid ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <div className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600 ml-1 mr-1" />
                      )}
                      <span>{field.label}</span>
                    </span>
                    <span className={field.valid ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-gray-400 dark:text-gray-500"}>
                      {field.valid ? "Done" : "Missing"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust & Escrow Guarantee Note */}
            <div className="border-t border-gray-100 dark:border-white/10 pt-4 text-left">
              <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/10 rounded-xl p-3.5">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">Verified Contractor Guarantee</h4>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed mt-0.5">
                      Your identity documents, trade credentials, and liability certificates are verified to unlock high-value projects and escrow payments.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Forms & Verification Documents */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Personal Information */}
          <div className="rounded-2xl bg-white dark:bg-[#141414] border border-gray-200/80 dark:border-white/10 p-6 sm:p-7 shadow-xs">
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
              missingFields={missingFieldsBySection.personal || []}
              touched={touched}
              onBlur={handleBlur}
            />
          </div>

          {/* Card 2: Business & Trade Information */}
          <div className="rounded-2xl bg-white dark:bg-[#141414] border border-gray-200/80 dark:border-white/10 p-6 sm:p-7 shadow-xs">
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
              missingFields={missingFieldsBySection.business || []}
              isVerified={verificationStatus?.isVerified || false}
              touched={touched}
              onBlur={handleBlur}
            />
          </div>

          {/* Card 3: Business Address & Service Location */}
          <div className="rounded-2xl bg-white dark:bg-[#141414] border border-gray-200/80 dark:border-white/10 p-6 sm:p-7 shadow-xs">
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
              missingFields={missingFieldsBySection.business || []}
              touched={touched}
              onBlur={handleBlur}
            />
          </div>

          {/* Card 4: Insurance & Compliance */}
          <div className="rounded-2xl bg-white dark:bg-[#141414] border border-gray-200/80 dark:border-white/10 p-6 sm:p-7 shadow-xs">
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
              missingFields={missingFieldsBySection.insurance || []}
              isVerified={verificationStatus?.isVerified || false}
              isAdmin={user?.user_role === 'admin'}
            />
          </div>

          {/* Card 5: Government Issued Photo ID */}
          <div className="rounded-2xl bg-white dark:bg-[#141414] border border-gray-200/80 dark:border-white/10 p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 dark:border-white/10 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 flex-shrink-0">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Government Issued Photo ID</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Official identification required for verification and compliance.
                  </p>
                </div>
              </div>

              {userFormData.government_id_verified ? (
                <div className="flex items-center space-x-1.5 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold self-start sm:self-auto">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Verified by Admin</span>
                </div>
              ) : userFormData.government_id ? (
                <div className="flex items-center space-x-1.5 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 px-3 py-1 rounded-full text-xs font-semibold self-start sm:self-auto">
                  <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Pending Admin Review</span>
                </div>
              ) : null}
            </div>

            {userFormData.government_id_verified ? (
              <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 rounded-xl">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">Government ID Verified</p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                      Your government-issued photo ID has been reviewed and approved by our admin team.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {userFormData.government_id && (
                  <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 rounded-xl mb-4">
                    <div className="flex items-start space-x-3">
                      <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Government ID In Review</p>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                          Your government ID has been uploaded and is waiting for administrator verification. You will be notified once reviewed.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <GovernmentIdUpload
                  currentIdFile={userFormData.government_id}
                  onIdFileChange={handleGovernmentIdChange}
                  disabled={userFormData.government_id_verified}
                />
              </>
            )}
          </div>

          {/* Card 6: Digital Signature */}
          <ProfileSignatureSection
            userId={user?.id || ''}
            userRole="contractor"
            userName={`${userFormData.first_name} ${userFormData.last_name}`.trim()}
            userEmail={user?.email}
            className="mb-2"
            cardClassName="rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-xs bg-white dark:bg-[#141414]"
          />

          {/* Docked Action Bar */}
          <div className="sticky bottom-4 z-20 !mt-8 sm:!mt-10 bg-white/95 dark:bg-[#141414]/95 backdrop-blur-md border border-gray-200/90 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm">
              {!isDirty ? (
                <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                  All profile information is up to date.
                </span>
              ) : (
                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  {completionPercentage === 100 
                    ? "Unsaved changes detected. Ready to save."
                    : `${completedCount} of ${contractorRequiredFields.length} profile requirements completed.`
                  }
                </span>
              )}
            </div>

            <Button 
              onClick={handleSave} 
              disabled={saving || !isDirty} 
              className={cn(
                "gap-2 min-w-[170px] font-semibold h-11 px-6 rounded-xl transition-all shadow-xs",
                saving || !isDirty
                  ? "bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-white/10 cursor-not-allowed hover:bg-gray-100 dark:hover:bg-white/5"
                  : "bg-orange-600 hover:bg-orange-700 text-white shadow-sm hover:shadow cursor-pointer"
              )}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </Button>
          </div>
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