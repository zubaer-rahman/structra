"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CalendarDays,
  DollarSign,
  MapPin,
  Plus,
  Edit,
  Building2,
  XCircle,
  MoreHorizontal,
  Clock,
  Star,
  Eye,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { Project } from "@/server/database/interfaces";
import ProjectTable from "@/components/features/projects/ProjectTable";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { PROJECT_STATUSES } from "@/utils/constants";
import { useHomeownerProfileStatus } from "@/hooks/useHomeownerProfileStatus";
import { AlertCircle } from "lucide-react";


interface RecentProjectsProps {
  projects: Project[];
  onProjectDeleted?: () => void;
  projectProposalCounts?: Record<string, number>;
}

function getStatusBadgeStyle(status: string) {
  const badgeStyles = {
    Draft: "bg-gray-100 text-gray-800 border-gray-300",
    "Open for Proposals": "bg-gray-100 text-gray-800 border-gray-300",
    Awarded: "bg-orange-100 text-orange-800 border-orange-300",
    "In Progress": "bg-orange-100 text-orange-800 border-orange-300",
    Completed: "bg-gray-900 text-white border-gray-900",
    Cancelled: "bg-gray-100 text-gray-800 border-gray-300",
  };
  return (
    badgeStyles[status as keyof typeof badgeStyles] ||
    "bg-gray-100 text-gray-800 border-gray-200"
  );
}

function getStatusIcon(status: string) {
  const icons = {
    Draft: Clock,
    "Open for Proposals": Clock,
    Awarded: Star,
    "In Progress": TrendingUp,
    Completed: Star,
    Cancelled: XCircle,
  };
  return icons[status as keyof typeof icons] || Clock;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getDaysAgo(date: string | Date) {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - dateObj.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

// Function to filter projects from the last 30 days
function getRecentProjects(projects: Project[], days: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return projects.filter((project) => {
    const projectDate = new Date(project.created_at);
    return projectDate >= cutoffDate;
  });
}

export default function RecentProjects({
  projects,
  onProjectDeleted,
  projectProposalCounts = {},
}: RecentProjectsProps) {
  // Filter projects from the last 30 days
  const recentProjects = getRecentProjects(projects, 30);
  const displayProjects = recentProjects.slice(0, 5);
  const { user } = useAuth();
  const router = useRouter();
  const { canPostProject, isProfileComplete, isGovernmentIdVerified, loading } = useHomeownerProfileStatus();

  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(
    null
  );
  console.log(deletingProjectId);
  // Handle post project button click
  const handlePostProject = () => {
    if (canPostProject) {
      router.push("/homeowner/projects/create");
    }
  };

  const handleDeleteProject = async (project: Project) => {
    if (!user) return;

    // Remove confirmation dialog - delete immediately
    setDeletingProjectId(project.id);

    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from("projects")
        .delete()
        .eq("id", project.id)
        .eq("creator", user.id);

      if (deleteError) {
        throw deleteError;
      }

      // Show success message and notify parent to refresh data
      toast.success("Project deleted successfully");

      // Call the callback to refresh data in parent component
      if (onProjectDeleted) {
        onProjectDeleted();
      }

      // Also try to refresh the router as backup
      router.refresh();
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    } finally {
      setDeletingProjectId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header Section */}
      <div className="py-4 sm:py-6 lg:py-8">
        {/* Main Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-2 w-full sm:w-auto">
            <div className="text-left">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Recent Projects
              </h2>
              <p className="text-gray-600 text-sm sm:text-lg mt-1">
                Track your latest project activities and progress
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Button
              onClick={handlePostProject}
              disabled={!canPostProject}
              className={`gap-2 ${
                canPostProject 
                  ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Plus className="h-5 w-5" />
              {loading ? 'Loading...' : 'Post a Project'}
            </Button>
            {!canPostProject && !loading && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>
                  {!isProfileComplete 
                    ? 'Complete your profile to post projects'
                    : !isGovernmentIdVerified 
                      ? 'Wait for your ID to be verified'
                      : 'Unable to post projects'
                  }
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {displayProjects.length === 0 ? (
        <div className="text-center py-16 px-4 sm:px-6 lg:px-8">
          <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-6">
            <Plus className="h-12 w-12 text-gray-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            No recent projects
          </h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg leading-relaxed">
            {recentProjects.length === 0
              ? "You haven't created any projects in the last 30 days. Start a new project to get started!"
              : "No projects to display from the last 30 days."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Enhanced Project Cards for Mobile */}
          <div className="block lg:hidden space-y-4">
            {displayProjects.map((project) => {
              const StatusIcon = getStatusIcon(project.status);

              return (
                <Card
                  key={project.id}
                  className="group bg-white border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] overflow-hidden"
                >
                  <CardContent className="p-6">
                    {/* Header with project type */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="h-4 w-4 text-gray-600" />
                          <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
                            {project.project_type || "General"}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors line-clamp-1">
                          {project.project_title}
                        </h3>
                      </div>
                      <div className="ml-4">
                        <Badge
                          className={`${getStatusBadgeStyle(
                            project.status
                          )} font-medium px-3 py-1 text-xs border shadow-sm`}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {project.status?.replace("_", " ") || "Unknown"}
                        </Badge>
                      </div>
                    </div>

                    {/* Project details grid */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-gray-700 bg-gray-50 p-2 rounded-lg">
                        <MapPin className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium truncate">
                          {project.location?.address || "Not specified"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700 bg-gray-50 p-2 rounded-lg">
                        <DollarSign className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium truncate">
                          {project.budget
                            ? formatCurrency(project.budget)
                            : "Not specified"}
                        </span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-gray-600">
                        <CalendarDays className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium">
                          {getDaysAgo(project.created_at)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/homeowner/projects/view/${project.id}`}
                                className="flex items-center"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            {project.status !== PROJECT_STATUSES.PROPOSAL_SELECTED && project.status !== PROJECT_STATUSES.COMPLETED && (
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/homeowner/projects/edit/${project.id}`}
                                  className="flex items-center"
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {project.status === PROJECT_STATUSES.DRAFT && (
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleDeleteProject(project);
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Enhanced Table for Desktop - Using ProjectTable Component */}
          <div className="hidden lg:block">
            <ProjectTable
              projects={displayProjects}
              onViewProject={(project) => {
                // Navigate to project view page
                window.location.href = `/homeowner/projects/view/${project.id}`;
              }}
              onEditProject={(project) => {
                // Navigate to project edit page
                window.location.href = `/homeowner/projects/edit/${project.id}`;
              }}
              projectProposalCounts={projectProposalCounts}
            />
          </div>

          {/* View All link centered below the table */}
          <div className="flex justify-center pt-6">
            <Link
              href="/homeowner/projects"
              className="text-orange-600 hover:text-orange-700 font-medium text-sm transition-colors"
            >
              View All Projects
            </Link>
          </div>
        </div>
      )}


    </div>
  );
}
