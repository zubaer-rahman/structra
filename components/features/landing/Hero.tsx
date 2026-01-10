"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function Hero() {
  const { user } = useAuth();
  
  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-orange-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
         <div className="flex flex-col sm:flex-row items-center justify-center mb-6 sm:mb-8">
          <Image
            src="/images/brand/app-icon-original.png"
            alt="BuildReady Icon"
            width={200}
            height={200}
            className="w-24 h-24 sm:w-32 sm:h-32 drop-shadow-xl mb-4 sm:mb-0"
          />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-orange-500 drop-shadow-sm sm:ml-3">
            BuildReady
          </h1>
        </div>

         <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight px-2">
            Where <span className="text-orange-600">Build-Ready Projects</span>{" "}
            Meet <span className="text-orange-600">Ready Builders</span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-xl sm:max-w-2xl mx-auto leading-relaxed px-4">
            Easily share better project information to more contractors with less effort 
            and get stronger results and a contract in hand
          </p>
        </div>

         <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
          <Link href="/register" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto text-sm sm:text-base px-6 sm:px-8 py-2.5 cursor-pointer bg-orange-600 hover:bg-orange-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-0 group"
            >
              Start Your Project
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1.5 sm:ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </Link>
          {user && (
            <Link href="/login" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-sm sm:text-base px-6 sm:px-8 py-2.5 cursor-pointer border-2 border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl group"
              >
                Access Dashboard
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1.5 sm:ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
