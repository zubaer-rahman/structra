"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/shared/UserMenu";
import { Menu, Globe, Heart } from "lucide-react";

export function AirbnbNavbar() {
  const { user } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-16 px-4 w-full flex items-center">
      <div className="flex items-center justify-between w-full">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="cursor-pointer">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <span className="text-orange-500 font-bold text-xl">BuildReady</span>
            </div>
          </Link>
        </div>

        {/* Main Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <Link 
            href="/" 
            className="flex items-center space-x-2 text-gray-900 font-medium hover:text-orange-600 transition-colors"
          >
            <span>Projects</span>
          </Link>
          <Link 
            href="/contractors" 
            className="flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-colors"
          >
            <span>Contractors</span>
          </Link>
          <Link 
            href="/about" 
            className="flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-colors"
          >
            <span>About</span>
          </Link>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-4">
          {!user ? (
            <>
              <Link href="/login">
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  Get Started
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/favorites" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Heart className="w-5 h-5 text-gray-600" />
              </Link>
              <UserMenu />
            </>
          )}
          
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Globe className="w-5 h-5 text-gray-600" />
          </button>
          
          <button className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </nav>
  );
}
