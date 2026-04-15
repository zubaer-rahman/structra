"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Wrench, Map, List, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
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
    <section className="py-40 bg-[#0A0A0A] border-y border-white/5">
      <div className={`max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Verified Talent</span>
          </motion.div>
          
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tighter">
            Elite Artisan <span className="text-orange-500">Network</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto font-medium">
            Connect with the industry&apos;s most respected master contractors. Each member is rigorously verified for architectural excellence.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-6">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold text-white tracking-tight">Active Master Builders</h3>
            <span className="px-2 py-0.5 bg-orange-600 text-white text-[10px] font-bold rounded-md">Verified</span>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl bg-white/5 backdrop-blur-3xl min-h-[600px]"
        >
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
            <div className="flex items-center justify-center h-[600px]">
              <div className="text-center">
                <Wrench className="h-20 w-20 text-gray-700 mx-auto mb-6" />
                <p className="text-2xl font-bold text-white mb-2 tracking-tight">
                  No verified artisans in this locale
                </p>
                <p className="text-gray-500 font-medium max-w-sm mx-auto">
                  Our network of master builders is expanding. Check back shortly for premium matches.
                </p>
              </div>
            </div>
          ) : (
            <ListView
              contractors={contractors}
              selectedContractor={selectedContractor}
              formatDate={formatDate}
            />
          )}
        </motion.div>
      </div>
    </section>
  );
}
