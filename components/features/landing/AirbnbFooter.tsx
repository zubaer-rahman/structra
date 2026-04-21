"use client";

import Link from "next/link";
import Image from "next/image";
import { Instagram, Mail } from "lucide-react";

export function AirbnbFooter() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between">
          {/* Logo and Tagline */}
          <div className="flex flex-col items-center space-y-2">
            <Link href="/" className="cursor-pointer">
              <Image
                src="/images/brand/logo.png"
                alt="Structra Logo"
                width={120}
                height={100}
                className="w-full h-auto"
              />
            </Link>
            <p className="text-sm text-orange-500">Connect. Build. Transform.</p>
          </div>

          {/* Contact Us and Social Icons */}
          <div className="flex flex-col items-center space-y-3">
            <p className="text-sm font-medium text-gray-700">Contact Us</p>
            <div className="flex items-center space-x-6">
              <button className="p-3 hover:bg-gray-100 rounded-full transition-colors">
                <Instagram className="w-6 h-6 text-gray-600 hover:text-orange-600" />
              </button>
              <button className="p-3 hover:bg-gray-100 rounded-full transition-colors">
                <Mail className="w-6 h-6 text-gray-600 hover:text-orange-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
