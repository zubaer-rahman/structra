"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { UserMenu } from "./UserMenu";
import { Menu, Users, Hammer, ArrowRightLeft } from "lucide-react";
import { useState } from "react";

interface NavbarProps {
  onMobileMenuToggle?: () => void;
  showMobileMenuButton?: boolean;
}

export default function Navbar({
  onMobileMenuToggle,
  showMobileMenuButton = false,
}: NavbarProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const isHomePage = false;
  const isNewLandingPage = pathname === "/new-landing";
  const isDashboardPage =
    pathname.includes("/dashboard") ||
    pathname.includes("/homeowner") ||
    pathname.includes("/contractor") ||
    pathname.includes("/admin");
  
  // Auth page detection
  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname.includes("/login") || pathname.includes("/register");
  const isLoginPage = pathname === "/login" || pathname.includes("/login");
  const oppositeAction = isLoginPage 
    ? { text: "Don't have an account? Register", href: "/register" }
    : { text: "Already have an account? Sign in", href: "/login" };


  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-md border-b border-gray-200/50 h-16 px-2 sm:px-4 w-full flex items-center transition-all duration-300">
      <div
        className={cn(
          "flex items-center justify-between w-full",
          isHomePage && "max-w-7xl mx-auto"
        )}
      >
        <div className="flex items-center space-x-2 sm:space-x-4">
          {showMobileMenuButton && isDashboardPage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMobileMenuToggle}
              className="lg:hidden group cursor-pointer p-2 mr-2 sm:mr-3 h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
            >
              <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 group-hover:text-gray-900" />
            </Button>
          )}

          <div className="flex items-center">
            <Link 
              href={user?.user_role ? `/${user.user_role}/dashboard` : "/"} 
              className="cursor-pointer"
            >
              <Image
                src="/images/brand/structra_logo.png"
                alt="Structra Logo"
                width={120}
                height={100}
                className="h-8 w-auto sm:h-10 lg:h-12"
              />
            </Link>
          </div>
        </div>

        {/* Navigation Tabs - Only visible on new landing page, hidden on mobile */}
        {isNewLandingPage && (
          <div className="hidden md:flex items-center justify-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              <Users className="h-4 w-4 lg:h-5 lg:w-5 text-gray-500" />
              <span className="hidden lg:inline">Connect</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              <Hammer className="h-4 w-4 lg:h-5 lg:w-5 text-gray-500" />
              <span className="hidden lg:inline">Build</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowRightLeft className="h-4 w-4 lg:h-5 lg:w-5 text-gray-500" />
              <span className="hidden lg:inline">Transform</span>
            </div>
          </div>
        )}

        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Auth page specific links */}
          {isAuthPage && !user && (
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href={oppositeAction.href} className="bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent hover:from-orange-700 hover:to-orange-800">
                {oppositeAction.text}
              </Link>
            </Button>
          )}

          {/* Regular page links */}
          {!isAuthPage && (
            <>
              {isHomePage && user && (
                <Link
                  href={`/${
                    user?.user_role || "homeowner"
                  }/dashboard`}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
              )}

              {!user && (
                <>
                  <Link href="/login">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs sm:text-sm font-medium px-2 sm:px-3"
                    >
                      <span className="hidden sm:inline">Sign In</span>
                      <span className="sm:hidden">Sign In</span>
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button
                      size="sm"
                      className="text-xs sm:text-sm font-medium bg-orange-500 hover:bg-orange-600 px-2 sm:px-3"
                    >
                      <span className="hidden sm:inline">Get Started</span>
                      <span className="sm:hidden">Start</span>
                    </Button>
                  </Link>
                </>
              )}
            </>
          )}

          <UserMenu />
        </div>
      </div>
    </nav>
  );
}
