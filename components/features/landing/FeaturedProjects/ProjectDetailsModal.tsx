"use client";

import React, { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  X,
  ExternalLink,
  Award,
  ShieldCheck
} from "lucide-react";
import { Project } from "@/server/database/interfaces";
import Image from "next/image";
import Link from "next/link";
import { normalizeFileReference, normalizeFileReferences } from "@/utils/helpers";

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
      slug?: string;
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
  const normalizedPhotos = useMemo(() => {
    return project ? normalizeFileReferences(project.project_photos, 'Project Photo') : [];
  }, [project]);

  const beforePhoto = normalizedPhotos[0];
  const afterPhoto = project ? normalizeFileReference(project.after_photo, 'After Photo') : null;

  const hasBothPhotos = !!(beforePhoto?.url && afterPhoto?.url);
  const singlePhoto = beforePhoto || afterPhoto;
  const singlePhotoUrl = singlePhoto?.url || "/images/placeholder-image.png";

  const primaryCategory = project?.category && project.category.length > 0
    ? project.category[0]
    : (project?.project_type || "Renovation");

  const locationCity = project?.location?.city || "Vancouver";
  const locationProvince = project?.location?.province || "BC";

  const contractorName = project?.contractor?.contractor_profile?.business_name || project?.contractor?.full_name;
  const contractorPhoto = project?.contractor?.profile_photo || project?.contractor?.contractor_profile?.logo || "/assets/avatar.png";
  const contractorSlug = project?.contractor?.contractor_profile?.slug || project?.contractor?.id;

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-5xl max-h-[92vh] overflow-y-auto p-0 rounded-[2rem] border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0E0E10] shadow-2xl"
        showCloseButton={false}
      >
        {/* Sticky Header */}
        <DialogHeader className="p-5 sm:p-6 pb-3 border-b border-gray-100 dark:border-white/[0.06] sticky top-0 bg-white/95 dark:bg-[#0E0E10]/95 backdrop-blur-xl z-20">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 rounded-full">
                  {primaryCategory}
                </span>
                <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.15em] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {project.status || "Completed"}
                </span>
                <span className="px-2.5 py-0.5 text-[9px] font-bold text-gray-500 dark:text-gray-400 rounded-full bg-gray-100 dark:bg-white/5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-orange-500/80" />
                  {locationCity}, {locationProvince}
                </span>
              </div>

              <DialogTitle className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-snug">
                {project.project_title}
              </DialogTitle>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 flex-shrink-0 transition-colors"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Photo Presentation: Side-by-Side if both exist, single image if only one */}
          <div>
            {hasBothPhotos ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Before Image */}
                <div className="relative w-full h-[220px] sm:h-[260px] md:h-[290px] rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-[#0A0A0C] shadow-md flex items-center justify-center group/img">
                  <a
                    href={beforePhoto.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative w-full h-full flex items-center justify-center cursor-pointer"
                    title="Open before photo in new page"
                  >
                    <Image
                      src={beforePhoto.url}
                      alt={`${project.project_title} - Before`}
                      fill
                      priority
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-contain p-2 transition-transform duration-300 group-hover/img:scale-[1.01]"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/images/placeholder-image.png";
                      }}
                    />
                  </a>

                  {/* Before text on Top Left */}
                  <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                    <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full bg-black/75 text-white/90 border border-white/20 backdrop-blur-md shadow-sm">
                      Before
                    </span>
                  </div>

                  {/* Link on Bottom Right */}
                  <a
                    href={beforePhoto.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-orange-500 text-white border border-white/20 backdrop-blur-md transition-all duration-200 shadow-md hover:scale-110 flex items-center justify-center cursor-pointer"
                    title="Open before photo in new page"
                    aria-label="Open before photo in new page"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* After Image */}
                <div className="relative w-full h-[220px] sm:h-[260px] md:h-[290px] rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-[#0A0A0C] shadow-md flex items-center justify-center group/img">
                  <a
                    href={afterPhoto.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative w-full h-full flex items-center justify-center cursor-pointer"
                    title="Open after photo in new page"
                  >
                    <Image
                      src={afterPhoto.url}
                      alt={`${project.project_title} - After`}
                      fill
                      priority
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-contain p-2 transition-transform duration-300 group-hover/img:scale-[1.01]"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/images/placeholder-image.png";
                      }}
                    />
                  </a>

                  {/* After text on Top Left */}
                  <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                    <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full bg-orange-500 text-white backdrop-blur-md shadow-sm">
                      After
                    </span>
                  </div>

                  {/* Link on Bottom Right */}
                  <a
                    href={afterPhoto.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-orange-500 text-white border border-white/20 backdrop-blur-md transition-all duration-200 shadow-md hover:scale-110 flex items-center justify-center cursor-pointer"
                    title="Open after photo in new page"
                    aria-label="Open after photo in new page"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-[260px] sm:h-[320px] md:h-[350px] rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-[#0A0A0C] shadow-md flex items-center justify-center group/img">
                <a
                  href={singlePhotoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative w-full h-full flex items-center justify-center cursor-pointer"
                  title="Open image in new page"
                >
                  <Image
                    src={singlePhotoUrl}
                    alt={project.project_title || "Project photo"}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 1024px"
                    className="object-contain p-2.5 transition-transform duration-300 group-hover/img:scale-[1.01]"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/images/placeholder-image.png";
                    }}
                  />
                </a>

                {/* Link on Bottom Right */}
                <a
                  href={singlePhotoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-orange-500 text-white border border-white/20 backdrop-blur-md transition-all duration-200 shadow-md hover:scale-110 flex items-center justify-center cursor-pointer"
                  title="Open image in new page"
                  aria-label="Open image in new page"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* Statement of Work / Scope */}
          {project.statement_of_work && (
            <div className="space-y-1.5">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                Statement of Work & Execution Scope
              </h3>
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-normal bg-gray-50/70 dark:bg-white/[0.02] p-4 rounded-xl border border-gray-100 dark:border-white/[0.06]">
                {project.statement_of_work}
              </p>
            </div>
          )}

          {/* Key Specifications Grid */}
          <div className="space-y-1.5">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
              Project Parameters
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
              {/* Budget */}
              <div className="p-3 rounded-xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] space-y-0.5">
                <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 text-[9px] font-black uppercase tracking-[0.15em]">
                  <DollarSign className="w-3 h-3 text-orange-500" />
                  Budget
                </div>
                <p className="text-sm sm:text-base font-black text-gray-900 dark:text-white">
                  {formatBudget(project.budget)}
                </p>
              </div>

              {/* Type */}
              <div className="p-3 rounded-xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] space-y-0.5">
                <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 text-[9px] font-black uppercase tracking-[0.15em]">
                  <Building2 className="w-3 h-3 text-orange-500" />
                  Type
                </div>
                <p className="text-sm sm:text-base font-black text-gray-900 dark:text-white capitalize truncate">
                  {project.project_type?.replace(/_/g, ' ') || 'Renovation'}
                </p>
              </div>

              {/* Location */}
              <div className="p-3 rounded-xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] space-y-0.5">
                <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 text-[9px] font-black uppercase tracking-[0.15em]">
                  <MapPin className="w-3 h-3 text-orange-500" />
                  Market
                </div>
                <p className="text-sm sm:text-base font-black text-gray-900 dark:text-white truncate">
                  {locationCity}
                </p>
              </div>

              {/* Completion / Timeline */}
              <div className="p-3 rounded-xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] space-y-0.5">
                <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 text-[9px] font-black uppercase tracking-[0.15em]">
                  <Calendar className="w-3 h-3 text-orange-500" />
                  Completion
                </div>
                <p className="text-sm sm:text-base font-black text-gray-900 dark:text-white truncate">
                  {project.substantial_completion
                    ? formatDate(project.substantial_completion.toString())
                    : (project.end_date ? formatDate(project.end_date.toString()) : "Standard")}
                </p>
              </div>
            </div>
          </div>

          {/* Awarded Master Builder */}
          {project.contractor && (
            <div className="p-4 rounded-xl bg-orange-500/[0.03] border border-orange-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-orange-500" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400">
                    Awarded Master Builder
                  </span>
                </div>
                {project.contractor.contractor_profile?.work_guarantee && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 dark:text-gray-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    {project.contractor.contractor_profile.work_guarantee}-Year Guarantee
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-slate-900/10 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex-shrink-0">
                    <Image
                      src={contractorPhoto}
                      alt={contractorName || "Contractor"}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/assets/avatar.png";
                      }}
                    />
                  </div>
                  <div>
                    <h4 className="font-black text-sm sm:text-base text-gray-900 dark:text-white">
                      {contractorName}
                    </h4>
                    {project.contractor.contractor_profile?.trade_category && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {project.contractor.contractor_profile.trade_category.join(", ")}
                      </p>
                    )}
                  </div>
                </div>

                {contractorSlug && (
                  <Link
                    href={`/contractors/${contractorSlug}`}
                    target="_blank"
                    className="flex-shrink-0"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs font-bold gap-1.5 border-orange-500/30 hover:bg-orange-500/10 text-orange-600 dark:text-orange-400"
                    >
                      View Profile
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-gray-100 dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto rounded-full px-6 text-xs font-bold"
            >
              Close
            </Button>

            <Button
              onClick={() => {
                const targetSlug = project.slug || project.id;
                window.open(`/projects/${targetSlug}`, '_blank');
              }}
              className="w-full sm:w-auto rounded-full px-6 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white gap-2 shadow-sm"
            >
              Explore Full Project
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
