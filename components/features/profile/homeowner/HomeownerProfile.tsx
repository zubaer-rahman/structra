"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Save, 
  Phone, 
  CheckCircle, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Loader2,
  Shield,
  ShieldCheck,
  User,
  Mail,
  MapPin,
  Lock,
  Check
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { ProfilePictureUpload, LocationInput } from "@/components/shared/form-input";
import type { LocationData } from "@/components/shared/form-input";
import { GovernmentIdUpload } from "@/components/shared/form-input/GovernmentIdUpload";
import ProfileSignatureSection from "@/components/shared/form-input/ProfileSignatureSection";
import { cn } from "@/lib/utils";

export function HomeownerProfile() {
  const { user, fetchUserProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    address: {
      address: "",
      city: null,
      province: null,
      postalCode: null,
      latitude: 0,
      longitude: 0,
      country: "",
    } as LocationData,
    profile_photo: "",
    government_id: null as {
      id: string;
      filename: string;
      url: string;
      size?: number;
      mimeType?: string;
      uploadedAt?: Date;
    } | null,
    government_id_verified: false,
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        // Parse address if it's a JSON string, otherwise use as plain string
        let addressData: LocationData;
        try {
          if (data?.address && typeof data.address === 'string' && data.address.startsWith('{')) {
            const parsed = JSON.parse(data.address);
            addressData = {
              address: parsed.address || "",
              city: parsed.city || null,
              province: parsed.province || parsed.state || null,
              postalCode: parsed.postalCode || parsed.zip_code || null,
              latitude: typeof parsed.latitude === 'number' ? parsed.latitude : 0,
              longitude: typeof parsed.longitude === 'number' ? parsed.longitude : 0,
              country: parsed.country || "",
            };
          } else {
            addressData = {
              address: data?.address || "",
              city: data?.city || null,
              province: data?.state || null,
              postalCode: data?.zip_code || null,
              latitude: 0,
              longitude: 0,
              country: data?.country || "",
            };
          }
        } catch {
          addressData = {
            address: data?.address || "",
            city: data?.city || null,
            province: data?.state || null,
            postalCode: data?.zip_code || null,
            latitude: 0,
            longitude: 0,
            country: data?.country || "",
          };
        }

        setFormData({
          first_name: data?.first_name || "",
          last_name: data?.last_name || "",
          phone_number: data?.phone_number || "",
          address: addressData,
          profile_photo: data?.profile_photo || "",
          government_id: data?.government_id || null,
          government_id_verified: data?.government_id_verified || false,
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Validation rules
  const isFirstNameValid = formData.first_name.trim().length > 0;
  const isLastNameValid = formData.last_name.trim().length > 0;
  const cleanPhone = formData.phone_number.trim();
  // Validates standard phone format with minimum 7 digits
  const isPhoneValid = cleanPhone.length >= 7 && /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/.test(cleanPhone);
  
  const addressString = (formData.address?.address || "").trim();
  const isAddressValid = addressString.length > 0;

  const isFormValid = isFirstNameValid && isLastNameValid && isPhoneValid && isAddressValid;

  const requiredFields = useMemo(() => [
    { key: 'first_name', label: 'First Name', valid: isFirstNameValid },
    { key: 'last_name', label: 'Last Name', valid: isLastNameValid },
    { key: 'phone_number', label: 'Phone Number', valid: isPhoneValid },
    { key: 'address', label: 'Location', valid: isAddressValid },
  ], [isFirstNameValid, isLastNameValid, isPhoneValid, isAddressValid]);

  const completedCount = requiredFields.filter(f => f.valid).length;

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (location: LocationData) => {
    setFormData((prev) => ({ ...prev, address: location }));
    setTouched((prev) => ({ ...prev, address: true }));
  };

  const handleProfilePhotoChange = async (photoUrl: string | null) => {
    if (!user?.id) return;
    
    setFormData(prev => ({
      ...prev,
      profile_photo: photoUrl || ""
    }));

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("users")
        .update({ profile_photo: photoUrl })
        .eq("id", user.id);

      if (error) {
        console.error("Error updating profile photo:", error);
        toast.error(error.message || "Failed to save profile picture.");
        return;
      }

      await fetchUserProfile();
      toast.success("Profile photo updated!");
    } catch (error: any) {
      console.error("Error saving profile photo:", error);
      toast.error(error?.message || "Failed to save profile picture.");
    }
  };

  const handleGovernmentIdChange = async (idFile: {
    id: string;
    filename: string;
    url: string;
    size?: number;
    mimeType?: string;
    uploadedAt?: Date;
  } | null) => {
    if (!user?.id) return;
    
    setFormData(prev => ({
      ...prev,
      government_id: idFile
    }));

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("users")
        .update({ government_id: idFile })
        .eq("id", user.id);

      if (error) {
        console.error("Error updating government ID:", error);
        if (error.code === 'PGRST204' || error.message?.includes('government_id')) {
          toast.error("Database column 'government_id' is missing. Please run the SQL migration in Supabase SQL editor.");
        } else {
          toast.error(error.message || "Failed to save government ID.");
        }
        return;
      }

      await fetchUserProfile();
      toast.success("Government ID saved successfully!");
    } catch (error: any) {
      console.error("Error saving government ID:", error);
      toast.error(error?.message || "Failed to save government ID.");
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if (!isFormValid) {
      // Mark all required fields as touched to show errors
      setTouched({
        first_name: true,
        last_name: true,
        phone_number: true,
        address: true,
      });
      toast.error("Please fill in all required fields before saving.");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();

      const trimmedFirstName = formData.first_name.trim();
      const trimmedLastName = formData.last_name.trim();
      const trimmedPhone = formData.phone_number.trim();

      const addressDataToSave = JSON.stringify(formData.address);

      // Only send personal info columns to avoid schema mismatch errors
      const profileUpdatePayload: Record<string, any> = {
        first_name: trimmedFirstName,
        last_name: trimmedLastName,
        full_name: `${trimmedFirstName} ${trimmedLastName}`.trim(),
        phone_number: trimmedPhone,
        address: addressDataToSave,
        updated_at: new Date().toISOString(),
      };

      if (formData.address) {
        if (formData.address.city) profileUpdatePayload.city = formData.address.city;
        if (formData.address.province) profileUpdatePayload.state = formData.address.province;
        if (formData.address.postalCode) profileUpdatePayload.zip_code = formData.address.postalCode;
        if (formData.address.country) profileUpdatePayload.country = formData.address.country;
      }

      const { error } = await supabase
        .from("users")
        .update(profileUpdatePayload)
        .eq("id", user.id);

      if (error) {
        console.error("Error updating profile in Supabase:", error);
        toast.error(error.message || "Failed to update profile. Please try again.");
        return;
      }

      await fetchUserProfile();
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error?.message || "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[50vh] bg-gray-50 flex items-center justify-center" suppressHydrationWarning>
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6" suppressHydrationWarning>
          <div className="text-center" suppressHydrationWarning>Authentication required. Please sign in.</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6" suppressHydrationWarning>
        <div className="text-center py-12" suppressHydrationWarning>
          <div className="text-gray-600" suppressHydrationWarning>Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Breadcrumb Navigation */}
      <Breadcrumbs />

      {/* Hero / Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-100">
              Account Management
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mt-1">
            Homeowner Profile
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your personal details, home location, and verification credentials.
          </p>
        </div>

        {/* Verification & Role Status Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200/60 shadow-xs">
            <User className="h-3.5 w-3.5 text-gray-500" />
            Homeowner
          </span>

          {formData.government_id_verified ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Verified Account
            </span>
          ) : formData.government_id ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-xs">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              Pending Review
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 shadow-xs">
              <Shield className="h-3.5 w-3.5 text-gray-400" />
              Unverified
            </span>
          )}
        </div>
      </div>

      {/* Main 2-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Profile Card, Readiness & Trust Summary (Sticky on Desktop) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
          {/* Identity & Avatar Card */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 text-center space-y-4">
            <div className="flex justify-center">
              <ProfilePictureUpload
                currentPhoto={formData.profile_photo}
                onPhotoChange={handleProfilePhotoChange}
                size={110}
                compact={true}
              />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">
                {`${formData.first_name} ${formData.last_name}`.trim() || user?.user_metadata?.full_name || "Homeowner"}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 truncate" title={user?.email || ""}>
                {user?.email || "No email linked"}
              </p>
            </div>

            <div className="border-t border-gray-100 pt-4">
              {/* Profile Strength Progress Bar */}
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-gray-700">Profile Completion</span>
                <span className="font-bold text-orange-600">
                  {Math.round((completedCount / requiredFields.length) * 100)}%
                </span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-600 transition-all duration-300 rounded-full"
                  style={{ width: `${(completedCount / requiredFields.length) * 100}%` }}
                />
              </div>

              {/* Requirement Checklist */}
              <div className="mt-4 space-y-2 text-left">
                {requiredFields.map((field) => (
                  <div key={field.key} className="flex items-center justify-between text-xs text-gray-600">
                    <span className="flex items-center gap-2">
                      {field.valid ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <div className="h-1.5 w-1.5 rounded-full bg-gray-300 ml-1 mr-1" />
                      )}
                      <span>{field.label}</span>
                    </span>
                    <span className={field.valid ? "text-emerald-600 font-medium" : "text-gray-400"}>
                      {field.valid ? "Done" : "Missing"}
                    </span>
                  </div>
                ))}
                
                <div className="flex items-center justify-between text-xs text-gray-600 pt-1 border-t border-dashed border-gray-100">
                  <span className="flex items-center gap-2">
                    {formData.profile_photo ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <div className="h-1.5 w-1.5 rounded-full bg-gray-300 ml-1 mr-1" />
                    )}
                    <span>Profile Photo</span>
                  </span>
                  <span className={formData.profile_photo ? "text-emerald-600 font-medium" : "text-gray-400"}>
                    {formData.profile_photo ? "Added" : "Optional"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span className="flex items-center gap-2">
                    {formData.government_id_verified ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : formData.government_id ? (
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                    ) : (
                      <div className="h-1.5 w-1.5 rounded-full bg-gray-300 ml-1 mr-1" />
                    )}
                    <span>Government ID</span>
                  </span>
                  <span className={
                    formData.government_id_verified 
                      ? "text-emerald-600 font-medium" 
                      : formData.government_id 
                      ? "text-amber-600 font-medium" 
                      : "text-gray-400"
                  }>
                    {formData.government_id_verified 
                      ? "Verified" 
                      : formData.government_id 
                      ? "In Review" 
                      : "Pending"}
                  </span>
                </div>
              </div>
            </div>

            {/* Trust & Escrow Guarantee Note */}
            <div className="border-t border-gray-100 pt-4 text-left">
              <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3.5">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Protected Profile</h4>
                    <p className="text-[11px] text-gray-600 leading-relaxed mt-0.5">
                      Your identity documents and phone number are encrypted and strictly used for verified contracts and escrow milestone releases.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Forms & Verification Documents */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Personal & Contact Information */}
          <div className="rounded-2xl bg-white border border-gray-200/80 p-6 sm:p-7 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
                  <p className="text-xs text-gray-500">
                    Your legal name and primary contact details for agreements.
                  </p>
                </div>
              </div>

              <span className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold self-start sm:self-auto",
                completedCount === requiredFields.length
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              )}>
                {completedCount === requiredFields.length ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                )}
                {completedCount} of {requiredFields.length} Required Fields
              </span>
            </div>

            <div className="space-y-5">
              {/* Names row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* First Name */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="first_name" className="text-xs font-semibold text-gray-700">
                      First Name <span className="text-red-500 font-bold">*</span>
                    </Label>
                    {touched.first_name && !isFirstNameValid && (
                      <span className="text-xs font-medium text-red-500">Required</span>
                    )}
                  </div>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange("first_name", e.target.value)}
                    onBlur={() => handleBlur("first_name")}
                    placeholder="Enter first name"
                    className={cn(
                      "transition-all h-10 text-sm",
                      touched.first_name && !isFirstNameValid
                        ? "border-red-500 focus-visible:ring-red-400 bg-red-50/20"
                        : "border-gray-200 focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-orange-500"
                    )}
                  />
                  {touched.first_name && !isFirstNameValid && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3.5 w-3.5" /> First name cannot be empty
                    </p>
                  )}
                </div>

                {/* Last Name */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="last_name" className="text-xs font-semibold text-gray-700">
                      Last Name <span className="text-red-500 font-bold">*</span>
                    </Label>
                    {touched.last_name && !isLastNameValid && (
                      <span className="text-xs font-medium text-red-500">Required</span>
                    )}
                  </div>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange("last_name", e.target.value)}
                    onBlur={() => handleBlur("last_name")}
                    placeholder="Enter last name"
                    className={cn(
                      "transition-all h-10 text-sm",
                      touched.last_name && !isLastNameValid
                        ? "border-red-500 focus-visible:ring-red-400 bg-red-50/20"
                        : "border-gray-200 focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-orange-500"
                    )}
                  />
                  {touched.last_name && !isLastNameValid && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3.5 w-3.5" /> Last name cannot be empty
                    </p>
                  )}
                </div>
              </div>

              {/* Contact row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Phone Number */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="phone_number" className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-gray-400" />
                      <span>Phone Number</span>
                      <span className="text-red-500 font-bold">*</span>
                    </Label>
                    {touched.phone_number && !isPhoneValid && (
                      <span className="text-xs font-medium text-red-500">
                        {formData.phone_number.trim().length === 0 ? "Required" : "Invalid phone"}
                      </span>
                    )}
                  </div>
                  <Input
                    id="phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => handleInputChange("phone_number", e.target.value)}
                    onBlur={() => handleBlur("phone_number")}
                    placeholder="e.g. +1 (555) 123-4567"
                    className={cn(
                      "transition-all h-10 text-sm",
                      touched.phone_number && !isPhoneValid
                        ? "border-red-500 focus-visible:ring-red-400 bg-red-50/20"
                        : "border-gray-200 focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-orange-500"
                    )}
                  />
                  {touched.phone_number && !isPhoneValid && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {formData.phone_number.trim().length === 0
                        ? "Phone number is required"
                        : "Please enter a valid phone number (at least 7 digits)"}
                    </p>
                  )}
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email" className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <Mail className="h-3 w-3 text-gray-400" />
                      <span>Email Address</span>
                    </Label>
                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Read-only
                    </span>
                  </div>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="h-10 text-sm bg-gray-50/80 border-gray-200 text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Location Input */}
              <div className="space-y-1.5 pt-1">
                <LocationInput
                  value={formData.address}
                  onChange={handleAddressChange}
                  onBlur={() => handleBlur("address")}
                  label="Primary Location / Service Address"
                  required={true}
                  error={touched.address && !isAddressValid ? "Address is required to complete your profile" : undefined}
                  placeholder="Enter your street address, city, or postal code"
                  showMap={false}
                  showSelectedLocation={true}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Government-Issued Photo ID */}
          <div className="rounded-2xl bg-white border border-gray-200/80 p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Government Issued Photo ID</h3>
                  <p className="text-xs text-gray-500">
                    Official identification required for verification and compliance.
                  </p>
                </div>
              </div>

              {formData.government_id_verified ? (
                <div className="flex items-center space-x-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold self-start sm:self-auto">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Verified by Admin</span>
                </div>
              ) : formData.government_id ? (
                <div className="flex items-center space-x-1.5 text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full text-xs font-semibold self-start sm:self-auto">
                  <Clock className="h-3.5 w-3.5 text-amber-600" />
                  <span>Pending Admin Review</span>
                </div>
              ) : null}
            </div>

            {formData.government_id_verified ? (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">Government ID Verified</p>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Your government-issued photo ID has been reviewed and approved by our admin team.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {formData.government_id && (
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl mb-4">
                    <div className="flex items-start space-x-3">
                      <Clock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-900">Government ID In Review</p>
                        <p className="text-xs text-amber-700 mt-0.5">
                          Your government ID has been uploaded and is waiting for administrator verification. You will be notified once reviewed.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <GovernmentIdUpload
                  currentIdFile={formData.government_id}
                  onIdFileChange={handleGovernmentIdChange}
                  disabled={formData.government_id_verified}
                />
              </>
            )}
          </div>

          {/* Card 3: Digital Signature */}
          <ProfileSignatureSection
            userId={user?.id || ''}
            userRole="homeowner"
            userName={`${formData.first_name} ${formData.last_name}`.trim()}
            userEmail={user?.email}
            className="mb-0"
            cardClassName="rounded-2xl border border-gray-200/80 shadow-xs"
          />

          {/* Docked Action Bar */}
          <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm">
              {!isFormValid ? (
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium">
                    Complete all required fields ({completedCount}/{requiredFields.length}) to save changes.
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium">
                    All required fields are complete. Ready to save.
                  </span>
                </div>
              )}
            </div>

            <Button 
              onClick={handleSave} 
              disabled={saving || !isFormValid} 
              className={cn(
                "gap-2 min-w-[170px] font-semibold h-11 px-6 rounded-xl transition-all shadow-xs",
                !isFormValid || saving
                  ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed hover:bg-gray-100"
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
    </div>
  );
}

