'use client'

import React, { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import SignaturePad from '@/components/shared/SignaturePad'
import { X, Save, Download, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface SignatureModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (signatureData: SignatureData) => Promise<void>
  title?: string
  description?: string
  signerName?: string
  signerEmail?: string
  signerRole?: string
  documentType?: string
  documentId?: string
  loading?: boolean
  existingSignature?: any
}

export interface SignatureData {
  signature_data: string
  signature_type: 'handwritten' | 'typed' | 'uploaded'
  signer_name: string
  signer_email?: string
  signer_role?: string
  document_type?: string
  document_id?: string
  metadata?: Record<string, any>
}

export function SignatureModal({
  isOpen,
  onClose,
  onSave,
  title = "Digital Signature",
  description = "Please provide your digital signature below",
  signerName = "",
  signerEmail = "",
  signerRole = "",
  documentType = "",
  documentId = "",
  loading = false,
  existingSignature = null
}: SignatureModalProps) {
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [signatureType, setSignatureType] = useState<'handwritten' | 'typed' | 'uploaded'>('handwritten')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when modal opens/closes or load existing signature
  React.useEffect(() => {
    if (isOpen) {
      if (existingSignature) {
        setSignatureData(existingSignature.signature_data)
        setSignatureType(existingSignature.signature_type)
      } else {
        setSignatureData(null)
        setSignatureType('handwritten')
      }
      setErrors({})
    }
  }, [isOpen, existingSignature])

  const handleSignatureChange = useCallback((data: string | null) => {
    setSignatureData(data)
    setErrors(prev => ({ ...prev, signature: '' }))
  }, [])



  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {}

    if (signatureType === 'handwritten' && !signatureData) {
      newErrors.signature = 'Please provide your signature'
    }

    if (signatureType === 'uploaded' && !signatureData) {
      newErrors.signature = 'Please upload a signature image'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [signatureType, signatureData])

  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      return
    }

    try {
      if (!signatureData) {
        toast.error('Please provide a signature')
        return
      }

      const signaturePayload: SignatureData = {
        signature_data: signatureData,
        signature_type: signatureType,
        signer_name: signerName,
        signer_email: signerEmail || undefined,
        signer_role: signerRole || undefined,
        document_type: documentType || undefined,
        document_id: documentId || undefined,
        metadata: {
          created_at: new Date().toISOString()
        }
      }

      await onSave(signaturePayload)
      onClose()
    } catch (error) {
      console.error('Error saving signature:', error)
      toast.error('Failed to save signature')
    }
  }, [validateForm, signatureData, signatureType, signerName, signerEmail, signerRole, documentType, documentId, onSave, onClose])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      setSignatureData(result)
      setErrors(prev => ({ ...prev, signature: '' }))
    }
    reader.readAsDataURL(file)
  }, [])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Signature Type Selection */}
          <div>
            <Label htmlFor="signature-type">Signature Type</Label>
            <Select value={signatureType} onValueChange={(value: any) => setSignatureType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select signature type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="handwritten">Handwritten (Draw)</SelectItem>
                <SelectItem value="uploaded">Upload Image</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Signature Input */}
          <div>
            <Label>Signature</Label>
            {signatureType === 'handwritten' && (
              <SignaturePad
                onSignatureChange={handleSignatureChange}
                width={400}
                height={200}
                className="mt-2"
              />
            )}
            
            {signatureType === 'uploaded' && (
              <div className="mt-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="mb-2"
                />
                {signatureData && (
                  <div className="mt-2 p-2 border rounded">
                    <img 
                      src={signatureData} 
                      alt="Uploaded signature" 
                      className="max-h-32 max-w-full object-contain"
                    />
                  </div>
                )}
              </div>
            )}
            
            {errors.signature && (
              <p className="text-sm text-red-600 mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.signature}
              </p>
            )}
          </div>


          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Saving...' : 'Save Signature'}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SignatureModal
