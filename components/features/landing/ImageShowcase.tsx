"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Home, Award, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export function ImageShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const showcases = [
    {
      image: "/images/landing/landing1.png",
      title: "Visionary Architecture",
      description: "From bold concepts to structural masterpieces, connect with Canada's elite architectural minds.",
      icon: <Home className="w-5 h-5" />,
      tag: "Design Phase",
      buttonText: "Explore Architecture"
    },
    {
      image: "/images/landing/landing2.png",
      title: "Master Craftsmanship",
      description: "Experience the precision of verified master builders dedicated to unparalleled quality and detail.",
      icon: <Award className="w-5 h-5" />,
      tag: "Build Phase",
      buttonText: "Find Master Builders"
    },
    {
      image: "/images/landing/landing3.png",
      title: "Elite Project Delivery",
      description: "Sophisticated project management ensures your timeline and budget are met with absolute certainty.",
      icon: <ShieldCheck className="w-5 h-5" />,
      tag: "Completion",
      buttonText: "Start Managing"
    }
  ];

  const nextSlide = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % showcases.length);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + showcases.length) % showcases.length);
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 8000);
    return () => clearInterval(timer);
  }, []);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <section className="py-40 bg-[#0A0A0A]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 tracking-tighter">
            The Lifecycle of <span className="text-orange-500">Excellence</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto font-medium">
            Structra orchestrates every stage of your construction journey with the precision of a high-performance firm.
          </p>
        </motion.div>

        <div className="relative h-[500px] sm:h-[600px] lg:h-[700px] w-full overflow-hidden rounded-[2.5rem] border border-white/5 shadow-2xl group">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.5 }
              }}
              className="absolute inset-0"
            >
              <div className="relative h-full w-full flex">
                <div className="absolute inset-0">
                  <Image
                    src={showcases[currentIndex].image}
                    alt={showcases[currentIndex].title}
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent lg:from-black/70 lg:via-transparent lg:to-transparent" />
                </div>
                
                <div className="relative z-10 w-full lg:w-1/2 p-8 sm:p-16 flex flex-col justify-center items-start">
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 text-orange-400"
                  >
                    {showcases[currentIndex].icon}
                    <span className="text-[10px] font-black uppercase tracking-widest">{showcases[currentIndex].tag}</span>
                  </motion.div>
                  
                  <motion.h3 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tighter leading-[0.9]"
                  >
                    {showcases[currentIndex].title}
                  </motion.h3>
                  
                  <motion.p 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-lg text-gray-300 mb-10 max-w-md font-medium leading-relaxed"
                  >
                    {showcases[currentIndex].description}
                  </motion.p>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Link href="/register">
                      <Button 
                        size="lg" 
                        className="h-16 px-10 bg-white text-black hover:bg-orange-500 hover:text-white transition-all duration-300 rounded-2xl font-bold group/btn shadow-2xl"
                      >
                        {showcases[currentIndex].buttonText}
                        <ArrowRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="absolute bottom-12 right-12 flex items-center gap-4 z-20">
            <button
              onClick={prevSlide}
              className="w-14 h-14 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all cursor-pointer group"
            >
              <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={nextSlide}
              className="w-14 h-14 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all cursor-pointer group"
            >
              <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Progress Indicators */}
          <div className="absolute top-12 right-12 flex flex-col gap-3 z-20">
            {showcases.map((_, index) => (
              <div 
                key={index}
                className="relative h-12 w-1 bg-white/10 rounded-full overflow-hidden"
              >
                {index === currentIndex && (
                  <motion.div 
                    layoutId="progress"
                    className="absolute top-0 left-0 w-full bg-orange-500"
                    initial={{ height: 0 }}
                    animate={{ height: "100%" }}
                    transition={{ duration: 8, ease: "linear" }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}