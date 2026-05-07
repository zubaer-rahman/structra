"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { UserMenu } from "./UserMenu";
import { Menu, Users, Hammer, ArrowRightLeft, ArrowLeft } from "lucide-react";
import { useState } from "react";

interface NavbarProps {
  onMobileMenuToggle?: () => void;
  showMobileMenuButton?: boolean;
  backUrl?: string;
  backText?: string;
}

export default function Navbar({
  onMobileMenuToggle,
  showMobileMenuButton = false,
  backUrl,
  backText = "Back",
}: NavbarProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const isHomePage = pathname === "/" || pathname === "/new-landing";
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
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 h-16 w-full flex items-center transition-all duration-500",
      isHomePage 
        ? "bg-black/20 backdrop-blur-xl border-b border-white/5 text-white" 
        : "bg-white/70 backdrop-blur-md border-b border-gray-200/50 text-gray-600"
    )}>
      <div className="flex items-center justify-between w-full px-2 sm:px-4 lg:px-8">
        <div className="flex items-center space-x-2 sm:space-x-4">
          {backUrl && (
            <Link href={backUrl}>
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "flex items-center px-2 sm:px-3",
                  isHomePage ? "text-gray-300 hover:text-white hover:bg-white/5" : "text-gray-600 hover:text-gray-900"
                )}
              >
                <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{backText}</span>
              </Button>
            </Link>
          )}

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
        {isHomePage && (
          <div className="hidden md:flex items-center justify-center space-x-12">
            {[
              { label: "Network", id: "network", icon: <Users className="h-3.5 w-3.5" /> },
              { label: "Infrastructure", id: "infrastructure", icon: <Hammer className="h-3.5 w-3.5" /> },
              { label: "Exchange", id: "exchange", icon: <ArrowRightLeft className="h-3.5 w-3.5" /> },
            ].map((item) => (
              <button 
                key={item.label} 
                onClick={() => {
                  document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center gap-2 group cursor-pointer border-none bg-transparent"
              >
                <div className="text-orange-500 opacity-50 group-hover:opacity-100 transition-opacity">
                  {item.icon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 group-hover:text-white transition-colors">
                  {item.label}
                </span>
              </button>
            ))}
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
              {!isDashboardPage && user && (
                <Link
                  href={`/${
                    user?.user_role || "homeowner"
                  }/dashboard`}
                >
                  <Button
                    size="sm"
                    className="text-xs sm:text-sm font-medium bg-orange-500/10 backdrop-blur-md border border-orange-500/20 text-orange-600 hover:bg-orange-500/20 transition-all duration-300 shadow-sm hover:shadow-orange-100 px-3 sm:px-4"
                  >
                    Dashboard
                  </Button>
                </Link>
              )}

              {!user && (
                <>
                  <div className="hidden sm:flex items-center gap-4 mr-4 border-r border-white/10 pr-6">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Live Network</span>
                    </div>
                  </div>
                  <Link href="/login">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-4",
                        isHomePage ? "text-gray-400 hover:text-white hover:bg-white/5" : ""
                      )}
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button
                      size="sm"
                      className="text-[10px] font-black uppercase tracking-widest bg-orange-500 hover:bg-orange-600 px-6 rounded-full h-9 shadow-[0_0_15px_rgba(234,88,12,0.3)]"
                    >
                      Register
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
