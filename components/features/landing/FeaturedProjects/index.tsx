"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Building2, Star } from "lucide-react";
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

export default function FeaturedProjects({ className = "" }: FeaturedProjectsProps) {
  const [featuredProjects, setFeaturedProjects] = useState<FeaturedProjectWithContractor[]>([]);
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [selectedProject, setSelectedProject] = useState<FeaturedProjectWithContractor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsToShow, setCardsToShow] = useState(3);

  useEffect(() => {
    setIsClient(true);
    fetchFeaturedProjects();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setCardsToShow(1);
      } else if (window.innerWidth < 1024) {
        setCardsToShow(2);
      } else {
        setCardsToShow(3);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchFeaturedProjects = async () => {
    try {
      setLoading(true);
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

  const maxIndex = Math.max(0, featuredProjects.length - cardsToShow);
  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % (maxIndex + 1));
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + maxIndex + 1) % (maxIndex + 1));

  const handleProjectClick = (project: FeaturedProjectWithContractor) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  const formatBudget = (budget: number) =>
    new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(budget);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

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
    <section className={`py-24 bg-transparent dark:bg-[#0A0A0A] ${className}`}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header — mirrors FeaturedContractorsCarousel */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">
                Featured <span className="text-orange-600 dark:text-orange-500">Showcases</span>
              </h2>
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">
                Curated Portfolio
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {featuredProjects.length > cardsToShow && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prevSlide}
                  className="w-10 h-10 rounded-full bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextSlide}
                  className="w-10 h-10 rounded-full bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            )}
            <Button
              variant="outline"
              className="bg-orange-500 border-none text-white hover:bg-orange-600 font-bold uppercase text-[10px] tracking-widest h-10 px-6 rounded-full"
              onClick={() => window.location.href = '/projects'}
            >
              View All Projects
            </Button>
          </div>
        </div>

        {/* Carousel or Empty State */}
        {featuredProjects.length === 0 ? (
          <div className="flex items-center justify-center h-64 bg-white dark:bg-white/5 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none">
            <div className="text-center">
              <Building2 className="h-12 w-12 text-gray-400 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                Refining our latest showcases...
              </p>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)]"
              style={{ transform: `translateX(-${currentIndex * (100 / cardsToShow)}%)` }}
            >
              {featuredProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex-shrink-0 px-3"
                  style={{ width: `calc(100% / ${cardsToShow})` }}
                >
                  <div className="cursor-pointer h-full" onClick={() => handleProjectClick(project)}>
                    <FeaturedProjectCard
                      project={project}
                      formatBudget={formatBudget}
                      formatDate={formatDate}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dot indicators */}
        {featuredProjects.length > cardsToShow && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? "w-6 bg-orange-500"
                    : "w-1.5 bg-gray-300 dark:bg-white/20"
                }`}
              />
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
