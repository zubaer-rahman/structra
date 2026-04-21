import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface FormActionsProps {
  loading: boolean
  cancelUrl?: string
  buttonText?: string
  showDraftButton?: boolean
  onSaveAsDraft?: () => void
  onPublish?: () => void
  isDraftLoading?: boolean
  isPublishLoading?: boolean
  isEditMode?: boolean
  publishButtonText?: string
  hidePublishButton?: boolean
  isProcessingPaymentSuccess?: boolean
}

export function FormActions({ 
  loading, 
  cancelUrl = "/homeowner/dashboard", 
  buttonText,
  showDraftButton = false,
  onSaveAsDraft,
  onPublish,
  isDraftLoading = false,
  isPublishLoading = false,
  isEditMode = false,
  publishButtonText,
  hidePublishButton = false,
  isProcessingPaymentSuccess = false
}: FormActionsProps) {
  
  // Button text logic for single button mode
  const getButtonText = () => {
    if (buttonText) return buttonText
    if (loading) return isEditMode ? "Updating Project..." : "Creating Project..."
    return isEditMode ? "Update Project Details" : "Create Project"
  }

  // If showing draft button, render two buttons
  if (showDraftButton) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-end space-x-4">
          <Link href={cancelUrl}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onSaveAsDraft}
            disabled={isDraftLoading}
          >
            {isProcessingPaymentSuccess ? "Publishing Project..." : isDraftLoading ? "Saving..." : (isEditMode ? "Save Changes" : "Save as Draft")}
          </Button>
          {!hidePublishButton && (
            <Button 
              type="submit" 
              onClick={onPublish}
              disabled={isPublishLoading}
            >
              {isProcessingPaymentSuccess ? "Publishing Project..." : isPublishLoading ? "Publishing..." : (publishButtonText || (isEditMode ? "Publish Changes (Pay $29)" : "Publish Project (Pay $29)"))}
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Default single button mode
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-end space-x-4">
        <Link href={cancelUrl}>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={loading}>
          {getButtonText()}
        </Button>
      </div>
    </div>
  )
}
