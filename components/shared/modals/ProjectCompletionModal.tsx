'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle, Camera, AlertCircle } from 'lucide-react'
import { AfterPhotoUpload } from '@/components/shared/form-input/AfterPhotoUpload'
import { useState, useEffect } from 'react'

// Define the file type based on the validation schema
type FileReference = {
  id: string;
  filename: string;
  url: string;
  size?: number;
  mimeType?: string;
  uploadedAt?: Date;
};

interface ProjectCompletionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (afterPhoto: FileReference) => Promise<void>
  projectTitle: string
  projectPhotos: FileReference[]
  existingAfterPhoto?: FileReference | null
  loading?: boolean
}

export function ProjectCompletionModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  projectTitle,
  projectPhotos,
  existingAfterPhoto,
  loading = false
}: ProjectCompletionModalProps) {
  // Get the before photo from the first project photo
  const beforePhoto = projectPhotos && projectPhotos.length > 0 ? projectPhotos[0] : null;
  // Use existing after photo if available, otherwise allow upload
  const [afterPhoto, setAfterPhoto] = useState<FileReference | null>(existingAfterPhoto || null)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (!afterPhoto) {
      setError('Please upload an after completion photo')
      return
    }

    try {
      setError(null)
      await onConfirm(afterPhoto)
      // Reset form on successful completion
      setAfterPhoto(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark project as complete')
    }
  }

  const handleClose = () => {
    setAfterPhoto(existingAfterPhoto || null)
    setError(null)
    onClose()
  }

  // Update afterPhoto when existingAfterPhoto changes
  useEffect(() => {
    setAfterPhoto(existingAfterPhoto || null)
  }, [existingAfterPhoto])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <CheckCircle className="h-6 w-6 text-green-600" />
            Mark Project as Complete
          </DialogTitle>
          <DialogDescription>
            {existingAfterPhoto 
              ? `Complete the project "${projectTitle}" - all required photos are ready.`
              : `Complete the project "${projectTitle}" by uploading a photo showing the finished work.`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-hidden">

          {/* After Photo Upload */}
          <div className="space-y-2">
            {!existingAfterPhoto && (
              <AfterPhotoUpload
                value={afterPhoto}
                onChange={setAfterPhoto}
                label="After Photo (Project Completion)"
                placeholder="Upload a photo showing the completed work"
                required={true}
                disabled={loading}
              />
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Help Text - Only show when uploading new photo */}
          {!existingAfterPhoto && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Important:</strong> The after photo will be used to create a before/after comparison 
                showing the completed work. Make sure the photo clearly shows the finished project area.
              </p>
            </div>
          )}
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
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Marking Complete...' : 'Mark Project Complete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
