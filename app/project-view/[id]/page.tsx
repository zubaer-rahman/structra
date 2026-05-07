"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowLeft, 
  Share2, 
  Heart, 
  Star, 
  MapPin, 
  Calendar, 
  DollarSign,
  User,
  Phone,
  Mail,
  ChevronRight,
  Grid3X3,
  CheckCircle,
  Clock,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";
import { Project } from "@/server/database/interfaces";
import LoadingSpinner from "@/components/shared/loading-spinner";
import { Navbar } from "@/components/shared";

interface ProjectWithContractor extends Omit<Project, 'homeowner'> {
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
}

export default function ProjectViewPage() {
  const params = useParams();
  const projectSlug = params.id as string;
  
  const [project, setProject] = useState<ProjectWithContractor | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    if (projectSlug) {
      fetchProject();
    }
  }, [projectSlug]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Fetch project details by slug
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select(`
          *,
          homeowner:users!creator(
            id,
            full_name,
            profile_photo
          )
        `)
        .eq("slug", projectSlug)
        .single();

      if (projectError) {
        console.error("Error fetching project:", projectError);
        return;
      }

      // Get contractor data if project has a selected proposal
      const { data: proposal } = await supabase
        .from("proposals")
        .select("contractor")
        .eq("project", projectData.id)
        .eq("is_selected", "yes")
        .single();

      let contractor = null;
      if (proposal?.contractor) {
        const { data: contractorData } = await supabase
          .from("users")
          .select(`
            id,
            full_name,
            profile_photo,
            contractor_profile(*)
          `)
          .eq("id", proposal.contractor)
          .single();
        
        contractor = contractorData;
      }

      setProject({
        ...projectData,
        contractor
      });

      // Fetch reviews for this project
      await fetchReviews(projectData.id);
    } catch (error) {
      console.error("Error fetching project:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (projectId: string) => {
    try {
      setReviewsLoading(true);
      const supabase = createClient();
      
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select(`
          id,
          rating,
          text,
          recommend_score,
          created_at,
          author_user:author(id, first_name, last_name, profile_photo),
          recipient_user:recipient(id, first_name, last_name, profile_photo)
        `)
        .eq("project", projectId)
        .eq("is_verified", "yes")
        .order("created_at", { ascending: false });

      if (reviewsError) {
        console.error("Error fetching reviews:", reviewsError);
        return;
      }

      setReviews(reviewsData || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const getProjectImages = (project: ProjectWithContractor) => {
    const images: string[] = [];
    
    // Add after photos
    if (project.after_photo && Array.isArray(project.after_photo)) {
      project.after_photo.forEach((photo: any) => {
        if (typeof photo === 'string' && photo.trim() !== '') {
          images.push(photo);
        } else if (typeof photo === 'object' && photo.url) {
          images.push(photo.url);
        }
      });
    }
    
    // Add project photos
    if (project.project_photos && Array.isArray(project.project_photos)) {
      project.project_photos.forEach((photo: any) => {
        if (typeof photo === 'string' && photo.trim() !== '') {
          images.push(photo);
        } else if (typeof photo === 'object' && photo.url) {
          images.push(photo.url);
        }
      });
    }
    
    return images.length > 0 ? images : ["/images/placeholder-image.png"];
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
      month: "long",
      day: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] pt-16">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] pt-16 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Project Not Found</h1>
            <Link href="/new-landing">
              <Button>Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const images = getProjectImages(project);
  const mainImage = images[currentImageIndex] || "/images/placeholder-image.png";

  return (
    <div className="min-h-screen bg-white">
      <Navbar backUrl="/new-landing" backText="Back" />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        {/* Project Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
          <h1 className="text-xl font-semibold text-gray-900 truncate">
            {project.project_title}
          </h1>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-gray-600">
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`flex items-center space-x-2 ${
                isFavorited ? 'text-red-500 hover:text-red-600' : 'text-gray-600'
              }`}
              onClick={() => setIsFavorited(!isFavorited)}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">Save</span>
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Project Details */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-96">
                {/* Main Image */}
                <div className="md:col-span-3 relative overflow-hidden rounded-2xl">
                  <Image
                    src={mainImage}
                    alt={project.project_title}
                    fill
                    className="object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                    onClick={() => setCurrentImageIndex((currentImageIndex + 1) % images.length)}
                  />
                </div>
                
                {/* Thumbnail Grid */}
                <div className="md:col-span-1 grid grid-rows-4 gap-2">
                  {images.slice(0, 4).map((image, index) => (
                    <div 
                      key={index}
                      className={`relative overflow-hidden rounded-lg cursor-pointer ${
                        index === currentImageIndex ? 'ring-2 ring-orange-500' : ''
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    >
                      <Image
                        src={image}
                        alt={`${project.project_title} ${index + 1}`}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                  {images.length > 4 && (
                    <div className="relative overflow-hidden rounded-lg cursor-pointer bg-gray-100 flex items-center justify-center">
                      <div className="text-center">
                        <Grid3X3 className="w-6 h-6 text-gray-600 mx-auto mb-1" />
                        <span className="text-xs text-gray-600">Show all {images.length} photos</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Project Information */}
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {project.project_title}
                </h1>
                <div className="flex items-center text-gray-600 mb-4">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{project.location?.address || 'Location not specified'}</span>
                </div>
                
                <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    <span>{formatBudget(project.budget)}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>{project.project_type}</span>
                  </div>
                  <div className="flex items-center">
                    <Building2 className="w-4 h-4 mr-1" />
                    <span>{project.category}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="ml-1 font-medium">
                      {reviewsLoading ? 'Loading...' : 
                       reviews.length > 0 ? 
                         (reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1) : 
                         'No reviews'
                      }
                    </span>
                  </div>
                  <span className="text-gray-600">·</span>
                  <span className="text-gray-600">Completed project</span>
                </div>
              </div>

              {/* Contractor Information */}
              {project.contractor && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Contractor</h3>
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                      <Image
                        src={project.contractor.profile_photo || "/images/placeholder-image.png"}
                        alt={project.contractor.full_name}
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {project.contractor.contractor_profile?.business_name || project.contractor.full_name}
                      </h4>
                      <p className="text-gray-600 text-sm">
                        {project.contractor.contractor_profile?.trade_category || 'General Contractor'}
                      </p>
                      <div className="flex items-center mt-2">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="ml-1 text-sm font-medium">4.8</span>
                        </div>
                        <span className="mx-2 text-gray-400">·</span>
                        <span className="text-sm text-gray-600">Verified contractor</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Project Description */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">About this project</h3>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    {project.statement_of_work || 'No description available for this project.'}
                  </p>
                </div>
              </div>

              {/* Project Timeline */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Project Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Start Date</span>
                    <span className="font-medium">
                      {project.start_date ? formatDate(project.start_date.toString()) : 'Not specified'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Completion Date</span>
                    <span className="font-medium">
                      {project.substantial_completion ? formatDate(project.substantial_completion.toString()) : 'Not specified'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className="flex items-center text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {project.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Action Widget */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="text-center mb-6">
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {formatBudget(project.budget)}
                  </div>
                  <div className="text-gray-600">Project Budget</div>
                </div>

                <div className="space-y-4">
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                    Contact Contractor
                  </Button>
                  
                  <Button variant="outline" className="w-full">
                    Request Similar Quote
                  </Button>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="text-center text-sm text-gray-600">
                    <p className="mb-2">Interested in a similar project?</p>
                    <p>Get quotes from verified contractors in your area.</p>
                  </div>
                </div>

                <div className="mt-6">
                  <Link href="/new-landing" className="text-sm text-gray-500 hover:text-gray-700">
                    Report this project
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
