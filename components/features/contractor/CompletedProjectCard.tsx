"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Calendar } from "lucide-react";
import Image from "next/image";

interface ProjectPhotos {
  before: {
    id: string;
    filename: string;
    url: string;
    size?: number;
    mimeType?: string;
    uploadedAt?: Date;
  } | null;
  after: {
    id: string;
    filename: string;
    url: string;
    size?: number;
    mimeType?: string;
    uploadedAt?: Date;
  } | null;
}

interface CompletedProject {
  id: string;
  project_title: string;
  photos: ProjectPhotos | null;
  rating: number;
  text: string;
  created_at: string;
  author_user: {
    id: string;
    full_name: string;
    profile_photo?: string;
  };
}

interface CompletedProjectCardProps {
  project: CompletedProject;
}

export default function CompletedProjectCard({ project }: CompletedProjectCardProps) {
  const [imageError, setImageError] = useState<{ before?: boolean; after?: boolean }>({});

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const hasPhotos = project.photos?.before && project.photos?.after;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 bg-white dark:bg-[#141414] border-neutral-200 dark:border-white/10">
      <CardContent className="p-0">
        {/* Project Title and Rating */}
        <div className="p-4 border-b border-neutral-100 dark:border-white/10">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-neutral-900 dark:text-white text-lg leading-tight">
              {project.project_title}
            </h3>
            <div className="flex items-center gap-1 ml-2">
              {renderStars(project.rating)}
            </div>
          </div>
          
          {/* Review Info */}
          <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(project.created_at)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{project.rating}/5</span>
            </div>
          </div>
        </div>

        {/* Before/After Photos */}
        {hasPhotos && (
          <div className="p-4">
            <div className="mb-3">
              <h4 className="font-medium text-neutral-900 dark:text-white">Project Photos</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Before Photo */}
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 text-center uppercase tracking-wider">Before</h5>
                <div className="relative aspect-square rounded-lg overflow-hidden bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10">
                  <Image
                    src={project.photos?.before?.url || '/images/placeholder-image.png'}
                    alt={`Before photo for ${project.project_title}`}
                    fill
                    className="object-cover"
                    onError={() => setImageError(prev => ({ ...prev, before: true }))}
                  />
                  {imageError.before && (
                    <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800">
                      <span className="text-neutral-500 text-xs">Image unavailable</span>
                    </div>
                  )}
                </div>
              </div>

              {/* After Photo */}
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 text-center uppercase tracking-wider">After</h5>
                <div className="relative aspect-square rounded-lg overflow-hidden bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10">
                  <Image
                    src={project.photos?.after?.url || '/images/placeholder-image.png'}
                    alt={`After photo for ${project.project_title}`}
                    fill
                    className="object-cover"
                    onError={() => setImageError(prev => ({ ...prev, after: true }))}
                  />
                  {imageError.after && (
                    <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800">
                      <span className="text-neutral-500 text-xs">Image unavailable</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Review Text */}
        <div className="p-4 pt-0">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-100 dark:bg-white/10 flex-shrink-0 border border-neutral-200 dark:border-white/10">
              <Image
                src={project.author_user?.profile_photo || '/images/placeholder-image.png'}
                alt={project.author_user?.full_name || 'Reviewer'}
                width={32}
                height={32}
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <p className="text-neutral-700 dark:text-neutral-300 text-sm leading-relaxed italic">
                &ldquo;{project.text}&rdquo;
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 font-medium">
                — {project.author_user?.full_name}
              </p>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
