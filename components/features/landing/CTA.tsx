"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function CTA() {
  const { user } = useAuth();
  
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-[#0A0A0A]">
      <div className="max-w-[1440px] mx-auto overflow-hidden rounded-[2.5rem] border border-white/5 relative group">
        {/* Banner Background with Advanced Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 via-black to-black -z-10" />
        <div className="absolute inset-0 opacity-30" 
             style={{ 
               backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)`,
               backgroundSize: '30px 30px'
             }} 
        />
        
        {/* Dramatic Glows */}
        <div className="absolute top-[-50%] right-[-10%] w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[120px] animate-pulse" />
        
        <div className="relative z-10 py-16 px-8 md:px-20 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl text-center md:text-left">
             <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500">
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Final Authorization</span>
             </div>
             <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 tracking-tighter leading-none italic uppercase">
              Architect Your <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-700">
                Masterpiece
              </span>
            </h2>
            <p className="text-lg text-gray-400 font-medium leading-relaxed">
              Join the elite circle of visionaries who redefine structural excellence.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 w-full md:w-auto">
            <Link href="/register" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                className="w-full h-16 px-12 text-base font-black uppercase tracking-widest bg-orange-600 hover:bg-orange-500 text-white shadow-[0_0_50px_rgba(234,88,12,0.3)] hover:shadow-[0_0_80px_rgba(234,88,12,0.6)] transition-all duration-500 rounded-2xl border-0 group cursor-pointer italic"
              >
                Register
                <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-2 transition-transform duration-300" />
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Bottom Metadata Bar */}
        <div className="border-t border-white/5 py-4 px-8 md:px-20 bg-white/[0.02] backdrop-blur-3xl flex flex-wrap gap-6 items-center">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Global Ops Active</span>
            </div>
            <div className="h-4 w-px bg-white/10 hidden md:block" />
            <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Secure Escrow Protocol</span>
            <div className="h-4 w-px bg-white/10 hidden md:block" />
            <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Elite Member Network: 500+</span>
        </div>
      </div>
    </section>
  );
}
