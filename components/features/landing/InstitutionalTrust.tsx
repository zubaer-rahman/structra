"use client";

import React from "react";
import { motion } from "framer-motion";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const partners = [
  { name: "PCL Construction", logo: "PCL" },
  { name: "EllisDon", logo: "ELLISDON" },
  { name: "Aecon", logo: "AECON" },
  { name: "Bird Construction", logo: "BIRD" },
  { name: "Graham", logo: "GRAHAM" },
  { name: "Ledcor", logo: "LEDCOR" },
];

export function InstitutionalTrust() {
  const settings = {
    dots: false,
    infinite: true,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    speed: 4000,
    autoplaySpeed: 0,
    cssEase: "linear",
    pauseOnHover: false,
    arrows: false,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 2,
        }
      }
    ]
  };

  return (
    <section className="py-10 sm:py-14 lg:py-20 bg-transparent dark:bg-[#0A0A0A] border-y border-gray-200/60 dark:border-white/5 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 md:mb-12">
          <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.4em] mb-4">Institutional Network Partners</p>
          <div className="h-px w-20 bg-orange-500/50 mx-auto" />
        </div>
        
        <div className="opacity-40 hover:opacity-100 transition-opacity duration-700 max-w-5xl mx-auto cursor-default pointer-events-none md:pointer-events-auto">
          <Slider {...settings}>
            {partners.map((partner) => (
              <div key={partner.name} className="px-4">
                <div className="flex items-center justify-center h-16">
                  <span className="text-xl md:text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase text-center block w-full">
                    {partner.logo}
                  </span>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </section>
  );
}
