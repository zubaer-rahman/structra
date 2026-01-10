import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

export interface FormBadgeProps {
  label: string
  onRemove?: () => void
  variant?: "default" | "secondary" | "destructive" | "outline"
  className?: string
  removable?: boolean
}

const FormBadge = React.forwardRef<HTMLDivElement, FormBadgeProps>(
  ({ 
    label, 
    onRemove, 
    variant = "secondary",
    className,
    removable = false
  }, ref) => {
    return (
      <div ref={ref}>
        <Badge
          variant={variant}
          className={cn(
            "flex items-center gap-2",
            removable && "pr-1",
            className
          )}
        >
          <span>{label}</span>
          {removable && onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="ml-1 rounded-full p-0.5 hover:bg-gray-200 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </Badge>
      </div>
    )
  }
)
FormBadge.displayName = "FormBadge"

export { FormBadge }
