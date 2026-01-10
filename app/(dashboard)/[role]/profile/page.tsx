"use client";

import { use } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  HomeownerProfile,
  ContractorProfile,
  AdminProfile,
} from "@/components/features/profile";

interface ProfilePageProps {
  params: Promise<{
    role: string;
  }>;
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { user } = useAuth();
  const resolvedParams = use(params) as { role: string };
  const { role } = resolvedParams;

   if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please sign in to view your profile.</p>
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
