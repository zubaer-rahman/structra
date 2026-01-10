"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  MapPin, 
  Calendar, 
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";
import { Project } from "@/server/database/interfaces";
import LoadingSpinner from "@/components/shared/loading-spinner";
import Navbar from "@/components/shared/navbar";

interface BlurredProject {
  id: string;
  project_title: string;
  statement_of_work: string;
  budget: number;
  category: string[];
  location: {
    city: string;
    province: string;
    address: string;
    latitude?: number;
    longitude?: number;
  };
  project_type: string;
  status: string;
  start_date: string;
  end_date: string;
  project_photos: any[];
  slug?: string;
  creator: string;
  created_at: string;
  homeowner?: {
    id: string;
    full_name: string;
    profile_photo?: string;
  };
}

interface BlurredProjectGalleryProps {
  projectSlug: string;
}

export default function BlurredProjectGallery({ projectSlug }: BlurredProjectGalleryProps) {
  const [project, setProject] = useState<BlurredProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showOneImage, setShowOneImage] = useState(false);

  useEffect(() => {
    if (projectSlug) {
      fetchProject();
    }
  }, [projectSlug]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // First try to fetch by slug
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select(`
          id,
          project_title,
          statement_of_work,
          budget,
          category,
          location,
          project_type,
          status,
          start_date,
          end_date,
          project_photos,
          slug,
          creator,
          created_at,
          homeowner:users!creator(
            id,
            full_name,
            profile_photo
          )
        `)
        .eq("slug", projectSlug)
        .single();

      if (projectError) {
        // If slug not found, check if the projectSlug is actually a UUID and try to fetch by ID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        if (uuidRegex.test(projectSlug)) {
          const { data: projectById, error: errorById } = await supabase
            .from("projects")
            .select(`
              id,
              project_title,
              statement_of_work,
              budget,
              category,
              location,
              project_type,
              status,
              start_date,
              end_date,
              project_photos,
              slug,
              creator,
              created_at,
              homeowner:users!creator(
                id,
                full_name,
                profile_photo
              )
            `)
            .eq("id", projectSlug)
            .single();

          if (errorById) {
            setProject(null);
            return;
          }

          // Transform the data to match our interface
          const transformedProject: BlurredProject = {
            ...projectById,
            homeowner: Array.isArray(projectById.homeowner) 
              ? projectById.homeowner[0] 
              : projectById.homeowner
          };

          setProject(transformedProject);
          return;
        }
        
        // If it's not a UUID either, set project to null
        setProject(null);
        return;
      }

      // Transform the data to match our interface
      const transformedProject: BlurredProject = {
        ...projectData,
        homeowner: Array.isArray(projectData.homeowner) 
          ? projectData.homeowner[0] 
          : projectData.homeowner
      };

      setProject(transformedProject);
    } catch (error) {
      console.error("Error fetching project:", error);
      setProject(null);
    } finally {
      setLoading(false);
    }
  };

  const getProjectImages = () => {
    if (!project) return [];
    
    const images = [];
    
    // Add project photos
    if (project.project_photos && Array.isArray(project.project_photos)) {
      project.project_photos.forEach(photo => {
        if (typeof photo === 'string' && photo.trim() !== '') {
          images.push(photo);
        } else if (typeof photo === 'object' && photo.url) {
          images.push(photo.url);
        }
      });
    }
    
    // If no project photos, use placeholder
    if (images.length === 0) {
      images.push("/images/placeholder-image.png");
    }
    
    return images;
  };

  const nextImage = () => {
    const images = getProjectImages();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    const images = getProjectImages();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const formatBudget = (budget: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(budget);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getLocationDisplay = () => {
    if (!project?.location) return "Location not specified";
    
    const { city, province } = project.location;
    if (city && province) {
      return `${city}, ${province}`;
    } else if (city) {
      return city;
    } else if (province) {
      return province;
    }
    return "Location not specified";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h2>
            <p className="text-gray-600">The project you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
      </div>
    );
  }

  const images = getProjectImages();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="pt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900 line-clamp-2">
                {project.project_title}
              </h1>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Lock className="w-4 h-4" />
                <span>Limited Preview</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>{getLocationDisplay()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Posted {formatDate(project.created_at)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <DollarSign className="w-4 h-4" />
                <span className="font-semibold">{formatBudget(project.budget)}</span>
              </div>
            </div>
          </div>

          {/* Image Gallery */}
          <div className="mb-8">
            <div className="relative bg-gray-100 rounded-2xl overflow-hidden">
              <div className="relative aspect-video">
                {images.length > 0 ? (
                  <>
                    <Image
                      src={images[currentImageIndex]}
                      alt={project.project_title || 'Project image'}
                      fill
                      className={`object-cover transition-all duration-300 ${
                        showOneImage ? 'blur-none' : 'blur-sm'
                      }`}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/images/placeholder-image.png";
                      }}
                    />
                    
                    {/* Blur overlay for all images except the first one */}
                    {!showOneImage && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="text-center text-white">
                          <Lock className="w-12 h-12 mx-auto mb-4 opacity-80" />
                          <p className="text-lg font-medium mb-2">Limited Preview</p>
                          <p className="text-sm opacity-90">
                            Sign up as a contractor to view full project details
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Navigation arrows */}
                    {images.length > 1 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    
                    {/* Image counter */}
                    <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-200">
                    <div className="text-center text-gray-500">
                      <Lock className="w-12 h-12 mx-auto mb-4" />
                      <p>No images available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Limited Project Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Overview</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Project Type</h4>
                    <p className="text-gray-600">{project.project_type}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Categories</h4>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(project.category) ? (
                        project.category.map((cat, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                          >
                            {cat}
                          </span>
                        ))
                      ) : (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                          {project.category}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Timeline</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Start: {formatDate(project.start_date)}</span>
                      <span>End: {formatDate(project.end_date)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Blurred Description */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Description</h3>
                <div className="relative">
                  <p className="text-gray-600 line-clamp-3 blur-sm">
                    {project.statement_of_work}
                  </p>
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent flex items-end justify-center pt-8">
                    <div className="text-center">
                      <Lock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500">
                        Full description available to verified contractors
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* CTA Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Interested in this project?
                </h3>
                <p className="text-gray-600 text-sm mb-6">
                  Sign up as a verified contractor to view full project details, submit proposals, and connect with homeowners.
                </p>
                <div className="flex flex-col gap-6">
                  <Link href="/register?role=contractor">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Sign Up as Contractor
                    </Button>
                  </Link>
                  <Link href="/search">
                    <Button variant="outline" className="w-full">
                      Search More
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Project Stats */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className="font-medium text-green-600">{project.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Budget</span>
                    <span className="font-medium">{formatBudget(project.budget)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location</span>
                    <span className="font-medium text-right">{getLocationDisplay()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
