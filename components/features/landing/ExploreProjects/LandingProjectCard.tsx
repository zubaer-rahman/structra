"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Calendar,
  Building2,
  Lock,
} from "lucide-react";
import { Project } from "@/server/database/interfaces";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

interface LandingProjectCardProps {
  project: Project;
  selectedProject: Project | null;
  formatBudget: (budget: number) => string;
  formatDate: (dateString: string) => string;
}

import { motion } from "framer-motion";
import { PROJECT_STATUSES } from "@/utils/constants";

export default function LandingProjectCard({
  project,
  selectedProject,
  formatBudget,
  formatDate,
}: LandingProjectCardProps) {
  const { user } = useAuth();
  
  // Check project access for authenticated users
  const { data: projectAccess } = trpc.projects.checkProjectAccess.useQuery(
    {
      projectId: project.id,
      userId: user?.id || ''
    },
    {
      enabled: !!user?.id && !!project.id,
      retry: false
    }
  );

  // For unauthenticated users, they don't have access
  // For authenticated users, check their actual access
  const hasAccess = user?.id ? (projectAccess?.hasAccess || false) : false;

  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="h-full"
    >
      <Card 
        className="group overflow-hidden h-full transition-all duration-500 cursor-pointer border border-gray-200/50 shadow-md hover:shadow-2xl bg-white/60 backdrop-blur-md hover:border-orange-500/30 relative"
        onClick={() => window.open(`/recent-project-preview/${project.slug || project.id}`, '_blank')}
      >
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Project Image */}
        <div className="relative h-48 overflow-hidden">
          <Image
            src={
              project?.project_photos?.[0]?.url || "/images/placeholder-image.png"
            }
            alt={project.project_title || "Project image"}
            width={500}
            height={500}
            className={`object-cover transition-transform duration-700 group-hover:scale-110 w-full h-full ${
              !hasAccess ? 'blur-md grayscale' : ''
            }`}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/images/placeholder-image.png";
            }}
          />

          {/* Category Badge - Glassmorphic */}
          <div className="absolute top-3 left-3">
            {project.category && project.category.length > 0 && (
              <div className="bg-orange-500/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-lg shadow-lg border border-white/20 uppercase tracking-wider">
                {project.category[0]}
              </div>
            )}
          </div>

          {/* Access Lock Overlay - Redesigned */}
          {!hasAccess && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[2px]">
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-white/20 transform group-hover:scale-110 transition-transform duration-300">
                <Lock className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          )}
        </div>

        <CardContent className="p-4 sm:p-5">
          {/* Homeowner Profile */}
          {project.homeowner && (
            <div className="flex items-center gap-2.5 mb-4">
              <div className="relative flex-shrink-0">
                <Image
                  src={project.homeowner.profile_photo || "/assets/avatar.png"}
                  alt={project.homeowner.full_name || "Homeowner"}
                  width={32}
                  height={32}
                  className="rounded-full object-cover ring-2 ring-orange-50"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/assets/avatar.png";
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {project.homeowner.full_name}
                </p>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Project Owner</p>
              </div>
            </div>
          )}

          {/* Project Title */}
          <h4 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1 group-hover:text-orange-600 transition-colors duration-300 tracking-tight">
            {project.project_title}
          </h4>

          {/* Budget - More Professional Layout */}
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-2xl font-extrabold text-gray-900 tabular-nums">
              {formatBudget(project.budget)}
            </span>
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Est. Budget</span>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-2 gap-y-3 gap-x-2 mb-4">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 bg-gray-50 rounded-md">
                <Building2 className="h-3.5 w-3.5 text-orange-600" />
              </div>
              <span className="text-xs font-semibold text-gray-700 truncate">
                {project.project_type || 'Construction'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 bg-gray-50 rounded-md">
                <MapPin className="h-3.5 w-3.5 text-orange-600" />
              </div>
              <span className="text-xs font-semibold text-gray-700 truncate">
                {project.location?.city || 'Remote'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-[10px] font-bold text-gray-400 uppercase">
                {project.start_date ? formatDate(String(project.start_date)) : 'TBD'}
              </span>
            </div>
            <div className={cn(
              "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest border",
              project.status === PROJECT_STATUSES.OPEN_FOR_PROPOSALS ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-600 border-gray-200"
            )}>
              {project.status}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
