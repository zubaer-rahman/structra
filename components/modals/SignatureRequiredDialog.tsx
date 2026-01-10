'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle, PenTool, ExternalLink } from 'lucide-react'
import SignatureModal, { SignatureData } from '@/components/modals/SignatureModal'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { SignatureWithUser } from '@/server/database/schemas/signatures'

interface SignatureRequiredDialogProps {
  isOpen: boolean
  onClose: () => void
  missingSignatures: string[]
  onSignatureAdded?: () => void
}

export function SignatureRequiredDialog({
  isOpen,
  onClose,
  missingSignatures,
  onSignatureAdded
}: SignatureRequiredDialogProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentUserSignature, setCurrentUserSignature] = useState<SignatureWithUser | null>(null)
  const [loadingSignature, setLoadingSignature] = useState(false)

  // Load current user's signature when dialog opens
  useEffect(() => {
    if (isOpen && user?.id) {
      loadCurrentUserSignature()
    }
  }, [isOpen, user?.id])

  const loadCurrentUserSignature = async () => {
    if (!user?.id) return

    try {
      setLoadingSignature(true)
      const supabase = createClient()
      
      const { data: signatures, error } = await supabase
        .from('signatures')
        .select(`
          *,
          user:users(id, first_name, last_name, email)
        `)
        .eq('user_id', user.id)
        .eq('document_type', 'profile')
        .order('created_at', { ascending: false })
        .limit(1)
      
      if (error) {
        console.error('Error loading signature:', error)
        return
      }
      
      if (signatures && signatures.length > 0) {
        setCurrentUserSignature(signatures[0])
      } else {
        setCurrentUserSignature(null)
      }
    } catch (error) {
      console.error('Error loading signature:', error)
    } finally {
      setLoadingSignature(false)
    }
  }

  const handleCreateOrUpdateSignature = () => {
    setShowSignatureModal(true)
  }

  const handleGoToProfile = () => {
    router.push('/profile')
    onClose()
  }

  const handleSignatureSave = async (signatureData: SignatureData) => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      // Generate signature hash for verification
      const generateSignatureHash = async (data: string) => {
        const encoder = new TextEncoder()
        const dataBuffer = encoder.encode(data)
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      }
      
      const signatureHash = await generateSignatureHash(signatureData.signature_data)
      
      // Prepare signature data for database
      const signatureRecord = {
        signature_data: signatureData.signature_data,
        signature_type: signatureData.signature_type,
        user_id: user?.id,
        document_type: 'profile',
        signer_name: signatureData.signer_name,
        signer_email: signatureData.signer_email,
        signer_role: user?.user_metadata?.role || 'homeowner',
        signature_hash: signatureHash,
        status: 'signed',
        is_verified: true,
        verified_at: new Date().toISOString(),
        metadata: signatureData.metadata || {}
      }
      
      let savedSignature
      let error
      
      if (currentUserSignature) {
        // Update existing signature
        const { data, error: updateError } = await supabase
          .from('signatures')
          .update(signatureRecord)
          .eq('id', currentUserSignature.id)
          .select(`
            *,
            user:users(id, first_name, last_name, email)
          `)
          .single()
        
        savedSignature = data
        error = updateError
      } else {
        // Create new signature
        const { data, error: insertError } = await supabase
          .from('signatures')
          .insert(signatureRecord)
          .select(`
            *,
            user:users(id, first_name, last_name, email)
          `)
          .single()
        
        savedSignature = data
        error = insertError
      }
      
      if (error) {
        throw error
      }
      
      setCurrentUserSignature(savedSignature)
      setShowSignatureModal(false)
      onSignatureAdded?.()
      onClose()
    } catch (error) {
      console.error('Error saving signature:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMessage = () => {
    if (missingSignatures.length === 2) {
      return 'Both homeowner and contractor must have valid profile signatures before downloading the PDF.'
    }
    
    if (missingSignatures.length === 1) {
      const missing = missingSignatures[0]
      return `The ${missing.toLowerCase()} is required before downloading the PDF.`
    }
    
    return 'Signatures are required before downloading the PDF.'
  }

  const isCurrentUserMissing = () => {
    if (!user) return false
    
    // Get user role from the user object or user_metadata
    const userRole = user.user_role || user.user_metadata?.role || 'homeowner'
    return missingSignatures.some(sig => 
      sig.toLowerCase().includes(userRole.toLowerCase()) || 
      sig.toLowerCase().includes('homeowner') && userRole === 'homeowner' ||
      sig.toLowerCase().includes('contractor') && userRole === 'contractor'
    )
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <span>Signature Required</span>
            </DialogTitle>
            <DialogDescription className="text-left">
              {getMessage()}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                <p className="mb-2">Missing signatures for:</p>
                <ul className="list-disc list-inside space-y-1">
                  {missingSignatures.map((signature, index) => (
                    <li key={index} className="capitalize">
                      {signature}
                    </li>
                  ))}
                </ul>
              </div>

              {isCurrentUserMissing() && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800">
                    You need to {currentUserSignature ? 'update' : 'create'} your digital signature to proceed.
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {isCurrentUserMissing() ? (
              <>
                <Button
                  onClick={handleCreateOrUpdateSignature}
                  className="w-full sm:w-auto"
                  disabled={loading || loadingSignature}
                >
                  <PenTool className="h-4 w-4 mr-2" />
                  {loadingSignature ? 'Loading...' : currentUserSignature ? 'Update My Signature' : 'Create My Signature'}
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <div className="w-full text-center">
                <p className="text-sm text-gray-600 mb-3">
                  Other parties need to create their signatures in their profile settings.
                </p>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Close
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Signature Modal */}
      <SignatureModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        onSave={handleSignatureSave}
        title={currentUserSignature ? "Update Digital Signature" : "Create Digital Signature"}
        description={currentUserSignature ? "Update your digital signature for use in contracts and agreements" : "Please provide your digital signature for use in contracts and agreements"}
        signerName={user?.user_metadata?.full_name || user?.email || ''}
        signerEmail={user?.email}
        signerRole={user?.user_metadata?.role || 'homeowner'}
        documentType="profile"
        documentId={`profile-${user?.id}`}
        loading={loading}
        existingSignature={currentUserSignature}
      />
    </>
  )
}

export default SignatureRequiredDialog
