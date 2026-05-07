"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Building2, Map, List } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";
import { Project } from "@/server/database/interfaces";
import LoadingSpinner from "@/components/shared/loading-spinner";
import GoogleMapView from "./GoogleMapView";
import ListView from "./ListView";

interface ExploreProjectsProps {
  className?: string;
}

export default function ExploreProjects({
  className = "",
}: ExploreProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    56.1304, -106.3468, // Default center of Canada
  ]);
  const [isClient, setIsClient] = useState(false);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  useEffect(() => {
    setIsClient(true);
    fetchProjects();
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
    fetchProjects(debouncedSearchQuery);
  }, [debouncedSearchQuery]);

  const fetchProjects = async (searchLocation?: string) => {
    try {
      setLoading(true);
      
      if (searchLocation && searchLocation.trim()) {
        // Use search API when searching for specific location
        const urlParams = new URLSearchParams();
        urlParams.set('location', searchLocation.trim());
        
        const response = await fetch(`/api/search/projects?${urlParams.toString()}`);
        
        if (!response.ok) {
          console.error('Search API error:', response.statusText);
          return;
        }
        
        const data = await response.json();
        const projectsData = data.projects || [];
        setProjects(projectsData);
        
        // Update map center based on first project location
        if (projectsData.length > 0 && projectsData[0].location?.latitude && projectsData[0].location?.longitude) {
          setMapCenter([
            Number(projectsData[0].location.latitude),
            Number(projectsData[0].location.longitude),
          ]);
        }
      } else {
        // Default: explicitly search for Canada while keeping input empty
        const response = await fetch(`/api/search/projects?location=Canada`);

        if (!response.ok) {
          console.error('Search API error (default Canada):', response.statusText);
          return;
        }

        const data = await response.json();
        const projectsData = data.projects || [];
        setProjects(projectsData);

        // Keep map centered on Canada for default (no specific search)
        setMapCenter([56.1304, -106.3468]);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
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

  if (loading) {
    return (
      <div className={`w-full h-[600px] ${className}`}>
        <LoadingSpinner
          text="Loading projects..."
          size="lg"
          variant="dark"
          className="h-full"
        />
      </div>
    );
  }

    return (
    <section className="py-40 bg-[#0A0A0A] border-y border-white/5">
      <div className={`max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
        {/* View Toggle Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500"
          >
            <Map className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Network</span>
          </motion.div>
          
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tighter">
            Live Project <span className="text-orange-500">Network</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto font-medium">
            Access Canada&apos;s most comprehensive directory of active, verified construction opportunities. Monitor the infrastructure landscape in real-time.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-6">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold text-white tracking-tight">Active Projects</h3>
            <span className="px-2 py-0.5 bg-orange-600 text-white text-[10px] font-bold rounded-md">Live</span>
          </div>
          
          <div className="flex items-center gap-2 p-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl w-full sm:w-auto">
            <Button
              variant={viewMode === "map" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("map")}
              className={cn(
                "flex items-center gap-2 flex-1 sm:flex-none h-10 px-6 rounded-xl transition-all duration-300",
                viewMode === "map" ? "bg-orange-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
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
                viewMode === "list" ? "bg-orange-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
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
          className="rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl bg-white/5 backdrop-blur-3xl min-h-[600px]"
        >
          {viewMode === "map" ? (
            <GoogleMapView
              projects={projects}
              selectedProject={selectedProject}
              mapCenter={mapCenter}
              isClient={isClient}
              onProjectClick={handleProjectClick}
              formatBudget={formatBudget}
              formatDate={formatDate}
              onSearch={handleSearch}
              searchQuery={searchQuery}
              obfuscate={true}
            />
          ) : projects.length === 0 ? (
            <div className="flex items-center justify-center h-[600px]">
              <div className="text-center">
                <Building2 className="h-20 w-20 text-gray-700 mx-auto mb-6" />
                <p className="text-2xl font-bold text-white mb-2 tracking-tight">
                  No active projects in this sector
                </p>
                <p className="text-gray-500 font-medium max-w-sm mx-auto">
                  Our network expands daily. Check back shortly for premium opportunities.
                </p>
              </div>
            </div>
          ) : (
            <ListView
              projects={projects}
              selectedProject={selectedProject}
              formatBudget={formatBudget}
              formatDate={formatDate}
            />
          )}
        </motion.div>
      </div>
    </section>
  );
}
