"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Building2, Star, MapPin, Calendar, DollarSign } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Project } from "@/server/database/interfaces";
import LoadingSpinner from "@/components/shared/loading-spinner";
import FeaturedProjectCard from "./FeaturedProjectCard";
import ProjectDetailsModal from "./ProjectDetailsModal";

interface FeaturedProjectWithContractor extends Omit<Project, 'homeowner'> {
  contractor?: {
    id: string;
    full_name: string;
  };
  homeowner?: {
    id: string;
    full_name: string;
    profile_photo?: string;
  };
  feature_type?: 'featured_project' | 'featured_contractor';
}

interface FeaturedProjectsProps {
  className?: string;
}

export default function FeaturedProjects({
  className = "",
}: FeaturedProjectsProps) {
  const [featuredProjects, setFeaturedProjects] = useState<FeaturedProjectWithContractor[]>([]);
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [selectedProject, setSelectedProject] = useState<FeaturedProjectWithContractor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
    fetchFeaturedProjects();
  }, []);

  const fetchFeaturedProjects = async () => {
    try {
      setLoading(true);
      
      // Use the API endpoint instead of direct Supabase queries
      const response = await fetch('/api/featured-projects');
      const data = await response.json();
      
      if (response.ok && data.projects) {
        setFeaturedProjects(data.projects as FeaturedProjectWithContractor[]);
      } else {
        console.error('Error fetching featured projects:', data.error);
        setFeaturedProjects([]);
      }
    } catch (error) {
      console.error('Error fetching featured projects:', error);
      setFeaturedProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = (project: FeaturedProjectWithContractor) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
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
    <section className={`py-16 sm:py-20 bg-gradient-to-b from-orange-50 to-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
            Featured Projects
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl sm:max-w-4xl mx-auto px-4">
            Showcasing completed projects that demonstrate the platform&apos;s capabilities and featured contractor work.
          </p>
        </div>

        {featuredProjects.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-500 mb-2">
                No featured projects available
              </p>
              <p className="text-gray-400">
                Check back later for featured project showcases
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {featuredProjects.map((project) => (
              <div key={project.id} onClick={() => handleProjectClick(project)} className="h-full">
                <FeaturedProjectCard
                  project={project}
                  formatBudget={formatBudget}
                  formatDate={formatDate}
                />
              </div>
            ))}
          </div>
        )}

        {/* Project Details Modal */}
        <ProjectDetailsModal
          project={selectedProject}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          formatBudget={formatBudget}
          formatDate={formatDate}
        />
      </div>
    </section>
  );
}
