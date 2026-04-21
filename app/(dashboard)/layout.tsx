"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";

import { Sidebar } from "@/components/ui/sidebar";
import LoadingSpinner from "@/components/shared/loading-spinner";
import { Navbar } from "@/components/shared";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && userRole && !loading) {
      const currentPath = pathname;
      
      // Handle admin users - redirect to identity verification instead of dashboard
      if (userRole === "admin") {
        if (currentPath === "/admin/dashboard" || currentPath === "/dashboard") {
          router.push("/admin/identity-verification");
        }
      } else {
        const roleDashboard = `/${userRole}/dashboard`;
        if (currentPath === "/dashboard") {
          router.push(roleDashboard);
        }
      }
    }
  }, [user, userRole, loading, router, pathname]);

  useEffect(() => {
    if (user && userRole && !loading && pathname) {
      const pathSegments = pathname.split("/");
      const routeRole = pathSegments[1];


      // Allow access to role-specific routes (not just dashboard)
      // Users can access: /{their-role}/dashboard, /{their-role}/projects, /{their-role}/profile, etc.
      if (routeRole && routeRole !== "dashboard" && userRole !== routeRole) {
        setAccessDenied(true);
        setTimeout(() => {
          router.push(`/${userRole}/dashboard`);
        }, 2000);
      } else {
        setAccessDenied(false);
      }
    }
  }, [user, userRole, loading, pathname, router]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        window.location.reload();
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [loading]);

  // Handle mobile sidebar toggle
  const handleMobileMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };



  // Close sidebar on mobile when screen size changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner
          text="Loading..."
          subtitle="Please wait a few seconds..."
          size="lg"
          variant="default"
        />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (accessDenied) {
    const pathSegments = pathname?.split("/") || [];
    const routeRole = pathSegments[1];

    return (
      <div className="min-h-screen flex items-center justify-center ">
        <div className="text-center max-w-md mx-auto">
          <LoadingSpinner
            text="Access Denied"
            subtitle={`You don't have permission to access the ${routeRole} dashboard. Redirecting you to your ${userRole} dashboard...`}
            size="lg"
            variant="error"
            className="mb-4"
          />
          <div className="animate-pulse">
            <div className="h-2 bg-gray-200 rounded mb-2"></div>
            <div className="h-2 bg-gray-200 rounded w-3/4 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  bg-white">
      {/* Top Navbar - Full width, fixed */}
      <Navbar 
        onMobileMenuToggle={handleMobileMenuToggle}
        showMobileMenuButton={true}
      />

      {/* Main Content Area - Properly positioned below navbar */}
      <div className="pt-16">
        {/* Sidebar - Fixed positioning, starts below navbar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content - Fixed position, sidebar expands on top */}
        <main className="transition-all duration-300 min-h-[calc(100vh-4rem)] lg:pl-64">
          <div className="max-w-[1440px]  mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
