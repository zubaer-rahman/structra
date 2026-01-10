'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, Eye, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { SIGNATURE_STATUSES, SIGNATURE_STATUS_DESCRIPTIONS } from '@/utils/constants/signatures'
import { SignatureWithUser } from '@/server/database/schemas/signatures'

interface SignatureViewerProps {
  signature: SignatureWithUser
  showDetails?: boolean
  onDownload?: (signature: SignatureWithUser) => void
  onView?: (signature: SignatureWithUser) => void
  className?: string
}

export function SignatureViewer({
  signature,
  showDetails = true,
  onDownload,
  onView,
  className = ''
}: SignatureViewerProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case SIGNATURE_STATUSES.VERIFIED:
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case SIGNATURE_STATUSES.SIGNED:
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case SIGNATURE_STATUSES.REJECTED:
        return <XCircle className="h-4 w-4 text-red-600" />
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

  const handleDownload = () => {
    if (onDownload) {
      onDownload(signature)
    } else {
      // Default download behavior
      const link = document.createElement('a')
      link.download = `signature-${signature.id}.png`
      link.href = signature.signature_data
      link.click()
    }
  }

  const handleView = () => {
    if (onView) {
      onView(signature)
    }
  }

  return (
    <Card className={`signature-viewer ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {signature.signer_name}
          </CardTitle>
          <Badge className={getStatusColor(signature.status)}>
            <div className="flex items-center space-x-1">
              {getStatusIcon(signature.status)}
              <span className="capitalize">{signature.status}</span>
            </div>
          </Badge>
        </div>
        {signature.signer_role && (
          <p className="text-sm text-gray-600 capitalize">
            {signature.signer_role}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
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
        {showDetails && (
          <div className="space-y-2 text-sm">
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

            {signature.expires_at && (
              <div className="flex justify-between">
                <span className="text-gray-600">Expires:</span>
                <span className={new Date(signature.expires_at) < new Date() ? 'text-red-600' : ''}>
                  {format(new Date(signature.expires_at), 'MMM dd, yyyy HH:mm')}
                </span>
              </div>
            )}

            {signature.document_type && (
              <div className="flex justify-between">
                <span className="text-gray-600">Document:</span>
                <span className="capitalize">{signature.document_type}</span>
              </div>
            )}

            <div className="pt-2 border-t">
              <p className="text-gray-600 text-xs">
                {SIGNATURE_STATUS_DESCRIPTIONS[signature.status as keyof typeof SIGNATURE_STATUS_DESCRIPTIONS]}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleView}
            className="flex items-center space-x-1"
          >
            <Eye className="h-4 w-4" />
            <span>View</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex items-center space-x-1"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default SignatureViewer
