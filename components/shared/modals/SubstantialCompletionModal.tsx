import * as React from "react"
import { useState } from "react"
import { Calendar, CheckCircle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { FormField, FormInput } from "@/components/shared/form-input"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

const substantialCompletionSchema = z.object({
  substantial_completion: z.string().min(1, 'Date is required').refine(
    (date) => {
      const completionDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      completionDate.setHours(0, 0, 0, 0);
      return completionDate <= today;
    },
    { message: 'Substantial completion date cannot be in the future' }
  )
})

type SubstantialCompletionFormData = z.infer<typeof substantialCompletionSchema>

interface SubstantialCompletionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (date: string) => Promise<void>
  currentDate?: string | null
  isContractor?: boolean
  hasAfterPhoto?: boolean
}

export function SubstantialCompletionModal({
  isOpen,
  onClose,
  onSave,
  currentDate,
  isContractor = false,
  hasAfterPhoto = false
}: SubstantialCompletionModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<SubstantialCompletionFormData>({
    resolver: zodResolver(substantialCompletionSchema),
    defaultValues: {
      substantial_completion: currentDate || new Date().toISOString().split('T')[0]
    }
  })

  const handleSubmit = async (data: SubstantialCompletionFormData) => {
    try {
      setIsLoading(true)
      await onSave(data.substantial_completion)
      toast.success("Substantial completion date updated successfully")
      onClose()
    } catch (error) {
      toast.error("Failed to update substantial completion date")
      console.error("Error updating substantial completion:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            Set Substantial Completion Date
          </DialogTitle>
          <DialogDescription>
            {isContractor 
              ? "Submit the date when you completed the major work requirements (98% complete)"
              : "Enter the date when the project was substantially completed (98% complete)"
            }
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          
          {/* After Photo Requirement */}
          {!hasAfterPhoto && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-gray-600 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900">After Photo Required</h4>
                  <p className="text-sm text-gray-700">
                    The homeowner must upload an after photo before setting the substantial completion date. 
                    This photo serves as evidence that the work has been completed.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-gray-600 mt-0.5" />
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">What is Substantial Completion?</h4>
                <p className="text-sm text-gray-700">
                  The date when the project is completed to the point that the statement of work 
                  requirements are met, even if trivial deficiencies or minor work remains. 
                  This can be approximated as 98% complete.
                </p>
              </div>
            </div>
          </div>

          <FormField name="substantial_completion">
            {({ field, error }) => (
              <FormInput
                {...field}
                label="Substantial Completion Date"
                type="date"
                max={today}
                helperText="Cannot be set for a future date"
                error={error}
                className="w-full"
                disabled={!hasAfterPhoto}
              />
            )}
          </FormField>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-gray-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Important</h4>
                <p className="text-sm text-gray-700">
                  Setting this date will trigger the project close workflow. 
                  Make sure the work is truly substantially complete before proceeding.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !hasAfterPhoto}
            >
              {isLoading ? "Saving..." : "Set Completion Date"}
            </Button>
          </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}
