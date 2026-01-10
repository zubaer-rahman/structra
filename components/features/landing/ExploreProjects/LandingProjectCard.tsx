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
import { trpc } from "@/utils/trpc";

interface LandingProjectCardProps {
  project: Project;
  selectedProject: Project | null;
  formatBudget: (budget: number) => string;
  formatDate: (dateString: string) => string;
}

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
  const isAuthenticated = !!user?.id;

  return (
    <Card 
      className="group overflow-hidden transition-all duration-300 cursor-pointer border border-gray-200 shadow-sm hover:shadow-lg bg-white hover:border-gray-300"
      onClick={() => window.open(`/recent-project-preview/${project.slug || project.id}`, '_blank')}
    >
      {/* Project Image */}
      <div className="relative h-52 overflow-hidden">
        <Image
          src={
            project?.project_photos?.[0]?.url || "/images/placeholder-image.png"
          }
          alt={project.project_title || "Project image"}
          width={500}
          height={500}
          className={`object-cover transition-transform duration-300 group-hover:scale-105 w-full h-full ${
            !hasAccess ? 'blur-sm' : ''
          }`}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/images/placeholder-image.png";
          }}
        />

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          {project.category && project.category.length > 0 && (
            <Badge className="bg-gradient-to-r from-orange-400 to-orange-500 text-white border-0 text-xs font-medium px-3 py-1 rounded-full">
              {project.category[0]}
            </Badge>
          )}
        </div>

        {/* Access Lock Overlay */}
        {!hasAccess && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white bg-opacity-80 rounded-full p-3 shadow-lg">
              <Lock className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        )}
 
      </div>

      <CardContent className="p-3">
        {/* Homeowner Profile */}
        {project.homeowner && (
          <div className="flex items-center gap-2 mb-3">
            <div className="relative">
              <Image
                src={project.homeowner.profile_photo || "/assets/avatar.png"}
                alt={project.homeowner.full_name || "Homeowner profile picture"}
                width={32}
                height={32}
                className="rounded-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/assets/avatar.png";
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {project.homeowner.full_name}
              </p>
              <p className="text-xs text-gray-500">Project Owner</p>
            </div>
          </div>
        )}

        {/* Project Title */}
        <h4 className="font-semibold text-base text-gray-900 mb-1 line-clamp-1 group-hover:text-gray-700 transition-colors duration-200">
          {project.project_title}
        </h4>

        {/* Budget - Large and Prominent */}
        <div className="mb-2">
          <p className="text-xl font-bold text-gray-900">{formatBudget(project.budget)}</p>
          <p className="text-xs text-gray-500">Project Budget</p>
        </div>

        {/* Key Details Row */}
        <div className="flex items-center gap-2 mb-2 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <Building2 className="h-3 w-3 text-gray-400" />
            {project.project_type || 'Construction'}
          </span>
          <span className="text-gray-300">|</span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-gray-400" />
            {project.start_date ? formatDate(String(project.start_date)) : 'TBD'}
          </span>
          <span className="text-gray-300">|</span>
          <span className="text-green-600 font-medium">
            {project.status}
          </span>
        </div>

        {/* Location */}
        {project.location?.city && project.location?.province && (
          <div className="flex items-center gap-1 text-gray-600 mb-2">
            <MapPin className="h-3 w-3 text-gray-400" />
            <span className="text-xs">
              {project.location.city}, {project.location.province}
            </span>
          </div>
        )}

        {/* Categories */}
        {project.category && project.category.length > 1 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {project.category.slice(1, 3).map((cat, index) => (
              <Badge
                key={`category-${project.id}-${index}-${cat}`}
                variant="outline"
                className="text-xs text-gray-600 border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                {cat}
              </Badge>
            ))}
            {project.category.length > 3 && (
              <Badge
                variant="outline"
                className="text-xs text-gray-600 border-gray-200 bg-gray-50"
              >
                +{project.category.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Posted Date */}
        <p className="text-xs text-gray-400">
          Posted {project.created_at ? formatDate(String(project.created_at)) : 'Recently'}
        </p>
      </CardContent>
    </Card>
  );
}
