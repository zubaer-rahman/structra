"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { ProjectService, BaseProject } from "@/server/services/ProjectService";
import { USER_ROLES } from "@/utils/constants";
import { trpc } from "@/utils/trpc";

import { Breadcrumbs } from "@/components/shared";
import { LoadingSpinner, SharedPagination, ResultsSummary } from "@/components/shared";
import ContractorProjectTable from "@/components/features/projects/ContractorProjectTable";
import { ContractorProjectCardGrid } from "@/components/features/proposals";
import ContractorProjectMapView from "@/components/features/projects/ContractorProjectMapView";
import ViewToggle from "@/components/features/projects/ViewToggle";
import { Search, CheckCircle, Eye, Briefcase, CheckSquare, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ContractorProjectsPage() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [allProjects, setAllProjects] = useState<BaseProject[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'budget-desc' | 'budget-asc'>('date-desc');
  const [viewMode, setViewMode] = useState<'map' | 'grid' | 'list'>('map');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [error, setError] = useState("");
  // Verification success handling removed - verification now only happens on profile page

  // Handle project payment cancellation from URL parameter
  useEffect(() => {
    const payment = searchParams.get('payment');
    if (payment === 'cancelled' && user && userRole === USER_ROLES.CONTRACTOR) {
      // Clean up pending transactions and show cancellation message
      handleProjectPaymentCancel();
      toast.error('Project payment was cancelled. You can try again anytime.');
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('payment');
      router.replace(newUrl.pathname + newUrl.search);
    }
  }, [searchParams, user, userRole, router]);

  const handleProjectPaymentCancel = async () => {
    if (!user?.id) return;
    
    try {
      // Call the project payment cancel API to clean up pending transactions
      const response = await fetch('/api/project-payment-cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          projectId: 'all', // Cancel all pending project payments for this user
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Cancelled project payment transactions:', data.cancelledTransactions);
      } else {
        console.error('Failed to cancel project payment:', data.error);
      }
    } catch (error) {
      console.error('Error cancelling project payment:', error);
    }
  };

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) {
        setProjectsLoading(false);
        return;
      }

      try {
        const projectService = new ProjectService();
        const combinedProjects: BaseProject[] = [];
        
        // Fetch available projects
        const availableResult = await projectService.getAvailableProjects(user.id);
        if (availableResult.success && availableResult.data) {
          // Mark available projects with a type indicator
          const availableProjects = availableResult.data.map(project => ({
            ...project,
            projectType: 'available' as const
          }));
          combinedProjects.push(...availableProjects);
        }

        // Fetch my projects (projects with accepted proposals)
        const myProjectsResult = await projectService.getContractorMyProjects(user.id);
        if (myProjectsResult.success && myProjectsResult.data) {
          // Mark my projects with a type indicator
          const myProjects = myProjectsResult.data.map(project => ({
            ...project,
            projectType: 'my-project' as const
          }));
          combinedProjects.push(...myProjects);
        }

        // Sort projects: my projects first, then available projects
        combinedProjects.sort((a, b) => {
          if (a.projectType === 'my-project' && b.projectType === 'available') return -1;
          if (a.projectType === 'available' && b.projectType === 'my-project') return 1;
          return 0;
        });

        setAllProjects(combinedProjects);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setError("Failed to load projects");
      } finally {
        setProjectsLoading(false);
      }
    };

    if (!loading && user && userRole === USER_ROLES.CONTRACTOR) {
      fetchProjects();
    }
  }, [user, userRole, loading]);





  // Handle view details click
  const handleViewDetails = (project: BaseProject) => {
    // Use slug if available, otherwise fall back to ID
    const projectIdentifier = project.slug || project.id;
    router.push(`/contractor/projects/view/${projectIdentifier}`);
  };


  if (loading || projectsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
                  <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Browse Projects
          </h1>
          <p className="text-muted-foreground">
            Browse and bid on published construction projects
          </p>
        </div>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <div className="text-center text-red-600">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || userRole !== USER_ROLES.CONTRACTOR) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600">
              Only contractors can view available projects.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Filter and sort projects
  const filteredProjects = allProjects
    .filter((project) => {
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
        project.location?.city?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'date-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'budget-desc':
          return (b.budget || 0) - (a.budget || 0);
        case 'budget-asc':
          return (a.budget || 0) - (b.budget || 0);
        default:
          return 0;
      }
    });

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/contractor/dashboard" },
            { label: "Browse Projects", href: "/contractor/projects" },
          ]}
        />
      </div>

      {/* Verification success UI removed - verification now only happens on profile page */}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            All Projects
          </h1>
          <p className="text-muted-foreground">
            Browse available projects and view your completed work
          </p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search all projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <ViewToggle currentView={viewMode} onViewChange={setViewMode} />
          
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Date Posted (Newest)</SelectItem>
                <SelectItem value="date-asc">Date Posted (Oldest)</SelectItem>
                <SelectItem value="budget-desc">Budget (Highest)</SelectItem>
                <SelectItem value="budget-asc">Budget (Lowest)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results Summary - Hide for map view */}
      {viewMode !== 'map' && (
        <ResultsSummary
          startIndex={startIndex}
          endIndex={endIndex}
          totalItems={filteredProjects.length}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}

      {/* Content - Dynamic view based on toggle */}
      {viewMode === 'map' ? (
        <ContractorProjectMapView
          projects={filteredProjects}
          onViewDetails={handleViewDetails}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          user={user}
        />
      ) : viewMode === 'list' ? (
        <ContractorProjectTable
          projects={paginatedProjects}
          onProjectClick={handleViewDetails}
        />
      ) : (
        <ContractorProjectCardGrid
          projects={paginatedProjects}
          onViewDetails={handleViewDetails}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          hideBadges={false}
        />
      )}

      {/* Shared Pagination - Hide for map view */}
      {viewMode !== 'map' && (
        <SharedPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
