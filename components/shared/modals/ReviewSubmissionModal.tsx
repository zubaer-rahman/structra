'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Star, MessageSquare, AlertCircle } from 'lucide-react'
import { useState } from 'react'

interface ReviewSubmissionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (reviewData: {
    rating: number
    recommendScore: number
    text: string
    homeownerConsentForPhotos: boolean
  }) => Promise<void>
  projectTitle: string
  contractorName: string
  homeownerConsentForPhotos: boolean
  loading?: boolean
}

export function ReviewSubmissionModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  projectTitle,
  contractorName,
  homeownerConsentForPhotos,
  loading = false
}: ReviewSubmissionModalProps) {
  const [rating, setRating] = useState<number>(5)
  const [recommendScore, setRecommendScore] = useState<number>(10)
  const [text, setText] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!text.trim()) {
      setError('Please write a review')
      return
    }

    try {
      setError(null)
      await onSubmit({
        rating,
        recommendScore,
        text: text.trim(),
        homeownerConsentForPhotos
      })
      // Reset form on successful submission
      setRating(5)
      setRecommendScore(10)
      setText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review')
    }
  }

  const handleClose = () => {
    setRating(5)
    setRecommendScore(10)
    setText('')
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <MessageSquare className="h-6 w-6 text-green-600" />
            Write Your Review
          </DialogTitle>
          <DialogDescription>
            Share your experience working with {contractorName} on "{projectTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-hidden">
          
          {/* Rating Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">
              Overall Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  disabled={loading}
                  className={`p-1 rounded ${
                    star <= rating 
                      ? 'text-yellow-400' 
                      : 'text-gray-300 hover:text-yellow-400'
                  } transition-colors`}
                >
                  <Star className="h-8 w-8 fill-current" />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {rating} star{rating !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Recommendation Score */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">
              How likely are you to recommend {contractorName} to others? <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">0</span>
              <input
                type="range"
                min="0"
                max="10"
                value={recommendScore}
                onChange={(e) => setRecommendScore(Number(e.target.value))}
                disabled={loading}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm text-gray-600">10</span>
              <span className="ml-2 text-sm font-medium text-gray-900">
                {recommendScore}/10
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {recommendScore >= 9 ? 'Promoter' : recommendScore >= 7 ? 'Passive' : 'Detractor'}
            </p>
          </div>

          {/* Review Text */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">
              Write your review <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Share details about your experience. What went well? What could be improved? How was the communication and quality of work?"
              className="min-h-[120px] resize-none"
              disabled={loading}
            />
            <p className="text-xs text-gray-500">
              {text.length}/500 characters
            </p>
          </div>

          {/* Photo Consent Status */}
          {homeownerConsentForPhotos && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>✓ Photo Consent:</strong> Your before/after photos will be included in this review and on the contractor's profile.
              </p>
            </div>
          )}

          {!homeownerConsentForPhotos && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Photo Consent:</strong> Your review will be posted without before/after photos.
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
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
            onClick={handleSubmit}
            disabled={loading || !text.trim()}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Submitting Review...' : 'Submit Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
