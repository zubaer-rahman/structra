import * as React from "react"
import { CheckCircle, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ProjectCompletionBadgeProps {
  substantialCompletion?: string | null;
  projectStatus?: string;
  className?: string;
}

export function ProjectCompletionBadge({
  substantialCompletion,
  projectStatus,
  className = ""
}: ProjectCompletionBadgeProps) {
  const [isCompleted, setIsCompleted] = React.useState(false);
  const [isReadyForClosure, setIsReadyForClosure] = React.useState(false);

  React.useEffect(() => {
    if (substantialCompletion) {
      const completionDate = new Date(substantialCompletion);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      completionDate.setHours(0, 0, 0, 0);
      
      // Check if substantial completion date is today or in the past
      const isCompletedToday = completionDate <= today;
      setIsCompleted(isCompletedToday);
      setIsReadyForClosure(true);
    } else {
      setIsCompleted(false);
      setIsReadyForClosure(false);
    }
  }, [substantialCompletion]);

  // Only show badge if project is in "Proposal Selected" status and substantial completion is set
  if (projectStatus !== "Proposal Selected" || !isReadyForClosure) {
    return null;
  }

  return (
    <div className={`mb-4 ${className}`}>
      {isCompleted ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-900">
                Project Substantially Completed
              </h3>
              <p className="text-sm text-green-700 mt-1">
                This project has reached substantial completion and is ready to be marked as completed.
              </p>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
              Ready for Closure
            </Badge>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-amber-900">
                Substantial Completion Date Set
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                A substantial completion date has been set for a future date. The project will be ready for closure on that date.
              </p>
            </div>
            <Badge variant="outline" className="border-amber-300 text-amber-800">
              Pending Completion
            </Badge>
          </div>
        </div>
      )}
    </div>
  )
}
