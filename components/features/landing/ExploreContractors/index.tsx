"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Wrench, Map, List, ChevronLeft, ChevronRight } from "lucide-react";
import { User, ContractorProfile } from "@/server/database/interfaces";
import LoadingSpinner from "@/components/shared/loading-spinner";
import GoogleMapView from "./GoogleMapView";
import ListView from "./ListView";
import ContractorCard from "./ContractorCard";
import { createClient } from "@/lib/supabase";

interface ContractorWithProfile extends Omit<User, 'contractor_profile'> {
  contractor_profile?: ContractorProfile; // This will be the actual profile object from our query
  average_rating?: number;
  rating_count?: number;
  slug?: string; // SEO-friendly URL slug from contractor profile
}

interface ExploreContractorsProps {
  className?: string;
}

export default function ExploreContractors({
  className = "",
}: ExploreContractorsProps) {
  const [selectedContractor, setSelectedContractor] = useState<ContractorWithProfile | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    43.6532, -79.3832,
  ]); // Default to Toronto
  const [isClient, setIsClient] = useState(false);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsToShow, setCardsToShow] = useState(7);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Use direct Supabase query like projects do
  const [contractors, setContractors] = useState<ContractorWithProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    fetchContractors();
  }, []);

  // Debounce search query with 1 second delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Trigger search when debounced query changes
  useEffect(() => {
    fetchContractors(debouncedSearchQuery);
  }, [debouncedSearchQuery]);

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

  const fetchContractors = async (searchLocation?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      if (searchLocation && searchLocation.trim()) {
        // Use search API when searching for specific location
        const urlParams = new URLSearchParams();
        urlParams.set('location', searchLocation.trim());
        
        const response = await fetch(`/api/search/contractors?${urlParams.toString()}`);
        
        if (!response.ok) {
          console.error('Search API error:', response.statusText);
          setError("Failed to search contractors. Please try again.");
          return;
        }
        
        const data = await response.json();
        const contractorsData = data.contractors || [];
        setContractors(contractorsData);
        
        // Update map center based on first contractor location
        if (contractorsData.length > 0) {
          const contractorWithCoords = contractorsData.find((contractor: ContractorWithProfile) => {
            const profile = contractor.contractor_profile;
            return profile?.address?.latitude && profile?.address?.longitude;
          });
          
          if (contractorWithCoords) {
            const profile = contractorWithCoords.contractor_profile;
            if (profile?.address?.latitude && profile?.address?.longitude) {
              setMapCenter([
                Number(profile.address.latitude),
                Number(profile.address.longitude)
              ]);
            }
          }
        }
      } else {
        // Default: fetch Canada-only contractors
        const supabase = createClient();

        // Fetch contractors with profile photos directly from users table
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
          .eq("is_admin_verified", true)
          .eq("address->>country", "Canada")
          .order("created_at", { ascending: false })
          .limit(12);

        if (error) {
          setError("Failed to load contractors. Please try again.");
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
              ...contractor.users, // User data as main object
              created_at: contractor.created_at, // Use contractor profile's created_at for joined date
              contractor_profile: contractor, // Profile data nested
              slug: contractor.slug, // Add slug to the main object for easy access
              average_rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
              rating_count: ratingCount,
            };
          })
        );

        setContractors(transformedData as unknown as ContractorWithProfile[]);
      }
    } catch (error) {
      setError("Failed to load contractors. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const nextSlide = () => {
    const maxIndex = Math.max(0, contractors.length - cardsToShow);
    setCurrentIndex((prev) => (prev + 1) % (maxIndex + 1));
  };

  const prevSlide = () => {
    const maxIndex = Math.max(0, contractors.length - cardsToShow);
    setCurrentIndex((prev) => (prev - 1 + maxIndex + 1) % (maxIndex + 1));
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Set map center when contractors data changes
  useEffect(() => {
    if (contractors && contractors.length > 0) {
      const contractorWithCoords = contractors.find(contractor => {
        const profile = contractor.contractor_profile;
        return profile?.address?.latitude && profile?.address?.longitude;
      });
      
      if (contractorWithCoords) {
        const profile = contractorWithCoords.contractor_profile;
        if (profile?.address?.latitude && profile?.address?.longitude) {
          setMapCenter([
            Number(profile.address.latitude),
            Number(profile.address.longitude)
          ]);
        } else {
          // Fallback to default center if no coordinates
          setMapCenter([43.6532, -79.3832]);
        }
      } else {
        // Fallback to default center if no coordinates
        setMapCenter([43.6532, -79.3832]);
      }
    }
  }, [contractors]);

  const handleContractorClick = (contractor: ContractorWithProfile) => {
    setSelectedContractor(contractor);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
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

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Wrench className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-500 mb-2">
            {error}
          </p>
          <p className="text-gray-400">
            Please try refreshing the page
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="py-8 sm:py-12 bg-gradient-to-b from-white to-orange-50">
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
            Explore Contractors Near You
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl sm:max-w-4xl mx-auto px-4">
            Discover verified contractors in your area. Click on any contractor to see their profile and services.
          </p>
        </div>

        {/* View Toggle - COMMENTED OUT */}
        {/* <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <h2 className="text-xl sm:text-2xl font-bold">Explore Contractors</h2>
          <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg w-full sm:w-auto">
            <Button
              variant={viewMode === "map" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("map")}
              className="flex items-center gap-2 flex-1 sm:flex-none"
            >
              <Map className="h-4 w-4" />
              <span className="hidden xs:inline">Map View</span>
              <span className="xs:hidden">Map</span>
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="flex items-center gap-2 flex-1 sm:flex-none"
            >
              <List className="h-4 w-4" />
              <span className="hidden xs:inline">List View</span>
              <span className="xs:hidden">List</span>
            </Button>
          </div>
        </div> */}

        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold">Explore Contractors</h2>
        </div>

        {viewMode === "map" ? (
          <GoogleMapView
            contractors={contractors}
            selectedContractor={selectedContractor}
            mapCenter={mapCenter}
            isClient={isClient}
            onContractorClick={handleContractorClick}
            formatDate={formatDate}
            onSearch={handleSearch}
            searchQuery={searchQuery}
          />
        ) : contractors.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Wrench className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-500 mb-2">
                No contractors nearby
              </p>
              <p className="text-gray-400">
                Check back later for new contractors
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* List View (Carousel) - COMMENTED OUT */}
            {/* <div className="relative overflow-hidden">
              <div 
                className="flex transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * (100 / cardsToShow)}%)` }}
              >
                {contractors.map((contractor, index) => (
                  <div 
                    key={contractor.id} 
                    className="flex-shrink-0 px-2" 
                    style={{ width: `calc(100% / ${cardsToShow})` }}
                  >
                    <ContractorCard
                      contractor={contractor}
                      selectedContractor={selectedContractor}
                      formatDate={formatDate}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center mt-6 space-x-2">
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
            </div> */}
            
            {/* Fallback message when no contractors */}
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Wrench className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-500 mb-2">
                  No contractors nearby
                </p>
                <p className="text-gray-400">
                  Check back later for new contractors
                </p>
              </div>
            </div>
          </>
        )}
        {/* } */}
      </div>
    </section>
  );
}
