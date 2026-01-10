'use client';

import { useEffect, useState, useRef } from 'react';
import { CheckCircle, Users, Award, TrendingUp } from 'lucide-react';

interface CounterProps {
  end: number;
  duration: number;
  suffix?: string;
}

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
    <div ref={ref} className="text-3xl sm:text-4xl md:text-5xl font-bold text-orange-600 mb-2">
      {count}{suffix}
    </div>
  );
}

export function Metrics() {
  return (
    <section className="py-12 sm:py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
            Platform Excellence in Numbers
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl sm:max-w-3xl mx-auto px-4">
            Trusted by industry professionals and homeowners across the construction sector
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <div className="text-center p-4 sm:p-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
              <Users className="w-8 h-8 sm:w-10 sm:h-10 text-gray-600" />
            </div>
            <AnimatedCounter end={500} duration={2.5} suffix="+" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Active Projects</h3>
            <p className="text-xs sm:text-sm text-gray-600 px-2">
              Ongoing construction projects across the platform
            </p>
          </div>
          
          <div className="text-center p-4 sm:p-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
              <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-gray-600" />
            </div>
            <AnimatedCounter end={200} duration={2.5} suffix="+" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Verified Contractors</h3>
            <p className="text-xs sm:text-sm text-gray-600 px-2">
              Pre-screened professionals with proven track records
            </p>
          </div>
          
          <div className="text-center p-4 sm:p-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
              <Award className="w-8 h-8 sm:w-10 sm:h-10 text-gray-600" />
            </div>
            <AnimatedCounter end={95} duration={2.5} suffix="%" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Success Rate</h3>
            <p className="text-xs sm:text-sm text-gray-600 px-2">
              Project completion rate with client satisfaction
            </p>
          </div>
          
          <div className="text-center p-4 sm:p-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-gray-600" />
            </div>
            <AnimatedCounter end={1000} duration={2.5} suffix="+" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Happy Clients</h3>
            <p className="text-xs sm:text-sm text-gray-600 px-2">
              Satisfied homeowners and contractors served
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
