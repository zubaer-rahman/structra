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
            location_geom,
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
          setError('Project not found')
          return
        }

        // Get the full proposal details
        const { data: fullProposalData, error: fullProposalError } = await supabase
          .from('proposals')
          .select(`
            *,
            project:projects (
              id,
              project_title,
              statement_of_work,
              category,
              location,
              location_geom,
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
          setError(fullProposalError.message)
          return
        }

        // Transform to ExtendedProjectWithProposal structure
        const transformedData: ExtendedProjectWithProposal = {
          ...projectData,
          created_at: (projectData as any).created_at || new Date().toISOString(),
          location: {
            ...projectData.location,
            ...(projectData.location_geom?.coordinates && {
              lat: projectData.location_geom.coordinates[1],
              lng: projectData.location_geom.coordinates[0]
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
    const statusConfigs: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string }> = {
      [PROPOSAL_STATUSES.SUBMITTED]: { 
        label: 'Submitted', 
        icon: FileText, 
        color: 'text-blue-700', 
        bgColor: 'bg-blue-50' 
      },
      [PROPOSAL_STATUSES.ACCEPTED]: { 
        label: 'Accepted', 
        icon: CheckCircle2, 
        color: 'text-green-700', 
        bgColor: 'bg-green-50' 
      },
      [PROPOSAL_STATUSES.REJECTED]: { 
        label: 'Rejected', 
        icon: XCircle, 
        color: 'text-red-700', 
        bgColor: 'bg-red-50' 
      },
      [PROPOSAL_STATUSES.WITHDRAWN]: { 
        label: 'Withdrawn', 
        icon: AlertCircle, 
        color: 'text-gray-700', 
        bgColor: 'bg-gray-50' 
      },
      'viewed': { 
        label: 'Viewed', 
        icon: CheckCircle2, 
        color: 'text-purple-700', 
        bgColor: 'bg-purple-50' 
      },
      'draft': { 
        label: 'Draft', 
        icon: FileText, 
        color: 'text-gray-700', 
        bgColor: 'bg-gray-50' 
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
          project:projects(*),
          homeowner_details:users!proposals_homeowner_fkey(*),
          project_details:projects(*)
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" variant="default" text="Loading proposal details..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Proposal</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  if (!projectData?.proposal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Proposal Not Found</h2>
          <p className="text-gray-600 mb-4">The requested proposal could not be found.</p>
          <Button onClick={() => router.push('/contractor/my-projects')}>View All Proposals</Button>
        </div>
      </div>
    )
  }

  if (userRole !== USER_ROLES.CONTRACTOR) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don&apos;t have permission to view this proposal.</p>
        </div>
      </div>
    )
  }

  const proposalStatusConfig = getStatusConfig(projectData?.proposal?.status || '')
  const projectStatusConfig = projectData ? getProjectStatusConfig(projectData.status) : null
  const StatusIcon = proposalStatusConfig.icon

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        <div className="bg-white px-2 sm:px-4 py-4 mb-4 sm:mb-6">
          <div className="max-w-7xl mx-auto">
            <Breadcrumbs
              items={[
                { label: 'Dashboard', href: '/contractor/dashboard' },
                { label: 'My Projects', href: '/contractor/my-projects' },
                { label: projectData?.project_title || 'Project Proposal', href: '#' }
              ]}
            />
          </div>
        </div>


        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Project & Proposal Details */}
          <div className="xl:col-span-2 space-y-4 sm:space-y-6">
            {/* Project Information Section */}
            <div className="bg-white p-4 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <Building className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-black">
                  Project Information
                </h2>
              </div>
              
              <div className="space-y-4">
                {/* Project Title */}
                <div>
                  <h3 className="text-xl font-bold text-black mb-2">
                    {projectData?.project_title || 'Project Title'}
                  </h3>
                </div>

                {/* Project Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 font-medium mb-1">Location</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {projectData?.location?.city || 'Not specified'}
                    </p>
                  </div>
                  
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <p className="text-xs text-gray-600 font-medium mb-1">Budget</p>
                    <p className="text-sm font-bold text-black">
                      {projectData?.budget ? formatCurrency(projectData.budget) : 'Not specified'}
                    </p>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 font-medium mb-1">Posted</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {projectData?.created_at ? formatDate(projectData.created_at) : 'Not specified'}
                    </p>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 font-medium mb-1">Expires</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {projectData?.expiry_date ? formatDate(projectData.expiry_date) : 'Not specified'}
                    </p>
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <span className="text-sm text-gray-600 font-medium">Categories:</span>
                  <div className="mt-2">
                    {projectData?.category ? (
                      Array.isArray(projectData.category) ? (
                        <div className="flex flex-wrap gap-2">
                          {projectData.category.map((cat, index) => (
                            <span key={index} className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                              {cat}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                          {projectData.category}
                        </span>
                      )
                    ) : (
                      <span className="text-sm text-gray-500">No categories specified</span>
                    )}
                  </div>
                </div>

                {/* View More Button */}
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    onClick={() => {
                      const identifier = projectData?.slug || projectData?.id
                      router.push(`/contractor/projects/view/${identifier}`)
                    }}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    <Building className="h-4 w-4 mr-2" />
                    View Full Project Details
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Proposal Information Section */}
            <div className="bg-white p-4 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-black">
                  Proposal Information
                </h2>
              </div>
              
              {/* Proposal Header */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                      <div className="flex items-center gap-2 sm:gap-4">
                        <StatusIcon className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
                        <Badge className="bg-black text-white border-0 px-2 sm:px-3 py-1 text-xs sm:text-sm">
                          {proposalStatusConfig.label}
                        </Badge>
                      </div>
                      <span className="text-xs sm:text-sm text-gray-600">
                        Submitted {projectData?.proposal?.submitted_date ? formatDate(projectData.proposal.submitted_date) : 'Date not specified'}
                      </span>
                    </div>
                    
                    <h3 className="text-lg sm:text-xl font-bold text-black mb-2">
                      {projectData?.proposal?.title || 'Proposal Details'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      For project: {projectData?.project_title || 'Unknown Project'}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    {/* Preview PDF Button */}
                    <Button 
                      onClick={handlePreviewPDF}
                      disabled={isGeneratingPDF}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 font-medium text-sm"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {isGeneratingPDF ? 'Generating...' : 'Review Contract'}
                    </Button>
                    
                    {/* Download PDF Button - only show if both contractor and homeowner have reviewed */}
                    {projectData?.proposal?.contract_reviewed && projectData?.proposal?.homeowner_contract_reviewed && (
                      <Button 
                        onClick={async () => {
                          if (!projectData?.proposal?.id) return
                          await downloadProposalPDF(projectData.proposal.id)
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 font-medium text-sm"
                      >
                        <FileDown className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                    )}
                    
                    
                    {projectData?.proposal?.status === 'draft' && (
                      <Button 
                        onClick={handleEditProposal}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 font-medium text-sm"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Proposal
                      </Button>
                    )}
                    {(projectData?.proposal?.status === 'rejected' || projectData?.proposal?.status === 'withdrawn' || projectData?.proposal?.status === 'expired') && 
                     (projectData?.status === 'Open for Proposals' || projectData?.status === 'Draft') && (
                      <Button 
                        onClick={handleResubmitProposal}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 font-medium text-sm"
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
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50/90 p-3 sm:p-4">
                      <AlertCircle className="h-5 w-5 shrink-0 text-red-700 mt-0.5" />
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-semibold text-red-900">Why it was rejected</p>
                        <p className="text-sm text-red-950 whitespace-pre-wrap">
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
                    <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
                    <h3 className="text-lg sm:text-xl font-bold text-black">
                      Financial Summary
                    </h3>
                  </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                <div className="text-center p-3 sm:p-4 bg-orange-50">
                  <p className="text-xs sm:text-sm text-gray-600 font-medium mb-1 sm:mb-2">Proposal Amount</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-black">
                    {formatCurrency(projectData?.proposal?.total_amount || 0)}
                  </p>
                </div>
                <div className="text-center p-3 sm:p-4 bg-gray-50">
                  <p className="text-xs sm:text-sm text-gray-600 font-medium mb-1 sm:mb-2">Project Budget</p>
                  <p className="text-base sm:text-lg lg:text-xl font-semibold text-gray-700">
                    {projectData?.budget ? formatCurrency(projectData.budget) : 'Not specified'}
                  </p>
                </div>
                <div className="text-center p-3 sm:p-4 bg-gray-50">
                  <p className="text-xs sm:text-sm text-gray-600 font-medium mb-1 sm:mb-2">Deposit Required</p>
                  <p className="text-base sm:text-lg lg:text-xl font-bold text-black">
                    {formatCurrency(projectData?.proposal?.deposit_amount || 0)}
                  </p>
                </div>
                <div className="text-center p-3 sm:p-4 bg-red-50">
                  <p className="text-xs sm:text-sm text-gray-600 font-medium mb-1 sm:mb-2">Delay Penalty</p>
                  <p className="text-base sm:text-lg lg:text-xl font-bold text-red-600">
                    {formatCurrency(projectData?.proposal?.delay_penalty || 0)}/day
                  </p>
                </div>
              </div>
              
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <span className="text-xs sm:text-sm text-gray-600">Subtotal:</span>
                    <span className="ml-0 sm:ml-2 font-semibold text-sm sm:text-base">{formatCurrency(projectData?.proposal?.subtotal_amount || 0)}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <span className="text-xs sm:text-sm text-gray-600">GST/HST:</span>
                    <span className="ml-0 sm:ml-2 font-semibold text-sm sm:text-base text-blue-600">
                      {formatCurrency((projectData?.proposal?.total_amount || 0) - (projectData?.proposal?.subtotal_amount || 0))}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <span className="text-xs sm:text-sm text-gray-600">Delay Penalty:</span>
                    <span className="ml-0 sm:ml-2 font-semibold text-sm sm:text-base text-red-600">
                      {formatCurrency(projectData?.proposal?.delay_penalty || 0)} per day
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <span className="text-xs sm:text-sm text-gray-600">Abandonment Penalty:</span>
                    <span className="ml-0 sm:ml-2 font-semibold text-sm sm:text-base text-red-600">
                      {formatCurrency(projectData?.proposal?.abandonment_penalty || 0)}
                    </span>
                  </div>
                </div>
              </div>
                </div>

                {/* Work Description */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <FileText className="h-5 w-5 text-black" />
                    <h3 className="text-lg sm:text-xl font-bold text-black">
                      Work Description
                    </h3>
                  </div>
              
              <div className="space-y-6">
                <div className="p-4 bg-gray-50">
                  <h3 className="font-semibold text-black mb-3">
                    Description of Work
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {projectData?.proposal?.description_of_work || "No description provided"}
                  </p>
                </div>

                {projectData?.proposal?.notes && (
                  <div className="p-4 bg-gray-50">
                    <h3 className="font-semibold text-black mb-3">Additional Notes</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {projectData.proposal.notes}
                    </p>
                  </div>
                )}
              </div>
                </div>

                {/* Timeline Details */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <Calendar className="h-5 w-5 text-black" />
                    <h3 className="text-lg sm:text-xl font-bold text-black">
                      Timeline Details
                    </h3>
                  </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50">
                  <CalendarDays className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">Proposed Start</p>
                  <p className="font-semibold text-gray-900">
                    {formatDate(projectData?.proposal?.proposed_start_date)}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50">
                  <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">Proposed End</p>
                  <p className="font-semibold text-gray-900">
                    {formatDate(projectData?.proposal?.proposed_end_date)}
                  </p>
                </div>
                <div className="text-center p-4 bg-orange-50">
                  <Timer className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">Proposal Expires</p>
                  <p className="font-semibold text-gray-900">
                    {formatDate(projectData?.proposal?.expiry_date)}
                  </p>
                </div>
              </div>
                </div>

                {/* Contract Terms Preview */}
                {projectData?.proposal?.clause_preview_html && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <FileTextIcon className="h-5 w-5 text-black" />
                      <h3 className="text-lg sm:text-xl font-bold text-black">
                        Contract Terms Preview
                      </h3>
                    </div>
                
                    <div className="p-4 bg-gray-50">
                      <p className="text-gray-700 leading-relaxed">
                        {projectData.proposal.clause_preview_html}
                      </p>
                    </div>
                  </div>
                )}

                {/* Attached Files */}
                {projectData?.proposal?.attached_files && projectData.proposal.attached_files.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <DownloadIcon className="h-5 w-5 text-black" />
                      <h3 className="text-lg sm:text-xl font-bold text-black">
                        Supporting Documents
                      </h3>
                    </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projectData.proposal.attached_files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileTextIcon className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium text-black">{file.filename}</p>
                          {file.size && (
                            <p className="text-sm text-gray-500">
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
                            // Fetch the file as a blob to force download
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
                            // Fallback to direct link if fetch fails
                            const link = document.createElement('a')
                            link.href = file.url
                            link.download = file.filename
                            link.style.display = 'none'
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                          }
                        }}
                        className="h-8 px-3 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
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
          <div className="space-y-6">
            {/* Project Summary */}
            <div className="bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <BuildingIcon className="h-5 w-5 text-black" />
                <h2 className="text-2xl font-bold text-black">Project Summary</h2>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-50">
                  <h4 className="font-medium text-black mb-2">Project Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium">
                        {Array.isArray(projectData?.category) 
                          ? projectData.category.join(', ')
                          : projectData?.category || 'Not specified'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Budget:</span>
                      <span className="font-medium">
                        {projectData?.budget ? formatCurrency(projectData.budget) : 'Not specified'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Permit Required:</span>
                      <span className="font-medium">
                        {projectData?.permit_required ? 'Yes' : 'No'}
                      </span>
                    </div>
                    {projectData?.project_type && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Project Type:</span>
                        <span className="font-medium">
                          {projectData.project_type}
                        </span>
                      </div>
                    )}
                    {projectData?.visibility_settings && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Visibility:</span>
                        <span className="font-medium">
                          {projectData.visibility_settings}
                        </span>
                      </div>
                    )}
                    {projectData?.is_verified_project && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium text-green-600">
                          <Award className="h-4 w-4 inline mr-1" />
                          Verified Project
                        </span>
                      </div>
                    )}
                    {projectData?.delay_penalty && projectData.delay_penalty > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Project Delay Penalty:</span>
                        <span className="font-medium text-red-600">
                          {formatCurrency(projectData.delay_penalty)}/day
                        </span>
                      </div>
                    )}
                    {projectData?.abandonment_penalty && projectData.abandonment_penalty > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Project Abandonment Penalty:</span>
                        <span className="font-medium text-red-600">
                          {formatCurrency(projectData.abandonment_penalty)}
                        </span>
                      </div>
                    )}
                    {projectData?.location && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Location:</span>
                        <span className="font-medium">
                          {projectData.location.city && projectData.location.province
                            ? `${projectData.location.city}, ${projectData.location.province}`
                            : projectData.location.address || 'Not specified'
                          }
                        </span>
                      </div>
                    )}
                    {projectData?.start_date && projectData?.end_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Timeline:</span>
                        <span className="font-medium">
                          {new Date(projectData.start_date).toLocaleDateString()} - {new Date(projectData.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {projectData?.decision_date && (
                       <div className="flex justify-between">
                         <span className="text-gray-600">Decision Date:</span>
                         <span className="font-medium">
                           {new Date(projectData.decision_date).toLocaleDateString()}
                         </span>
                       </div>
                     )}
                     {projectData?.expiry_date && (
                       <div className="flex justify-between">
                         <span className="text-gray-600">Expiry Date:</span>
                         <span className="font-medium">
                           {new Date(projectData.expiry_date).toLocaleDateString()}
                         </span>
                       </div>
                     )}
                     {projectData?.substantial_completion && (
                       <div className="flex justify-between">
                         <span className="text-gray-600">Substantial Completion:</span>
                         <span className="font-medium">
                           {new Date(projectData.substantial_completion).toLocaleDateString()}
                         </span>
                       </div>
                     )}
                  </div>
                </div>
                

              </div>
            </div>

            {/* Proposal Status */}
            <div className="bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="h-5 w-5 text-black" />
                <h2 className="text-2xl font-bold text-black">
                  Proposal Status
                </h2>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-50">
                  <div className="mb-4">
                    <Badge className={`${proposalStatusConfig.bgColor} ${proposalStatusConfig.color} border-0`}>
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
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-600">Submitted:</span>
                      <p className="font-medium">{formatDate(projectData?.proposal?.submitted_date)}</p>
                    </div>
                    
                    <div>
                      <span className="text-gray-600">Last Updated:</span>
                      <p className="font-medium">{formatDate(projectData?.proposal?.last_updated)}</p>
                    </div>
                    
                    {projectData?.proposal?.viewed_date && (
                      <div>
                        <span className="text-gray-600">Viewed:</span>
                        <p className="font-medium">{formatDate(projectData.proposal.viewed_date)}</p>
                      </div>
                    )}

                    {projectData?.proposal?.status === 'rejected' &&
                      projectData.proposal.rejection_reason_notes?.trim() && (
                      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                        <div className="flex gap-3">
                          <AlertCircle className="h-5 w-5 shrink-0 text-red-700 mt-0.5" />
                          <div className="space-y-2 min-w-0">
                            <p className="text-sm font-semibold text-red-900">Homeowner feedback</p>
                            {projectData.proposal.rejected_date && (
                              <p className="text-xs text-red-800">
                                Rejected on {formatDate(projectData.proposal.rejected_date)}
                              </p>
                            )}
                            <p className="text-sm text-red-950 whitespace-pre-wrap">
                              {projectData.proposal.rejection_reason_notes.trim()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Resubmit availability notice */}
                    {(projectData?.proposal?.status === 'rejected' || projectData?.proposal?.status === 'withdrawn' || projectData?.proposal?.status === 'expired') && 
                     projectData?.status !== 'Open for Proposals' && projectData?.status !== 'Draft' && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm text-yellow-800 font-medium">
                            Resubmit Not Available
                          </span>
                        </div>
                        <p className="text-xs text-yellow-700 mt-1">
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
              <div className="bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <UserCheck className="h-5 w-5 text-black" />
                  <h2 className="text-2xl font-bold text-black">
                    Homeowner
                  </h2>
                </div>
                
                <div className="space-y-4">
                  <div className="text-center p-4 bg-gray-50">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <UserCheck className="h-6 w-6 text-indigo-600" />
                    </div>
                    <h4 className="font-semibold text-black">
                      {projectData.homeowner.full_name}
                    </h4>
                    {projectData.homeowner.email && (
                      <p className="text-sm text-gray-600">{projectData.homeowner.email}</p>
                    )}
                  </div>
                  
                  {/* Contact & Actions - Hidden/Commented as requested */}
                  {/* 
                  <div className="space-y-3">
                    <Button 
                      onClick={handleContactHomeowner}
                      variant="outline" 
                      className="w-full"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact Homeowner
                    </Button>
                    
                    {projectData?.homeowner?.phone_number && (
                      <Button 
                        variant="outline" 
                        className="w-full"
                      >
                        <PhoneIcon className="h-4 w-4 mr-2" />
                        Call Homeowner
                    </Button>
                    )}
                  </div>
                  */}
                </div>
              </div>
            )}

          </div>
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