"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star, MapPin, Award, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [cardsToShow, setCardsToShow] = useState(4);

  useEffect(() => {
    setIsClient(true);
    fetchFeaturedContractors();
  }, []);

  // Handle responsive design
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setCardsToShow(1);
      } else if (window.innerWidth < 1024) {
        setCardsToShow(2);
      } else if (window.innerWidth < 1280) {
        setCardsToShow(3);
      } else {
        setCardsToShow(4);
      }
    };

    // Set initial value
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchFeaturedContractors = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/featured-contractors');
      const data = await response.json();

      if (response.ok && data.contractors) {
        setFeaturedContractors(data.contractors as ContractorWithProfile[]);
      } else {
        console.error("Error fetching featured contractors:", data.error);
        setFeaturedContractors([]);
      }
    } catch (error) {
      console.error("Error fetching featured contractors:", error);
      setFeaturedContractors([]);
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

  const getContractorLocation = (contractor: ContractorWithProfile) => {
    const rawAddr = contractor.contractor_profile?.address as unknown;
    if (typeof rawAddr === "string" && rawAddr.trim()) {
      const parts = rawAddr.split(",").map((p: string) => p.trim());
      if (parts.length >= 2) {
        return `${parts[1]}${parts[2] ? `, ${parts[2].split(" ")[0]}` : ""}`;
      }
      return rawAddr;
    }
    if (rawAddr && typeof rawAddr === "object") {
      const addrObj = rawAddr as { city?: string | null; province?: string | null; state?: string | null };
      const city = addrObj.city;
      const prov = addrObj.province || addrObj.state;
      if (city && prov) return `${city}, ${prov}`;
      if (city) return city;
    }
    return "Vancouver, BC";
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
    <section className="py-24 bg-transparent dark:bg-[#0A0A0A]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <Award className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">
                Featured <span className="text-orange-600 dark:text-orange-500">Master Builders</span>
              </h2>
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Institutional Grade Performance</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {featuredContractors.length > cardsToShow && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prevSlide}
                  className="w-10 h-10 rounded-full bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextSlide}
                  className="w-10 h-10 rounded-full bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
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
          <div className="flex items-center justify-center h-64 bg-white dark:bg-white/5 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none">
            <div className="text-center">
              <Wrench className="h-12 w-12 text-gray-400 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
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
                  <Link href={`/contractors/${contractor.slug || contractor.id}`} className="group block">
                    <div className="relative aspect-[3/4] rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10 bg-slate-900 dark:bg-white/5 shadow-sm dark:shadow-xl transition-all duration-500 group-hover:border-orange-500/40 group-hover:-translate-y-2">
                      <Image
                        src={getContractorImage(contractor)}
                        alt={contractor.full_name || 'Contractor'}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0 opacity-80 group-hover:opacity-100"
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

                        <div className="flex items-center gap-1.5 text-gray-400">
                          <MapPin className="w-3 h-3 text-orange-500" />
                          <span className="text-[9px] font-bold uppercase tracking-widest truncate">
                            {getContractorLocation(contractor)}
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
