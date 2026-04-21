"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardIcon } from "@/components/shared";
import {
  Home,
  FileText,
  Briefcase,
  Users,
  BarChart3,
  DollarSign,
  X,
  UserCheck,
  FileCheck,
  Wrench,
  Star,
} from "lucide-react";
import { Button } from "./button";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({
  isOpen,
  onClose,
}: SidebarProps) {
  const { userRole } = useAuth();
  const pathname = usePathname();

  const getMenuItems = () => {
    const baseItems = [
      { name: "Dashboard", href: `/${userRole}/dashboard`, icon: "dashboard", iconType: "dashboard" },
    ];

    switch (userRole) {
      case "homeowner":
        return [
          { name: "Dashboard", href: "/homeowner/dashboard", icon: "dashboard", iconType: "dashboard" },
          { name: "Projects", href: "/homeowner/projects", icon: "projects", iconType: "projects" },
          { name: "Proposals", href: "/homeowner/proposals", icon: "proposals", iconType: "proposals" },
        ];

      case "contractor":
        return [
          { name: "Dashboard", href: "/contractor/dashboard", icon: "dashboard", iconType: "dashboard" },
          {
            name: "Browse Projects",
            href: "/contractor/projects",
            icon: "projects",
            iconType: "projects",
          },
          {
            name: "My Projects",
            href: "/contractor/my-projects",
            icon: "proposals",
            iconType: "proposals",
          },
        ];

      case "admin":
        return [
          {
            name: "Identity Verification",
            href: "/admin/identity-verification",
            icon: UserCheck,
            iconType: "lucide",
          },
          {
            name: "Project Verification",
            href: "/admin/project-verification",
            icon: FileCheck,
            iconType: "lucide",
          },
          {
            name: "Contractor Verification",
            href: "/admin/contractor-verification",
            icon: Wrench,
            iconType: "lucide",
          },
          {
            name: "Featured",
            href: "/admin/feature",
            icon: Star,
            iconType: "lucide",
          },
        ];

      default:
        return baseItems;
    }
  };

  const menuItems = getMenuItems();

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden transition-opacity duration-300"
          onClick={onClose}
          style={{ touchAction: "none" }}
          aria-hidden="true"
        />
      )}

      <div
        className={`
        fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 z-40 transition-all duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        w-64
        lg:translate-x-0 lg:z-50 lg:h-[calc(100vh-4rem)] lg:top-16 lg:w-64
        overflow-hidden
        shadow-2xl lg:shadow-lg
        `}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex flex-col h-full bg-white overflow-hidden">
          <div className="relative py-2 px-4 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="lg:hidden absolute top-1 right-1 cursor-pointer p-1 h-7 w-7 rounded-full hover:bg-gray-100"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4 text-gray-600" />
            </Button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto overflow-x-hidden min-h-0">
            {menuItems.map((item) => {
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive(item.href) ? "default" : "ghost"}
                    size="sm"
                    className={`
                      w-full transition-all duration-200 overflow-hidden cursor-pointer
                      ${
                        isActive(item.href)
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      }
                      justify-start px-3 py-3
                    `}
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        onClose();
                      }
                    }}
                  >
                    {item.iconType === "lucide" ? (
                      <item.icon className={`h-5 w-5 transition-all duration-300 flex-shrink-0 mr-3 ${
                        isActive(item.href) ? "text-white" : "text-gray-700"
                      }`} />
                    ) : (
                      <div className={`mr-3 transition-all duration-300 ${
                        isActive(item.href) ? "brightness-0 invert" : "brightness-0"
                      }`}>
                        <DashboardIcon 
                          iconType={item.icon as 'dashboard' | 'projects' | 'proposals' | 'profile'}
                          size={20}
                        />
                      </div>
                    )}
                    <span className="transition-all duration-300 overflow-hidden block">
                      {item.name}
                    </span>
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
