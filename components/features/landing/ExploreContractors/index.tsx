"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Wrench, Map, List } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { User, ContractorProfile } from "@/server/database/interfaces";
import LoadingSpinner from "@/components/shared/loading-spinner";
import GoogleMapView from "./GoogleMapView";
import ListView from "./ListView";

interface ContractorWithProfile extends Omit<User, 'contractor_profile'> {
  contractor_profile?: ContractorProfile;
  average_rating?: number;
  rating_count?: number;
  slug?: string;
}

interface ExploreContractorsProps {
  className?: string;
}

export default function ExploreContractors({ className = "" }: ExploreContractorsProps) {
  const [contractors, setContractors] = useState<ContractorWithProfile[]>([]);
  const [selectedContractor, setSelectedContractor] = useState<ContractorWithProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([56.1304, -106.3468]); // Canada centre
  const [isClient, setIsClient] = useState(false);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

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

  const fetchContractors = async (searchLocation?: string) => {
    try {
      setLoading(true);

      const urlParams = new URLSearchParams();
      if (searchLocation && searchLocation.trim()) {
        urlParams.set("location", searchLocation.trim());
      }

      const response = await fetch(`/api/search/contractors?${urlParams.toString()}`);

      if (!response.ok) {
        console.error("Contractor search API error:", response.statusText);
        setContractors([]);
        return;
      }

      const data = await response.json();
      const contractorsData: ContractorWithProfile[] = data.contractors || [];
      setContractors(contractorsData);

      // Update map center to first contractor with coordinates
      const withCoords = contractorsData.find((c) => {
        const profile = c.contractor_profile;
        return profile?.address?.latitude && profile?.address?.longitude;
      });
      if (withCoords) {
        const profile = withCoords.contractor_profile;
        if (profile?.address?.latitude && profile?.address?.longitude) {
          setMapCenter([Number(profile.address.latitude), Number(profile.address.longitude)]);
        }
      } else if (!searchLocation) {
        // Keep Canada default when no results have coords
        setMapCenter([56.1304, -106.3468]);
      }
    } catch (error) {
      console.error("Error fetching contractors:", error);
      setContractors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => setSearchQuery(query);

  const handleContractorClick = (contractor: ContractorWithProfile) =>
    setSelectedContractor(contractor);

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return "Invalid Date";
    }
  };

  if (!isClient || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner variant="dark" />
      </div>
    );
  }

  return (
    <section className="py-12 sm:py-20 lg:py-28 bg-transparent dark:bg-[#0A0A0A] border-y border-gray-200 dark:border-white/5">
      <div className={`max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>

        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-8 sm:mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 mb-4 sm:mb-6 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-500"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Verified Talent</span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 sm:mb-6 tracking-tighter">
            Elite Artisan <span className="text-orange-600 dark:text-orange-500">Network</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-medium px-2">
            Connect with the industry&apos;s most respected master contractors. Each member is rigorously verified for architectural excellence.
          </p>
        </div>

        {/* Subheader row — matches ExploreProjects exactly */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-6">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Active Master Builders</h3>
            <span className="px-2 py-0.5 bg-orange-600 text-white text-[10px] font-bold rounded-md">Verified</span>
          </div>

          {/* Map / List toggle */}
          <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl w-full sm:w-auto">
            <Button
              variant={viewMode === "map" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("map")}
              className={cn(
                "flex items-center gap-2 flex-1 sm:flex-none h-10 px-6 rounded-xl transition-all duration-300",
                viewMode === "map"
                  ? "bg-orange-600 text-white shadow-lg"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <Map className="h-4 w-4" />
              <span className="font-bold">Map Grid</span>
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-2 flex-1 sm:flex-none h-10 px-6 rounded-xl transition-all duration-300",
                viewMode === "list"
                  ? "bg-orange-600 text-white shadow-lg"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <List className="h-4 w-4" />
              <span className="font-bold">Data List</span>
            </Button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-[2.5rem] overflow-hidden border border-gray-200 dark:border-white/5 shadow-sm bg-white dark:bg-white/5 backdrop-blur-3xl min-h-[600px]"
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
                <Wrench className="h-20 w-20 text-gray-400 dark:text-gray-700 mx-auto mb-6" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                  No verified artisans in this locale
                </p>
                <p className="text-gray-500 dark:text-gray-400 font-medium max-w-sm mx-auto">
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
