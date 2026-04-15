"use client";

import React from "react";
import { ArrowRight } from "lucide-react";

export default function SeeMoreCard() {
  return (
    <div 
      className="group flex items-center justify-center h-full cursor-pointer px-4"
      onClick={() => window.open('/register', '_blank')}
    >
      <div className="flex items-center justify-center gap-3 text-orange-500 font-black uppercase tracking-[0.2em] text-[10px] border border-white/10 bg-white/5 backdrop-blur-3xl px-8 py-4 rounded-2xl group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-all duration-500 shadow-2xl">
        <span>Expand Network</span>
        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
}
