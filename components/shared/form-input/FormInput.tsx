import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { AlertCircle } from "lucide-react"

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  containerClassName?: string
  isInvalid?: boolean
  validationMessage?: string
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ 
    className, 
    type, 
    label, 
    error, 
    helperText, 
    required, 
    containerClassName,
    id,
    isInvalid,
    validationMessage,
    ...props 
  }, ref) => {
    const inputId = id || `form-input-${Math.random().toString(36).substr(2, 9)}`
    const hasError = Boolean(error || isInvalid)
    const errorMessage = error || validationMessage
    
    return (
      <div className={cn("space-y-1.5", containerClassName)}>
        {label && (
          <div className="flex items-center justify-between">
            <Label htmlFor={inputId} className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {label}
              {required && <span className="text-red-500 font-bold ml-1">*</span>}
            </Label>
            {hasError && (
              <span className="text-xs font-medium text-red-500">Required</span>
            )}
          </div>
        )}
        <Input
          id={inputId}
          type={type}
          className={cn(
            "transition-all h-10 text-sm dark:bg-[#161616] dark:text-white",
            hasError
              ? "border-red-500 focus-visible:ring-red-400 bg-red-50/20 dark:bg-red-950/20"
              : "border-gray-200 dark:border-white/10 focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-orange-500",
            className
          )}
          ref={ref}
          {...props}
        />
        {helperText && !hasError && (
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{helperText}</p>
        )}
        {hasError && errorMessage && (
          <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </p>
        )}
      </div>
    )
  }
)
FormInput.displayName = "FormInput"

export { FormInput }

