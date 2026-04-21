"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star, MapPin, Building2, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";
import { Project } from "@/server/database/interfaces";
import LoadingSpinner from "@/components/shared/loading-spinner";

interface RecentProjectWithContractor extends Omit<Project, 'homeowner'> {
  contractor?: {
    id: string;
    full_name: string;
    profile_photo?: string;
    contractor_profile?: any;
  };
  homeowner?: {
    id: string;
    full_name: string;
    profile_photo?: string;
  };
  averageRating?: number;
  reviewCount?: number;
}

export function RecentProjectsCarousel() {
  const [recentProjects, setRecentProjects] = useState<RecentProjectWithContractor[]>([]);
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsToShow, setCardsToShow] = useState(7);

  useEffect(() => {
    setIsClient(true);
    fetchRecentProjects();
  }, []);

  // Handle responsive design
  useEffect(() => {
    const handleResize = () => {
      setCardsToShow(window.innerWidth < 768 ? 1 : 7);
    };

    // Set initial value
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchRecentProjects = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/recent-projects');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch recent projects');
      }
      
      setRecentProjects(data.projects as unknown as RecentProjectWithContractor[]);
      
    } catch (error) {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    const maxIndex = Math.max(0, recentProjects.length - cardsToShow);
    setCurrentIndex((prev) => (prev + 1) % (maxIndex + 1));
  };

  const prevSlide = () => {
    const maxIndex = Math.max(0, recentProjects.length - cardsToShow);
    setCurrentIndex((prev) => (prev - 1 + maxIndex + 1) % (maxIndex + 1));
  };

  const formatBudget = (budget: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(budget);
  };

  const getProjectImage = (project: RecentProjectWithContractor) => {
    // Helper function to safely get image URL from various formats
    const getImageUrl = (imageData: any): string | null => {
      if (!imageData) return null;
      
      // If it's already a string
      if (typeof imageData === 'string' && imageData.trim() !== '') {
        return imageData;
      }
      
      // If it's an object with url property
      if (typeof imageData === 'object' && imageData.url && typeof imageData.url === 'string' && imageData.url.trim() !== '') {
        return imageData.url;
      }
      
      // If it's an object with src property
      if (typeof imageData === 'object' && imageData.src && typeof imageData.src === 'string' && imageData.src.trim() !== '') {
        return imageData.src;
      }
      
      return null;
    };

    // Check for valid after photo
    if (project.after_photo && Array.isArray(project.after_photo) && project.after_photo.length > 0) {
      const imageUrl = getImageUrl(project.after_photo[0]);
      if (imageUrl) return imageUrl;
    }
    
    // Check for valid project photos
    if (project.project_photos && Array.isArray(project.project_photos) && project.project_photos.length > 0) {
      const imageUrl = getImageUrl(project.project_photos[0]);
      if (imageUrl) return imageUrl;
    }
    
    return "/images/placeholder-image.png";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Open for Proposals":
        return <Clock className="w-3 h-3 text-white" />;
      case "Proposal Selected":
        return <CheckCircle className="w-3 h-3 text-white" />;
      case "Completed":
        return <Star className="w-3 h-3 text-white" />;
      default:
        return <Clock className="w-3 h-3 text-white" />;
    }
  };

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <section className="pt-2 pb-2 bg-white will-change-auto">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Recent Projects
            </h2>
          </div>
          
          <div className="flex items-center space-x-2">
            {recentProjects.length > 7 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevSlide}
                  className="w-8 h-8 p-0 rounded-full"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextSlide}
                  className="w-8 h-8 p-0 rounded-full"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}
            <Link href="/register?role=contractor">
              <Button
                variant="outline"
                size="sm"
                className="text-sm font-medium"
              >
                View All
              </Button>
            </Link>
          </div>
        </div>

        {recentProjects.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-500 mb-2">
                No recent projects available
              </p>
              <p className="text-gray-400">
                Check back later for new project listings
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Projects Carousel */}
            <div className="relative overflow-hidden">
              <div 
                className="flex transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * (100 / cardsToShow)}%)` }}
              >
                {recentProjects.map((project) => (
                  <div 
                    key={project.id} 
                    className="flex-shrink-0 px-2" 
                    style={{ width: `calc(100% / ${cardsToShow})` }}
                  >
                    {/* Clickable Container for both Image and Text */}
                    <Link href={`/recent-project-preview/${project.slug || project.id}`} className="cursor-pointer group block">
                      {/* Image Card */}
                      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 mb-3">
                        <div className="relative aspect-square overflow-hidden">
                          <Image
                            src={getProjectImage(project)}
                            alt={project.project_title || 'Project image'}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/images/placeholder-image.png";
                            }}
                          />
                          
                          {/* Status Badge */}
                          <div className="absolute top-3 left-3 bg-gray-500 text-white text-xs font-medium px-2 py-1 rounded-full shadow-sm flex items-center space-x-1">
                            {getStatusIcon(project.status)}
                            <span className="text-white">
                              {project.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Text Content Below Image */}
                      <div className="px-2">
                        <h3 className="font-semibold text-gray-900 text-xs line-clamp-1 mb-1">
                          {project.project_title}
                        </h3>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            {project.averageRating && project.averageRating > 0 ? (
                              <>
                                <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs font-medium">
                                  {project.averageRating}
                                </span>
                              </>
                            ) : (
                              <span className="text-xs text-gray-400">
                                No reviews
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-semibold text-gray-500">
                            {formatBudget(project.budget)}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

          </>
        )}
      </div>
    </section>
  );
}
