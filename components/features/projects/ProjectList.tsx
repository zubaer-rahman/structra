"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Grid3X3, Table2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SharedPagination, ResultsSummary } from "@/components/shared";
import { PROJECT_STATUSES } from "@/utils/constants";

import { Project } from "@/server/database/interfaces";
import ProjectTable from "./ProjectTable";
import ProjectCard from "./ProjectCard";

interface ProjectListProps {
  projects: Project[];
  onPostProject: () => void;
  onViewProject?: (project: Project) => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (project: Project) => void;
  projectProposalCounts?: Record<string, number>;
  canPostProject?: boolean;
  isProfileComplete?: boolean;
  isGovernmentIdVerified?: boolean;
  loading?: boolean;
}

export default function ProjectList({
  projects,
  onPostProject,
  onViewProject,
  onEditProject,
  onDeleteProject,
  projectProposalCounts = {},
  canPostProject = true,
  isProfileComplete = true,
  isGovernmentIdVerified = true,
  loading = false,
}: ProjectListProps) {
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter projects based on search and status
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        project.project_title
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        project.statement_of_work
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        project.location?.address
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        project.location?.city
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || project.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header with Post Project Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage and track your construction projects
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Button 
            onClick={onPostProject} 
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

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value={PROJECT_STATUSES.DRAFT}>Draft</SelectItem>
              <SelectItem value={PROJECT_STATUSES.OPEN_FOR_PROPOSALS}>Open for Proposals</SelectItem>
              <SelectItem value={PROJECT_STATUSES.PROPOSAL_SELECTED}>Proposal Selected</SelectItem>
              <SelectItem value={PROJECT_STATUSES.COMPLETED}>Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 border rounded-lg p-1 bg-muted">
          <Button
            variant={viewMode === "table" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
            className="h-8 px-3"
          >
            <Table2 className="h-4 w-4 mr-2" />
          </Button>
          <Button
            variant={viewMode === "card" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("card")}
            className="h-8 px-3"
          >
            <Grid3X3 className="h-4 w-4 mr-2" />
          </Button>
        </div>
      </div>

      {/* Results Summary */}
      <ResultsSummary
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={filteredProjects.length}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={handleItemsPerPageChange}
      />

      {/* Content */}
      {viewMode === "table" ? (
        <ProjectTable
          projects={paginatedProjects}
          onViewProject={onViewProject}
          onEditProject={onEditProject}
          onDeleteProject={onDeleteProject}
          projectProposalCounts={projectProposalCounts}
        />
      ) : (
        <ProjectCard
          projects={paginatedProjects}
          onProjectClick={onViewProject}
          onViewProject={onViewProject}
          onEditProject={onEditProject}
          onDeleteProject={onDeleteProject}
        />
      )}

      {/* Shared Pagination */}
      <SharedPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {/* Empty State */}
      {paginatedProjects.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-muted-foreground">
            <svg
              className="h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No projects found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your filters or create a new project.
          </p>
        </div>
      )}
    </div>
  );
}
