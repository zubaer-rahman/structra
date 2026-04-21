import React from 'react'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ContractReviewBadgeProps {
  contractReviewed: boolean
  homeownerContractReviewed: boolean
  userRole: 'contractor' | 'homeowner'
  className?: string
}

export function ContractReviewBadge({
  contractReviewed,
  homeownerContractReviewed,
  userRole,
  className = ""
}: ContractReviewBadgeProps) {
  
  // Determine what action is required for the current user
  const needsContractorReview = !contractReviewed
  const needsHomeownerReview = !homeownerContractReviewed
  
  // Show warning badge if current user needs to review
  const showWarning = (userRole === 'contractor' && needsContractorReview) || 
                     (userRole === 'homeowner' && needsHomeownerReview)
  
  // Show success badge if both reviews are complete
  const showSuccess = contractReviewed && homeownerContractReviewed
  
  if (showSuccess) {
    return (
      <Badge 
        className={cn(
          'bg-green-100 text-green-800 border-green-300 hover:bg-green-200 font-medium flex items-center gap-1.5',
          className
        )}
      >
        <CheckCircle className="h-3 w-3" />
        Contract Signed
      </Badge>
    )
  }
  
  if (showWarning) {
    const actionText = userRole === 'contractor' ? 'Review Contract' : 'Confirm Contract'
    
    return (
      <Badge 
        className={cn(
          'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200 font-medium flex items-center gap-1.5',
          className
        )}
      >
        <AlertTriangle className="h-3 w-3" />
        {actionText} Required
      </Badge>
    )
  }
  
  // Show pending badge if other party needs to review
  const otherPartyNeedsReview = (userRole === 'contractor' && needsHomeownerReview) || 
                               (userRole === 'homeowner' && needsContractorReview)
  
  if (otherPartyNeedsReview) {
    return (
      <Badge 
        className={cn(
          'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200 font-medium flex items-center gap-1.5',
          className
        )}
      >
        <Clock className="h-3 w-3" />
        Awaiting Review
      </Badge>
    )
  }
  
  return null
}
