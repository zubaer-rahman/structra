import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export interface FormCardProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  headerClassName?: string
  contentClassName?: string
}

const FormCard = React.forwardRef<HTMLDivElement, FormCardProps>(
  ({ 
    title, 
    description, 
    children, 
    className,
    headerClassName,
    contentClassName
  }, ref) => {
    return (
      <Card ref={ref} className={cn("border-gray-200", className)}>
        {(title || description) && (
          <CardHeader className={cn("pb-4", headerClassName)}>
            {title && (
              <CardTitle className="text-lg font-medium text-gray-900">
                {title}
              </CardTitle>
            )}
            {description && (
              <CardDescription className="text-gray-600">
                {description}
              </CardDescription>
            )}
          </CardHeader>
        )}
        <CardContent className={cn("space-y-4", contentClassName)}>
          {children}
        </CardContent>
      </Card>
    )
  }
)
FormCard.displayName = "FormCard"

export { FormCard }
