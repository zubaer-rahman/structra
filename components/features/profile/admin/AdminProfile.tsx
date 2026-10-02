"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { ProfilePictureUpload } from "@/components/shared/form-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/shared/loading-spinner";
import { cn } from "@/lib/utils";
import { 
  User, 
  Shield, 
  ShieldCheck, 
  CheckCircle2, 
  Save, 
  Loader2, 
  Mail, 
  Phone, 
  Lock, 
  Check, 
  Copy,
  ExternalLink,
  FileCheck,
  Sparkles,
  Layers
} from "lucide-react";

export function AdminProfile() {
  const { user, fetchUserProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    profile_photo: "",
  });

  const [initialFormData, setInitialFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
  });

  const [createdAt, setCreatedAt] = useState<string | null>(null);

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

        const initialValues = {
          first_name: data?.first_name || "",
          last_name: data?.last_name || "",
          phone_number: data?.phone_number || "",
        };

        setFormData({
          ...initialValues,
          profile_photo: data?.profile_photo || "",
        });

        setInitialFormData(initialValues);

        if (data?.created_at) {
          setCreatedAt(new Date(data.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }));
        }
      } catch (error) {
        console.error("Error fetching admin user data:", error);
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const isDirty = useMemo(() => {
    return (
      formData.first_name.trim() !== initialFormData.first_name.trim() ||
      formData.last_name.trim() !== initialFormData.last_name.trim() ||
      formData.phone_number.trim() !== initialFormData.phone_number.trim()
    );
  }, [formData, initialFormData]);

  const handleProfilePhotoChange = async (photoUrl: string | null) => {
    setFormData(prev => ({ ...prev, profile_photo: photoUrl || "" }));
    
    try {
      setSaving(true);
      const supabase = createClient();
      
      const { error } = await supabase
        .from("users")
        .update({ profile_photo: photoUrl })
        .eq("id", user?.id);

      if (error) throw error;

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
      
      const fullName = `${formData.first_name} ${formData.last_name}`.trim();
      const { error } = await supabase
        .from("users")
        .update({ 
          first_name: formData.first_name,
          last_name: formData.last_name,
          full_name: fullName,
          phone_number: formData.phone_number.trim() || null,
        })
        .eq("id", user?.id);

      if (error) throw error;

      setInitialFormData({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
      });

      await fetchUserProfile?.();
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyId = () => {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    toast.success("Admin UID copied to clipboard");
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[50vh]">
          <LoadingSpinner text="Loading profile..." size="lg" variant="default" />
        </div>
      </div>
    );
  }

  const displayName = `${formData.first_name} ${formData.last_name}`.trim() || 
    user?.user_metadata?.full_name || 
    "Administrator";

  const adminModules = [
    {
      title: "Identity Verification",
      description: "Review and approve government IDs submitted by homeowners & contractors.",
      href: "/admin/identity-verification",
      icon: ShieldCheck,
      badge: "Identity Scope",
    },
    {
      title: "Contractor Verification",
      description: "Inspect business licenses, insurance coverage, and contractor credentials.",
      href: "/admin/contractor-verification",
      icon: FileCheck,
      badge: "Compliance",
    },
    {
      title: "Project Verification",
      description: "Moderate newly submitted construction projects before public bidding.",
      href: "/admin/project-verification",
      icon: Layers,
      badge: "Escrow & Quality",
    },
    {
      title: "Feature Controls",
      description: "Toggle platform modules, role gates, and global feature configurations.",
      href: "/admin/feature",
      icon: Sparkles,
      badge: "Platform",
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Breadcrumb Navigation */}
      <Breadcrumbs />

      {/* Hero / Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-100 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2.5 py-0.5 rounded-full border border-orange-100 dark:border-orange-500/20">
              System Administration
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white mt-1">
            Admin Profile
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage your administrative identity, contact information, and platform management privileges.
          </p>
        </div>

        {/* Status & Role Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 border border-gray-200/60 dark:border-white/10 shadow-xs">
            <Shield className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
            Administrator
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-500/30 shadow-xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            Full Access Active
          </span>
        </div>
      </div>

      {/* Main 2-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Identity & Administration Scope Card (Sticky on Desktop) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
          <div className="bg-white dark:bg-[#141414] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-xs p-6 text-center space-y-4">
            <div className="flex justify-center">
              <ProfilePictureUpload
                currentPhoto={formData.profile_photo}
                onPhotoChange={handleProfilePhotoChange}
                size={110}
                compact={true}
              />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                {displayName}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate" title={user?.email || ""}>
                {user?.email || "No email linked"}
              </p>
            </div>

            {/* Role & Privileges Overview (No account progress) */}
            <div className="border-t border-gray-100 dark:border-white/10 pt-4 space-y-3 text-left">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">Access Level</span>
                <span className="font-semibold text-gray-900 dark:text-white">Platform Administrator</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">Account Status</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Active & Authorized
                </span>
              </div>
              {createdAt && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Member Since</span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{createdAt}</span>
                </div>
              )}
            </div>

            {/* Administrator Security & Audit Notice */}
            <div className="border-t border-gray-100 dark:border-white/10 pt-4 text-left">
              <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/10 rounded-xl p-3.5">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">Governed Access</h4>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed mt-0.5">
                      This administrator profile has system-level permissions to moderate identity proofs, project specifications, and escrow contracts.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Forms & System Access Panels */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Personal & Contact Information */}
          <div className="rounded-2xl bg-white dark:bg-[#141414] border border-gray-200/80 dark:border-white/10 p-6 sm:p-7 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 dark:border-white/10 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 flex-shrink-0">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Personal Information</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Your personal name and primary contact details for system communication.
                  </p>
                </div>
              </div>

              <Button
                onClick={handleSave}
                disabled={saving || !isDirty}
                size="sm"
                className={cn(
                  "self-start sm:self-auto flex items-center gap-2 font-medium px-4 h-9 shadow-xs transition-all",
                  saving || !isDirty
                    ? "bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-white/10 cursor-not-allowed hover:bg-gray-100 dark:hover:bg-white/5"
                    : "bg-orange-600 hover:bg-orange-700 text-white cursor-pointer shadow-xs hover:shadow"
                )}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-5">
              {/* Names row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* First Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="first_name" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    First Name
                  </Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder="Enter first name"
                    className="transition-all h-10 text-sm dark:bg-[#161616] dark:text-white border-gray-200 dark:border-white/10 focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-orange-500"
                  />
                </div>

                {/* Last Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="last_name" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Last Name
                  </Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Enter last name"
                    className="transition-all h-10 text-sm dark:bg-[#161616] dark:text-white border-gray-200 dark:border-white/10 focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-orange-500"
                  />
                </div>
              </div>

              {/* Phone & Email Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Phone Number */}
                <div className="space-y-1.5">
                  <Label htmlFor="phone_number" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone_number"
                      value={formData.phone_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                      placeholder="(555) 000-0000"
                      className="pl-9 transition-all h-10 text-sm dark:bg-[#161616] dark:text-white border-gray-200 dark:border-white/10 focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-orange-500"
                    />
                  </div>
                </div>

                {/* Email (Read Only) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Email Address
                    </Label>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Managed by Auth
                    </span>
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      value={user?.email || ""}
                      disabled
                      className="pl-9 h-10 text-sm bg-gray-50 dark:bg-white/[0.04] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Administrative Control Scope */}
          <div className="rounded-2xl bg-white dark:bg-[#141414] border border-gray-200/80 dark:border-white/10 p-6 sm:p-7 shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-white/10">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Administrative Scope</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Quick access to the management and verification areas granted to your account.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {adminModules.map((module) => {
                const Icon = module.icon;
                return (
                  <Link
                    key={module.title}
                    href={module.href}
                    className="group block p-4 rounded-xl border border-gray-200/70 dark:border-white/10 hover:border-orange-500/40 dark:hover:border-orange-500/40 bg-gray-50/50 dark:bg-white/[0.02] hover:bg-orange-50/20 dark:hover:bg-orange-950/10 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-white/10 border border-gray-200/60 dark:border-white/10 flex items-center justify-center text-gray-700 dark:text-gray-200 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 bg-white dark:bg-white/5 px-2 py-0.5 rounded border border-gray-200/60 dark:border-white/10">
                        {module.badge}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-semibold text-sm text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                      {module.title}
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                      {module.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Card 3: Security & Account Identifiers */}
          <div className="rounded-2xl bg-white dark:bg-[#141414] border border-gray-200/80 dark:border-white/10 p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-white/10">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-700 dark:text-gray-300 flex-shrink-0">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Security & Identifiers</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Unique system references associated with your administrator credentials.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* UID */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Administrator UID</span>
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-lg">
                  <code className="text-xs font-mono text-gray-600 dark:text-gray-300 truncate flex-1">
                    {user?.id || "Unavailable"}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-white/10 transition-colors"
                    title="Copy UID"
                  >
                    {copiedId ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Role Tier */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">System Role Token</span>
                <div className="p-2.5 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-lg flex items-center justify-between">
                  <span className="text-xs font-mono font-medium text-gray-800 dark:text-gray-200">
                    user_role: admin
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200/70 dark:border-emerald-500/20">
                    Verified
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminProfile;
