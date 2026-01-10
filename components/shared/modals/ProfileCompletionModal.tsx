'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle, ExternalLink, User } from 'lucide-react'
import { validateContractorProfileForVerification, getProfileCompletionMessage, getMissingFieldsBySection } from '@/utils/validation'

interface ProfileCompletionModalProps {
  isOpen: boolean
  onClose: () => void
  userProfile?: {
    first_name?: string | null
    last_name?: string | null
    phone_number?: string | null
    address?: string | null
  } | null
  contractorProfile?: {
    business_name?: string | null
    bio?: string | null
    legal_entity_type?: string | null
    trade_category?: string[] | null
    service_location?: string | null
    gst_hst_number?: string | null
    wcb_number?: string | null
    insurance_general_liability?: number | null
    insurance_builders_risk?: number | null
    insurance_expiry?: string | null
    work_guarantee?: number | null
  } | null
}

export function ProfileCompletionModal({ 
  isOpen, 
  onClose, 
  userProfile, 
  contractorProfile 
}: ProfileCompletionModalProps) {
  // Validate profile completeness
  const profileValidation = validateContractorProfileForVerification(userProfile || null, contractorProfile || null)
  const missingFieldsBySection = getMissingFieldsBySection(profileValidation)

  const handleGoToProfile = () => {
    onClose()
    window.location.href = '/contractor/profile'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <User className="h-6 w-6 text-orange-600" />
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
                  {getProfileCompletionMessage(profileValidation)}
                </p>
                
                {/* Missing fields by section */}
                <div className="space-y-2">
                  {missingFieldsBySection.personal.length > 0 && (
                    <div className="text-xs">
                      <span className="font-medium text-amber-900">Personal Info:</span>
                      <span className="text-amber-700 ml-1">{missingFieldsBySection.personal.join(', ')}</span>
                    </div>
                  )}
                  {missingFieldsBySection.business.length > 0 && (
                    <div className="text-xs">
                      <span className="font-medium text-amber-900">Business Info:</span>
                      <span className="text-amber-700 ml-1">{missingFieldsBySection.business.join(', ')}</span>
                    </div>
                  )}
                  {missingFieldsBySection.compliance.length > 0 && (
                    <div className="text-xs">
                      <span className="font-medium text-amber-900">Compliance:</span>
                      <span className="text-amber-700 ml-1">{missingFieldsBySection.compliance.join(', ')}</span>
                    </div>
                  )}
                  {missingFieldsBySection.insurance.length > 0 && (
                    <div className="text-xs">
                      <span className="font-medium text-amber-900">Insurance:</span>
                      <span className="text-amber-700 ml-1">{missingFieldsBySection.insurance.join(', ')}</span>
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