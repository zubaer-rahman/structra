'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import SignatureModal, { SignatureData } from '@/components/modals/SignatureModal'
import { createClient } from '@/lib/supabase'
import { 
  PenTool, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Download,
  FileText,
  Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { SIGNATURE_STATUSES } from '@/utils/constants/signatures'
import { SignatureWithUser } from '@/server/database/schemas/signatures'

interface ProfileSignatureSectionProps {
  userId: string
  userRole: 'contractor' | 'homeowner'
  userName: string
  userEmail?: string
  className?: string
}

export function ProfileSignatureSection({
  userId,
  userRole,
  userName,
  userEmail,
  className = ''
}: ProfileSignatureSectionProps) {
  const [signature, setSignature] = useState<SignatureWithUser | null>(null)
  const [loading, setLoading] = useState(false)
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const getAuthHeaders = async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const headers: Record<string, string> = {}
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`
    }
    return headers
  }

  // Load existing signature
  useEffect(() => {
    loadSignature()
  }, [userId])

  const loadSignature = async () => {
    try {
      setLoading(true)
      const authHeaders = await getAuthHeaders()
      const response = await fetch(`/api/signatures?user_id=${userId}&document_type=profile`, {
        headers: authHeaders,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to load signature (${response.status})`)
      }

      const { signatures } = await response.json()
      if (signatures && signatures.length > 0) {
        setSignature(signatures[0] as SignatureWithUser)
      } else {
        setSignature(null)
      }
    } catch (error) {
      console.error('Error loading signature:', error)
      toast.error('Failed to load signature')
    } finally {
      setLoading(false)
    }
  }

  const handleSignatureSave = async (signatureData: SignatureData) => {
    try {
      setLoading(true)
      const signaturePayload = {
        signature_data: signatureData.signature_data,
        signature_type: signatureData.signature_type,
        document_type: 'profile',
        signer_name: signatureData.signer_name,
        signer_email: signatureData.signer_email,
        signer_role: userRole,
        metadata: signatureData.metadata || {}
      }

      if (signature) {
        const authHeaders = await getAuthHeaders()
        const response = await fetch(`/api/signatures/${signature.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
          body: JSON.stringify(signaturePayload),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Failed to update signature (${response.status})`)
        }
      } else {
        const authHeaders = await getAuthHeaders()
        const response = await fetch('/api/signatures', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
          body: JSON.stringify(signaturePayload),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Failed to create signature (${response.status})`)
        }
      }

      await loadSignature()
      toast.success(signature ? 'Signature updated successfully!' : 'Signature saved successfully!')
      setShowSignatureModal(false)
    } catch (error) {
      console.error('Error saving signature:', error)
      toast.error('Failed to save signature')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSignature = async () => {
    if (!signature) return
    
    try {
      setIsDeleting(true)
      
      console.log('Attempting to delete signature:', {
        signatureId: signature.id,
        userId: userId,
        userRole: userRole
      })
      
      // Use the API route for deletion
      const authHeaders = await getAuthHeaders()
      const response = await fetch(`/api/signatures/${signature.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      
      console.log('Signature deleted successfully')
      
      // If no error, the deletion was successful
      setSignature(null)
      toast.success('Signature deleted successfully')
    } catch (error) {
      console.error('Error deleting signature:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error(`Failed to delete signature: ${errorMessage}`)
    } finally {
      setIsDeleting(false)
    }
  }


  const handleDownloadSignature = () => {
    if (signature) {
      const link = document.createElement('a')
      link.download = `signature-${signature.signer_name}-${signature.id}.png`
      link.href = signature.signature_data
      link.click()
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case SIGNATURE_STATUSES.VERIFIED:
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case SIGNATURE_STATUSES.SIGNED:
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case SIGNATURE_STATUSES.REJECTED:
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case SIGNATURE_STATUSES.EXPIRED:
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      case SIGNATURE_STATUSES.PENDING:
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case SIGNATURE_STATUSES.VERIFIED:
        return 'bg-green-100 text-green-800'
      case SIGNATURE_STATUSES.SIGNED:
        return 'bg-blue-100 text-blue-800'
      case SIGNATURE_STATUSES.REJECTED:
        return 'bg-red-100 text-red-800'
      case SIGNATURE_STATUSES.EXPIRED:
        return 'bg-orange-100 text-orange-800'
      case SIGNATURE_STATUSES.PENDING:
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={`profile-signature-section ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PenTool className="h-5 w-5" />
            <span>Digital Signature</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Create and manage your digital signature for contracts and agreements
          </p>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          ) : signature ? (
            <div className="space-y-4">
              {/* Signature Preview */}
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-center min-h-[100px]">
                  {signature.signature_type === 'handwritten' || signature.signature_type === 'uploaded' ? (
                    <img
                      src={signature.signature_data}
                      alt={`Signature by ${signature.signer_name}`}
                      className="max-h-24 max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-lg font-signature text-gray-700">
                      {signature.signature_data.includes('base64,') 
                        ? atob(signature.signature_data.split(',')[1])
                        : signature.signature_data
                      }
                    </div>
                  )}
                </div>
              </div>

              {/* Signature Details */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status:</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(signature.status)}
                    <Badge className={getStatusColor(signature.status)}>
                      {signature.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="capitalize">{signature.signature_type}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span>{format(new Date(signature.created_at), 'MMM dd, yyyy HH:mm')}</span>
                </div>

                {signature.verified_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Verified:</span>
                    <span>{format(new Date(signature.verified_at), 'MMM dd, yyyy HH:mm')}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSignature}
                  className="flex items-center space-x-1"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSignatureModal(true)}
                  className="flex items-center space-x-1"
                >
                  <PenTool className="h-4 w-4" />
                  <span>Edit</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteSignature}
                  disabled={isDeleting}
                  className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <PenTool className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Signature Created</h3>
              <p className="text-gray-600 mb-4">
                Create your digital signature to use in contracts and agreements
              </p>
              <Button onClick={() => setShowSignatureModal(true)}>
                <PenTool className="h-4 w-4 mr-2" />
                Create Signature
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Signature Modal */}
      <SignatureModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        onSave={handleSignatureSave}
        title={signature ? `Edit Digital Signature` : `Create Digital Signature`}
        description={signature ? `Update your digital signature` : `Please provide your digital signature for use in contracts and agreements`}
        signerName={userName}
        signerEmail={userEmail}
        signerRole={userRole}
        documentType="profile"
        documentId={`profile-${userId}`}
        loading={loading}
      />

    </div>
  )
}

export default ProfileSignatureSection
