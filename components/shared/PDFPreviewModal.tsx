'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { X, Download, Eye, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { validateProfileSignatures } from '@/utils/helpers/signatureValidation'
import SignatureRequiredDialog from '@/components/modals/SignatureRequiredDialog'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'

interface PDFPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  pdfUrl?: string
  pdfBlob?: Blob | null
  title?: string
  allowDownload?: boolean
  className?: string
  // Signature validation props
  homeownerId?: string | null
  contractorId?: string | null
  requireSignatures?: boolean
  // Contract confirmation props
  showConfirmContract?: boolean
  proposalId?: string
  contractReviewed?: boolean
  homeownerContractReviewed?: boolean
  userRole?: 'contractor' | 'homeowner'
  onContractConfirmed?: () => void
  showDecisionActions?: boolean
  onAccept?: () => void
  onReject?: () => void
}

export function PDFPreviewModal({
  isOpen,
  onClose,
  pdfUrl,
  pdfBlob,
  title = 'PDF Preview',
  allowDownload = false,
  className = '',
  homeownerId,
  contractorId,
  requireSignatures = false,
  showConfirmContract = false,
  proposalId,
  contractReviewed = false,
  homeownerContractReviewed = false,
  userRole,
  onContractConfirmed,
  showDecisionActions = false,
  onAccept,
  onReject
}: PDFPreviewModalProps) {
  const { user } = useAuth()
  const [pdfObjectUrl, setPdfObjectUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  
  // Signature validation state
  const [showSignatureDialog, setShowSignatureDialog] = useState(false)
  const [missingSignatures, setMissingSignatures] = useState<string[]>([])
  const [isValidatingSignatures, setIsValidatingSignatures] = useState(false)
  
  // Contract confirmation state
  const [isConfirmingContract, setIsConfirmingContract] = useState(false)

  // Clean up object URL on unmount or when URL changes
  useEffect(() => {
    return () => {
      if (pdfObjectUrl) {
        URL.revokeObjectURL(pdfObjectUrl)
      }
    }
  }, [pdfObjectUrl])

  // Handle PDF URL or blob
  useEffect(() => {
    if (!isOpen) {
      setPdfObjectUrl(null)
      setError(null)
      return
    }

    const setupPDF = async () => {
      setIsLoading(true)
      setError(null)

      try {
        if (pdfBlob) {
          // Create object URL from blob
          const url = URL.createObjectURL(pdfBlob)
          setPdfObjectUrl(url)
        } else if (pdfUrl) {
          // Use direct URL
          setPdfObjectUrl(pdfUrl)
        } else {
          setError('No PDF source provided')
        }
      } catch (err) {
        console.error('Error setting up PDF:', err)
        setError('Failed to load PDF')
      } finally {
        setIsLoading(false)
      }
    }

    setupPDF()
  }, [isOpen, pdfUrl, pdfBlob])


  const handleDownload = async () => {
    if (!pdfObjectUrl) return

    // Check signatures if required
    if (requireSignatures && (homeownerId || contractorId)) {
      try {
        setIsValidatingSignatures(true)
        const validationResult = await validateProfileSignatures(homeownerId || null, contractorId || null)
        
        if (!validationResult.isValid) {
          setMissingSignatures(validationResult.missingSignatures)
          setShowSignatureDialog(true)
          return
        }
      } catch (error) {
        console.error('Error validating signatures:', error)
        // Continue with download if validation fails
      } finally {
        setIsValidatingSignatures(false)
      }
    }

    // Proceed with download
    try {
      const link = document.createElement('a')
      link.href = pdfObjectUrl
      link.download = `${title}.pdf`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  const handleConfirmContract = async () => {
    if (!proposalId) return

    try {
      setIsConfirmingContract(true)
      
      // Choose the correct API endpoint based on user role
      const apiEndpoint = userRole === 'homeowner' 
        ? '/api/contracts/confirm-homeowner-review'
        : '/api/contracts/confirm-review'
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          proposalId,
          userId: user?.id // Use authenticated user's ID
        }),
      })

      const data = await response.json()
      console.log('API Response:', { status: response.status, data })

      if (response.ok) {
        console.log('Success! Showing toast...')
        const successMessage = userRole === 'homeowner' 
          ? 'Contract review confirmed successfully!'
          : 'Contract review confirmed successfully!'
        toast.success(successMessage)
        onContractConfirmed?.()
      } else {
        console.log('Error response:', data)
        toast.error(data.error || 'Failed to confirm contract review')
      }
    } catch (error) {
      console.error('Error confirming contract:', error)
      toast.error('Failed to confirm contract review')
    } finally {
      setIsConfirmingContract(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          "w-full h-[95vh] p-0 flex flex-col",
          className || "max-w-6xl"
        )}
        style={{
          maxWidth: className ? '55vw' : '72rem',
          width: '55vw',
          height: '95vh'
        }}
        showCloseButton={false}
        onKeyDown={handleKeyDown}
      >
        {/* Compact Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50/50 flex-shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <DialogTitle className="text-sm font-medium flex items-center gap-2 min-w-0 flex-1">
              <Eye className="h-4 w-4 flex-shrink-0" />
              <span 
                className="truncate max-w-[200px] sm:max-w-[300px] lg:max-w-[400px]" 
                title={title}
              >
                {title}
              </span>
            </DialogTitle>
            
            {/* Review Status Badges */}
            {showConfirmContract && (
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {/* Both Reviewed Indicator */}
                {contractReviewed && homeownerContractReviewed && (
                  <div className="flex items-center gap-1 mr-2">
                    <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      🎉 Contract Ready
                    </div>
                  </div>
                )}
                
                {/* Contractor Review Status */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-600 font-medium hidden lg:inline">Contractor:</span>
                  <span className="text-xs text-gray-600 font-medium lg:hidden">C:</span>
                  <div className={`px-1.5 sm:px-2 py-1 rounded-full text-xs font-medium ${
                    contractReviewed 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}>
                    {contractReviewed ? '✓ Reviewed' : '⏳ Pending'}
                  </div>
                </div>
                
                {/* Homeowner Review Status */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-600 font-medium hidden lg:inline">Homeowner:</span>
                  <span className="text-xs text-gray-600 font-medium lg:hidden">H:</span>
                  <div className={`px-1.5 sm:px-2 py-1 rounded-full text-xs font-medium ${
                    homeownerContractReviewed 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}>
                    {homeownerContractReviewed ? '✓ Reviewed' : '⏳ Pending'}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Homeowner Decision Buttons */}
            {showDecisionActions && userRole === 'homeowner' && (
              <>
                <Button
                  size="sm"
                  onClick={onAccept}
                  className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  onClick={onReject}
                  variant="outline"
                  className="h-7 px-3 text-xs"
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Reject
                </Button>
              </>
            )}

            {/* Confirm Contract Button (if showConfirmContract is true and not yet reviewed by current user) */}
            {showConfirmContract && proposalId && (
              (userRole === 'contractor' && !contractReviewed) ||
              (userRole === 'homeowner' && !homeownerContractReviewed)
            ) && (
              <Button
                size="sm"
                onClick={handleConfirmContract}
                disabled={isConfirmingContract}
                className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                {isConfirmingContract ? 'Confirming...' : 'Confirm Contract'}
              </Button>
            )}
            
            
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* PDF Content - Takes remaining space */}
        <div className="flex-1 p-3 overflow-hidden">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-sm text-gray-600">Loading PDF...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-red-500 mb-4">
                  <X className="h-12 w-12 mx-auto" />
                </div>
                <p className="text-sm text-gray-600 mb-4">{error}</p>
                <Button onClick={onClose} variant="outline">
                  Close
                </Button>
              </div>
            </div>
          )}

          {pdfObjectUrl && !isLoading && !error && (
            <div className="h-full overflow-auto bg-gray-100 rounded-lg">
              <iframe
                ref={iframeRef}
                src={`${pdfObjectUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                className="w-full h-full border-0 rounded-lg"
                title={title}
                onError={() => setError('Failed to load PDF content')}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>

    {/* Signature Required Dialog */}
    <SignatureRequiredDialog
      isOpen={showSignatureDialog}
      onClose={() => setShowSignatureDialog(false)}
      missingSignatures={missingSignatures}
      onSignatureAdded={() => {
        setShowSignatureDialog(false)
        // Retry download after signature is added
        handleDownload()
      }}
    />
  </>
  )
}

export default PDFPreviewModal
