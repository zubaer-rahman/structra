"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

export function Hero() {
  const { user } = useAuth();
  
  return (
    <section className="relative pt-20 pb-16 sm:pt-24 sm:pb-20 lg:pt-32 lg:pb-28 overflow-hidden bg-gradient-to-b from-orange-50 to-white">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3] 
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-1/4 w-64 h-64 bg-orange-200 rounded-full blur-3xl" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2] 
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-100 rounded-full blur-3xl" 
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Glassmorphic Trust Badge / Eyebrow */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center px-4 py-1.5 mb-8 rounded-full bg-white/40 backdrop-blur-md border border-white/20 shadow-lg"
        >
          <span className="text-xs sm:text-sm font-bold text-orange-800 tracking-wide uppercase">
            The Definitive Construction Network
          </span>
        </motion.div>

        <div className="mb-10 sm:mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-[1.1] tracking-tight"
          >
            Elevate Your Construction <br className="hidden sm:block" /> 
            <span className="bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
              Experience
            </span> with Precision
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg sm:text-xl md:text-2xl text-gray-600 max-w-2xl sm:max-w-3xl mx-auto leading-relaxed px-4 font-medium"
          >
            Connecting visionary homeowners with elite, verified professionals. Streamline your project lifecycle from initial concept to final walkthrough.
          </motion.p>
        </div>

         <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4"
        >
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
        </motion.div>
      </div>
    </section>
  );
}
