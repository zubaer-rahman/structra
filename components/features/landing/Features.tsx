"use client";

import { motion } from "framer-motion";
import { CheckCircle, MessageSquare, TrendingUp, Shield, Award, FileText } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export function Features() {
  return (
    <section className="py-12 sm:py-20 lg:py-28 bg-transparent dark:bg-[#0A0A0A] border-y border-gray-200 dark:border-white/5 relative overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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
            <Shield className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">The Ecosystem</span>
          </motion.div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-3 sm:mb-4 tracking-tighter">
            Architectural <span className="text-orange-600 dark:text-orange-500">Integrity</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto font-medium leading-relaxed px-2">
            A premium infrastructure where visionary designs meet engineering mastery.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
        >
          {[
            { icon: FileText, title: "Precision Briefing Engine", description: "Define your project with unprecedented clarity. Our structured system ensures every requirement is perfectly communicated." },
            { icon: CheckCircle, title: "Elite Artisan Network", description: "Access a curated circle of pre-vetted master contractors. Rigorously verified for high-end project delivery." },
            { icon: MessageSquare, title: "Command Center", description: "Maintain absolute control with centralized communication. Integrated milestone tracking and document sharing." },
            { icon: TrendingUp, title: "Performance Intel", description: "Make data-driven decisions with comparative analytics. Benchmarking tools provide deep insights into technical feasibility." },
            { icon: Shield, title: "Sovereign Security", description: "Your project data is protected by enterprise-grade encryption. Architectural plans remain strictly confidential." },
            { icon: Award, title: "Reputation Protocol", description: "Our reputation system uses real-world delivery metrics and verified completion rates to build absolute trust." }
          ].map((feature, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="h-full border border-gray-200 dark:border-white/5 bg-white dark:bg-white/[0.03] backdrop-blur-3xl shadow-sm hover:bg-gray-50/80 dark:hover:bg-white/[0.08] transition-all duration-500 hover:-translate-y-1 group overflow-hidden relative rounded-[2rem]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-bl-full -mr-16 -mt-16 transition-all duration-500 group-hover:scale-150" />
                <CardHeader className="p-6 sm:p-8 relative z-10">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-[0_0_20px_rgba(234,88,12,0.15)] group-hover:rotate-12 transition-transform duration-500">
                    <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <CardTitle className="text-sm font-black text-gray-900 dark:text-white mb-2 sm:mb-4 tracking-tighter uppercase italic group-hover:text-orange-600 dark:group-hover:text-orange-500 transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-gray-500 dark:text-gray-400 text-[13px] leading-relaxed font-bold uppercase tracking-wider">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
