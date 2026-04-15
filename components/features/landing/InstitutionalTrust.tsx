"use client";

import React from "react";
import { motion } from "framer-motion";

const partners = [
  { name: "PCL Construction", logo: "PCL" },
  { name: "EllisDon", logo: "ELLISDON" },
  { name: "Aecon", logo: "AECON" },
  { name: "Bird Construction", logo: "BIRD" },
  { name: "Graham", logo: "GRAHAM" },
  { name: "Ledcor", logo: "LEDCOR" },
];

export function InstitutionalTrust() {
  return (
    <section className="py-24 bg-[#0A0A0A] border-y border-white/5 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-4">Institutional Network Partners</p>
          <div className="h-px w-20 bg-orange-500/50 mx-auto" />
        </div>
        
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-30 hover:opacity-100 transition-opacity duration-700">
          {partners.map((partner, index) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="flex items-center justify-center"
            >
              <span className="text-2xl md:text-3xl font-black text-white tracking-tighter italic uppercase">
                {partner.logo}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
