'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import SignatureModal, { SignatureData } from '@/components/modals/SignatureModal'
import SignatureViewer from '@/components/shared/SignatureViewer'
import { 
  FileText, 
  PenTool, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Download,
  Eye,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { SIGNATURE_STATUSES } from '@/utils/constants/signatures'
import { SignatureWithUser } from '@/server/database/schemas/signatures'

interface ContractSignatureWorkflowProps {
  agreementId: string
  homeownerId: string
  contractorId: string
  homeownerName: string
  contractorName: string
  documentTitle: string
  onSignaturesComplete?: (signatures: { homeowner: SignatureWithUser; contractor: SignatureWithUser }) => void
  onDownloadPDF?: () => void
  className?: string
}

interface SignatureStatus {
  homeowner: SignatureWithUser | null
  contractor: SignatureWithUser | null
}

export function ContractSignatureWorkflow({
  agreementId,
  homeownerId,
  contractorId,
  homeownerName,
  contractorName,
  documentTitle,
  onSignaturesComplete,
  onDownloadPDF,
  className = ''
}: ContractSignatureWorkflowProps) {
  const [signatures, setSignatures] = useState<SignatureStatus>({
    homeowner: null,
    contractor: null
  })
  const [loading, setLoading] = useState(false)
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [currentSigner, setCurrentSigner] = useState<'homeowner' | 'contractor' | null>(null)
  const [selectedSignature, setSelectedSignature] = useState<SignatureWithUser | null>(null)
  const [showSignatureViewer, setShowSignatureViewer] = useState(false)

  // Calculate completion status
  const getCompletionStatus = () => {
    const hasHomeownerSignature = signatures.homeowner?.status === SIGNATURE_STATUSES.SIGNED || signatures.homeowner?.status === SIGNATURE_STATUSES.VERIFIED
    const hasContractorSignature = signatures.contractor?.status === SIGNATURE_STATUSES.SIGNED || signatures.contractor?.status === SIGNATURE_STATUSES.VERIFIED
    
    if (hasHomeownerSignature && hasContractorSignature) {
      return { status: 'completed', progress: 100, message: 'All signatures completed' }
    } else if (hasHomeownerSignature || hasContractorSignature) {
      return { status: 'partial', progress: 50, message: 'One signature pending' }
    } else {
      return { status: 'pending', progress: 0, message: 'Awaiting signatures' }
    }
  }

  const completionStatus = getCompletionStatus()

  // Load existing signatures
  useEffect(() => {
    loadSignatures()
  }, [agreementId])

  const loadSignatures = async () => {
    try {
      setLoading(true)
      // TODO: Implement API call to fetch signatures
      // const response = await fetch(`/api/signatures/agreement/${agreementId}`)
      // const data = await response.json()
      // setSignatures(data)
    } catch (error) {
      console.error('Error loading signatures:', error)
      toast.error('Failed to load signatures')
    } finally {
      setLoading(false)
    }
  }

  const handleSignatureSave = async (signatureData: SignatureData) => {
    try {
      setLoading(true)
      
      // TODO: Implement API call to save signature
      // const response = await fetch('/api/signatures', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     ...signatureData,
      //     document_id: agreementId,
      //     document_type: 'agreement',
      //     user_id: currentSigner === 'homeowner' ? homeownerId : contractorId
      //   })
      // })
      
      // const savedSignature = await response.json()
      
      // Update local state
      if (currentSigner) {
        setSignatures(prev => ({
          ...prev,
          [currentSigner]: signatureData as SignatureWithUser
        }))
      }

      toast.success('Signature saved successfully')
      setShowSignatureModal(false)
      setCurrentSigner(null)

      // Check if all signatures are complete
      const newCompletionStatus = getCompletionStatus()
      if (newCompletionStatus.status === 'completed' && onSignaturesComplete) {
        onSignaturesComplete({
          homeowner: signatures.homeowner!,
          contractor: signatures.contractor!
        })
      }
    } catch (error) {
      console.error('Error saving signature:', error)
      toast.error('Failed to save signature')
    } finally {
      setLoading(false)
    }
  }

  const handleSignClick = (signer: 'homeowner' | 'contractor') => {
    setCurrentSigner(signer)
    setShowSignatureModal(true)
  }

  const handleViewSignature = (signature: SignatureWithUser) => {
    setSelectedSignature(signature)
    setShowSignatureViewer(true)
  }

  const handleDownloadSignature = (signature: SignatureWithUser) => {
    const link = document.createElement('a')
    link.download = `signature-${signature.signer_name}-${signature.id}.png`
    link.href = signature.signature_data
    link.click()
  }

  const getSignerStatus = (signature: SignatureWithUser | null) => {
    if (!signature) return { status: 'pending', icon: Clock, color: 'text-yellow-600' }
    
    switch (signature.status) {
      case SIGNATURE_STATUSES.VERIFIED:
        return { status: 'verified', icon: CheckCircle, color: 'text-green-600' }
      case SIGNATURE_STATUSES.SIGNED:
        return { status: 'signed', icon: CheckCircle, color: 'text-blue-600' }
      case SIGNATURE_STATUSES.REJECTED:
        return { status: 'rejected', icon: AlertCircle, color: 'text-red-600' }
      case SIGNATURE_STATUSES.EXPIRED:
        return { status: 'expired', icon: AlertCircle, color: 'text-orange-600' }
      default:
        return { status: 'pending', icon: Clock, color: 'text-yellow-600' }
    }
  }

  return (
    <div className={`contract-signature-workflow ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Contract Signatures</span>
          </CardTitle>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Completion Status</span>
              <Badge variant={completionStatus.status === 'completed' ? 'default' : 'secondary'}>
                {completionStatus.message}
              </Badge>
            </div>
            <Progress value={completionStatus.progress} className="h-2" />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Document Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">{documentTitle}</h3>
            <p className="text-sm text-gray-600">
              Agreement ID: {agreementId}
            </p>
            <p className="text-sm text-gray-600">
              Created: {format(new Date(), 'MMM dd, yyyy')}
            </p>
          </div>

          {/* Signers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Homeowner Signature */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Homeowner</h4>
                <span className="text-sm text-gray-600">{homeownerName}</span>
              </div>
              
              {signatures.homeowner ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    {React.createElement(getSignerStatus(signatures.homeowner).icon, {
                      className: `h-4 w-4 ${getSignerStatus(signatures.homeowner).color}`
                    })}
                    <span className="text-sm capitalize">
                      {getSignerStatus(signatures.homeowner).status}
                    </span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewSignature(signatures.homeowner!)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadSignature(signatures.homeowner!)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-yellow-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Awaiting signature</span>
                  </div>
                  <Button
                    onClick={() => handleSignClick('homeowner')}
                    className="w-full"
                    disabled={loading}
                  >
                    <PenTool className="h-4 w-4 mr-2" />
                    Sign as Homeowner
                  </Button>
                </div>
              )}
            </div>

            {/* Contractor Signature */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Contractor</h4>
                <span className="text-sm text-gray-600">{contractorName}</span>
              </div>
              
              {signatures.contractor ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    {React.createElement(getSignerStatus(signatures.contractor).icon, {
                      className: `h-4 w-4 ${getSignerStatus(signatures.contractor).color}`
                    })}
                    <span className="text-sm capitalize">
                      {getSignerStatus(signatures.contractor).status}
                    </span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewSignature(signatures.contractor!)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadSignature(signatures.contractor!)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-yellow-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Awaiting signature</span>
                  </div>
                  <Button
                    onClick={() => handleSignClick('contractor')}
                    className="w-full"
                    disabled={loading}
                  >
                    <PenTool className="h-4 w-4 mr-2" />
                    Sign as Contractor
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {completionStatus.status === 'completed' && (
            <div className="flex justify-center pt-4 border-t">
              <Button onClick={onDownloadPDF} className="flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Download Signed PDF</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Signature Modal */}
      <SignatureModal
        isOpen={showSignatureModal}
        onClose={() => {
          setShowSignatureModal(false)
          setCurrentSigner(null)
        }}
        onSave={handleSignatureSave}
        title={`Sign as ${currentSigner === 'homeowner' ? 'Homeowner' : 'Contractor'}`}
        description={`Please provide your digital signature for ${documentTitle}`}
        signerName={currentSigner === 'homeowner' ? homeownerName : contractorName}
        signerRole={currentSigner || undefined}
        documentType="agreement"
        documentId={agreementId}
        loading={loading}
      />

      {/* Signature Viewer Modal */}
      {selectedSignature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Signature Details</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSignatureViewer(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <SignatureViewer signature={selectedSignature} showDetails={true} />
          </div>
        </div>
      )}
    </div>
  )
}

export default ContractSignatureWorkflow
