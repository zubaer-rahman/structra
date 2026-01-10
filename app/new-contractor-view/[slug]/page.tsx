"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  Star, 
  MapPin, 
  Calendar, 
  CheckCircle,
  Building2,
  Award,
  Shield,
  Mail,
  Phone,
  Wrench,
  Briefcase,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";
import { User, ContractorProfile } from "@/server/database/interfaces";
import LoadingSpinner from "@/components/shared/loading-spinner";
import { trpc } from "@/utils/trpc";
import GoogleMap from "@/components/shared/GoogleMap";
import Navbar from "@/components/shared/navbar";
import CompletedProjectCard from "@/components/features/contractor/CompletedProjectCard";

interface ContractorWithProfile extends Omit<User, 'contractor_profile'> {
  contractor_profile?: ContractorProfile;
  average_rating?: number;
  rating_count?: number;
  slug?: string;
}

interface Review {
  id: string;
  rating: number;
  text: string;
  created_at: string;
  author_user?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_photo?: string;
  };
  recommend_score?: number;
}

export default function ContractorViewPage() {
  const params = useParams();
  const contractorSlug = params.slug as string;
  
  const [contractor, setContractor] = useState<ContractorWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedProjects, setCompletedProjects] = useState<any[]>([]);
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0);

  // Fetch reviews using tRPC (public query - no auth required)
  const { data: reviewsData = [], isLoading: reviewsLoading } = trpc.reviews.getByContractorPublic.useQuery({
    contractorId: contractor?.id || '',
  }, {
    enabled: !!contractor?.id
  });

  // Transform reviews data to ensure author_user is a single object and limit to 3
  const reviews = reviewsData.slice(0, 3).map(review => ({
    ...review,
    author_user: Array.isArray(review.author_user) ? review.author_user[0] : review.author_user
  }));

  useEffect(() => {
    if (contractorSlug) {
      fetchContractor();
    }
  }, [contractorSlug]);

  // Fetch completed projects when contractor is available
  useEffect(() => {
    if (contractor?.id) {
      fetchCompletedProjects();
    }
  }, [contractor?.id]);

  const fetchCompletedProjects = async () => {
    try {
      const response = await fetch(`/api/reviews/contractor/${contractor?.id}`);
      if (response.ok) {
        const data = await response.json();
        // Filter and transform projects with photos and consent
        const projectsWithPhotos = data.reviews
          .filter((review: any) => 
            review.project?.photos?.before && review.project?.photos?.after
          )
          .map((review: any) => ({
            id: review.project.id,
            project_title: review.project.project_title,
            photos: review.project.photos,
            rating: review.rating,
            text: review.text,
            created_at: review.created_at,
            author_user: review.author_user
          }));
        setCompletedProjects(projectsWithPhotos);
      }
    } catch (error) {
      console.error('Error fetching completed projects:', error);
    }
  };

  const fetchContractor = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Fetch contractor details by slug
      const { data: contractorData, error: contractorError } = await supabase
        .from("contractor_profiles")
        .select(`
          *,
          users!user_id (
            id,
            full_name,
            first_name,
            last_name,
            email,
            phone_number,
            address,
            profile_photo,
            user_role,
            is_verified_contractor,
            is_active,
            created_at
          )
        `)
        .eq("slug", contractorSlug)
        .single();

      if (contractorError) {
        console.error("Error fetching contractor:", contractorError);
        return;
      }

      // Transform data to match expected structure
      const transformedData = {
        ...contractorData.users,
        created_at: contractorData.created_at,
        contractor_profile: contractorData,
        slug: contractorData.slug,
      };

      setContractor(transformedData as unknown as ContractorWithProfile);
    } catch (error) {
      console.error("Error fetching contractor:", error);
    } finally {
      setLoading(false);
    }
  };

  const getContractorImage = (contractor: ContractorWithProfile) => {
    // Priority: profile photo > company logo > portfolio image > placeholder
    if (contractor.profile_photo && 
        typeof contractor.profile_photo === 'string' && 
        contractor.profile_photo.trim() !== "") {
      return contractor.profile_photo;
    }
    
    if (contractor.contractor_profile?.logo && 
        typeof contractor.contractor_profile.logo === 'string' && 
        contractor.contractor_profile.logo.trim() !== "") {
      return contractor.contractor_profile.logo;
    }
    
    if (contractor.contractor_profile?.portfolio && Array.isArray(contractor.contractor_profile.portfolio)) {
      const portfolioImage = contractor.contractor_profile.portfolio.find(photo => {
        return typeof photo === 'string' && photo.trim() !== '';
      });
      
      if (portfolioImage) {
        return portfolioImage;
      }
    }
    
    // Check portfolio_file for file references
    if (contractor.contractor_profile?.portfolio_file && Array.isArray(contractor.contractor_profile.portfolio_file)) {
      const portfolioFileImage = contractor.contractor_profile.portfolio_file.find(photo => {
        return photo && typeof photo === 'object' && photo.url && photo.url.trim() !== '';
      });
      
      if (portfolioFileImage) {
        return portfolioFileImage.url;
      }
    }
    
    return "/images/placeholder-image.png";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const getAverageRating = () => {
    if (!reviews || reviews.length === 0) return "No reviews";
    return (reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1);
  };

  const nextProject = () => {
    const maxIndex = Math.max(0, Math.min(completedProjects.length - 1, 5)); // Max 6 items (0-5)
    setCurrentProjectIndex((prev) => (prev + 1) % (maxIndex + 1));
  };

  const prevProject = () => {
    const maxIndex = Math.max(0, Math.min(completedProjects.length - 1, 5)); // Max 6 items (0-5)
    setCurrentProjectIndex((prev) => (prev - 1 + maxIndex + 1) % (maxIndex + 1));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!contractor) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Contractor Not Found</h1>
          <Link href="/new-landing">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const mainImage = getContractorImage(contractor);

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
            {contractor.contractor_profile?.business_name || contractor.full_name}
          </span>
        </nav>
        {/* Single Image Section - Centered */}
        <div className="mb-8">
          <div className="flex justify-center">
            <div className="relative w-full max-w-md h-80 rounded-2xl overflow-hidden">
              <Image
                src={mainImage}
                alt={contractor.contractor_profile?.business_name || contractor.full_name}
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Contractor Details */}
          <div className="lg:col-span-2">
            {/* Contractor Information */}
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {contractor.contractor_profile?.business_name || contractor.full_name}
                    </h1>
                    {/* Address hidden from public view */}
                    {/* <div className="flex items-center text-gray-600 mb-4">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{contractor.contractor_profile?.service_location || contractor.address || 'Location not specified'}</span>
                    </div> */}
                  </div>
                  
                </div>
                
                <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Wrench className="w-4 h-4 mr-1" />
                    <span>{contractor.contractor_profile?.trade_category?.join(', ') || 'General Contractor'}</span>
                  </div>
                  <div className="flex items-center">
                    <Building2 className="w-4 h-4 mr-1" />
                    <span>{contractor.contractor_profile?.legal_entity_type || 'Business'}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>Member since {formatDate(contractor.created_at)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="ml-1 font-medium">{getAverageRating()}</span>
                  </div>
                  <span className="text-gray-600">·</span>
                  <span className="text-gray-600">{reviews.length} reviews</span>
                </div>
              </div>

              {/* About Section */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">About {contractor.contractor_profile?.business_name || contractor.full_name}</h3>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    {contractor.contractor_profile?.bio || 'No bio available for this contractor.'}
                  </p>
                </div>
              </div>

              {/* Services & Specialties */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Services & Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {contractor.contractor_profile?.trade_category?.map((trade, index) => (
                    <span 
                      key={index}
                      className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
                    >
                      {trade}
                    </span>
                  )) || (
                    <span className="text-gray-500">No specialties listed</span>
                  )}
                </div>
              </div>

              {/* Business Information */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Business Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Business Name</span>
                      <span className="font-medium">{contractor.contractor_profile?.business_name || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Legal Entity</span>
                      <span className="font-medium">{contractor.contractor_profile?.legal_entity_type || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Service Area</span>
                      <span className="font-medium">{contractor.contractor_profile?.service_location || 'Not specified'}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">GST/HST Number</span>
                      <span className="font-medium">{contractor.contractor_profile?.gst_hst_number || 'Not provided'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">WCB Number</span>
                      <span className="font-medium">{contractor.contractor_profile?.wcb_number || 'Not provided'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Work Guarantee</span>
                      <span className="font-medium">
                        {contractor.contractor_profile?.work_guarantee ? 
                          `${contractor.contractor_profile.work_guarantee} months` : 
                          'Not specified'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Insurance Information */}
              {(contractor.contractor_profile?.insurance_general_liability || contractor.contractor_profile?.insurance_builders_risk) && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Insurance Coverage</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contractor.contractor_profile?.insurance_general_liability && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">General Liability</span>
                        <span className="font-medium">
                          ${contractor.contractor_profile.insurance_general_liability.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {contractor.contractor_profile?.insurance_builders_risk && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Builder's Risk</span>
                        <span className="font-medium">
                          ${contractor.contractor_profile.insurance_builders_risk.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {contractor.contractor_profile?.insurance_expiry && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Expiry Date</span>
                        <span className="font-medium">
                          {formatDate(contractor.contractor_profile.insurance_expiry)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Reviews Section */}
              {reviews && reviews.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">Reviews</h3>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="ml-1 text-lg font-semibold">
                          {getAverageRating()}
                        </span>
                      </div>
                      <span className="text-gray-600">·</span>
                      <span className="text-gray-600">{reviews.length} reviews</span>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="flex space-x-4">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                          <Image
                            src={review.author_user?.profile_photo || "/images/placeholder-image.png"}
                            alt={review.author_user?.first_name + ' ' + review.author_user?.last_name || 'Reviewer'}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold text-gray-900">
                              {review.author_user?.first_name} {review.author_user?.last_name}
                            </h4>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating 
                                      ? 'fill-yellow-400 text-yellow-400' 
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">
                              {formatDate(review.created_at)}
                            </span>
                          </div>
                          <p className="text-gray-700 leading-relaxed">{review.text}</p>
                          {review.recommend_score && (
                            <div className="mt-2 text-sm text-gray-600">
                              Recommendation Score: {review.recommend_score}/10
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Projects */}
              {completedProjects.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">Completed Projects</h3>
                    {completedProjects.length > 1 && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={prevProject}
                          className="w-8 h-8 p-0 rounded-full"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={nextProject}
                          className="w-8 h-8 p-0 rounded-full"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="relative overflow-hidden">
                    <div 
                      className="flex transition-transform duration-300 ease-in-out"
                      style={{ 
                        transform: `translateX(-${currentProjectIndex * (100 / 3)}%)`,
                        width: `${Math.min(completedProjects.length, 3) * 100}%`
                      }}
                    >
                      {completedProjects.slice(0, 6).map((project, index) => (
                        <div 
                          key={project.id} 
                          className="flex-shrink-0 px-2" 
                          style={{ width: `${100 / 3}%` }}
                        >
                          <CompletedProjectCard project={project} />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Project indicators */}
                  {completedProjects.length > 1 && (
                    <div className="flex items-center justify-center mt-4 space-x-2">
                      {Array.from({ length: Math.min(completedProjects.length, 6) }).map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentProjectIndex(index)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentProjectIndex ? 'bg-orange-500' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Map View */}
              {contractor.contractor_profile?.address && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Service Location</h3>
                  <GoogleMap
                    location={{
                      latitude: contractor.contractor_profile.address.latitude || 0,
                      longitude: contractor.contractor_profile.address.longitude || 0,
                      address: contractor.contractor_profile.address.address,
                      city: contractor.contractor_profile.address.city || 'Unknown',
                      province: contractor.contractor_profile.address.province || 'Unknown',
                      postalCode: contractor.contractor_profile.address.postalCode || 'Unknown'
                    }}
                    height="400px"
                    title={contractor.contractor_profile.business_name || contractor.full_name}
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
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-gray-200">
                    <Image
                      src={contractor.profile_photo || contractor.contractor_profile?.logo || "/images/placeholder-image.png"}
                      alt={contractor.contractor_profile?.business_name || contractor.full_name}
                      width={80}
                      height={80}
                      className="object-cover"
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {contractor.contractor_profile?.business_name || contractor.full_name}
                  </h3>
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{getAverageRating()}</span>
                    <span className="text-gray-600">·</span>
                    <span className="text-gray-600">{reviews.length} reviews</span>
                  </div>
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
                      <div className="font-medium text-gray-900">Back to Home</div>
                      <div className="text-sm text-gray-600">View all contractors</div>
                    </div>
                  </Link>

                  <Link href="/search" className="flex items-center p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-orange-100 transition-colors">
                      <Building2 className="w-5 h-5 text-gray-600 group-hover:text-orange-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Browse More</div>
                      <div className="text-sm text-gray-600">Discover similar contractors</div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Contractor Stats */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contractor Details</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Location</span>
                    <span className="text-gray-900 font-medium text-right max-w-32 truncate">
                      {contractor.contractor_profile?.service_location || contractor.address || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Reviews</span>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="font-medium">{getAverageRating()}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Member Since</span>
                    <span className="text-gray-900 font-medium">
                      {formatDate(contractor.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Trade Category</span>
                    <span className="text-gray-900 font-medium text-right max-w-32 truncate">
                      {contractor.contractor_profile?.trade_category?.join(', ') || 'General'}
                    </span>
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
