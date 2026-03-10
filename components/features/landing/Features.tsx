"use client";

import { motion } from "framer-motion";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, CheckCircle, MessageSquare, TrendingUp, Shield, Award } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export function Features() {
  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-white to-orange-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
            The Structra Trust Ecosystem
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl sm:max-w-4xl mx-auto px-4">
            A premium infrastructure where architectural visions meet engineering mastery. We bridge the gap between complex requirements and flawless execution through intelligent collaboration tools.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
        >
          {[
            {
              icon: FileText,
              title: "Precision Briefing Engine",
              description: "Define your project with unprecedented clarity. Our structured briefing system ensures every requirement, budget detail, and timeline expectation is perfectly communicated to the right professionals."
            },
            {
              icon: CheckCircle,
              title: "Elite Artisan Network",
              description: "Access a curated circle of pre-vetted master contractors. Each member is rigorously verified for insurance, licensing, and a proven history of high-end project delivery."
            },
            {
              icon: MessageSquare,
              title: "Collaboration Command Center",
              description: "Maintain absolute control with centralized communication. Integrated milestone tracking, document sharing, and change management keep all stakeholders aligned and informed."
            },
            {
              icon: TrendingUp,
              title: "Performance Intelligence",
              description: "Make data-driven decisions with comparative analytics. Benchmarking tools provide deep insights into proposal costs, technical feasibility, and historical contractor performance."
            },
            {
              icon: Shield,
              title: "Sovereign Data Security",
              description: "Your project data is protected by enterprise-grade encryption and strict privacy protocols. We ensure that sensitive contract details and architectural plans remain secure and confidential."
            },
            {
              icon: Award,
              title: "Trust Assurance Protocol",
              description: "Our multi-layered reputation system uses real-world delivery metrics, client satisfaction scores, and verified completion rates to build a foundation of absolute trust."
            }
          ].map((feature, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="h-full border-0 bg-white/60 backdrop-blur-lg shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-100/50 rounded-bl-full -mr-12 -mt-12 transition-all duration-500 group-hover:scale-150" />
                <CardHeader className="p-4 sm:p-6 relative z-10">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg shadow-orange-200 group-hover:rotate-12 transition-transform duration-300">
                    <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <CardTitle className="text-base sm:text-lg text-gray-900 group-hover:text-orange-600 transition-colors duration-300">{feature.title}</CardTitle>
                  <CardDescription className="text-gray-600 text-sm leading-relaxed">
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
