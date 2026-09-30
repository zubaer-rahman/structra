"use client";

import { Project } from "@/server/database/interfaces";
import { User } from "@/server/database/interfaces/auth";
import {
  Calendar,
  MapPin,
  Clock,
  User as UserIcon,
} from "lucide-react";
import ProjectImageGallery from "./ProjectImageGallery";
import { ProjectCompletionBadge } from "../ProjectCompletionBadge";

interface ProjectViewHeaderProps {
  project: Project;
  user: User;
}

export default function ProjectViewHeader({
  project,
  user,
}: ProjectViewHeaderProps) {
  return (
    <div>
      {/* Project Completion Badge */}
      <ProjectCompletionBadge 
        substantialCompletion={project.substantial_completion?.toString() || null}
        projectStatus={project.status}
        className="mb-4"
      />
      
      <div className="bg-white dark:bg-[#141414] rounded-lg border border-gray-100 dark:border-white/10 p-4 sm:p-6 mb-4 sm:mb-6 transition-colors">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Section - Project Visuals */}
        <div className="lg:col-span-1">
          <ProjectImageGallery
            projectPhotos={project.project_photos}
            projectType={project.project_type}
          />
        </div>

        {/* Middle Section - Project Details */}
        <div className="lg:col-span-1">
          <div className="space-y-3 sm:space-y-4">
            {/* Project Title */}
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white leading-tight">
                {project.project_title}
              </h1>
            </div>

            {/* Project Type Badge */}
            <div>
              <span className="bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-transparent dark:border-orange-500/20 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                {project.project_type?.toUpperCase() || "PROJECT"}
              </span>
            </div>

            {/* Project Status */}
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Status:</span>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  project.status === "Open for Proposals"
                    ? "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400"
                    : project.status === "Proposal Selected"
                    ? "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400"
                    : project.status === "Completed"
                    ? "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400"
                    : project.status === "In Progress"
                    ? "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400"
                    : project.status === "Draft"
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                    : project.status === "Cancelled"
                    ? "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
              >
                {project.status || "Unknown"}
              </span>
            </div>

            {/* Budget */}
            <div className="flex items-center gap-2 ">
              <span className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                ${project.budget.toLocaleString()}
              </span>
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 ml-2">
                Budget
              </span>
            </div>

            {/* Delay Penalty */}
            {project.delay_penalty > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-bold text-orange-600 dark:text-orange-400">
                  ${project.delay_penalty.toFixed(2)}
                </span>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 ml-2">
                  Delay Penalty/Day
                </span>
              </div>
            )}

            {/* Location */}
            {project.location.city || project.location.province ? (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  {[project.location.city, project.location.province]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            ) : null}

            {/* Timeline */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
              <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                {new Date(project.start_date).toLocaleDateString()} -{" "}
                {new Date(project.end_date).toLocaleDateString()}
              </span>
            </div>

            {/* Project Details */}
            <div className="pt-3 sm:pt-4 border-t border-gray-200 dark:border-white/10">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2 text-sm sm:text-base">
                Project Details
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">
                {project.statement_of_work || "No description provided"}
              </p>
            </div>

            {/* Categories */}
            {project.category && project.category.length > 0 && (
              <div className="pt-3 sm:pt-4 border-t border-gray-200 dark:border-white/10">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2 text-sm sm:text-base">
                  Categories
                </h3>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {project.category.map((cat, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section - Project Summary - Hidden on medium and mobile */}
        <div className="hidden xl:block lg:col-span-1">
          <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4 border border-transparent dark:border-white/10">
            <h3 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
              Project Summary
            </h3>

            {/* Created Date */}
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Created</span>
              <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                {new Date(project.created_at).toLocaleDateString()}
              </span>
            </div>

            {/* Expiry Date */}
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Expires</span>
              <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                {new Date(project.expiry_date).toLocaleDateString()}
              </span>
            </div>

            {/* Permit Required */}
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Permit Required
              </span>
              <span
                className={`text-xs sm:text-sm font-medium ${
                  project.permit_required ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                }`}
              >
                {project.permit_required ? "Yes" : "No"}
              </span>
            </div>

            {/* Verified Project */}
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Verified</span>
              <span
                className={`text-xs sm:text-sm font-medium ${
                  project.is_verified_project
                    ? "text-green-600 dark:text-green-400"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {project.is_verified_project ? "Yes" : "No"}
              </span>
            </div>

            {/* Proposal Count */}
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Proposals
              </span>
              <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                {project.proposal_count || 0}
              </span>
            </div>

            {/* Homeowner Info */}
            <div className="pt-3 sm:pt-4 border-t border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 dark:bg-orange-950/40 rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                    {user?.full_name || "Unknown User"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Project Owner</p>
                </div>
              </div>
            </div>

            {/* Last Updated */}
            <div className="pt-3 sm:pt-4 border-t border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Last updated{" "}
                  {new Date(project.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
