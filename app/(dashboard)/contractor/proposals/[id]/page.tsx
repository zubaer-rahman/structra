'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Breadcrumbs, LoadingSpinner } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { 
  Building, 
  User, 
  DollarSign, 
  Calendar, 
  Clock, 
  FileText, 
  MapPin, 
  Award, 
  Timer, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Shield, 
  CalendarDays, 
  Clock3, 
  Building2, 
  UserCheck, 
  Clock4,
  CheckCircle,
  AlertTriangle,
  Info,
  Edit,
  FileText as FileTextIcon,
  Download as DownloadIcon,
  Building as BuildingIcon,
  Settings,
  Eye,
  FileDown
} from 'lucide-react'
import { ContractReviewBadge } from '@/components/shared/ContractReviewBadge'
import { PROJECT_STATUSES, PROPOSAL_STATUSES, USER_ROLES } from '@/utils/constants'
import { formatCurrency } from '@/lib/utils'
import { getProjectStatusConfig } from '@/utils/helpers'
import { createClient } from '@/lib/supabase'
import { isValidSlug } from '@/utils/helpers/slugUtils'
import { ProjectWithProposal } from '@/types/project'
import PDFPreviewModal from '@/components/shared/PDFPreviewModal'
import { generateProposalPDFBlob } from '@/utils/helpers/pdfPreviewGenerator'
import { downloadProposalPDF } from '@/utils/helpers/downloadProposalPDF'
import { ProposalWithJoins } from '@/server/database/interfaces/proposals'
import toast from 'react-hot-toast'

interface ExtendedProjectWithProposal extends Omit<ProjectWithProposal, 'proposal'> {
  permit_required?: boolean
  project_type?: string
  visibility_settings?: string
  decision_date?: string | null
  certificate_of_title?: string | null
  substantial_completion?: string | null
  is_verified_project?: boolean
  delay_penalty?: number
  abandonment_penalty?: number
  project_photos?: Array<{
    id: string
    filename: string
    url: string
    size?: number
    mimeType?: string
    uploadedAt?: string
  }>
  files?: Array<{
    id: string
    filename: string
    url: string
    size?: number
    mimeType?: string
    uploadedAt?: string
  }>
  proposal?: {
    id: string
    title: string
    description_of_work: string
    subtotal_amount: number | null
    tax_included: 'yes' | 'no'
    total_amount: number | null
    deposit_amount: number | null
    deposit_due_on: string | null
    proposed_start_date: string | null
    proposed_end_date: string | null
    expiry_date: string | null
    status: string
    is_selected: 'yes' | 'no'
    submitted_date: string | null
    accepted_date: string | null
    rejected_date: string | null
    withdrawn_date: string | null
    viewed_date: string | null
    last_updated: string
    rejected_by: string | null
    rejection_reason: string | null
    rejection_reason_notes: string | null
    clause_preview_html: string | null
    attached_files: Array<{
      id: string
      filename: string
      url: string
      size?: number
      mimeType?: string
      uploadedAt?: string
    }>
    notes: string | null
    visibility_settings: string
    project: string
    contractor: string
    homeowner: string
    delay_penalty: number
    abandonment_penalty: number
    contract_reviewed: boolean
    homeowner_contract_reviewed: boolean
    created_at: string
  } | null
}

/**
 * Utility function to detect if a string is a UUID
 * This is used to determine if the URL parameter is a proposal ID (UUID) or a project slug
 */
const isUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

export default function ContractorProposalViewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { user, userRole } = useAuth()
  const [projectData, setProjectData] = useState<ExtendedProjectWithProposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // PDF Preview state
  const [showPDFPreview, setShowPDFPreview] = useState(false)
  const [previewPDFBlob, setPreviewPDFBlob] = useState<Blob | null>(null)
  const [previewTitle, setPreviewTitle] = useState('')
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [contractReviewed, setContractReviewed] = useState(false)

  // Unwrap params using React.use()
  const resolvedParams = use(params)
  const identifier = resolvedParams.id
  
  // Determine if the identifier is a UUID (proposal ID) or a slug
  // This page supports both routing patterns:
  // 1. /contractor/my-projects/[proposal-id] - Direct proposal ID (legacy/fallback)
  // 2. /contractor/my-projects/[project-slug] - Project slug (preferred for SEO)
  // Prioritize UUID detection since UUIDs can also match slug pattern
  const isProposalId = isUUID(identifier)
  const isSlug = !isProposalId && isValidSlug(identifier)

  useEffect(() => {
    if (!user) return

    const fetchProjectData = async () => {
      try {
        setLoading(true)
        
        const supabase = createClient()
        
        let proposalId: string
        let projectId: string

        if (isProposalId) {
          // Direct proposal ID lookup
          proposalId = identifier
          
          // Get the proposal to find the project ID
          const { data: proposalData, error: proposalError } = await supabase
            .from('proposals')
            .select('project')
            .eq('id', proposalId)
            .eq('contractor', user.id)
            .eq('is_deleted', 'no')
            .single()

          if (proposalError || !proposalData) {
            setError('Proposal not found')
            return
          }
          
          projectId = proposalData.project
        } else if (isSlug) {
          // Slug-based lookup - find project by slug first
          const { data: projectData, error: projectError } = await supabase
            .from('projects')
            .select('id')
            .eq('slug', identifier)
            .single()

          if (projectError || !projectData) {
            console.error('Error finding project by slug:', projectError)
            setError('Project not found')
            return
          }
          
          projectId = projectData.id
          
          // Find the proposal for this project and contractor
          const { data: proposalData, error: proposalError } = await supabase
            .from('proposals')
            .select('id')
            .eq('project', projectId)
            .eq('contractor', user.id)
            .eq('is_deleted', 'no')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (proposalError || !proposalData) {
            console.error('Error finding proposal for project:', proposalError)
            setError('Proposal not found for this project')
            return
          }
          
          proposalId = proposalData.id
        } else {
          setError('Invalid identifier format')
          return
        }

        // Get the project details directly
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select(`
            id,
            project_title,
            statement_of_work,
            category,
            location,
            status,
            budget,
            start_date,
            end_date,
            permit_required,
            creator,
            project_type,
            visibility_settings,
            expiry_date,
            decision_date,
            certificate_of_title,
            project_photos,
            files,
            substantial_completion,
            is_verified_project,
            delay_penalty,
            abandonment_penalty,
            slug,
            homeowner:users!creator(
              id,
              full_name,
              email,
              phone_number,
              address
            )
          `)
          .eq('id', projectId)
          .single()

        if (projectError || !projectData) {
          console.error('Error fetching project details:', projectError)
          setError(projectError?.message || 'Project not found')
          return
        }

        // Get the full proposal details
        const { data: fullProposalData, error: fullProposalError } = await supabase
          .from('proposals')
          .select(`
            *,
            project:projects!proposals_project_fkey (
              id,
              project_title,
              statement_of_work,
              category,
              location,
              status,
              budget,
              start_date,
              end_date,
              permit_required,
              creator,
              project_type,
              visibility_settings,
              expiry_date,
              decision_date,
              certificate_of_title,
              project_photos,
              files,
              substantial_completion,
              is_verified_project,
              delay_penalty,
              abandonment_penalty
            )
          `)
          .eq('id', proposalId)
          .eq('contractor', user.id)
          .eq('is_deleted', 'no')
          .single()

        if (fullProposalError) {
          console.error('Error fetching full proposal details:', fullProposalError)
          setError(fullProposalError.message)
          return
        }

        // Transform to ExtendedProjectWithProposal structure
        const transformedData: ExtendedProjectWithProposal = {
          ...projectData,
          created_at: (projectData as any).created_at || new Date().toISOString(),
          location: {
            ...projectData.location,
            ...((projectData as any).location_geom?.coordinates && {
              lat: (projectData as any).location_geom.coordinates[1],
              lng: (projectData as any).location_geom.coordinates[0]
            })
          },
          homeowner: Array.isArray(projectData.homeowner) ? projectData.homeowner[0] : projectData.homeowner,
          proposal: fullProposalData ? {
            ...fullProposalData,
            project: fullProposalData.project?.id || '',
            contractor: fullProposalData.contractor || '',
            homeowner: fullProposalData.homeowner || '',
            created_at: fullProposalData.created_at || new Date().toISOString()
          } : null
        }

        setProjectData(transformedData)
      } catch (err) {
        setError('Failed to fetch project details')
        console.error('Error fetching project:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProjectData()
  }, [user, identifier, isProposalId, isSlug])

  const getStatusConfig = (status: string) => {
    const statusConfigs: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; badgeClass: string }> = {
      [PROPOSAL_STATUSES.SUBMITTED]: { 
        label: 'Submitted', 
        icon: FileText, 
        color: 'text-blue-600 dark:text-blue-400', 
        badgeClass: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30' 
      },
      [PROPOSAL_STATUSES.ACCEPTED]: { 
        label: 'Accepted', 
        icon: CheckCircle2, 
        color: 'text-emerald-600 dark:text-emerald-400', 
        badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' 
      },
      [PROPOSAL_STATUSES.REJECTED]: { 
        label: 'Rejected', 
        icon: XCircle, 
        color: 'text-rose-600 dark:text-rose-400', 
        badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30' 
      },
      [PROPOSAL_STATUSES.WITHDRAWN]: { 
        label: 'Withdrawn', 
        icon: AlertCircle, 
        color: 'text-muted-foreground', 
        badgeClass: 'bg-muted text-muted-foreground border-border' 
      },
      'viewed': { 
        label: 'Viewed', 
        icon: CheckCircle2, 
        color: 'text-purple-600 dark:text-purple-400', 
        badgeClass: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30' 
      },
      'draft': { 
        label: 'Draft', 
        icon: FileText, 
        color: 'text-muted-foreground', 
        badgeClass: 'bg-muted text-muted-foreground border-border' 
      }
    }
    return statusConfigs[status] || statusConfigs[PROPOSAL_STATUSES.SUBMITTED]
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not specified'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleEditProposal = () => {
    if (projectData?.proposal) {
      router.push(`/contractor/projects/submit-proposal/${projectData.proposal.project}?edit=${projectData.proposal.id}`)
    }
  }

  const handleResubmitProposal = () => {
    if (projectData?.proposal) {
      // For resubmit, we create a new proposal for the same project
      router.push(`/contractor/projects/submit-proposal/${projectData.proposal.project}`)
    }
  }

  const handlePreviewPDF = async () => {
    if (!projectData?.proposal) return

    try {
      setIsGeneratingPDF(true)
      
      // Fetch the complete proposal data with joins before generating PDF
      const supabase = createClient()
      const { data, error } = await supabase
        .from('proposals')
        .select(`
          *,
          project:projects!proposals_project_fkey(*),
          homeowner_details:users!proposals_homeowner_fkey(*),
          project_details:projects!proposals_project_fkey(*)
        `)
        .eq('id', projectData.proposal.id)
        .eq('contractor', user?.id)
        .eq('is_deleted', 'no')
        .single()
      
      if (error) {
        throw new Error(`Error fetching proposal data: ${error.message}`)
      }
      
      if (!data) {
        throw new Error('Proposal data not found')
      }
      
      // Fetch contractor profile separately
      const { data: contractorProfile, error: contractorProfileError } = await supabase
        .from('contractor_profiles')
        .select('business_name, address, work_guarantee, work_guarantee_statement, insurance_builders_risk, insurance_general_liability')
        .eq('user_id', data.contractor)
        .single()
      
      if (contractorProfileError) {
        console.error('Error fetching contractor profile:', contractorProfileError)
      }
      
      // Fetch contractor user data for phone number
      const { data: contractorUser, error: contractorUserError } = await supabase
        .from('users')
        .select('phone_number, full_name')
        .eq('id', data.contractor)
        .single()
      
      if (contractorUserError) {
        console.error('Error fetching contractor user data:', contractorUserError)
      }
      
      // Attach contractor profile and user data to the proposal data
      const proposalWithContractor = {
        ...data,
        contractor_profile: {
          ...contractorProfile,
          ...contractorUser
        }
      }
      
      // Convert to ProposalWithJoins type and generate PDF blob (skip signature validation for preview)
      const fullProposal = proposalWithContractor as unknown as ProposalWithJoins
      const result = await generateProposalPDFBlob(fullProposal, true) // true = skip signature validation
      
      if (result.success && result.blob) {
        setPreviewPDFBlob(result.blob)
        setPreviewTitle(`Agreement - ${projectData.project_title}`)
        setContractReviewed(projectData.proposal?.contract_reviewed || false)
        setShowPDFPreview(true)
      } else {
        toast.error(result.error || 'Failed to generate PDF preview')
      }
    } catch (error) {
      console.error('PDF preview error:', error)
      toast.error('Failed to generate PDF preview')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" variant="default" text="Loading proposal details..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center max-w-md w-full">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Error Loading Proposal</h2>
          <p className="text-sm text-muted-foreground mb-5">{error}</p>
          <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  if (!projectData?.proposal) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <div className="rounded-xl border border-dashed border-border/80 bg-card/50 p-8 text-center max-w-md w-full">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Proposal Not Found</h2>
          <p className="text-sm text-muted-foreground mb-5">The requested proposal could not be found.</p>
          <Button onClick={() => router.push('/contractor/proposals')}>View All Proposals</Button>
        </div>
      </div>
    )
  }

  if (userRole !== USER_ROLES.CONTRACTOR) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center max-w-md w-full">
          <Shield className="h-10 w-10 text-destructive mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground">You don&apos;t have permission to view this proposal.</p>
        </div>
      </div>
    )
  }

  const proposalStatusConfig = getStatusConfig(projectData?.proposal?.status || '')
  const projectStatusConfig = projectData ? getProjectStatusConfig(projectData.status) : null
  const StatusIcon = proposalStatusConfig.icon

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div>
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/contractor/dashboard' },
            { label: 'My Proposals', href: '/contractor/proposals' },
            { label: projectData?.project_title || 'Project Proposal', href: '#' }
          ]}
        />
      </div>


        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Project & Proposal Details */}
          <div className="xl:col-span-2 space-y-4 sm:space-y-6">
            {/* Project Information Section */}
            <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-6 shadow-xs text-card-foreground">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <Building className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                  Project Information
                </h2>
              </div>
              
              <div className="space-y-4">
                {/* Project Title */}
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {projectData?.project_title || 'Project Title'}
                  </h3>
                </div>

                {/* Project Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="text-center p-3 rounded-lg border border-border/40 bg-muted/30">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Location</p>
                    <p className="text-sm font-semibold text-foreground">
                      {projectData?.location?.city || 'Not specified'}
                    </p>
                  </div>
                  
                  <div className="text-center p-3 rounded-lg border border-border/40 bg-muted/30">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Budget</p>
                    <p className="text-sm font-mono font-bold text-foreground">
                      {projectData?.budget ? formatCurrency(projectData.budget) : 'Not specified'}
                    </p>
                  </div>
                  
                  <div className="text-center p-3 rounded-lg border border-border/40 bg-muted/30">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Posted</p>
                    <p className="text-sm font-semibold text-foreground">
                      {projectData?.created_at ? formatDate(projectData.created_at) : 'Not specified'}
                    </p>
                  </div>
                  
                  <div className="text-center p-3 rounded-lg border border-border/40 bg-muted/30">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Expires</p>
                    <p className="text-sm font-semibold text-foreground">
                      {projectData?.expiry_date ? formatDate(projectData.expiry_date) : 'Not specified'}
                    </p>
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <span className="text-xs text-muted-foreground font-medium">Categories:</span>
                  <div className="mt-2">
                    {projectData?.category ? (
                      Array.isArray(projectData.category) ? (
                        <div className="flex flex-wrap gap-2">
                          {projectData.category.map((cat, index) => (
                            <span key={index} className="inline-block bg-muted/60 text-foreground border border-border/40 px-2.5 py-1 rounded-full text-xs font-medium">
                              {cat}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="inline-block bg-muted/60 text-foreground border border-border/40 px-2.5 py-1 rounded-full text-xs font-medium">
                          {projectData.category}
                        </span>
                      )
                    ) : (
                      <span className="text-xs text-muted-foreground">No categories specified</span>
                    )}
                  </div>
                </div>

                {/* View More Button */}
                <div className="pt-4 border-t border-border/60">
                  <Button
                    onClick={() => {
                      const identifier = projectData?.slug || projectData?.id
                      router.push(`/contractor/projects/view/${identifier}`)
                    }}
                    variant="outline"
                    className="w-full sm:w-auto border-border/60 hover:bg-accent text-foreground"
                  >
                    <Building className="h-4 w-4 mr-2" />
                    View Full Project Details
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Proposal Information Section */}
            <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-6 shadow-xs text-card-foreground">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                  Proposal Information
                </h2>
              </div>
              
              {/* Proposal Header Banner */}
              <div className="mb-6 p-4 sm:p-5 rounded-xl border border-border/60 bg-muted/20">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <StatusIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${proposalStatusConfig.color}`} />
                        <Badge variant="outline" className={`${proposalStatusConfig.badgeClass} border px-2.5 py-0.5 text-xs sm:text-sm font-medium capitalize`}>
                          {proposalStatusConfig.label}
                        </Badge>
                      </div>
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        Submitted {projectData?.proposal?.submitted_date ? formatDate(projectData.proposal.submitted_date) : 'Date not specified'}
                      </span>
                    </div>
                    
                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1.5">
                      {projectData?.proposal?.title || 'Proposal Details'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      For project: {projectData?.project_title || 'Unknown Project'}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    {/* Preview PDF Button */}
                    <Button 
                      onClick={handlePreviewPDF}
                      disabled={isGeneratingPDF}
                      variant="outline"
                      className="border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 px-4 py-2 font-medium text-sm"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {isGeneratingPDF ? 'Generating...' : 'Review Contract'}
                    </Button>
                    
                    {/* Download PDF Button */}
                    <Button 
                      onClick={async () => {
                        if (!projectData?.proposal?.id) return
                        await downloadProposalPDF(projectData.proposal.id)
                      }}
                      variant="outline"
                      className="border-border/60 text-foreground hover:bg-accent px-4 py-2 font-medium text-sm"
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    
                    {projectData?.proposal?.status === 'draft' && (
                      <Button 
                        onClick={handleEditProposal}
                        className="px-4 py-2 font-medium text-sm"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Proposal
                      </Button>
                    )}
                    {(projectData?.proposal?.status === 'rejected' || projectData?.proposal?.status === 'withdrawn' || projectData?.proposal?.status === 'expired') && 
                     (projectData?.status === 'Open for Proposals' || projectData?.status === 'Draft') && (
                      <Button 
                        onClick={handleResubmitProposal}
                        className="px-4 py-2 font-medium text-sm"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Resubmit Proposal
                      </Button>
                    )}
                  </div>
                </div>

                {projectData?.proposal?.status === 'rejected' &&
                  (projectData?.status === 'Open for Proposals' || projectData?.status === 'Draft') &&
                  projectData.proposal.rejection_reason_notes?.trim() && (
                  <div className="mt-4 pt-4 border-t border-border/60">
                    <div className="flex gap-3 rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 sm:p-4">
                      <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">Why it was rejected</p>
                        <p className="text-sm text-rose-900 dark:text-rose-200 whitespace-pre-wrap">
                          {projectData.proposal.rejection_reason_notes.trim()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4 sm:space-y-6">
                {/* Financial Summary */}
                <div>
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                      Financial Summary
                    </h3>
                  </div>
              
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                    <div className="text-center p-3 sm:p-4 rounded-lg border border-border/40 bg-muted/30">
                      <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1">Proposal Amount</p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold font-mono text-foreground">
                        {formatCurrency(projectData?.proposal?.total_amount || 0)}
                      </p>
                    </div>
                    <div className="text-center p-3 sm:p-4 rounded-lg border border-border/40 bg-muted/30">
                      <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1">Project Budget</p>
                      <p className="text-base sm:text-lg lg:text-xl font-semibold font-mono text-foreground/80">
                        {projectData?.budget ? formatCurrency(projectData.budget) : 'Not specified'}
                      </p>
                    </div>
                    <div className="text-center p-3 sm:p-4 rounded-lg border border-border/40 bg-muted/30">
                      <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1">Deposit Required</p>
                      <p className="text-base sm:text-lg lg:text-xl font-bold font-mono text-foreground">
                        {formatCurrency(projectData?.proposal?.deposit_amount || 0)}
                      </p>
                    </div>
                    <div className="text-center p-3 sm:p-4 rounded-lg border border-rose-500/30 bg-rose-500/5">
                      <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1">Delay Penalty</p>
                      <p className="text-base sm:text-lg lg:text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
                        {formatCurrency(projectData?.proposal?.delay_penalty || 0)}/day
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg border border-border/40 bg-muted/20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <span className="text-xs sm:text-sm text-muted-foreground">Subtotal:</span>
                        <span className="ml-0 sm:ml-2 font-semibold font-mono text-sm sm:text-base text-foreground">{formatCurrency(projectData?.proposal?.subtotal_amount || 0)}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <span className="text-xs sm:text-sm text-muted-foreground">GST/HST:</span>
                        <span className="ml-0 sm:ml-2 font-semibold font-mono text-sm sm:text-base text-blue-600 dark:text-blue-400">
                          {formatCurrency((projectData?.proposal?.total_amount || 0) - (projectData?.proposal?.subtotal_amount || 0))}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <span className="text-xs sm:text-sm text-muted-foreground">Delay Penalty:</span>
                        <span className="ml-0 sm:ml-2 font-semibold font-mono text-sm sm:text-base text-rose-600 dark:text-rose-400">
                          {formatCurrency(projectData?.proposal?.delay_penalty || 0)} per day
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <span className="text-xs sm:text-sm text-muted-foreground">Abandonment Penalty:</span>
                        <span className="ml-0 sm:ml-2 font-semibold font-mono text-sm sm:text-base text-rose-600 dark:text-rose-400">
                          {formatCurrency(projectData?.proposal?.abandonment_penalty || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Work Description */}
                <div>
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                      Work Description
                    </h3>
                  </div>
              
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg border border-border/40 bg-muted/20">
                      <h4 className="font-semibold text-foreground text-sm mb-2">
                        Description of Work
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {projectData?.proposal?.description_of_work || "No description provided"}
                      </p>
                    </div>

                    {projectData?.proposal?.notes && (
                      <div className="p-4 rounded-lg border border-border/40 bg-muted/20">
                        <h4 className="font-semibold text-foreground text-sm mb-2">Additional Notes</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {projectData.proposal.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline Details */}
                <div>
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                      Timeline Details
                    </h3>
                  </div>
              
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                    <div className="text-center p-4 rounded-lg border border-border/40 bg-muted/30">
                      <CalendarDays className="h-6 w-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Proposed Start</p>
                      <p className="font-semibold text-foreground text-sm">
                        {formatDate(projectData?.proposal?.proposed_start_date)}
                      </p>
                    </div>
                    <div className="text-center p-4 rounded-lg border border-border/40 bg-muted/30">
                      <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Proposed End</p>
                      <p className="font-semibold text-foreground text-sm">
                        {formatDate(projectData?.proposal?.proposed_end_date)}
                      </p>
                    </div>
                    <div className="text-center p-4 rounded-lg border border-border/40 bg-muted/30">
                      <Timer className="h-6 w-6 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Proposal Expires</p>
                      <p className="font-semibold text-foreground text-sm">
                        {formatDate(projectData?.proposal?.expiry_date)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contract Terms Preview */}
                {projectData?.proposal?.clause_preview_html && (
                  <div>
                    <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                      <FileTextIcon className="h-5 w-5 text-muted-foreground" />
                      <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                        Contract Terms Preview
                      </h3>
                    </div>
                
                    <div className="p-4 rounded-lg border border-border/40 bg-muted/20">
                      <div 
                        className="text-sm text-muted-foreground leading-relaxed prose dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: projectData.proposal.clause_preview_html }}
                      />
                    </div>
                  </div>
                )}

                {/* Attached Files */}
                {projectData?.proposal?.attached_files && projectData.proposal.attached_files.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                      <DownloadIcon className="h-5 w-5 text-muted-foreground" />
                      <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                        Supporting Documents
                      </h3>
                    </div>
                
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {projectData.proposal.attached_files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/20">
                          <div className="flex items-center gap-3 min-w-0">
                            <FileTextIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium text-foreground text-sm truncate">{file.filename}</p>
                              {file.size && (
                                <p className="text-xs text-muted-foreground">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                const response = await fetch(file.url)
                                const blob = await response.blob()
                                const url = window.URL.createObjectURL(blob)
                                const link = document.createElement('a')
                                link.href = url
                                link.download = file.filename
                                document.body.appendChild(link)
                                link.click()
                                document.body.removeChild(link)
                                window.URL.revokeObjectURL(url)
                              } catch (error) {
                                console.error('Download failed:', error)
                                const link = document.createElement('a')
                                link.href = file.url
                                link.download = file.filename
                                link.style.display = 'none'
                                document.body.appendChild(link)
                                link.click()
                                document.body.removeChild(link)
                              }
                            }}
                            className="h-8 px-3 text-xs border-border/60 hover:bg-accent shrink-0 ml-2"
                          >
                            <DownloadIcon className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Project Summary */}
            <div className="rounded-xl border border-border/60 bg-card p-5 sm:p-6 text-card-foreground shadow-xs">
              <div className="flex items-center gap-2 sm:gap-3 mb-4">
                <BuildingIcon className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold text-foreground">Project Summary</h2>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-border/40 bg-muted/20">
                  <h4 className="font-medium text-foreground text-sm mb-3">Project Details</h4>
                  <div className="space-y-2.5 text-xs sm:text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Category:</span>
                      <span className="font-medium text-foreground">
                        {Array.isArray(projectData?.category) 
                          ? projectData.category.join(', ')
                          : projectData?.category || 'Not specified'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Budget:</span>
                      <span className="font-semibold font-mono text-foreground">
                        {projectData?.budget ? formatCurrency(projectData.budget) : 'Not specified'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Permit Required:</span>
                      <span className="font-medium text-foreground">
                        {projectData?.permit_required ? 'Yes' : 'No'}
                      </span>
                    </div>
                    {projectData?.project_type && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Project Type:</span>
                        <span className="font-medium text-foreground">
                          {projectData.project_type}
                        </span>
                      </div>
                    )}
                    {projectData?.visibility_settings && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Visibility:</span>
                        <span className="font-medium text-foreground">
                          {projectData.visibility_settings}
                        </span>
                      </div>
                    )}
                    {projectData?.is_verified_project && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          <Award className="h-3.5 w-3.5 inline mr-1" />
                          Verified Project
                        </span>
                      </div>
                    )}
                    {projectData?.delay_penalty && projectData.delay_penalty > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Delay Penalty:</span>
                        <span className="font-medium font-mono text-rose-600 dark:text-rose-400">
                          {formatCurrency(projectData.delay_penalty)}/day
                        </span>
                      </div>
                    )}
                    {projectData?.abandonment_penalty && projectData.abandonment_penalty > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Abandonment:</span>
                        <span className="font-medium font-mono text-rose-600 dark:text-rose-400">
                          {formatCurrency(projectData.abandonment_penalty)}
                        </span>
                      </div>
                    )}
                    {projectData?.location && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Location:</span>
                        <span className="font-medium text-foreground">
                          {projectData.location.city && projectData.location.province
                            ? `${projectData.location.city}, ${projectData.location.province}`
                            : projectData.location.address || 'Not specified'
                          }
                        </span>
                      </div>
                    )}
                    {projectData?.start_date && projectData?.end_date && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Timeline:</span>
                        <span className="font-medium text-foreground">
                          {new Date(projectData.start_date).toLocaleDateString()} - {new Date(projectData.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {projectData?.decision_date && (
                       <div className="flex justify-between items-center">
                         <span className="text-muted-foreground">Decision Date:</span>
                         <span className="font-medium text-foreground">
                           {new Date(projectData.decision_date).toLocaleDateString()}
                         </span>
                       </div>
                     )}
                     {projectData?.expiry_date && (
                       <div className="flex justify-between items-center">
                         <span className="text-muted-foreground">Expiry Date:</span>
                         <span className="font-medium text-foreground">
                           {new Date(projectData.expiry_date).toLocaleDateString()}
                         </span>
                       </div>
                     )}
                     {projectData?.substantial_completion && (
                       <div className="flex justify-between items-center">
                         <span className="text-muted-foreground">Substantial Completion:</span>
                         <span className="font-medium text-foreground">
                           {new Date(projectData.substantial_completion).toLocaleDateString()}
                         </span>
                       </div>
                     )}
                  </div>
                </div>
              </div>
            </div>

            {/* Proposal Status */}
            <div className="rounded-xl border border-border/60 bg-card p-5 sm:p-6 text-card-foreground shadow-xs">
              <div className="flex items-center gap-2 sm:gap-3 mb-4">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold text-foreground">
                  Proposal Status
                </h2>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-border/40 bg-muted/20">
                  <div className="mb-4">
                    <Badge variant="outline" className={`${proposalStatusConfig.badgeClass} border font-medium px-2.5 py-0.5 text-xs capitalize`}>
                      {proposalStatusConfig.label}
                    </Badge>
                    {projectData?.proposal?.status === 'accepted' && (
                      <div className="mt-2">
                        <ContractReviewBadge
                          contractReviewed={projectData.proposal.contract_reviewed}
                          homeownerContractReviewed={projectData.proposal.homeowner_contract_reviewed}
                          userRole="contractor"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2.5 text-xs sm:text-sm">
                    <div>
                      <span className="text-muted-foreground">Submitted:</span>
                      <p className="font-medium text-foreground">{formatDate(projectData?.proposal?.submitted_date)}</p>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">Last Updated:</span>
                      <p className="font-medium text-foreground">{formatDate(projectData?.proposal?.last_updated)}</p>
                    </div>
                    
                    {projectData?.proposal?.viewed_date && (
                      <div>
                        <span className="text-muted-foreground">Viewed:</span>
                        <p className="font-medium text-foreground">{formatDate(projectData.proposal.viewed_date)}</p>
                      </div>
                    )}

                    {projectData?.proposal?.status === 'rejected' &&
                      projectData.proposal.rejection_reason_notes?.trim() && (
                      <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/5 p-3.5">
                        <div className="flex gap-2.5">
                          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                          <div className="space-y-1.5 min-w-0">
                            <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">Homeowner feedback</p>
                            {projectData.proposal.rejected_date && (
                              <p className="text-xs text-muted-foreground">
                                Rejected on {formatDate(projectData.proposal.rejected_date)}
                              </p>
                            )}
                            <p className="text-xs text-rose-900 dark:text-rose-200 whitespace-pre-wrap">
                              {projectData.proposal.rejection_reason_notes.trim()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Resubmit availability notice */}
                    {(projectData?.proposal?.status === 'rejected' || projectData?.proposal?.status === 'withdrawn' || projectData?.proposal?.status === 'expired') && 
                     projectData?.status !== 'Open for Proposals' && projectData?.status !== 'Draft' && (
                      <div className="mt-4 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                            Resubmit Not Available
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          This project is {projectData?.status?.toLowerCase()} and no longer accepting new proposals.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Homeowner Information */}
            {projectData?.homeowner && (
              <div className="rounded-xl border border-border/60 bg-card p-5 sm:p-6 text-card-foreground shadow-xs">
                <div className="flex items-center gap-2 sm:gap-3 mb-4">
                  <UserCheck className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-xl font-semibold text-foreground">
                    Homeowner
                  </h2>
                </div>
                
                <div className="space-y-4">
                  <div className="text-center p-4 rounded-lg border border-border/40 bg-muted/20">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                      <UserCheck className="h-6 w-6" />
                    </div>
                    <h4 className="font-semibold text-foreground text-sm">
                      {projectData.homeowner.full_name}
                    </h4>
                    {projectData.homeowner.email && (
                      <p className="text-xs text-muted-foreground mt-0.5">{projectData.homeowner.email}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      {/* PDF Preview Modal - Larger Size */}
      <PDFPreviewModal
        isOpen={showPDFPreview}
        onClose={() => {
          setShowPDFPreview(false)
          setPreviewPDFBlob(null)
          setPreviewTitle('')
          setContractReviewed(false)
        }}
        pdfBlob={previewPDFBlob}
        title={previewTitle}
        allowDownload={false}
        showConfirmContract={projectData?.proposal?.status === PROPOSAL_STATUSES.ACCEPTED}
        proposalId={projectData?.proposal?.id}
        contractReviewed={contractReviewed}
        homeownerContractReviewed={projectData?.proposal?.homeowner_contract_reviewed || false}
        userRole="contractor"
        onContractConfirmed={() => {
          setContractReviewed(true)
          // Refresh the page data to show updated status
          window.location.reload()
        }}
        className="max-w-[95vw] w-full h-[95vh]"
      />
    </div>
  )
}