"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  MapPin, 
  Calendar,
  DollarSign,
  Star,
  Shield,
  X,
  Clock,
  CheckCircle
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

interface ProjectDetailsModalProps {
  project: FeaturedProjectWithContractor | null;
  isOpen: boolean;
  onClose: () => void;
  formatBudget: (budget: number) => string;
  formatDate: (dateString: string) => string;
}

export default function ProjectDetailsModal({
  project,
  isOpen,
  onClose,
  formatBudget,
  formatDate
}: ProjectDetailsModalProps) {
  if (!project) return null;

  const isFeaturedProject = project.is_featured_project;
  const isFeaturedContractor = !!project.contractor;


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 pr-4">
              <div>
                <DialogTitle className="text-3xl font-bold text-gray-900">
                  {project.project_title}
                </DialogTitle>
                {/* Contractor Name - Display prominently below title */}
                {project.contractor && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={project.contractor.profile_photo || project.contractor.contractor_profile?.logo || "/assets/avatar.png"}
                        alt={project.contractor.contractor_profile?.business_name || project.contractor.full_name || "Contractor"}
                        width={24}
                        height={24}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/assets/avatar.png";
                        }}
                      />
                    </div>
                    <p className="text-lg font-semibold text-blue-600">
                      {project.contractor.contractor_profile?.business_name || project.contractor.full_name}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                <CheckCircle className="h-4 w-4" />
                <span>Completed</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="flex-shrink-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-8">
          {/* Featured Badges */}
          <div className="flex gap-3">
            {isFeaturedProject && (
              <span className="px-4 py-2 text-sm bg-orange-100 text-orange-700 rounded-full font-medium">
                Featured Project
              </span>
            )}
            {isFeaturedContractor && (
              <span className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-full font-medium">
                Featured Contractor
              </span>
            )}
          </div>

          {/* Contractor Badge */}
          {project.contractor && (
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
              <div className="relative">
                <Image
                  src={project.contractor.profile_photo || project.contractor.contractor_profile?.logo || "/assets/avatar.png"}
                  alt={project.contractor.contractor_profile?.business_name || project.contractor.full_name || "Contractor"}
                  width={32}
                  height={32}
                  className="rounded-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/assets/avatar.png";
                  }}
                />
                <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5">
                  <Shield className="h-2 w-2 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {project.contractor.contractor_profile?.business_name || project.contractor.full_name}
                </p>
                <p className="text-xs text-blue-600">Featured Contractor</p>
              </div>
            </div>
          )}

          {/* Project Photos */}
          {(project.project_photos && project.project_photos.length > 0) || project.after_photo ? (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">Project Gallery</h3>
              
              {/* Before and After Comparison */}
              {project.project_photos && project.project_photos.length > 0 && project.after_photo ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Before Photo */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700 text-center bg-gray-100 px-3 py-1 rounded-full">Before</h4>
                      <div className="relative h-80 rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg">
                        <Image
                          src={project.project_photos[0].url || "/images/placeholder-image.png"}
                          alt={`${project.project_title || "Project"} - Before`}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/images/placeholder-image.png";
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* After Photo */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700 text-center bg-green-100 px-3 py-1 rounded-full">After</h4>
                      <div className="relative h-80 rounded-xl overflow-hidden border-2 border-green-200 shadow-lg">
                        <Image
                          src={project.after_photo.url || "/images/placeholder-image.png"}
                          alt={`${project.project_title || "Project"} - After`}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/images/placeholder-image.png";
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Fallback to regular photo grid if no before/after available */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {project.project_photos?.filter(photo => photo && photo.url).map((photo, index) => (
                    <div key={`photo-${project.id}-${index}`} className="relative h-80 rounded-xl overflow-hidden shadow-lg">
                      <Image
                        src={photo.url || "/images/placeholder-image.png"}
                        alt={`${project.project_title || "Project"} - Photo ${index + 1}`}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/images/placeholder-image.png";
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {/* Project Details */}
          <div className="bg-white border border-gray-200 p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <span className="text-sm text-gray-500">Budget</span>
                  <p className="font-semibold text-gray-900 text-lg">
                    {formatBudget(project.budget)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <span className="text-sm text-gray-500">Project Type</span>
                  <p className="font-semibold text-gray-900 capitalize">
                    {project.project_type?.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>

              {project.location?.city && project.location?.province && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Location</span>
                    <p className="font-semibold text-gray-900">
                      {project.location.city}, {project.location.province}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <span className="text-sm text-gray-500">Timeline</span>
                  <p className="font-semibold text-gray-900">
                    {formatDate(project.start_date?.toString() || '')} - {formatDate(project.end_date?.toString() || '')}
                  </p>
                </div>
              </div>

              {project.substantial_completion && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Completed</span>
                    <p className="font-semibold text-gray-900">
                      {formatDate(project.substantial_completion?.toString() || '')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center pt-6 border-t border-gray-200">
            <Button 
              onClick={() => {
                if (project.slug) {
                  window.open(`/project/${project.slug}`, '_blank')
                } else {
                  // Fallback to project id if no slug available
                  console.warn('No slug available for project:', project.project_title, 'using project id as fallback')
                  window.open(`/project/${project.id}`, '_blank')
                }
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 text-lg font-medium rounded-lg"
            >
              View Full Project Details
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
