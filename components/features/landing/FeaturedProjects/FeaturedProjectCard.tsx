"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  Building2, 
  MapPin, 
  Calendar,
  DollarSign,
  Star,
  Shield
} from "lucide-react";
import { Project } from "@/server/database/interfaces";
import Image from "next/image";

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
  formatDate
}: FeaturedProjectCardProps) {
  const isFeaturedProject = project.is_featured_project;
  const isFeaturedContractor = !!project.contractor;


  return (
    <Card className="cursor-pointer transition-all hover:shadow-lg border border-gray-200 hover:border-orange-300 group h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
              {project.project_title}
            </h3>
            {/* Contractor Name - Display prominently below title */}
            {project.contractor && (
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={project.contractor.profile_photo || project.contractor.contractor_profile?.logo || "/assets/avatar.png"}
                    alt={project.contractor.contractor_profile?.business_name || project.contractor.full_name || "Contractor"}
                    width={20}
                    height={20}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/assets/avatar.png";
                    }}
                  />
                </div>
                <p className="text-sm font-medium text-blue-600">
                  {project.contractor.contractor_profile?.business_name || project.contractor.full_name}
                </p>
              </div>
            )}
            <p className="text-sm text-gray-600 line-clamp-3 mb-3">
              {project.statement_of_work}
            </p>
          </div>
          
          {/* Featured Badge */}
          <div className="flex flex-col gap-1 ml-3">
            {isFeaturedProject && (
              <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full font-medium">
                Featured Project
              </span>
            )}
            {isFeaturedContractor && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full font-medium">
                Featured Contractor
              </span>
            )}
          </div>
        </div>

        {/* Project Image */}
        {project.project_photos && project.project_photos.length > 0 && project.project_photos[0] && (
          <div className="relative w-full h-48 mb-3 rounded-lg overflow-hidden">
            {(() => {
              const projectSrc = project.project_photos?.[0]?.url || "/images/placeholder-image.png";
              
              // Ensure src is never empty or undefined
              if (!projectSrc || typeof projectSrc !== 'string' || projectSrc.trim() === '') {
                return null;
              }
              
              return (
                <Image
                  src={projectSrc}
                  alt={project.project_title || "Project image"}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/images/placeholder-image.png";
                  }}
                />
              );
            })()}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3 flex-1 flex flex-col">
        {/* Budget */}
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="h-4 w-4 text-green-600" />
          <span className="font-medium text-gray-900">
            {formatBudget(project.budget)}
          </span>
        </div>

        {/* Categories */}
        {project.category && project.category.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.category.slice(0, 3).map((cat, index) => (
              <span 
                key={index}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
              >
                {cat}
              </span>
            ))}
            {project.category.length > 3 && (
              <span className="px-2 py-1 text-xs text-gray-500">
                +{project.category.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Location */}
        {project.location?.city && project.location?.province && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin className="h-4 w-4" />
            <span className="truncate">
              {project.location.city}, {project.location.province}
            </span>
          </div>
        )}

        {/* Completion Date */}
        {project.substantial_completion && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>
              Completed {formatDate(project.substantial_completion?.toString() || '')}
            </span>
          </div>
        )}

        {/* Spacer to push contractor/homeowner info to bottom */}
        <div className="flex-1"></div>

        {/* Contractor Info (if featured contractor) */}
        {project.contractor && (
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                {(() => {
                  const contractorSrc = project.contractor.profile_photo || project.contractor.contractor_profile?.logo || "/assets/avatar.png";
                  
                  // Ensure src is never empty or undefined
                  if (!contractorSrc || typeof contractorSrc !== 'string' || contractorSrc.trim() === '') {
                    return null;
                  }
                  
                  return (
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={contractorSrc}
                        alt={project.contractor.contractor_profile?.business_name || project.contractor.full_name || "Contractor"}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/assets/avatar.png";
                        }}
                      />
                    </div>
                  );
                })()}
                <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                  <Shield className="h-2 w-2 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {project.contractor.contractor_profile?.business_name || project.contractor.full_name}
                </p>
                <p className="text-xs text-gray-500">
                  Featured Contractor
                </p>
                {project.contractor.contractor_profile?.trade_category && project.contractor.contractor_profile.trade_category.length > 0 && (
                  <p className="text-xs text-gray-400 truncate">
                    {project.contractor.contractor_profile.trade_category.slice(0, 2).join(", ")}
                    {project.contractor.contractor_profile.trade_category.length > 2 && "..."}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
