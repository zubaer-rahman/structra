'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle, ExternalLink, Home } from 'lucide-react'
import { 
  validateHomeownerProfileForVerification, 
  getHomeownerProfileCompletionMessage, 
  getHomeownerMissingFieldsBySection,
  HomeownerProfileData
} from '@/utils/validation'

interface HomeownerProfileCompletionModalProps {
  isOpen: boolean
  onClose: () => void
  userProfile?: {
    first_name?: string | null
    last_name?: string | null
    phone_number?: string | null
    address?: string | null
    city?: string | null
    province?: string | null
    postal_code?: string | null
    government_id?: {
      id: string
      filename: string
      url: string
      size?: number
      mimeType?: string
      uploadedAt?: Date
    } | null
    government_id_verified?: boolean
  } | null
}

export function HomeownerProfileCompletionModal({ 
  isOpen, 
  onClose, 
  userProfile 
}: HomeownerProfileCompletionModalProps) {
  // Convert userProfile to HomeownerProfileData format
  const homeownerData: HomeownerProfileData = {
    first_name: userProfile?.first_name || undefined,
    last_name: userProfile?.last_name || undefined,
    phone_number: userProfile?.phone_number || undefined,
    address: userProfile?.address || undefined,
    city: userProfile?.city || undefined,
    province: userProfile?.province || undefined,
    postal_code: userProfile?.postal_code || undefined,
    government_id: userProfile?.government_id || undefined,
    government_id_verified: userProfile?.government_id_verified || false,
  }

  // Validate profile completeness
  const profileValidation = validateHomeownerProfileForVerification(homeownerData)
  const missingFieldsBySection = getHomeownerMissingFieldsBySection(profileValidation)

  const handleGoToProfile = () => {
    onClose()
    window.location.href = '/homeowner/profile'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Home className="h-6 w-6 text-orange-600" />
            Complete Your Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning Message */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-amber-900 mb-2">
                  Profile Incomplete
                </h4>
                <p className="text-sm text-amber-800 mb-3">
                  {getHomeownerProfileCompletionMessage(profileValidation)}
                </p>
                
                {/* Missing fields by section */}
                <div className="space-y-2">
                  {missingFieldsBySection.personal.length > 0 && (
                    <div className="text-xs">
                      <span className="font-medium text-amber-900">Personal Info:</span>
                      <span className="text-amber-700 ml-1">{missingFieldsBySection.personal.join(', ')}</span>
                    </div>
                  )}
                  {missingFieldsBySection.contact.length > 0 && (
                    <div className="text-xs">
                      <span className="font-medium text-amber-900">Contact Info:</span>
                      <span className="text-amber-700 ml-1">{missingFieldsBySection.contact.join(', ')}</span>
                    </div>
                  )}
                  {missingFieldsBySection.location.length > 0 && (
                    <div className="text-xs">
                      <span className="font-medium text-amber-900">Location Info:</span>
                      <span className="text-amber-700 ml-1">{missingFieldsBySection.location.join(', ')}</span>
                    </div>
                  )}
                  {missingFieldsBySection.verification.length > 0 && (
                    <div className="text-xs">
                      <span className="font-medium text-amber-900">Verification:</span>
                      <span className="text-amber-700 ml-1">{missingFieldsBySection.verification.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleGoToProfile}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Complete Profile
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}