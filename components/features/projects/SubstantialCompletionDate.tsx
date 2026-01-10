import * as React from "react"
import { Calendar, CheckCircle } from "lucide-react"
import { FormField, FormInput } from "@/components/shared/form-input"
import { Badge } from "@/components/ui/badge"

interface SubstantialCompletionDateProps {
  substantialCompletion?: string | null;
  onDateChange?: (date: string) => void;
  isContractor?: boolean;
  className?: string;
}

export function SubstantialCompletionDate({
  substantialCompletion,
  onDateChange,
  isContractor = false,
  className = ""
}: SubstantialCompletionDateProps) {
  const [isCompleted, setIsCompleted] = React.useState(false);

  React.useEffect(() => {
    if (substantialCompletion) {
      const completionDate = new Date(substantialCompletion);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      completionDate.setHours(0, 0, 0, 0);
      
      // Check if substantial completion date is today or in the past
      setIsCompleted(completionDate <= today);
    }
  }, [substantialCompletion]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    onDateChange?.(date);
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <span>Project Completion</span>
        </h3>
        {isCompleted && (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-4 w-4 mr-1" />
            Project Completed
          </Badge>
        )}
      </div>

      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Substantial Completion Date</h4>
          <p className="text-sm text-blue-700 mb-4">
            The date when the project is completed to the point that the statement of work requirements are met, 
            even if trivial deficiencies or minor work remains; this can be approximated as 98% complete.
          </p>
          
          <FormField name="substantial_completion">
            {({ field, error }) => (
              <FormInput
                {...field}
                label="Substantial Completion Date"
                type="date"
                max={new Date().toISOString().split('T')[0]} // Prevent future dates
                helperText={
                  isContractor 
                    ? "Submit the date when you completed the major work requirements"
                    : "Enter the date when the project was substantially completed"
                }
                error={error}
                className="w-full max-w-md"
                onChange={(e) => {
                  field.onChange(e);
                  handleDateChange(e);
                }}
              />
            )}
          </FormField>
        </div>

        {isCompleted && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="text-sm font-medium text-green-900">Project Ready for Closure</h4>
                <p className="text-sm text-green-700">
                  The substantial completion date has been set. This project is ready to be marked as completed.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
