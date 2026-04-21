"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  Star, 
  MapPin, 
  Calendar, 
  DollarSign,
  ChevronRight,
  Grid3X3,
  CheckCircle,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";
import { Project } from "@/server/database/interfaces";
import LoadingSpinner from "@/components/shared/loading-spinner";
import { trpc } from "@/utils/trpc";
import GoogleMap from "@/components/shared/GoogleMap";
import SiteAmenitiesDisplay from "@/components/features/projects/SiteAmenitiesDisplay";
import Navbar from "@/components/shared/navbar";

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

  // Fetch contractor reviews (reviews about the contractor across all projects)
  const { data: contractorReviewsData = [], isLoading: contractorReviewsLoading, error: contractorReviewsError } = trpc.reviews.getByContractorPublic.useQuery({
    contractorId: project?.contractor?.id || '',
  }, {
    enabled: !!project?.contractor?.id
  });

  // Transform contractor reviews data to ensure author_user is a single object
  const contractorReviews = contractorReviewsData.map(review => ({
    ...review,
    author_user: Array.isArray(review.author_user) ? review.author_user[0] : review.author_user
  }));

  // Debug logging for reviews
  useEffect(() => {
    if (project?.id) {
      console.log('🔍 Reviews Debug:', {
        projectId: project.id,
        contractorReviews,
        contractorReviewsLoading,
        contractorReviewsError,
        contractorReviewsCount: contractorReviews?.length || 0
      });
    }
  }, [project?.id, contractorReviews, contractorReviewsLoading, contractorReviewsError]);


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
          *
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
    } catch (error) {
      console.error("Error fetching project:", error);
    } finally {
      setLoading(false);
    }
  };

  const getProjectImages = (project: ProjectWithContractor) => {
    const images = [];
    
    // Add after photos
    if (project.after_photo && Array.isArray(project.after_photo)) {
      project.after_photo.forEach(photo => {
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
    
    // If no images, use placeholder
    if (images.length === 0) {
      images.push("/images/placeholder-image.png");
    }
    
    // Ensure we have exactly 5 images (1 main + 4 thumbnails)
    const targetImages = [];
    for (let i = 0; i < 5; i++) {
      if (i < images.length) {
        // Use existing image
        targetImages.push(images[i]);
      } else {
        // Duplicate from existing images
        targetImages.push(images[i % images.length]);
      }
    }
    
    return targetImages;
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Project Not Found</h1>
          <Link href="/new-landing">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const images = getProjectImages(project);
  const mainImage = images[currentImageIndex] || "/images/placeholder-image.png";

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm mb-6">
          <Link href="/new-landing" className="text-gray-500 hover:text-gray-700">
            Home
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900 font-medium truncate">
            {project.project_title}
          </span>
        </nav>
        {/* Images Section - Full Width */}
        <div className="mb-8">
          {/* Image Gallery */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-[500px]">
              {/* Main Image - Takes 50% width */}
              <div className="relative overflow-hidden rounded-2xl">
                <Image
                  src={mainImage}
                  alt={project.project_title}
                  fill
                  className="object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                  onClick={() => setCurrentImageIndex((currentImageIndex + 1) % images.length)}
                />
              </div>
              
              {/* Thumbnail Grid - 2x2 layout with 4 images */}
              <div className="grid grid-rows-2 grid-cols-2 gap-2">
                {images.slice(1, 5).map((image, index) => (
                  <div 
                    key={index + 1}
                    className={`relative overflow-hidden rounded-lg cursor-pointer ${
                      (index + 1) === currentImageIndex ? 'ring-2 ring-orange-500' : ''
                    }`}
                    onClick={() => setCurrentImageIndex(index + 1)}
                  >
                    <Image
                      src={image}
                      alt={`${project.project_title} ${index + 2}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Project Details */}
          <div className="lg:col-span-2">
            {/* Project Information */}
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {project.project_title}
                </h1>
                <div className="flex items-center text-gray-600 mb-4">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>
                    {project.location?.city && project.location?.province 
                      ? `${project.location.city}, ${project.location.province}`
                      : 'Location not specified'
                    }
                  </span>
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
                  <span className="text-gray-600">Completed project</span>
                </div>
              </div>

              {/* Contractor Information */}
              {project.contractor && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">Contractor</h3>
                    <p className="text-sm text-gray-600 mt-1">Overall rating from all projects</p>
                  </div>
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
                          <span className="ml-1 text-sm font-medium">
                            {contractorReviewsLoading ? 'Loading...' : 
                             contractorReviews.length > 0 ? 
                               (contractorReviews.reduce((acc, review) => acc + review.rating, 0) / contractorReviews.length).toFixed(1) : 
                               'No reviews'
                            }
                          </span>
                        </div>
                        <span className="mx-2 text-gray-400">·</span>
                        <span className="text-sm text-gray-600">Verified contractor</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Rated by homeowners across all projects</p>
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

              {/* Site Amenities */}
              {project.site_amenities && (
                <div className="border-t border-gray-200 pt-6">
                  <SiteAmenitiesDisplay 
                    amenities={project.site_amenities || {
                      power: [],
                      sanitation: [],
                      water: [],
                      parking: [],
                      comfort: [],
                      safety: [],
                      security: [],
                      logistics: []
                    }}
                    className=""
                  />
                </div>
              )}


              {/* Map View */}
              {project.location && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Project Location</h3>
                  <GoogleMap
                    location={{
                      latitude: project.location.latitude,
                      longitude: project.location.longitude,
                      address: project.location.address,
                      city: project.location.city || 'Unknown',
                      province: project.location.province || 'Unknown',
                      postalCode: project.location.postalCode || 'Unknown'
                    }}
                    height="400px"
                    title={project.project_title}
                    className="rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Action Widget */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Action Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Get Started</h3>
                  <p className="text-sm text-gray-600">Join our platform to connect and build</p>
                </div>

                <div className="flex flex-col gap-4">
                  <Link href="/register?role=contractor">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white h-11 font-medium rounded-lg">
                      Join as Contractor
                    </Button>
                  </Link>
                  
                  <Link href="/register?role=homeowner">
                    <Button variant="outline" className="w-full h-11 font-medium rounded-lg border-gray-300 text-gray-700 hover:bg-gray-50">
                      Start Your Project
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link href="/new-landing" className="flex items-center p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-orange-100 transition-colors">
                      <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-orange-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Back to Projects</div>
                      <div className="text-sm text-gray-600">View all projects</div>
                    </div>
                  </Link>

                  <Link href="/search" className="flex items-center p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-orange-100 transition-colors">
                      <Building2 className="w-5 h-5 text-gray-600 group-hover:text-orange-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Browse More</div>
                      <div className="text-sm text-gray-600">Discover similar projects</div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Project Stats */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className="flex items-center text-green-600 font-medium">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {project.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Location</span>
                    <span className="text-gray-900 font-medium text-right max-w-32 truncate">
                      {project.location?.city || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-gray-600">Contractor Rating</span>
                      <p className="text-xs text-gray-500">From all projects</p>
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="font-medium">
                        {contractorReviewsLoading ? '...' : 
                         contractorReviews.length > 0 ? 
                           (contractorReviews.reduce((acc, review) => acc + review.rating, 0) / contractorReviews.length).toFixed(1) : 
                           'No reviews'
                        }
                      </span>
                    </div>
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
