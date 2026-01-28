'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Shield, Star, Building2, FileCheck, Award, AlertCircle, ExternalLink } from 'lucide-react'
import { trpc } from '@/utils/trpc'
import { useStripe } from '@/hooks/useStripe'
import { validateContractorProfileForVerification, getProfileCompletionMessage, getMissingFieldsBySection } from '@/utils/validation'
import { clientConfig } from '@/config/client-env'
import { LoadingSpinner } from '@/components/shared'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'

interface VerificationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  user?: { id: string; email?: string }
  returnUrl?: string
  userProfile?: Record<string, unknown> | null
  contractorProfile?: Record<string, unknown> | null
}

export function VerificationModal({ isOpen, onClose, onSuccess, user, returnUrl, userProfile: propUserProfile, contractorProfile: propContractorProfile }: VerificationModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Use passed profile data or fetch if not provided
  const { data: fetchedUserProfile } = trpc.users.getProfile.useQuery(undefined, {
    enabled: !!user?.id && isOpen && !propUserProfile,
  })
  
  const { data: fetchedContractorProfile } = trpc.users.getContractorProfile.useQuery(undefined, {
    enabled: !!user?.id && isOpen && !propContractorProfile,
  })
  
  // Use passed data or fetched data
  const userProfile = propUserProfile || fetchedUserProfile
  const contractorProfile = propContractorProfile || fetchedContractorProfile
  
  // Validate profile completeness
  const profileValidation = validateContractorProfileForVerification(userProfile, contractorProfile)
  const missingFieldsBySection = getMissingFieldsBySection(profileValidation)
  
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
  
  // Get verification status - always call the hook, but control when it runs
  const verificationQuery = trpc.users.checkVerificationStatus.useQuery(undefined, {
    enabled: user && isOpen,
  })
  
  const verificationStatus = verificationQuery?.data

  // Stripe integration
  const { createSubscriptionSession, createCheckoutSession, isLoading: stripeLoading, error: stripeError } = useStripe()

  // Fetch verification status when modal opens
  useEffect(() => {
    if (isOpen && user && verificationQuery.refetch) {
      verificationQuery.refetch()
    }
  }, [isOpen, user])

  // Re-validate profile when profile data changes
  useEffect(() => {
    if (isOpen && (userProfile || contractorProfile)) {
      // Profile validation will automatically update due to dependency on userProfile and contractorProfile
    }
  }, [isOpen, userProfile, contractorProfile])

  const handleVerification = async () => {
    if (verificationStatus?.isVerified) {
      onClose()
      return
    }

    // Check if profile is complete before allowing payment
    if (!profileValidation.isComplete) {
      return
    }

    if (!user?.id) {
      toast.error('Please log in to continue')
      return
    }

    setIsProcessing(true)
    
    try {
      // Use the environment variable for the price ID, fallback to null if not set
      const priceId = process.env.NEXT_PUBLIC_STRIPE_VERIFICATION_PRICE_ID || null
      
      // Determine return URLs - use returnUrl if provided, otherwise use current page
      const baseUrl = window.location.origin || 'http://localhost:3000'
      const successUrl = returnUrl 
        ? `${baseUrl}${returnUrl}?verification=success&session_id={CHECKOUT_SESSION_ID}` 
        : `${baseUrl}${window.location.pathname}?verification=success&session_id={CHECKOUT_SESSION_ID}`
      const cancelUrl = returnUrl 
        ? `${baseUrl}${returnUrl}?verification=cancelled` 
        : `${baseUrl}${window.location.pathname}?verification=cancelled`
      
      // Validate URLs before proceeding
      if (!successUrl.startsWith('http') || !cancelUrl.startsWith('http')) {
        throw new Error('Invalid URL constructed for payment redirects')
      }
      
      // Use the new contractor verification API route
      const paymentType = priceId ? 'subscription' : 'one_time'
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      // Debug logging
      console.log('Sending verification request with data:', {
        userId: user.id,
        paymentType,
        priceId,
        successUrl,
        cancelUrl,
      })
      
      const response = await fetch('/api/payments/contractor-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          userId: user.id,
          paymentType,
          priceId,
          successUrl,
          cancelUrl,
        }),
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)
      
      let data
      try {
        data = await response.json()
        console.log('Response data:', data)
      } catch (jsonError) {
        console.log('Failed to parse response JSON:', jsonError)
        throw new Error('Invalid response from server')
      }

      if (!response.ok) {
        console.log('API Error Response:', data)
        throw new Error(data.error || data.message || 'Failed to create payment session')
      }

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      console.log('Payment error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to process payment')
      setIsProcessing(false)
    }
  }

  const isLoading = stripeLoading || isProcessing
  const canProceedWithVerification = profileValidation.isComplete

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[82vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Shield className="h-7 w-7 text-orange-600" />
            Contractor Verification
            <Badge variant="secondary" className="ml-2 text-sm">
              ${clientConfig.pricing.getContractorVerificationAnnualInDollars()}/year
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Value Proposition */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-5 rounded-lg border border-orange-200">
            <h3 className="text-base font-semibold text-orange-900 mb-3">
              Become a Verified Contractor
            </h3>
            <p className="text-orange-800 text-sm leading-relaxed">
              {requirements.description}
            </p>
          </div>

          {/* Benefits & Requirements in Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Benefits */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Star className="h-4 w-4 text-orange-500" />
                Benefits
              </h4>
              <div className="space-y-2">
                {requirements.benefits.slice(0, 4).map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-orange-500" />
                Requirements
              </h4>
              <div className="space-y-2">
                {requirements.requirements.map((requirement, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                    <Building2 className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    <span>{requirement}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Annual Verification Fee</p>
                <p className="text-2xl font-bold text-gray-900 mb-1">{requirements.annualFee} {requirements.currency}</p>
                <p className="text-sm text-gray-500">Billed annually • Cancel anytime</p>
              </div>
              <Award className="h-10 w-10 text-orange-600" />
            </div>
          </div>

          {/* Profile Incomplete Warning */}
          {!profileValidation.isComplete && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-amber-900 mb-2">
                    Complete Your Profile First
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
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 text-xs"
                    onClick={() => {
                      onClose()
                      // Navigate to contractor profile
                      window.location.href = '/contractor/profile'
                    }}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Complete Profile
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {stripeError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-xs">{stripeError}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 text-sm py-2"
            >
              Cancel
            </Button>
            
            {verificationStatus?.isVerified ? (
              <Button
                disabled
                className="flex-1 bg-green-600 hover:bg-green-700 text-sm py-2"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Already Verified
              </Button>
            ) : (
              <Button
                onClick={handleVerification}
                disabled={isLoading || !canProceedWithVerification}
                className={`flex-1 text-sm py-2 ${
                  canProceedWithVerification 
                    ? 'bg-orange-600 hover:bg-orange-700' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <LoadingSpinner inline size="xs" variant="white" text="Processing..." />
                ) : !canProceedWithVerification ? (
                  <>
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Complete Profile First
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-1" />
                    Become Verified
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Status Info */}
          {verificationStatus?.isVerified && (
            <div className="text-center text-xs text-gray-600 pt-2">
              <p>✅ You are already a verified contractor</p>
              <p>Your verification expires annually and will be renewed automatically</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
