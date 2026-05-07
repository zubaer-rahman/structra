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
        <LoadingSpinner variant="dark" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner variant="dark" />
      </div>
    );
  }

  return (
    <section className="py-24 bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <Award className="w-5 h-5 text-orange-500" />
             </div>
             <div>
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                  Featured <span className="text-orange-500">Master Builders</span>
                </h2>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Institutional Grade Performance</p>
             </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {featuredContractors.length > 7 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prevSlide}
                  className="w-10 h-10 rounded-full bg-white/5 border-white/10 text-white hover:bg-white/10 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextSlide}
                  className="w-10 h-10 rounded-full bg-white/5 border-white/10 text-white hover:bg-white/10 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            )}
            <Link href="/register?role=homeowner">
              <Button
                variant="outline"
                className="bg-orange-500 border-none text-white hover:bg-orange-600 font-bold uppercase text-[10px] tracking-widest h-10 px-6 rounded-full"
              >
                View Full Network
              </Button>
            </Link>
          </div>
        </div>

        {featuredContractors.length === 0 ? (
          <div className="flex items-center justify-center h-64 bg-white/5 rounded-3xl border border-white/5">
            <div className="text-center">
              <Wrench className="h-12 w-12 text-gray-700 mx-auto mb-4" />
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                Scanning for Elite Talent...
              </p>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)]"
              style={{ 
                transform: `translateX(-${currentIndex * (100 / cardsToShow)}%)` 
              }}
            >
              {featuredContractors.map((contractor) => (
                <div 
                  key={contractor.id} 
                  className="flex-shrink-0 px-3" 
                  style={{ 
                    width: `calc(100% / ${cardsToShow})` 
                  }}
                >
                  <Link href={`/new-contractor-view/${contractor.slug || contractor.id}`} className="group block">
                    <div className="relative aspect-[3/4] rounded-3xl overflow-hidden border border-white/10 bg-white/5 shadow-2xl transition-all duration-500 group-hover:border-orange-500/30 group-hover:-translate-y-2">
                      <Image
                        src={getContractorImage(contractor)}
                        alt={contractor.full_name || 'Contractor'}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0 opacity-60 group-hover:opacity-100"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/images/placeholder-image.png";
                        }}
                      />
                      
                      {/* Premium Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                      
                      <div className="absolute inset-x-0 bottom-0 p-6 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="px-2 py-0.5 rounded bg-orange-500 text-[8px] font-black uppercase text-white tracking-widest">
                            Verified
                          </div>
                          {contractor.average_rating && contractor.average_rating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 fill-yellow-500 text-yellow-500" />
                              <span className="text-[10px] font-black text-white">{contractor.average_rating}</span>
                            </div>
                          )}
                        </div>
                        
                        <h3 className="text-sm font-black text-white leading-tight line-clamp-2 uppercase tracking-tighter italic">
                          {contractor.contractor_profile?.business_name || contractor.full_name}
                        </h3>
                        
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <MapPin className="w-3 h-3" />
                          <span className="text-[9px] font-bold uppercase tracking-widest truncate">
                              {contractor.contractor_profile?.address?.city || 'Elite Division'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
