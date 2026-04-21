'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { USER_ROLES } from '@/utils/constants'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { FileText, Search, Grid3X3, Table2 } from 'lucide-react'
import { Breadcrumbs, LoadingSpinner, SharedPagination, ResultsSummary } from '@/components/shared'
import { ContractorProposalTable } from '@/components/features/projects/ContractorProposalTable'
import { ProposalCardGrid } from '@/components/features/proposals'
import { ProjectWithProposal } from '@/types/project'
import { ProjectService, BaseProject } from '@/server/services/ProjectService'

export default function ContractorProposalsPage() {
  const { user, userRole, loading } = useAuth()
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [projects, setProjects] = useState<ProjectWithProposal[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchProjects = async () => {
      if (loading) {
        return
      }
      
      if (!user) {
        router.push('/login')
        return
      }
      
      if (userRole !== 'contractor') {
        router.push(`/${userRole}/dashboard`)
        return
      }

      try {
        setProjectsLoading(true)
        setError(null)

        const projectService = new ProjectService()
        
        // Fetch my projects (projects with accepted proposals or paid access)
        const myProjectsResult = await projectService.getContractorMyProjects(user.id)
        if (!myProjectsResult.success) {
          throw new Error(myProjectsResult.error || 'Failed to fetch my projects')
        }

        const myProjects = myProjectsResult.data || []
        
        // For each project, check if there's a proposal and get its details
        const projectsWithProposals = await Promise.all(
          myProjects.map(async (project) => {
            // Get proposal details for this project
            const { data: proposalData, error: proposalError } = await supabase
              .from('proposals')
              .select(`
                id,
                title,
                status,
                subtotal_amount,
                total_amount,
                created_at,
                description_of_work,
                proposed_start_date,
                proposed_end_date,
                contract_reviewed,
                homeowner_contract_reviewed,
                contract_reviewed_at,
                homeowner_contract_reviewed_at,
                rejected_date,
                rejection_reason,
                rejection_reason_notes
              `)
              .eq('contractor', user.id)
              .eq('project', project.id)
              .eq('is_deleted', 'no')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()

            return {
              ...project,
              created_at: typeof project.created_at === 'string' ? project.created_at : project.created_at?.toISOString() || new Date().toISOString(),
              slug: project.slug || project.id, // Use project ID as fallback for slug
              expiry_date: project.expiry_date ? (typeof project.expiry_date === 'string' ? project.expiry_date : project.expiry_date.toISOString()) : null,
              start_date: project.start_date ? (typeof project.start_date === 'string' ? project.start_date : project.start_date.toISOString()) : null,
              end_date: project.end_date ? (typeof project.end_date === 'string' ? project.end_date : project.end_date.toISOString()) : null,
              homeowner: Array.isArray(project.homeowner) ? project.homeowner[0] : project.homeowner,
              proposal: proposalData ? {
                ...proposalData,
                created_at: typeof proposalData.created_at === 'string' ? proposalData.created_at : proposalData.created_at?.toISOString() || new Date().toISOString(),
                proposed_start_date: proposalData.proposed_start_date ? (typeof proposalData.proposed_start_date === 'string' ? proposalData.proposed_start_date : proposalData.proposed_start_date.toISOString()) : null,
                proposed_end_date: proposalData.proposed_end_date ? (typeof proposalData.proposed_end_date === 'string' ? proposalData.proposed_end_date : proposalData.proposed_end_date.toISOString()) : null
              } : null
            }
          })
        )

        setProjects(projectsWithProposals)
      } catch (err) {
        setError('Failed to fetch projects')
      } finally {
        setProjectsLoading(false)
      }
    }

    fetchProjects()
  }, [loading, user, userRole, supabase, router])



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }



  const handleViewDetails = (project: typeof projects[0]) => {
    if (project.proposal) {
      // Use project slug if available, otherwise fall back to proposal ID
      const identifier = project.slug || project.proposal.id
      router.push(`/contractor/my-projects/${identifier}`)
    } else {
      // If no proposal, redirect to project view using slug if available
      const identifier = project.slug || project.id
      router.push(`/contractor/projects/view/${identifier}`)
    }
  }

  const handleEditProposal = (project: typeof projects[0]) => {
    if (project.proposal && project.id) {
      router.push(`/contractor/projects/submit-proposal/${project.id}?edit=${project.proposal.id}`)
    } else if (project.id) {
      // If no proposal, redirect to submit proposal page
      router.push(`/contractor/projects/submit-proposal/${project.id}`)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value))
    setCurrentPage(1)
  }

  // Filter and search projects
  const filteredProjects = projects?.filter(project => {
    const matchesSearch = 
      project.project_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.statement_of_work?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.homeowner?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.proposal?.description_of_work?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const proposalStatus = project.proposal?.status || 'no-proposal'
    const matchesStatus = statusFilter === 'all' || proposalStatus === statusFilter
    
    return matchesSearch && matchesStatus
  }) || []

  // Pagination calculations
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProjects = filteredProjects.slice(startIndex, endIndex)

  if (loading || projectsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              My Projects
            </h1>
            <p className="text-muted-foreground">
              Track and manage your project proposals
            </p>
          </div>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <div className="text-center text-red-600">{error}</div>
          </div>
        </div>
      </div>
    )
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
              Only contractors can view their proposals.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/contractor/dashboard' },
          { label: 'My Projects', href: '/contractor/my-projects' },
        ]}
      />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            My Projects
          </h1>
          <p className="text-muted-foreground text-sm lg:text-base">
            Track and manage your project proposals
          </p>
        </div>
      </div>

      {/* Controls Bar */}
        <div className="flex flex-col gap-3 lg:gap-4">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="search-projects"
                name="search-projects"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="no-proposal">No Proposal</SelectItem>
                </SelectContent>
              </Select>
          </div>

          {/* View Toggle */}
        <div className="flex items-center gap-1 border rounded-lg p-1 bg-muted self-start">
            <Button
            variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
            onClick={() => setViewMode("table")}
            className="h-8 px-3"
            >
            <Table2 className="h-4 w-4" />
            </Button>
            <Button
            variant={viewMode === "card" ? "default" : "ghost"}
              size="sm"
            onClick={() => setViewMode("card")}
            className="h-8 px-3"
            >
            <Grid3X3 className="h-4 w-4" />
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
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 lg:py-12">
            <FileText className="w-10 h-10 lg:w-12 lg:h-12 text-gray-400 mb-3 lg:mb-4" />
            <h3 className="text-base lg:text-lg font-medium text-gray-900 mb-2">
              {statusFilter === 'all' ? 'No projects yet' : `No ${statusFilter === 'no-proposal' ? 'projects without proposals' : statusFilter} projects`}
            </h3>
            <p className="text-gray-600 text-center mb-4 lg:mb-6 text-sm lg:text-base">
              {statusFilter === 'all' 
                ? 'Start by browsing available projects and submitting your first proposal.'
                : statusFilter === 'no-proposal'
                ? 'You have projects but no proposals submitted yet.'
                : `You don't have any ${statusFilter} projects at the moment.`
              }
            </p>
            <Button onClick={() => router.push('/contractor/projects')} size="sm" className="lg:hidden">
              Browse Projects
            </Button>
            <Button onClick={() => router.push('/contractor/projects')} className="hidden lg:inline-flex">
              Browse Projects
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <ContractorProposalTable
                proposals={paginatedProjects}
                onProposalClick={handleViewDetails}
                onViewDetails={handleViewDetails}
                onEditProposal={handleEditProposal}
              />
            </div>
          ) : (
            <ProposalCardGrid
              proposals={paginatedProjects}
              onViewDetails={handleViewDetails}
              formatDate={formatDate}
              onBrowseProjects={() => router.push('/contractor/projects')}
            />
          )}

          {/* Shared Pagination */}
          <SharedPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  )
}
