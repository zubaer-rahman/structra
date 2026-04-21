"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Building2, Map, List } from "lucide-react";
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
          className="h-full"
        />
      </div>
    );
  }

    return (
    <section className="py-8 sm:py-12 bg-gradient-to-b from-white to-orange-50">
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
        {/* View Toggle */}
        <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
        Explore Projects Near You
        </h2>
        <p className="text-lg sm:text-xl text-gray-600 max-w-3xl sm:max-w-4xl mx-auto px-4">
        Discover construction projects in your area. Click on any project to see its details.        </p>
      </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <h2 className="text-xl sm:text-2xl font-bold">Explore Projects</h2>
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
        </div>

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
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-500 mb-2">
                No projects nearby
              </p>
              <p className="text-gray-400">
                Check back later for new opportunities
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
      </div>
    </section>
  );
}
