"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star, MapPin, Award, CheckCircle, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";
import { User, ContractorProfile } from "@/server/database/interfaces";
import LoadingSpinner from "@/components/shared/loading-spinner";

interface ContractorWithProfile extends Omit<User, 'contractor_profile'> {
  contractor_profile?: ContractorProfile;
  average_rating?: number;
  rating_count?: number;
  slug?: string;
}

export function FeaturedContractorsCarousel() {
  const [featuredContractors, setFeaturedContractors] = useState<ContractorWithProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsToShow, setCardsToShow] = useState(7);

  useEffect(() => {
    setIsClient(true);
    fetchFeaturedContractors();
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

  const fetchFeaturedContractors = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Fetch featured contractors
      const { data, error } = await supabase
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
        .eq("users.user_role", "contractor")
        .eq("users.is_active", true)
        .eq("users.is_verified_contractor", true)
        .eq("is_featured_contractor", true)
        .order("created_at", { ascending: false })
        .limit(12);

      if (error) {
        console.error("Error fetching featured contractors:", error);
        return;
      }

      // Transform data and calculate ratings for each contractor
      const transformedData = await Promise.all(
        (data || []).map(async (contractor) => {
          // Get reviews for this contractor to calculate average rating
          const { data: reviews, error: reviewsError } = await supabase
            .from("reviews")
            .select("rating")
            .eq("recipient", contractor.user_id)
            .eq("is_verified", "yes");

          let averageRating = 0;
          let ratingCount = 0;

          if (!reviewsError && reviews && reviews.length > 0) {
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            averageRating = totalRating / reviews.length;
            ratingCount = reviews.length;
          }

          return {
            ...contractor.users,
            created_at: contractor.created_at,
            contractor_profile: contractor,
            slug: contractor.slug,
            average_rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
            rating_count: ratingCount,
          };
        })
      );

      setFeaturedContractors(transformedData as unknown as ContractorWithProfile[]);
    } catch (error) {
      console.error("Error fetching featured contractors:", error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    const maxIndex = Math.max(0, featuredContractors.length - cardsToShow);
    setCurrentIndex((prev) => (prev + 1) % (maxIndex + 1));
  };

  const prevSlide = () => {
    const maxIndex = Math.max(0, featuredContractors.length - cardsToShow);
    setCurrentIndex((prev) => (prev - 1 + maxIndex + 1) % (maxIndex + 1));
  };

  const getContractorImage = (contractor: ContractorWithProfile) => {
    // Check for valid profile photo
    if (contractor.profile_photo && 
        typeof contractor.profile_photo === 'string' && 
        contractor.profile_photo.trim() !== "") {
      return contractor.profile_photo;
    }
    
    // Check for valid logo
    if (contractor.contractor_profile?.logo && 
        typeof contractor.contractor_profile.logo === 'string' && 
        contractor.contractor_profile.logo.trim() !== "") {
      return contractor.contractor_profile.logo;
    }
    
    return "/images/placeholder-image.png";
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
    <section className="pt-2 pb-6 bg-white">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Featured Contractors
            </h2>
          </div>
          
          <div className="flex items-center space-x-2">
            {featuredContractors.length > 7 && (
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
            <Link href="/register?role=homeowner">
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

        {featuredContractors.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Wrench className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-500 mb-2">
                No featured contractors available
              </p>
              <p className="text-gray-400">
                Check back later for featured contractor showcases
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Contractors Carousel */}
            <div className="relative overflow-hidden">
              <div 
                className="flex transition-transform duration-300 ease-in-out"
                style={{ 
                  transform: `translateX(-${currentIndex * (100 / cardsToShow)}%)` 
                }}
              >
                {featuredContractors.map((contractor) => (
                  <div 
                    key={contractor.id} 
                    className="flex-shrink-0 px-2" 
                    style={{ 
                      width: `calc(100% / ${cardsToShow})` 
                    }}
                  >
                    {/* Clickable Container for both Image and Text */}
                    <Link href={`/new-contractor-view/${contractor.slug || contractor.id}`} className="cursor-pointer group block">
                      {/* Image Card */}
                      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 mb-3">
                        <div className="relative aspect-square overflow-hidden">
                          <Image
                            src={getContractorImage(contractor)}
                            alt={contractor.full_name || 'Contractor image'}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/images/placeholder-image.png";
                            }}
                          />
                          
                          {/* Verification Badge */}
                          {contractor.is_verified_contractor && (
                            <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center space-x-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>Verified</span>
                            </div>
                          )}

                          {/* Featured Badge */}
                          {contractor.contractor_profile?.is_featured_contractor && (
                            <div className="absolute top-3 left-3 bg-gray-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center space-x-1">
                              <Award className="w-3 h-3" />
                              <span>Featured</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Text Content Below Image */}
                      <div className="px-2">
                        <h3 className="font-semibold text-gray-900 text-xs line-clamp-1 mb-1">
                          {contractor.contractor_profile?.business_name || contractor.full_name}
                        </h3>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs font-medium">
                              {contractor.average_rating && contractor.average_rating > 0 ? contractor.average_rating : 'No reviews'}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-gray-500">
                            Verified
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
