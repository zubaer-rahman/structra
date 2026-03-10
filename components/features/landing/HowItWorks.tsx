"use client";

import { motion } from "framer-motion";

export function HowItWorks() {
  const steps = [
    {
      title: "Conceptual Blueprinting",
      description: "Transform your ideas into a comprehensive project charter. Define your scope, architectural requirements, and budget with our guided intelligence tools."
    },
    {
      title: "Curated Talent Acquisition",
      description: "Receive bespoke proposals from the industry's most respected contractors. Each submission includes technical specs, transparent costing, and deep portfolio insights."
    },
    {
      title: "Seamless Execution & Delivery",
      description: "Finalize your partnership and launch your project. Utilize our command center for real-time tracking, secure payments, and collaborative milestone management."
    }
  ];

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b to-white from-orange-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
            The Path to Perfection
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl sm:max-w-4xl mx-auto px-4">
            From initial concept to final sign-off, Structra orchestrates a high-fidelity workflow designed for those who demand excellence in every detail.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-12 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-8 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-orange-200 to-transparent -z-10" />

          {steps.map((step, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="text-center group relative"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/60 backdrop-blur-md border border-orange-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-6 shadow-xl group-hover:scale-110 group-hover:bg-orange-500 group-hover:border-orange-500 transition-all duration-500">
                <span className="text-orange-600 group-hover:text-white text-lg sm:text-xl font-bold transition-colors duration-300">{index + 1}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-3 text-gray-900 group-hover:text-orange-600 transition-colors duration-300">{step.title}</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed px-2">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
