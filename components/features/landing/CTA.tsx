"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function CTA() {
  const { user } = useAuth();
  
  return (
    <>
      <section className="py-12 sm:py-20 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 leading-tight px-2">
              Ready to Architect Your Next Masterpiece?
            </h2>
            
            <p className="text-base sm:text-lg text-orange-50 max-w-xl sm:max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
              Join a distinguished community of visionaries and master builders who choose Structra for professional excellence and guaranteed project integrity.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-sm sm:text-base px-6 sm:px-8 py-2.5 bg-white text-orange-600 hover:bg-gray-50 shadow-xl hover:shadow-2xl transition-all duration-300 font-semibold group">
                Initialize Your Project
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1.5 sm:ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>
            
            {user && (
              <Link href="/login" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto text-sm sm:text-base px-6 sm:px-8 py-2.5 bg-transparent border-2 border-white text-white hover:bg-white hover:text-orange-600 font-semibold transition-all duration-300 shadow-xl hover:shadow-2xl group"
                >
                  Access Professional Dashboard
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1.5 sm:ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
