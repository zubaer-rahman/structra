"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, ShieldCheck, Users2, Trophy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

export function Hero() {
  const { user } = useAuth();
  
  return (
    <section className="relative pt-40 pb-32 sm:pt-48 sm:pb-40 lg:pt-56 lg:pb-56 overflow-hidden bg-[#0A0A0A]">
      {/* Premium Background Elements */}
      <div className="absolute inset-0 -z-10 bg-[#0A0A0A]">
        {/* 3D Perspective Grid */}
        <div className="absolute inset-0 opacity-[0.15]" 
             style={{ 
               backgroundImage: `
                 linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
               `,
               backgroundSize: '100px 100px',
               transform: 'perspective(1000px) rotateX(60deg) translateY(-100px)',
               transformOrigin: 'top'
             }} 
        />
        
        {/* Glowing Structural Lines */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(234,88,12,0.15),transparent_70%)]" />
        
        {/* Moving Atmospheric Glows */}
        <motion.div 
          animate={{ 
            opacity: [0.2, 0.4, 0.2],
            scale: [1, 1.2, 1],
            x: [-20, 20, -20]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-orange-600/10 rounded-full blur-[140px]" 
        />
        <motion.div 
          animate={{ 
            opacity: [0.1, 0.3, 0.1],
            scale: [1.2, 1, 1.2],
            y: [-30, 30, -30]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 5 }}
          className="absolute bottom-[-20%] right-[-10%] w-[1000px] h-[1000px] bg-blue-600/5 rounded-full blur-[180px]" 
        />

        {/* Noise Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Elite Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 mb-10 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
          <span className="text-[10px] sm:text-xs font-bold text-gray-300 tracking-[0.2em] uppercase">
            The Gold Standard in Construction
          </span>
        </motion.div>

        <div className="mb-14 sm:mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white mb-8 leading-[0.95] tracking-tighter"
          >
            Construct Your <br className="hidden sm:block" /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-orange-400 via-orange-500 to-orange-700">
              Legacy
            </span> With Elite Pros
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg sm:text-xl md:text-2xl text-gray-400 max-w-4xl mx-auto leading-relaxed px-4 font-medium"
          >
            Structra connects visionary homeowners with Canada's most elite, verified construction professionals. Experience the next generation of project management.
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center px-4 mb-20"
        >
          <Link href="/register" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto h-16 px-10 text-base font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-[0_0_40px_rgba(234,88,12,0.3)] hover:shadow-[0_0_60px_rgba(234,88,12,0.5)] transition-all duration-500 rounded-2xl border-0 group overflow-hidden relative cursor-pointer"
            >
              <span className="relative z-10 flex items-center gap-2">
                Begin Transformation
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </Button>
          </Link>
          
          <Link href="/login" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-16 px-10 text-base font-bold bg-white/5 border border-white/10 text-white hover:bg-white/10 backdrop-blur-lg transition-all duration-500 rounded-2xl shadow-2xl group cursor-pointer"
            >
              <span className="flex items-center gap-2">
                Professional Login
                <Users2 className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
              </span>
            </Button>
          </Link>
        </motion.div>

      </div>
    </section>
  );
}
