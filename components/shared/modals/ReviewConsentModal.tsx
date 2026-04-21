'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, Camera, AlertCircle, Shield, Star, MessageSquare } from 'lucide-react'
import { useState } from 'react'
import Image from 'next/image'

type FileReference = {
  id: string;
  filename: string;
  url: string;
  size?: number;
  mimeType?: string;
  uploadedAt?: Date;
};

interface ReviewConsentModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reviewData: {
    consent: boolean
    rating: number
    recommendScore: number
    text: string
  }) => Promise<void>
  projectTitle: string
  contractorName: string
  beforePhoto: FileReference | null
  afterPhoto: FileReference | null
  loading?: boolean
}

export function ReviewConsentModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  projectTitle,
  contractorName,
  beforePhoto,
  afterPhoto,
  loading = false
}: ReviewConsentModalProps) {
  const [consent, setConsent] = useState<boolean>(false)
  const [rating, setRating] = useState<number>(5)
  const [recommendScore, setRecommendScore] = useState<number>(10)
  const [text, setText] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (!text.trim()) {
      setError('Please write a review')
      return
    }

    try {
      setError(null)
      await onConfirm({
        consent,
        rating,
        recommendScore,
        text: text.trim()
      })
      // Reset form on successful completion
      setConsent(false)
      setRating(5)
      setRecommendScore(10)
      setText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review')
    }
  }

  const handleClose = () => {
    setConsent(false)
    setRating(5)
    setRecommendScore(10)
    setText('')
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <MessageSquare className="h-6 w-6 text-green-600" />
            Review Your Contractor
          </DialogTitle>
          <DialogDescription>
            Your project "{projectTitle}" has been completed! Please review {contractorName} and decide about photo usage.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          
          {/* Consent Question */}
          <div className="space-y-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Photo Usage Consent
            </h3>
            
            <div className="space-y-2">
              <p className="text-sm text-blue-800">
                Do you consent to include the before/after pictures of the Area of Work in the review and on the contractor's profile?
              </p>
              
              <div className="space-y-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="consent"
                    value="yes"
                    checked={consent === true}
                    onChange={() => setConsent(true)}
                    className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                    disabled={loading}
                  />
                  <span className="text-sm text-blue-800 font-medium">Yes</span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="consent"
                    value="no"
                    checked={consent === false}
                    onChange={() => setConsent(false)}
                    className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                    disabled={loading}
                  />
                  <span className="text-sm text-blue-800 font-medium">No</span>
                </label>
              </div>
            </div>
          </div>

          {/* Review Form */}
          <div className="space-y-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Star className="h-5 w-5" />
              Your Review
            </h3>
            
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
          </div>

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
            Skip for Now
          </Button>
          <Button
            onClick={handleConfirm}
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
