"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  USER_ROLES,
  ProposalStatus,
  PROPOSAL_STATUSES,
  RejectionReason,
  ProjectStatus,
} from "@/utils/constants";
import { createClient } from "@/lib/supabase";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  FileText,
} from "lucide-react";
import HomeownerProposalTable from "@/components/features/projects/HomeownerProposalTable";
import { LoadingSpinner, Breadcrumbs, SharedPagination, ResultsSummary } from "@/components/shared";

interface Project {
  id: string;
  project_title: string;
  status?: ProjectStatus;
}

// Type for proposals with joined data from Supabase query
interface ProposalWithJoins {
  id: string;
  project: string;
  project_id: string;
  contractor: string;
  homeowner: string;
  title: string;
  description_of_work: string;
  subtotal_amount: number;
  tax_included: "yes" | "no";
  tax_total?: number;
  total_amount: number;
  deposit_amount: number;
  deposit_due_on: string;
  delay_penalty: number;
  abandonment_penalty: number;
  proposed_start_date: string;
  proposed_end_date: string;
  expiry_date: string;
  status: ProposalStatus;
  is_selected: "yes" | "no";
  is_deleted: "yes" | "no";
  contract_reviewed: boolean;
  homeowner_contract_reviewed: boolean;
  submitted_date?: string;
  accepted_date?: string;
  rejected_date?: string;
  withdrawn_date?: string;
  viewed_date?: string;
  last_updated: string;
  rejected_by?: string;
  rejection_reason?: RejectionReason;
  rejection_reason_notes?: string;
  clause_preview_html?: string;
  attached_files?: Array<{
    id: string;
    filename: string;
    url: string;
    size?: number;
    mimeType?: string;
    uploadedAt?: string;
  }>;
  notes?: string;
  agreement?: string;
  proposals: string[];
  created_by: string;
  last_modified_by: string;
  visibility_settings: "private" | "public" | "shared";
  created_at: string;
  updated_at: string;
  // Joined data
  project_details: {
    id: string;
    project_title: string;
    statement_of_work: string;
    category: string[];
    location: Record<string, unknown>;
    status: ProjectStatus;
    budget: number;
    pid?: string;
  };
  contractor_profile?: {
    id: string;
    full_name: string;
    email: string;
    phone_number?: string;
    address?: string;
  };
}

export default function HomeownerProposalsPage() {
  const { user, userRole } = useAuth();

  const [proposals, setProposals] = useState<ProposalWithJoins[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [projects, setProjects] = useState<Project[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setProposalsLoading(false);
        return;
      }

      try {
        const supabase = createClient();

        // Fetch projects first
        const { data: projectsData, error: projectsError } = await supabase
          .from("projects")
          .select("id, project_title")
          .eq("creator", user.id);

        if (projectsError) throw projectsError;
        setProjects(projectsData || []);

        // Fetch proposals - first get project IDs for this homeowner
        const { data: projectIds, error: projectIdsError } = await supabase
          .from("projects")
          .select("id")
          .eq("creator", user.id)
          .limit(50);

        if (projectIdsError) throw projectIdsError;

        if (projectIds && projectIds.length > 0) {
          const projectIdList = projectIds.map((p) => p.id);

          // Fetch proposals for these projects
          const { data: proposalsData, error: proposalsError } = await supabase
            .from("proposals")
            .select(
              `
            id,
            title,
            status,
            is_selected,
            subtotal_amount,
            total_amount,
            deposit_amount,
            deposit_due_on,
            delay_penalty,
            abandonment_penalty,
            created_at,
            description_of_work,
            proposed_start_date,
            proposed_end_date,
            contractor,
            project,
            contract_reviewed,
            homeowner_contract_reviewed,
            project_details:projects!proposals_project_fkey (
              id,
              project_title,
              statement_of_work,
              category,
              location,
              status,
              budget,
              pid
            ),
            contractor_profile:users!proposals_contractor_fkey (
              id,
              full_name,
              email
            )
          `
            )
            .in("project", projectIdList)
            .eq("is_deleted", "no")
            .in("status", [
              PROPOSAL_STATUSES.SUBMITTED,
              PROPOSAL_STATUSES.VIEWED,
              PROPOSAL_STATUSES.ACCEPTED,
              PROPOSAL_STATUSES.REJECTED,
            ])
            .order("created_at", { ascending: false })
            .limit(20);

          if (proposalsError) {
            console.error("Proposals query error:", proposalsError);
            throw proposalsError;
          }

          // Transform the data to match the expected interface structure
          const transformedProposals = (proposalsData || []).map((proposal) => {
            // Extract the first item from arrays (since joins return arrays)
            const projectDetails = Array.isArray(proposal.project_details) ? proposal.project_details[0] : proposal.project_details;
            const contractorProfile = Array.isArray(proposal.contractor_profile) ? proposal.contractor_profile[0] : proposal.contractor_profile;
            
            return {
              id: proposal.id,
              project: projectDetails?.id || '',
              project_id: projectDetails?.id || '',
              contractor: proposal.contractor || '',
              homeowner: user.id,
              title: proposal.title || '',
              description_of_work: proposal.description_of_work || '',
              subtotal_amount: proposal.subtotal_amount || 0,
              tax_included: 'no' as const,
              total_amount: proposal.total_amount || 0,
              deposit_amount: proposal.deposit_amount || 0,
              deposit_due_on: proposal.deposit_due_on || '',
              delay_penalty: proposal.delay_penalty || 0,
              abandonment_penalty: proposal.abandonment_penalty || 0,
              proposed_start_date: proposal.proposed_start_date || '',
              proposed_end_date: proposal.proposed_end_date || '',
              expiry_date: '',
              status: proposal.status as ProposalStatus,
              is_selected: proposal.is_selected || 'no',
              is_deleted: 'no' as const,
              contract_reviewed: proposal.contract_reviewed || false,
              homeowner_contract_reviewed: proposal.homeowner_contract_reviewed || false,
              created_at: proposal.created_at || '',
              updated_at: proposal.created_at || '',
              last_updated: proposal.created_at || '',
              created_by: proposal.contractor || '',
              last_modified_by: proposal.contractor || '',
              visibility_settings: 'private' as const,
              proposals: [],
              project_details: projectDetails ? {
                id: projectDetails.id,
                project_title: projectDetails.project_title,
                statement_of_work: projectDetails.statement_of_work,
                category: projectDetails.category || [],
                location: projectDetails.location || {},
                status: projectDetails.status,
                budget: projectDetails.budget || 0,
                pid: projectDetails.pid
              } : {
                id: '',
                project_title: '',
                statement_of_work: '',
                category: [],
                location: {},
                status: 'Draft' as ProjectStatus,
                budget: 0,
                pid: undefined
              },
              contractor_profile: contractorProfile ? {
                id: contractorProfile.id,
                full_name: contractorProfile.full_name,
                email: contractorProfile.email
              } : {
                id: '',
                full_name: '',
                email: ''
              }
            };
          });

          setProposals(transformedProposals);
        } else {
          setProposals([]);
        }
      } catch (error: unknown) {
        console.error("Error fetching data:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        if (error && typeof error === "object" && "message" in error) {
          const errorObj = error as {
            message?: string;
            code?: string;
            hint?: string;
          };
          console.error("Error message:", errorObj.message);
          console.error("Error code:", errorObj.code);
          console.error("Error hint:", errorObj.hint);
        }
        setError(
          error instanceof Error ? error.message : "Failed to fetch data"
        );
      } finally {
        setProposalsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const filteredProposals = proposals.filter((proposal) => {
    const matchesSearch =
      proposal.project_details?.project_title
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      proposal.contractor_profile?.full_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      proposal.description_of_work
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || proposal.status === statusFilter;
    const matchesProject =
      projectFilter === "all" || proposal.project_details?.id === projectFilter;
    return matchesSearch && matchesStatus && matchesProject;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredProposals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProposals = filteredProposals.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  if (proposalsLoading) {
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
              Project Proposals
            </h1>
            <p className="text-muted-foreground">
              Review and manage proposals from contractors for your projects
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

  if (!user || userRole !== USER_ROLES.HOMEOWNER) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600">
              Only homeowners can view project proposals.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/homeowner/dashboard' },
            { label: 'Project Proposals', href: '/homeowner/proposals' }
          ]}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Project Proposals
          </h1>
          <p className="text-muted-foreground">
            Review and manage proposals from contractors for your projects
          </p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search proposals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="viewed">Viewed</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>


      </div>

     

             {/* Results Summary */}
       <ResultsSummary
         startIndex={startIndex}
         endIndex={endIndex}
         totalItems={filteredProposals.length}
         itemsPerPage={itemsPerPage}
         onItemsPerPageChange={handleItemsPerPageChange}
       />

              {/* Proposals Table */}
        <HomeownerProposalTable
          proposals={paginatedProposals}
        />

       {/* Pagination */}
       {totalPages > 1 && (
         <SharedPagination
           currentPage={currentPage}
           totalPages={totalPages}
           onPageChange={handlePageChange}
         />
       )}

       {/* Empty State */}
      {filteredProposals.length === 0 && !proposalsLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No proposals found
              </h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== "all" || projectFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "You haven't received any proposals yet. Check back later or create a new project to attract contractors."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
