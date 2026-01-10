'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { DollarSign, CreditCard, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { BaseProject } from '@/server/services/ProjectService'
import { clientConfig } from '@/config/client-env'
import { createClient } from '@/lib/supabase'

interface ProjectPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  project: BaseProject
  userId: string
  isVerified: boolean
}

export function ProjectPaymentModal({
  isOpen,
  onClose,
  project,
  userId,
  isVerified
}: ProjectPaymentModalProps) {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  const handlePayment = async () => {
    setIsProcessingPayment(true)
    
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch('/api/payments/project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          projectId: project.id,
          userId: userId,
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
      setIsProcessingPayment(false)
    }
  }

  const projectAccessFee = clientConfig.pricing.getProjectAccessFeeInDollars()
  const verificationPrice = clientConfig.pricing.getContractorVerificationAnnualInDollars()
  const projectPrice = isVerified ? projectAccessFee : projectAccessFee + verificationPrice

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-center">
            Project Access Required
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Project Info */}
          <div className="p-3 bg-gray-50 rounded">
            <h3 className="font-medium text-gray-900 text-sm">
              {project.project_title}
            </h3>
            <p className="text-xs text-gray-600">
              {typeof project.location === 'object' && project.location ? 
                `${project.location.city}, ${project.location.province}` : 
                project.location || 'Location not specified'
              }
            </p>
          </div>

          {/* Payment Details */}
          <div className="space-y-3">
            <p className="text-sm text-gray-600 text-center">
              To view this project&apos;s details and submit a proposal, you need to purchase project access.
            </p>

            {/* Pricing */}
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                ${projectPrice.toFixed(2)} CAD
              </div>
              {!isVerified && (
                <div className="text-xs text-gray-500 mt-1">
                  Includes verification + project access
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isProcessingPayment}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessingPayment}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              {isProcessingPayment ? 'Processing...' : 'Pay Now'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}