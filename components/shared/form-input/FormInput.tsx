import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

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
    
    return (
      <div className={cn("space-y-2", containerClassName)}>
        {label && (
          <Label htmlFor={inputId} className={cn(
            "text-sm font-medium block",
            isInvalid ? "text-red-700 dark:text-red-400" : "text-gray-700 dark:text-gray-200"
          )}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <Input
          id={inputId}
          type={type}
          className={cn(
            "w-full transition-colors duration-200",
            "border-gray-300 dark:border-white/10 focus-visible:border-blue-500 dark:focus-visible:border-blue-400 focus-visible:ring-offset-0 focus-visible:ring-0",
            "placeholder:text-gray-400 dark:placeholder:text-gray-500 bg-white dark:bg-[#161616] text-gray-900 dark:text-white",
            (error || isInvalid) && "border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-950/20 focus-visible:border-red-500",
            className
          )}
          ref={ref}
          {...props}
        />
        {helperText && (
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{helperText}</p>
        )}
        {error && (
          <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
        )}
        {!error && isInvalid && validationMessage && (
          <p className="text-sm text-red-500 dark:text-red-400">{validationMessage}</p>
        )}
      </div>
    )
  }
)
FormInput.displayName = "FormInput"

export { FormInput }
