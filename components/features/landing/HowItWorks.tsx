"use client";

import { motion } from "framer-motion";

export function HowItWorks() {
  const steps = [
    {
      title: "Conceptual Blueprinting",
      description: "Transform your ideas into a comprehensive project charter. Define your scope and architectural requirements with guided intelligence."
    },
    {
      title: "Talent Acquisition",
      description: "Receive bespoke proposals from the industry's most respected contractors. Each submission includes deep portfolio insights."
    },
    {
      title: "Command Center Launch",
      description: "Finalize your partnership and launch. Utilize our command center for real-time tracking and secure milestone management."
    }
  ];

  return (
    <section className="py-12 sm:py-20 lg:py-28 bg-transparent dark:bg-[#0A0A0A] border-y border-gray-200 dark:border-white/5 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-14"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 mb-3 sm:mb-5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-500"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">The Process</span>
          </motion.div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-3 sm:mb-4 tracking-tighter">
            The Path to <span className="text-orange-600 dark:text-orange-500">Perfection</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto font-medium px-2">
            Structra orchestrates a high-fidelity workflow designed for those who demand excellence in every structural detail.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 relative">
          {/* Connector Line (Desktop only) */}
          <div className="hidden md:block absolute top-10 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent -z-10 shadow-[0_0_20px_rgba(234,88,12,0.3)]" />

          {steps.map((step, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="text-center group"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-white/5 backdrop-blur-3xl border border-gray-200 dark:border-white/10 rounded-3xl flex items-center justify-center mx-auto mb-5 sm:mb-8 shadow-sm dark:shadow-xl group-hover:scale-110 group-hover:bg-orange-600 group-hover:border-orange-500 transition-all duration-700 relative">
                <span className="text-gray-900 dark:text-white group-hover:text-white text-xl sm:text-3xl font-black transition-colors">{index + 1}</span>
                <div className="absolute inset-0 rounded-3xl bg-orange-600/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              </div>
              <h3 className="text-lg sm:text-xl font-black mb-2 sm:mb-4 text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-500 transition-colors duration-300 tracking-tight">
                {step.title}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed font-medium px-2 sm:px-0">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
