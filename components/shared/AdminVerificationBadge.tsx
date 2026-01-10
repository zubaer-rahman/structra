'use client'

import { Badge } from '@/components/ui/badge'
import { Shield, CheckCircle, Clock } from 'lucide-react'

interface AdminVerificationBadgeProps {
  isAdminVerified: boolean
  verificationDate?: string
  className?: string
}

export function AdminVerificationBadge({ 
  isAdminVerified, 
  verificationDate, 
  className = "" 
}: AdminVerificationBadgeProps) {
  if (!isAdminVerified) {
    return (
      <Badge variant="outline" className={`text-gray-600 bg-gray-50 text-xs sm:text-sm px-2 sm:px-3 py-1 ${className}`}>
        <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
        <span className="hidden sm:inline">Pending Admin Verification</span>
        <span className="sm:hidden">Pending</span>
      </Badge>
    )
  }

  return (
    <Badge className={`text-green-800 bg-green-100 border-green-200 text-xs sm:text-sm px-2 sm:px-3 py-1 ${className}`}>
      <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
      <span className="hidden sm:inline">Insurance, GST and WCB Verified by Admin</span>
      <span className="sm:hidden">Admin Verified</span>
      {verificationDate && (
        <span className="ml-1 text-xs opacity-75 hidden sm:inline">
          ({new Date(verificationDate).toLocaleDateString()})
        </span>
      )}
    </Badge>
  )
}
