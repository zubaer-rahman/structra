"use client";

import React from "react";
import { Project } from "@/server/database/interfaces";
import LandingProjectCard from "./LandingProjectCard";
import SeeMoreCard from "./SeeMoreCard";
import { Building2 } from "lucide-react";

interface ListViewProps {
  projects: Project[];
  selectedProject: Project | null;
  formatBudget: (budget: number) => string;
  formatDate: (dateString: string) => string;
}

export default function ListView({
  projects,
  selectedProject,
  formatBudget,
  formatDate,
}: ListViewProps) {
  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[500px] p-12">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
          <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            No active projects found
          </p>
        </div>
      </div>
    );
  }

  // Optional: Limit the number of projects displayed in the grid before the "See More" card
  const limitedProjects = projects.slice(0, 11);

  return (
    <div className="p-6 sm:p-8">
      {/* Count header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
          {projects.length} active project{projects.length !== 1 ? "s" : ""}
        </p>
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {limitedProjects.map((project, index) => (
          <LandingProjectCard
            key={project.id || `project-${index}`}
            project={project}
            selectedProject={selectedProject}
            formatBudget={formatBudget}
            formatDate={formatDate}
          />
        ))}
        <SeeMoreCard />
      </div>
    </div>
  );
}
