import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle } from "lucide-react"

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
  isPublishDisabled?: boolean
  missingFields?: string[]
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
  isProcessingPaymentSuccess = false,
  isPublishDisabled = false,
  missingFields = []
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
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Missing fields or validation status message */}
          <div className="text-xs flex-1">
            {!isEditMode && isPublishDisabled && (
              <div className="flex items-start gap-2 text-amber-800 bg-amber-50/80 border border-amber-200/70 rounded-lg p-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-amber-900">
                    Required to publish:
                  </p>
                  <p className="text-amber-700">
                    {missingFields.length > 0
                      ? missingFields.join(" • ")
                      : "Please fill in all required fields to enable publishing."}
                  </p>
                </div>
              </div>
            )}
            {!isEditMode && !isPublishDisabled && (
              <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50/80 border border-emerald-200/70 rounded-lg p-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="font-medium text-emerald-900">
                  All required fields completed. Ready to publish!
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-3 flex-shrink-0">
            <Link href={cancelUrl}>
              <Button type="button" variant="outline" className="cursor-pointer">
                Cancel
              </Button>
            </Link>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onSaveAsDraft}
              disabled={isDraftLoading}
              className="cursor-pointer"
            >
              {isProcessingPaymentSuccess ? "Publishing Project..." : isDraftLoading ? "Saving..." : (isEditMode ? "Save Changes" : "Save as Draft")}
            </Button>
            {!hidePublishButton && (
              <Button 
                type="submit" 
                onClick={onPublish}
                disabled={isPublishLoading || isPublishDisabled}
                className={`cursor-pointer transition-all duration-200 ${
                  isPublishDisabled 
                    ? "opacity-50 cursor-not-allowed bg-gray-200 text-gray-500 hover:bg-gray-200 hover:text-gray-500 border border-gray-300 shadow-none" 
                    : "bg-orange-600 hover:bg-orange-700 text-white shadow-sm"
                }`}
                title={isPublishDisabled ? "Please fill in all required fields to enable publishing" : undefined}
              >
                {isProcessingPaymentSuccess ? "Publishing Project..." : isPublishLoading ? "Publishing..." : (publishButtonText || (isEditMode ? "Publish Changes (Pay $29)" : "Publish Project (Pay $29)"))}
              </Button>
            )}
          </div>
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
        <Button type="submit" disabled={loading || isPublishDisabled}>
          {getButtonText()}
        </Button>
      </div>
    </div>
  )
}
