"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { ProfilePictureUpload } from "@/components/shared/form-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";

export function AdminProfile() {
  const { user, fetchUserProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    profile_photo: "",
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

        setFormData({
          first_name: data?.first_name || "",
          last_name: data?.last_name || "",
          profile_photo: data?.profile_photo || "",
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleProfilePhotoChange = async (photoUrl: string | null) => {
    if (!photoUrl) return;
    
    setFormData(prev => ({ ...prev, profile_photo: photoUrl }));
    
    try {
      setSaving(true);
      const supabase = createClient();
      
      const { error } = await supabase
        .from("users")
        .update({ profile_photo: photoUrl })
        .eq("id", user?.id);

      if (error) throw error;

      // Refresh user profile to update the auth context
      await fetchUserProfile?.();
      
      toast.success("Profile picture updated successfully");
    } catch (error) {
      console.error("Error updating profile picture:", error);
      toast.error("Failed to update profile picture");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const supabase = createClient();
      
      const { error } = await supabase
        .from("users")
        .update({ 
          first_name: formData.first_name,
          last_name: formData.last_name,
        })
        .eq("id", user?.id);

      if (error) throw error;

      // Refresh user profile to update the auth context
      await fetchUserProfile?.();
      
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
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
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Admin Profile</h1>
          <p className="text-gray-600">Manage your administrator account</p>
          <p className="text-sm font-medium text-blue-600">
            Administrator Account
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

      {/* Name Section */}
      <div className="rounded-lg bg-white border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            <p className="text-sm text-gray-600">Update your name information</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Changes"}</span>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="first_name" className="text-sm font-medium text-gray-700">
              First Name
            </Label>
            <Input
              id="first_name"
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
              placeholder="Enter your first name"
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="last_name" className="text-sm font-medium text-gray-700">
              Last Name
            </Label>
            <Input
              id="last_name"
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
              placeholder="Enter your last name"
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Account Info Section - Read Only */}
      <div className="rounded-lg bg-white border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
            <p className="text-sm text-gray-600">Your administrator account details</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email Address</label>
            <div className="p-3 bg-gray-50 rounded-md text-gray-900">
              {user?.email || "Not set"}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Role</label>
            <div className="p-3 bg-gray-50 rounded-md">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-500 text-white">
                Administrator
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Account Status</label>
            <div className="p-3 bg-gray-50 rounded-md">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500 text-white">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
