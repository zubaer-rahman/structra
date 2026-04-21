"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  HomeownerDashboard,
  ContractorDashboard,
  RoleSelector,
} from "@/components/features/dashboard";
import { LoadingSpinner } from "@/components/shared";

interface RolePageProps {
  params: Promise<{
    role: string;
  }>;
}

export default function RolePage({ params }: RolePageProps) {
  const resolvedParams = use(params) as { role: string };
  const { role } = resolvedParams;
  const router = useRouter();

  // Redirect admin users to identity verification
  useEffect(() => {
    if (role === "admin") {
      router.push("/admin/identity-verification");
    }
  }, [role, router]);

  switch (role) {
    case "contractor":
      return <ContractorDashboard />;

    case "homeowner":
      return <HomeownerDashboard />;

    case "admin":
      // This will redirect, but show loading while redirecting
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner 
            text="Redirecting to Identity Verification..."
            size="lg"
            variant="default"
            className="text-center"
          />
        </div>
      );

    default:
      return <RoleSelector />;
  }
}
