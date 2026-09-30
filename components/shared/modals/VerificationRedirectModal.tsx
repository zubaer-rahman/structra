'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Shield, Star, Building2, FileCheck, Award, AlertCircle, ExternalLink, ArrowRight } from 'lucide-react'
import { clientConfig } from '@/config/client-env'

interface VerificationRedirectModalProps {
  isOpen: boolean
  onClose: () => void
  user?: { id: string; email?: string }
}

export function VerificationRedirectModal({ isOpen, onClose, user }: VerificationRedirectModalProps) {
  // Hardcoded verification requirements
  const requirements = {
    annualFee: 400,
    currency: 'CAD',
    benefits: [
      'Verified GST/HST registration',
      'Verified WorkSafeBC compliance',
      'Insurance disclosure verification'
    ],
    description: 'Become a verified contractor and prove to homeowners that you Structra with verified GST/HST registration and WorkSafeBC compliance, and insurance disclosure.',
    requirements: [
      'GST/HST registration',
      'WorksafeBC registration',
      'Certificate of Insurance'
    ]
  }

  const handleGoToProfile = () => {
    onClose()
    window.location.href = '/contractor/profile'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[82vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Shield className="h-7 w-7 text-orange-600" />
            Contractor Verification Required
            <Badge variant="secondary" className="ml-2 text-sm">
              ${clientConfig.pricing.getContractorVerificationAnnualInDollars()}/year
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Value Proposition */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20 p-5 rounded-lg border border-orange-200 dark:border-orange-900/40">
            <h3 className="text-base font-semibold text-orange-900 dark:text-orange-300 mb-3">
              Verification Required for Project Access
            </h3>
            <p className="text-orange-800 dark:text-orange-200/90 text-sm leading-relaxed">
              You need to be a verified contractor to view project details and submit proposals. Complete your verification on your profile page to unlock all contractor features.
            </p>
          </div>

          {/* Benefits & Requirements in Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Benefits */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
                <Star className="h-4 w-4 text-orange-500" />
                Benefits
              </h4>
              <div className="space-y-2">
                {requirements.benefits.slice(0, 4).map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-foreground">
                    <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
                <FileCheck className="h-4 w-4 text-orange-500" />
                Requirements
              </h4>
              <div className="space-y-2">
                {requirements.requirements.map((requirement, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span>{requirement}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-muted/50 border border-border p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Annual Verification Fee</p>
                <p className="text-2xl font-bold text-foreground mb-1">{requirements.annualFee} {requirements.currency}</p>
                <p className="text-sm text-muted-foreground">Billed annually • Cancel anytime</p>
              </div>
              <Award className="h-10 w-10 text-orange-600 dark:text-orange-500" />
            </div>
          </div>

          {/* Redirect Message */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                  Complete Verification on Profile Page
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200/90 mb-3">
                  To proceed with project access, please complete your contractor verification on your profile page. This ensures all your business information is properly documented.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 text-sm py-2"
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleGoToProfile}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-sm py-2"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Go to Profile to Verify
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Status Info */}
          <div className="text-center text-xs text-muted-foreground pt-2">
            <p>🔒 Verification required to access project details and submit proposals</p>
            <p>Complete verification once to unlock all contractor features</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
