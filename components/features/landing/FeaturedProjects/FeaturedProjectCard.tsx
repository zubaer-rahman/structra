"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { MapPin, ArrowUpRight } from "lucide-react";
import { Project } from "@/server/database/interfaces";
import Image from "next/image";
import { normalizeFileReferences } from "@/utils/helpers";
import { motion } from "framer-motion";

interface FeaturedProjectWithContractor extends Omit<Project, 'homeowner'> {
  contractor?: {
    id: string;
    full_name: string;
    profile_photo?: string;
    contractor_profile?: {
      id: string;
      business_name?: string;
      logo?: string;
      featured_contractor_expiry?: string;
      bio?: string;
      trade_category?: string[];
      service_location?: string;
      work_guarantee?: number;
      work_guarantee_statement?: string;
      portfolio?: string[];
      address?: {
        address: string;
        latitude?: number | null;
        longitude?: number | null;
        city?: string | null;
        province?: string | null;
        postalCode?: string | null;
        country?: string | null;
      };
    };
  };
  homeowner?: {
    id: string;
    full_name: string;
    profile_photo?: string;
  };
  feature_type?: 'featured_project' | 'featured_contractor';
}

interface FeaturedProjectCardProps {
  project: FeaturedProjectWithContractor;
  formatBudget: (budget: number) => string;
  formatDate: (dateString: string) => string;
}

export default function FeaturedProjectCard({
  project,
  formatBudget,
}: FeaturedProjectCardProps) {
  const photos = normalizeFileReferences(project.project_photos, 'Project Photo');
  const projectSrc = photos[0]?.url || "/images/placeholder-image.png";

  const locationCity = project.location?.city || "Vancouver";
  const locationProvince = project.location?.province || "BC";
  const primaryCategory = project.category && project.category.length > 0 
    ? project.category[0] 
    : (project.project_type || "Renovation");

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="h-full"
    >
      <Card className="cursor-pointer bg-white dark:bg-[#111113] transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)] hover:shadow-2xl border border-gray-200/90 dark:border-white/[0.08] hover:border-orange-500/40 dark:hover:border-orange-500/50 group h-full flex flex-col overflow-hidden rounded-[2rem] p-0">
        {/* Top Image Container */}
        <div className="relative w-full aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-white/[0.03]">
          <Image
            src={projectSrc}
            alt={project.project_title || "Project image"}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/images/placeholder-image.png";
            }}
          />
          {/* Subtle cinematic gradient vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

          {/* Top Overlays */}
          <div className="absolute top-4 inset-x-4 flex items-center justify-between pointer-events-none">
            <span className="px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] bg-black/60 backdrop-blur-md text-white border border-white/10 rounded-full shadow-sm">
              {primaryCategory}
            </span>
            <span className="px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] bg-orange-500 text-white rounded-full shadow-sm">
              Featured
            </span>
          </div>

          {/* Micro hover indicator */}
          <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/90 dark:bg-black/60 backdrop-blur-md border border-white/20 text-gray-900 dark:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105 shadow-md">
            <ArrowUpRight className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <h3 className="font-black text-lg text-gray-900 dark:text-white line-clamp-1 group-hover:text-orange-500 transition-colors tracking-tight">
              {project.project_title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed font-normal">
              {project.statement_of_work}
            </p>
          </div>

          {/* Bottom Meta Pill Bar */}
          <div className="pt-4 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                Budget
              </span>
              <span className="text-orange-600 dark:text-orange-500 font-black text-sm">
                {formatBudget(project.budget)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 font-medium text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-orange-500/70" />
              <span className="truncate max-w-[130px]">
                {locationCity}, {locationProvince}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
