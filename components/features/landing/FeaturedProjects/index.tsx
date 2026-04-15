"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Building2, Star, MapPin, Calendar, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
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
    <section className={`py-40 bg-[#0A0A0A] ${className}`}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500"
          >
            <Star className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Curated Portfolio</span>
          </motion.div>
          
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tighter">
            Featured <span className="text-orange-500">Showcases</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto font-medium">
            A selection of architectural landmarks and high-precision builds managed through the Structra ecosystem.
          </p>
        </div>

        {featuredProjects.length === 0 ? (
          <div className="flex items-center justify-center h-96 rounded-[2.5rem] border border-white/5 bg-white/5 backdrop-blur-3xl">
            <div className="text-center">
              <Building2 className="h-20 w-20 text-gray-700 mx-auto mb-6" />
              <p className="text-2xl font-bold text-white mb-2 tracking-tight">
                Refining our latest showcases
              </p>
              <p className="text-gray-500 font-medium max-w-sm mx-auto">
                Premium projects are currently being onboarded. Review our live grid for active opportunities.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {featuredProjects.map((project, index) => (
              <motion.div 
                key={project.id} 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                onClick={() => handleProjectClick(project)} 
                className="h-full cursor-pointer"
              >
                <FeaturedProjectCard
                  project={project}
                  formatBudget={formatBudget}
                  formatDate={formatDate}
                />
              </motion.div>
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
