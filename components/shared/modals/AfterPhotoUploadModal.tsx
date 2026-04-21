'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Camera, AlertCircle } from 'lucide-react'
import { AfterPhotoUpload } from '@/components/shared/form-input/AfterPhotoUpload'
import { useState } from 'react'

// Define the file type based on the validation schema
type FileReference = {
  id: string;
  filename: string;
  url: string;
  size?: number;
  mimeType?: string;
  uploadedAt?: Date;
};

interface AfterPhotoUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (afterPhoto: FileReference) => Promise<void>
  projectTitle: string
  projectPhotos: FileReference[]
  existingAfterPhoto?: FileReference | null
  loading?: boolean
}

export function AfterPhotoUploadModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  projectTitle,
  projectPhotos,
  existingAfterPhoto,
  loading = false
}: AfterPhotoUploadModalProps) {
  // Get the before photo from the first project photo
  const beforePhoto = projectPhotos && projectPhotos.length > 0 ? projectPhotos[0] : null;
  const [afterPhoto, setAfterPhoto] = useState<FileReference | null>(existingAfterPhoto || null)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (!afterPhoto) {
      setError('Please upload an after photo')
      return
    }

    try {
      setError(null)
      await onConfirm(afterPhoto)
      // Don't reset the form on success since this might be an update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload after photo')
    }
  }

  const handleClose = () => {
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Camera className="h-6 w-6" />
            Upload After Photo
          </DialogTitle>
          <DialogDescription>
            Upload a photo showing the completed work for &quot;{projectTitle}&quot;.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-hidden">
          {/* Before Photo Display */}
          {beforePhoto && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Before Photo (Project Start)
              </h4>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-20 h-16 bg-white rounded border overflow-hidden flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={beforePhoto.url}
                      alt="Before photo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0" style={{ maxWidth: '300px' }}>
                    <p 
                      className="text-sm font-medium text-gray-900"
                      style={{ 
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        width: '100%',
                        display: 'block'
                      }}
                    >
                      {beforePhoto.filename}
                    </p>
                    <p 
                      className="text-xs text-gray-500"
                      style={{ 
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        width: '100%',
                        display: 'block'
                      }}
                    >
                      {beforePhoto.size ? `${(beforePhoto.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'} • {beforePhoto.mimeType}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* After Photo Upload */}
          <div className="space-y-2">
            <AfterPhotoUpload
              value={afterPhoto}
              onChange={setAfterPhoto}
              label="After Photo (Project Completion)"
              placeholder="Upload a photo showing the completed work"
              required={true}
              disabled={loading}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Help Text */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm">
              <strong>Important:</strong> The after photo will be used to create a before/after comparison 
              showing the completed work. Make sure the photo clearly shows the finished project area.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || !afterPhoto}
          >
            {loading ? 'Uploading...' : existingAfterPhoto ? 'Update After Photo' : 'Upload After Photo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
