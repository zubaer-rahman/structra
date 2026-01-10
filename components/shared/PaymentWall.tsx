'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DollarSign, ArrowRight, CheckCircle, Shield, X } from 'lucide-react'
import { ExtendedUser } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase'
import { validateHomeownerProfileForVerification, HomeownerProfileData } from '@/utils/validation'
import { HomeownerProfileCompletionModal } from '@/components/shared/modals/HomeownerProfileCompletionModal'
import { LoadingSpinner } from '@/components/shared'

interface PaymentWallProps {
  user: ExtendedUser
  onPaymentSuccess?: () => void
  onClose?: () => void
  open?: boolean
  useDialog?: boolean // New prop to control which version to use
  successUrl?: string // Allow custom success URL
  cancelUrl?: string  // Allow custom cancel URL
}

export default function PaymentWall({ user, onClose, open = true, useDialog = true, successUrl, cancelUrl }: PaymentWallProps) {
  const [isVerified, setIsVerified] = useState<boolean | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<{
    first_name?: string | null;
    last_name?: string | null;
    phone_number?: string | null;
    address?: string | null;
    government_id?: {
      id: string
      filename: string
      url: string
      size?: number
      mimeType?: string
      uploadedAt?: Date
    } | null;
    government_id_verified?: boolean;
  } | null>(null)
  const [showProfileCompletionModal, setShowProfileCompletionModal] = useState(false)

  // Refetch profile data when profile completion modal is closed
  const handleProfileModalClose = async () => {
    setShowProfileCompletionModal(false)
    
      // Refetch profile data to check if it's now complete
      try {
        const supabase = createClient()
        const { data: userData } = await supabase
          .from('users')
          .select('first_name, last_name, phone_number, address, government_id, government_id_verified')
          .eq('id', user.id)
          .single()
        
        setUserProfile(userData)
      } catch (error) {
        console.error('Error refetching profile data:', error)
      }
  }

  // Check if user is verified and fetch profile data
  useEffect(() => {
    const checkVerificationAndProfile = async () => {
      try {
        const supabase = createClient()
        
        // Fetch user profile and verification status
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('is_verified')
          .eq('user_id', user.id)
          .single()

      // Fetch user data for profile completeness check
      const { data: userData } = await supabase
        .from('users')
        .select('first_name, last_name, phone_number, address, government_id, government_id_verified')
        .eq('id', user.id)
        .single()

        setIsVerified(profile?.is_verified || false)
        setUserProfile(userData)
      } catch (error) {
        console.error('Error checking verification and profile:', error)
        setIsVerified(false)
        setUserProfile(null)
      } finally {
        setLoading(false)
      }
    }

    // Only fetch data when component is mounted or when it becomes visible
    if (open) {
      checkVerificationAndProfile()
    }
  }, [user.id, open])

  const handlePayment = async () => {
    if (!user?.id) {
      toast.error('Please log in to continue')
      return
    }

    // Check profile completeness before payment
    if (userProfile) {
      const homeownerData: HomeownerProfileData = {
        first_name: userProfile.first_name || undefined,
        last_name: userProfile.last_name || undefined,
        phone_number: userProfile.phone_number || undefined,
        address: userProfile.address || undefined,
        government_id: userProfile.government_id || undefined,
        government_id_verified: userProfile.government_id_verified || false,
      }

      const profileValidation = validateHomeownerProfileForVerification(homeownerData)
      
      if (!profileValidation.isComplete) {
        setShowProfileCompletionModal(true)
        return
      }
    }

    setIsProcessing(true)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      // Use custom URLs if provided, otherwise fall back to create page
      // Add userId and sessionId parameters to both success and cancel URLs for transaction handling
      const baseSuccessUrl = successUrl || `${window.location.origin}/homeowner/projects/create?payment=success`;
      const finalSuccessUrl = `${baseSuccessUrl}&userId=${user.id}&sessionId={CHECKOUT_SESSION_ID}`;
      const baseCancelUrl = cancelUrl || `${window.location.origin}/homeowner/projects/create?payment=cancelled`;
      const finalCancelUrl = `${baseCancelUrl}&userId=${user.id}&sessionId={CHECKOUT_SESSION_ID}`;

      const response = await fetch('/api/payments/homeowner-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          userId: user.id,
          isFirstPayment: !isVerified,
          successUrl: finalSuccessUrl,
          cancelUrl: finalCancelUrl,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment session')
      }

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to process payment')
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" variant="default" />
      </div>
    )
  }

  // Dialog version (Priority - Default)
  if (useDialog) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              {isVerified ? 'Create New Project' : 'Get Verified & Create Project'}
            </DialogTitle>
            <p className="text-lg text-gray-600">
              {isVerified 
                ? 'Pay $29.99 to create a new project and start receiving proposals'
                : 'Pay $29.99 to verify your project and start receiving proposals'
              }
            </p>
          </DialogHeader>

          <div className="space-y-6">
            {/* Verification Status */}
            <div className="flex items-center justify-center">
              {isVerified ? (
                <Badge variant="secondary" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Project Verified
                </Badge>
              ) : (
                <Badge variant="outline" className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-orange-600" />
                  Project Verification Required
                </Badge>
              )}
            </div>

            {/* Benefits */}
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h3 className="text-sm font-semibold text-orange-900 mb-3">
                What you get:
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-orange-800">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>One project with &apos;Open for Proposals&apos; status</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-orange-800">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Access to qualified contractors</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-orange-800">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Proposal management system</span>
                </div>
                {!isVerified && (
                  <div className="flex items-center gap-2 text-sm text-orange-800">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Verified project status</span>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing */}
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">$29.99</div>
              <div className="text-sm text-gray-600">per project</div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full bg-orange-600 hover:bg-orange-700"
                size="lg"
              >
                {isProcessing ? (
                  <LoadingSpinner inline size="xs" variant="white" text="Processing..." />
                ) : (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Pay $29.99 & Create Project
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>

              {onClose && (
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="w-full"
                  size="lg"
                >
                  Cancel & Return to Form
                </Button>
              )}
            </div>

            {/* Additional Info */}
            <div className="text-xs text-gray-500 text-center">
              Secure payment processing powered by Stripe
            </div>
          </div>
        </DialogContent>
        
        {/* Profile Completion Modal */}
        <HomeownerProfileCompletionModal
          isOpen={showProfileCompletionModal}
          onClose={handleProfileModalClose}
          userProfile={userProfile}
        />
      </Dialog>
    )
  }

  // Card version (Alternative - Full page)
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center relative">
            {/* Close button for card version */}
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            
            <div className="mx-auto h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {isVerified ? 'Create New Project' : 'Get Verified & Create Project'}
            </CardTitle>
            <CardDescription className="text-lg">
              {isVerified 
                ? 'Pay $29.99 to create a new project and start receiving proposals'
                : 'Pay $29.99 to become a verified homeowner and create your first project'
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Verification Status */}
            <div className="flex items-center justify-center">
              {isVerified ? (
                <Badge variant="secondary" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Project Verified
                </Badge>
              ) : (
                <Badge variant="outline" className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-orange-600" />
                  Project Verification Required
                </Badge>
              )}
            </div>

            {/* Benefits */}
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h3 className="text-sm font-semibold text-orange-900 mb-3">
                What you get:
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-orange-800">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>One project with &apos;Open for Proposals&apos; status</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-orange-800">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Access to qualified contractors</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-orange-800">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Proposal management system</span>
                </div>
                {!isVerified && (
                  <div className="flex items-center gap-2 text-sm text-orange-800">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Verified project status</span>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing */}
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">$29.99</div>
              <div className="text-sm text-gray-600">per project</div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full bg-orange-600 hover:bg-orange-700"
                size="lg"
              >
                {isProcessing ? (
                  <LoadingSpinner inline size="xs" variant="white" text="Processing..." />
                ) : (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Pay $29.99 & Create Project
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>

              {onClose && (
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="w-full"
                  size="lg"
                >
                  Cancel & Return to Form
                </Button>
              )}
            </div>

            {/* Additional Info */}
            <div className="text-xs text-gray-500 text-center">
              Secure payment processing powered by Stripe
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Completion Modal */}
      <HomeownerProfileCompletionModal
        isOpen={showProfileCompletionModal}
        onClose={handleProfileModalClose}
        userProfile={userProfile}
      />
    </div>
  )
}