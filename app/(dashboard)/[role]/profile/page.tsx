"use client";

import { use, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  HomeownerProfile,
  ContractorProfile,
  AdminProfile,
} from "@/components/features/profile";
import LoadingSpinner from "@/components/shared/loading-spinner";

interface ProfilePageProps {
  params: Promise<{
    role: string;
  }>;
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { user, loading } = useAuth();
  const resolvedParams = use(params) as { role: string };
  const { role } = resolvedParams;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center" suppressHydrationWarning>
        <LoadingSpinner text="Loading profile..." size="lg" variant="default" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Authentication Required</h2>
          <p className="text-gray-600 dark:text-gray-400">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  switch (role) {
    case "contractor":
      return <ContractorProfile />;

    case "homeowner":
      return <HomeownerProfile />;

    case "admin":
      return <AdminProfile />;

    default:
      return <HomeownerProfile />;
  }
}
