'use client';

import { useEffect, useState, useRef } from 'react';
import { CheckCircle, Users, Award, TrendingUp } from 'lucide-react';

interface CounterProps {
  end: number;
  duration: number;
  suffix?: string;
}

import { motion } from 'framer-motion';

function AnimatedCounter({ end, duration, suffix = '' }: CounterProps) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = (timestamp - startTime) / (duration * 1000);

      if (progress < 1) {
        setCount(Math.floor(end * progress));
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isVisible, end, duration]);

  return (
    <div ref={ref} className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-2 tracking-tighter">
      {count}{suffix}
    </div>
  );
}

export function Metrics() {
  const stats = [
    { label: "Active Projects", value: 500, suffix: "+", icon: <TrendingUp className="w-6 h-6" />, desc: "Global infrastructure initiatives" },
    { label: "Verified Artisans", value: 200, suffix: "+", icon: <Award className="w-6 h-6" />, desc: "Certified master builders" },
    { label: "Success Rate", value: 95, suffix: "%", icon: <CheckCircle className="w-6 h-6" />, desc: "Project excellence index" },
    { label: "Elite Clients", value: 1000, suffix: "+", icon: <Users className="w-6 h-6" />, desc: "Premium service delivery" },
  ];

  return (
    <section className="py-40 bg-[#0A0A0A] border-b border-white/5 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
      
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {stats.map((stat, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-3 text-orange-500 mb-6 font-black uppercase tracking-[0.2em] text-[10px]">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                  {stat.icon}
                </div>
                {stat.label}
              </div>
              <AnimatedCounter end={stat.value} duration={2} suffix={stat.suffix} />
              <p className="text-sm text-gray-500 font-medium uppercase tracking-widest mt-4">
                {stat.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
