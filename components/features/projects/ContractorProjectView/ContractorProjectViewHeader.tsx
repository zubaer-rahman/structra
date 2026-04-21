'use client'

import { useState, useEffect } from 'react'
import { Project } from '@/server/database/interfaces'
import { User } from '@/server/database/interfaces/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, 
  Clock, 
  User as UserIcon,
  Send,
  CheckCircle
} from 'lucide-react'
import { getProjectStatusConfig } from '@/utils/helpers'
import { formatCurrency, formatDate } from '@/lib/utils'
import ProjectImageGallery from '../HomeownerProjectView/ProjectImageGallery'
import { VerificationRedirectModal } from '@/components/shared/modals/VerificationRedirectModal'
import { trpc } from '@/utils/trpc'
import { toast } from 'sonner'
import { ProjectCompletionBadge } from '../ProjectCompletionBadge'
import { clientConfig } from '@/config/client-env'
import { useStripe } from '@/hooks/useStripe'
import { PROPOSAL_STATUSES } from '@/utils/constants'

interface ContractorProjectViewHeaderProps {
  project: Project
  user: User
  onSubmitProposal: () => void
}

export function ContractorProjectViewHeader({
  project,
  user,
  onSubmitProposal
}: ContractorProjectViewHeaderProps) {
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  
  // Check for verification success/cancel parameters in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const verificationStatus = urlParams.get('verification')
      const paymentStatus = urlParams.get('payment')
      
      if (verificationStatus === 'success') {
        setShowSuccessMessage(true)
        // Remove the parameter from URL
        const newUrl = window.location.pathname
        window.history.replaceState({}, '', newUrl)
        
        // Auto-hide after 5 seconds
        setTimeout(() => setShowSuccessMessage(false), 5000)
      }
      
      if (paymentStatus === 'success') {
        toast.success('Payment successful! You now have access to this project.')
        // Remove the parameter from URL
        const newUrl = window.location.pathname
        window.history.replaceState({}, '', newUrl)
      } else if (paymentStatus === 'cancelled') {
        toast.error('Payment was cancelled.')
        // Remove the parameter from URL
        const newUrl = window.location.pathname
        window.history.replaceState({}, '', newUrl)
      }
    }
  }, [])
  
  // Check verification status - handle errors gracefully
  const { data: verificationStatus, isLoading: verificationLoading, error: verificationError } = trpc.users.checkVerificationStatus.useQuery(undefined, {
    retry: false,
    enabled: !!user, // Only run query if user is authenticated
  })

  // Check project access status
  const { data: projectAccess, isLoading: accessLoading } = trpc.projects.checkProjectAccess.useQuery(
    {
      projectId: project.id,
      userId: user?.id || ''
    },
    {
      enabled: !!user && !!project.id,
      retry: false
    }
  )

  // Check contractor's proposals for this project
  const { data: contractorProposals, isLoading: proposalsLoading } = trpc.proposals.getByContractorAndProject.useQuery(
    {
      projectId: project.id,
      contractorId: user?.id || ''
    },
    {
      enabled: !!user && !!project.id,
      retry: false
    }
  )

  // Debug logging removed to clean up console output
  
  const projectStatusConfig = getProjectStatusConfig(project.status)

  // Determine if submit button should be shown based on proposal status
  const shouldShowSubmitButton = () => {
    if (!contractorProposals || contractorProposals.length === 0) {
      return true // No proposals exist, show submit button
    }

    // Get the most recent proposal
    const latestProposal = contractorProposals[0]
    
    // Hide submit button if proposal is accepted or submitted
    if (latestProposal.status === PROPOSAL_STATUSES.ACCEPTED || 
        latestProposal.status === PROPOSAL_STATUSES.SUBMITTED) {
      return false
    }

    // Show submit button if proposal is rejected, expired, or withdrawn
    if (latestProposal.status === PROPOSAL_STATUSES.REJECTED || 
        latestProposal.status === PROPOSAL_STATUSES.EXPIRED || 
        latestProposal.status === PROPOSAL_STATUSES.WITHDRAWN) {
      return true
    }

    // For any other status (like viewed), hide the button
    return false
  }

  const { createCheckoutSession } = useStripe()

  const handlePayForProjectAccess = async () => {
    if (!user || !project.id) {
      toast.error('Please log in to access this project')
      return
    }

    setIsProcessingPayment(true)
    
    try {
      // Calculate amount based on verification status
      const baseAmount = clientConfig.pricing.projectAccessFee
      const verificationFee = verificationStatus?.isVerified ? 0 : clientConfig.pricing.contractorVerificationAnnual
      const totalAmount = baseAmount + verificationFee
      
      const successUrl = `${window.location.origin}/contractor/projects/view/${project.id}?payment=success`
      const cancelUrl = `${window.location.origin}/contractor/projects/view/${project.id}?payment=cancelled`
      
      await createCheckoutSession({
        amount: totalAmount,
        description: `Project Access${verificationStatus?.isVerified ? '' : ' + Contractor Verification'}`,
        successUrl,
        cancelUrl,
        metadata: {
          projectId: project.id,
          userId: user.id,
          paymentType: 'project_access',
          includesVerification: (!verificationStatus?.isVerified).toString()
        }
      })
    } catch (error) {
      console.error('Payment error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to process payment')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const handleSubmitProposal = () => {
    // If there's an authentication error, user needs to log in first
    if (verificationError?.data?.code === 'UNAUTHORIZED') {
      // Redirect to login or show login prompt
      // For now, just proceed with proposal submission
      // You can add login redirect logic here
      onSubmitProposal()
      return
    }

    // Check if user has access to this project
    if (!projectAccess?.hasAccess) {
      toast.error('You need to purchase access to this project before submitting a proposal')
      return
    }
    
    // Check if user is verified contractor
    if (verificationStatus?.isVerified) {
      // User is verified, proceed with proposal submission
      onSubmitProposal()
    } else {
      // User is not verified, show verification modal
      setShowVerificationModal(true)
    }
  }

  // Determine button text and state
  const getButtonText = () => {
    if (!user) return 'Submit Proposal' // User not authenticated
    if (verificationLoading || accessLoading) return 'Checking...'
    if (verificationError?.data?.code === 'UNAUTHORIZED') return 'Submit Proposal'
    
    // Check if user has project access
    if (!projectAccess?.hasAccess) {
      const isVerified = verificationStatus?.isVerified
      const projectAccessFee = clientConfig.pricing.getProjectAccessFeeInDollars()
       const verificationFee = clientConfig.pricing.getContractorVerificationAnnualInDollars()
       const price = isVerified ? `$${projectAccessFee.toFixed(2)}` : `$${(projectAccessFee + verificationFee).toFixed(2)}`
      return `Pay ${price} for Project Access`
    }
    
    if (verificationStatus?.isVerified) return 'Submit Proposal'
    return 'Submit Proposal (Verification Required)'
  }

  const isButtonDisabled = (verificationLoading || accessLoading || isProcessingPayment || proposalsLoading) && !!user
  
  // Determine which action to take when button is clicked
  const getButtonAction = () => {
    if (!user) return handleSubmitProposal
    if (!projectAccess?.hasAccess) return handlePayForProjectAccess
    return handleSubmitProposal
  }
  
  // Determine button color based on action
  const getButtonClassName = () => {
    if (!user || projectAccess?.hasAccess) {
      return 'w-full bg-orange-600 hover:bg-orange-700 text-white'
    }
    return 'w-full bg-green-600 hover:bg-green-700 text-white'
  }

  return (
    <>
      {/* Project Completion Badge */}
      <ProjectCompletionBadge 
        substantialCompletion={project.substantial_completion?.toString() || null}
        projectStatus={project.status}
      />

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <h3 className="text-sm font-medium text-green-800">Verification Successful!</h3>
              <p className="text-sm text-green-700">
                Your contractor verification has been completed. You can now submit proposals to projects.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSuccessMessage(false)}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              ×
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
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
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 leading-tight">
                  {project.project_title}
                </h1>
              </div>

              {/* Project Type Badge */}
              <div>
                <span className="bg-orange-100 text-orange-700 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                  {project.project_type?.toUpperCase() || 'PROJECT'}
                </span>
              </div>

              {/* Project Status */}
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-gray-600">Status:</span>
                <Badge className={`${projectStatusConfig.color} border-0`}>
                  {projectStatusConfig.label}
                </Badge>
              </div>

              {/* Budget */}
              <div className="flex items-center gap-2">
                <div>
                  <span className="text-xl sm:text-2xl font-bold text-green-600">
                    {formatCurrency(project.budget || 0)}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500 ml-2">
                    Budget
                  </span>
                </div>
              </div>

              {/* Delay Penalty */}
              {project.delay_penalty > 0 && (
                <div className="flex items-center gap-2">
                  <div>
                    <span className="text-lg sm:text-xl font-bold text-orange-600">
                      {formatCurrency(project.delay_penalty)}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-500 ml-2">
                      Delay Penalty/Day
                    </span>
                  </div>
                </div>
              )}

              {/* Location */}
              {project.location.city || project.location.province ? (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 sm:w-5 sm:h-5 text-gray-500" />
                  <span className="text-sm sm:text-base text-gray-700">
                    {[project.location.city, project.location.province]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              ) : null}

              {/* Timeline */}
              <div className="flex items-center gap-2">
                <Clock className="h-4 sm:w-5 sm:h-5 text-gray-500" />
                <div>
                  <span className="text-sm sm:text-base text-gray-700">
                    {project.start_date && project.end_date
                      ? `${formatDate(project.start_date)} - ${formatDate(project.end_date)}`
                      : 'Timeline not specified'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Actions & Homeowner Info */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              {/* Action Buttons */}
              <div className="space-y-3">
                {shouldShowSubmitButton() ? (
                  <Button 
                    onClick={getButtonAction()}
                    disabled={isButtonDisabled}
                    className={getButtonClassName()}
                  >
                    <Send className="h-4 mr-2" />
                    {isProcessingPayment ? 'Processing...' : getButtonText()}
                  </Button>
                ) : (
                  <div className="text-center py-3 px-4 bg-gray-50 rounded-lg border">
                    <p className="text-sm text-gray-600">
                      {contractorProposals && contractorProposals.length > 0 
                        ? `You have already submitted a proposal (${contractorProposals[0].status})`
                        : 'Loading proposal status...'
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Homeowner Information */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <UserIcon className="h-4 text-indigo-600" />
                  <span className="text-sm font-medium text-gray-900">Posted by</span>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <UserIcon className="h-6  text-indigo-600" />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900">
                    {project.homeowner?.full_name || 'Unknown Homeowner'}
                  </h4>
                  {project.homeowner?.email && (
                    <p className="text-xs text-gray-600">{project.homeowner.email}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Redirect Modal - only show if user is authenticated but not verified */}
      {user && verificationStatus && !verificationStatus.isVerified && (
        <VerificationRedirectModal 
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          user={user}
        />
      )}
    </>
  )
}
