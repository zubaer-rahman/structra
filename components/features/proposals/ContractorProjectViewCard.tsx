'use client'

import { Calendar, MapPin, DollarSign, Eye, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BaseProject } from '@/server/services/ProjectService'
import { getProjectStatusConfig, capitalizeFirst } from '@/utils/helpers'
import { useState } from 'react'
import { trpc } from '@/utils/trpc'
import { validateContractorProfileForVerification } from '@/utils/validation'
import { VerificationRedirectModal } from '@/components/shared/modals/VerificationRedirectModal'
import { ProfileCompletionModal } from '@/components/shared/modals/ProfileCompletionModal'
import { ProjectPaymentModal } from '@/components/shared/modals/ProjectPaymentModal'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

interface ContractorProjectViewCardProps {
  project: BaseProject
  onViewDetails: (project: BaseProject) => void
  formatCurrency: (amount: number) => string
  formatDate: (date: Date | string) => string
  hideBadges?: boolean
}

export default function ContractorProjectViewCard({ 
  project, 
  onViewDetails,
  formatCurrency,
  formatDate,
  hideBadges = false
}: ContractorProjectViewCardProps) {
  const { user } = useAuth()
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [showProfileCompletionModal, setShowProfileCompletionModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  
  // Fetch user profile data
  const { data: userProfile, isLoading: userProfileLoading } = trpc.users.getProfile.useQuery(undefined, {
    enabled: !!user?.id,
  })
  
  // Fetch contractor profile data
  const { data: contractorProfile, isLoading: contractorProfileLoading } = trpc.users.getContractorProfile.useQuery(undefined, {
    enabled: !!user?.id,
  })
  
  // Get verification status
  const { data: verificationStatus, isLoading: verificationLoading } = trpc.users.checkVerificationStatus.useQuery(undefined, {
    enabled: !!user?.id,
  })
  
  
  const handleViewDetailsClick = async () => {
    if (!user) {
      toast.error('Please log in to view project details')
      return
    }
    
    // Wait for all data to load before performing validations
    if (userProfileLoading || contractorProfileLoading || verificationLoading) {
      return // Don't proceed if data is still loading
    }
    
    // Check profile completeness
    const profileValidation = validateContractorProfileForVerification(userProfile, contractorProfile)
    if (!profileValidation.isComplete) {
      setShowProfileCompletionModal(true)
      return
    }
    
    // Check verification status
    if (!verificationStatus?.isVerified) {
      toast.error('You need to be a verified contractor to view project details')
      setShowVerificationModal(true)
      return
    }
    
    // Check project view access (payment)
    if (!project.hasAccess) {
      // Show payment modal for verified users
      setShowPaymentModal(true)
      return
    }
    
    // All checks passed, proceed with viewing details
    onViewDetails(project)
  }
  return (
    <>
    <Card className="hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] h-full flex flex-col">
      <CardHeader className="pb-4 flex-shrink-0">
        {/* Access Type and Proposal Status Indicators */}
        {!hideBadges && project.hasAccess && project.accessType && (
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge 
              variant="outline" 
              className="border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/5 px-3 py-1 text-xs font-medium flex items-center gap-1 w-fit"
            >
              <CheckCircle className="h-3 w-3" />
              {project.accessType === 'accepted_proposal' ? 'Accepted Proposal' : 'Paid Access'}
            </Badge>
            
            {/* Proposal Status Badge - Show for paid access projects */}
            {project.accessType === 'paid_access' && project.proposalStatus && project.proposalStatus !== 'none' && (
              <Badge 
                variant="outline" 
                className={`${
                  project.proposalStatus === 'accepted'
                    ? 'border-green-300 dark:border-green-500/40 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10'
                    : project.proposalStatus === 'submitted'
                    ? 'border-blue-300 dark:border-blue-500/40 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10'
                    : project.proposalStatus === 'rejected'
                    ? 'border-red-300 dark:border-red-500/40 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10'
                    : project.proposalStatus === 'expired'
                    ? 'border-orange-300 dark:border-orange-500/40 text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10'
                    : 'border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-white/5'
                } px-3 py-1 text-xs font-medium w-fit`}
              >
                {project.proposalStatus === 'accepted' && 'Proposal Accepted'}
                {project.proposalStatus === 'submitted' && 'Proposal Submitted'}
                {project.proposalStatus === 'rejected' && 'Proposal Rejected'}
                {project.proposalStatus === 'expired' && 'Proposal Expired'}
                {project.proposalStatus === 'withdrawn' && 'Proposal Withdrawn'}
              </Badge>
            )}
          </div>
        )}
        
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white mb-2 truncate">
              {capitalizeFirst(project.project_title)}
            </CardTitle>
          </div>
          {!hideBadges && (
            <Badge 
              variant={getProjectStatusConfig(project.status).variant} 
              className={`${getProjectStatusConfig(project.status).color} px-3 py-1 text-xs font-medium shrink-0`}
            >
              {getProjectStatusConfig(project.status).label}
            </Badge>
          )}
        </div>
        
        {/* Statement of work - Full width with max 2 lines */}
        <div className="mt-3">
          <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {project.statement_of_work || 'No description provided'}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 flex-1 flex flex-col">
        {/* Metadata Grid */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {project.location?.city || 'Not specified'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {project.budget ? formatCurrency(project.budget) : 'TBD'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Posted {formatDate(project.created_at)}
            </span>
          </div>

          {project.expiry_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Expires {formatDate(project.expiry_date)}
              </span>
            </div>
          )}
        </div>
        
        {/* Categories */}
        {project.category && project.category.length > 0 && (
          <div className="mb-5 p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/10">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-700 dark:text-gray-300">Categories:</span> {project.category.join(', ')}
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-3 mt-auto">
          <Button 
            variant="outline" 
            onClick={handleViewDetailsClick}
            disabled={userProfileLoading || contractorProfileLoading || verificationLoading}
            className={`w-full disabled:opacity-50 ${
              project.hasAccess
                ? 'border-green-300 dark:border-green-500/40 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 hover:border-green-400'
                : 'border-orange-300 dark:border-orange-500/40 text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:border-orange-400'
            }`}
          >
            <Eye className="h-4 w-4 mr-2" />
            {(userProfileLoading || contractorProfileLoading || verificationLoading) 
              ? 'Loading...' 
              : project.hasAccess 
                ? (project.status === 'Completed' || project.proposalStatus === 'accepted'
                    ? 'View Project'
                    : 'Submit Proposal')
                : 'Purchase View Access'
            }
          </Button>
        </div>
      </CardContent>
    </Card>
    
    {/* Profile Completion Modal */}
    <ProfileCompletionModal 
      isOpen={showProfileCompletionModal}
      onClose={() => setShowProfileCompletionModal(false)}
      userProfile={userProfile}
      contractorProfile={contractorProfile}
    />
    
    {/* Verification Redirect Modal */}
    <VerificationRedirectModal 
      isOpen={showVerificationModal}
      onClose={() => setShowVerificationModal(false)}
      user={user ? { id: user.id, email: user.email } : undefined}
    />
    
    {/* Project Payment Modal */}
    <ProjectPaymentModal 
      isOpen={showPaymentModal}
      onClose={() => setShowPaymentModal(false)}
      project={project}
      userId={user?.id || ''}
      isVerified={verificationStatus?.isVerified || false}
    />
  </>
  )
}
