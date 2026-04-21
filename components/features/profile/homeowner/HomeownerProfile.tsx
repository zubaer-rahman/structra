"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Phone, MapPin, CheckCircle, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { ProfilePictureUpload, LocationInput } from "@/components/shared/form-input";
import type { LocationData } from "@/components/shared/form-input";
import { GovernmentIdUpload } from "@/components/shared/form-input/GovernmentIdUpload";
import ProfileSignatureSection from "@/components/shared/form-input/ProfileSignatureSection";

export function HomeownerProfile() {
  const { user, fetchUserProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    address: {
      address: "",
      city: null as string | null,
      province: null as string | null,
      postalCode: null as string | null,
      latitude: null as number | null,
      longitude: null as number | null,
      country: "",
    } as LocationData,
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
        let addressData;
        try {
          // Check if address is a JSON string
          if (data?.address && typeof data.address === 'string' && data.address.startsWith('{')) {
            addressData = JSON.parse(data.address);
          } else {
            // Use as plain string
            addressData = {
              address: data?.address || "",
              city: null,
              province: null,
              postalCode: null,
              latitude: null,
              longitude: null,
              country: "",
            };
          }
        } catch (error) {
          // If parsing fails, treat as plain string
          addressData = {
            address: data?.address || "",
            city: null,
            province: null,
            postalCode: null,
            latitude: null,
            longitude: null,
            country: "",
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

  // Check for authentication after all hooks are declared
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">Authentication required. Please sign in.</div>
        </div>
      </div>
    );
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (location: LocationData) => {
    setFormData((prev) => ({ ...prev, address: location }));
  };

  const handleProfilePhotoChange = async (photoUrl: string | null) => {
    if (!user?.id) return;
    
    setFormData(prev => ({
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

  const handleGovernmentIdChange = async (idFile: {
    id: string
    filename: string
    url: string
    size?: number
    mimeType?: string
    uploadedAt?: Date
  } | null) => {
    if (!user?.id) return;
    
    setFormData(prev => ({
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
    if (!user) return;

    setSaving(true);
    try {
      const supabase = createClient();
      
      // Convert location object to appropriate format for database storage
      const saveData = {
        ...formData,
        address: typeof formData.address === 'object' 
          ? JSON.stringify(formData.address) // Save as JSON string to preserve all location data
          : formData.address
      };
      
      const { error } = await supabase
        .from("users")
        .update(saveData)
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-gray-600">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      {/* Header */}
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Profile Settings</h1>
          <p className="text-gray-600">Manage your account information</p>
          <p className={`text-sm font-medium ${formData.government_id_verified ? 'text-green-600' : 'text-red-600'}`}>
            {formData.government_id_verified ? 'Verified Homeowner' : 'Unverified Homeowner'}
          </p>
        </div>
      </div>

      {/* Profile Picture Section */}
      <div className="rounded-lg bg-white border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Profile Picture</h3>
            <p className="text-sm text-gray-600">Upload a photo for your profile</p>
          </div>
        </div>
        <ProfilePictureUpload
          currentPhoto={formData.profile_photo}
          onPhotoChange={handleProfilePhotoChange}
          size={120}
        />
      </div>

      {/* Digital Signature Section */}
      <ProfileSignatureSection
        userId={user?.id || ''}
        userRole="homeowner"
        userName={`${formData.first_name} ${formData.last_name}`.trim()}
        userEmail={user?.email}
        className="mb-6"
      />

      {/* Government ID Section */}
      <div className="rounded-lg bg-white border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Government Issued Photo ID</h3>
            <p className="text-sm text-gray-600">
              {formData.government_id_verified 
                ? "Your government ID has been verified by admin" 
                : formData.government_id
                  ? "Wait for your ID to be verified"
                  : "Upload your government-issued photo ID for verification"
              }
            </p>
          </div>
          {formData.government_id_verified ? (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Verified by Admin</span>
            </div>
          ) : formData.government_id ? (
            <div className="flex items-center space-x-2 text-orange-600">
              <Clock className="h-5 w-5" />
              <span className="text-sm font-medium">Pending Verification</span>
            </div>
          ) : null}
        </div>
        {formData.government_id_verified ? (
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
          <>
            {formData.government_id && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg mb-4">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-orange-900">Government ID Pending Verification</p>
                    <p className="text-xs text-orange-700">
                      Your government ID has been uploaded and is waiting for admin verification. You'll be notified once it's reviewed.
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

      {/* Profile Header */}
      <div className="rounded-lg bg-white border border-gray-200 p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
          <p className="text-sm text-gray-600">Your account details and contact information</p>
        </div>
      </div>

      {/* Profile Form */}
      <div className="rounded-lg bg-white border border-gray-200 p-6 shadow-sm">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleInputChange("first_name", e.target.value)}
                placeholder="Enter your first name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange("last_name", e.target.value)}
                placeholder="Enter your last name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number" className="flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span>Phone Number</span>
            </Label>
            <Input
              id="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={(e) => handleInputChange("phone_number", e.target.value)}
              placeholder="Enter your phone number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={user?.email || ""}
              disabled
              className="bg-gray-50 border-gray-200 text-gray-600"
            />
          </div>

          <div className="space-y-2">
            <LocationInput
              value={formData.address}
              onChange={handleAddressChange}
              label="Location"
              placeholder="Enter your complete address"
              showMap={false}
              showSelectedLocation={false}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving} 
          className="gap-2 bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving Changes..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
