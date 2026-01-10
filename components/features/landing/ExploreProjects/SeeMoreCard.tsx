"use client";

import React from "react";
import { ArrowRight } from "lucide-react";

export default function SeeMoreCard() {
  return (
    <div 
      className="group flex items-center justify-center h-full cursor-pointer"
      onClick={() => window.open('/register', '_blank')}
    >
      <div className="flex items-center justify-center gap-2 text-orange-500 font-medium text-base border border-orange-300 px-4 py-2 rounded-md group-hover:text-orange-600 group-hover:border-orange-400 transition-all duration-200">
        <span>See More</span>
        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
}
