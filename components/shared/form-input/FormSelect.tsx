import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface FormSelectOption {
  value: string
  label: string
}

export interface FormSelectProps {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  containerClassName?: string
  placeholder?: string
  options: FormSelectOption[]
  value?: string
  onChange?: (value: string) => void
  onValueChange?: (value: string) => void
  disabled?: boolean
  isInvalid?: boolean
  validationMessage?: string
}

const FormSelect = React.forwardRef<HTMLButtonElement, FormSelectProps>(
  ({ 
    label, 
    error, 
    helperText, 
    required, 
    containerClassName,
    placeholder = "Select an option",
    options,
    value,
    onChange,
    onValueChange,
    disabled = false,
    isInvalid = false,
    validationMessage
  }, ref) => {
    const selectId = `form-select-${Math.random().toString(36).substr(2, 9)}`
    
    return (
      <div className={cn("space-y-2", containerClassName)}>
        {label && (
          <Label htmlFor={selectId} className={cn(
            "text-sm font-medium block",
            isInvalid ? "text-red-600" : "text-gray-700"
          )}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <Select 
          value={value} 
          onValueChange={(val) => {
            onValueChange?.(val);
            onChange?.(val);
          }}
          disabled={disabled}
        >
          <SelectTrigger 
            ref={ref}
            className={cn(
              "w-full transition-colors duration-200",
              "border-gray-300 focus:border-blue-500 focus:ring-0 focus:ring-offset-0 focus-visible:ring-offset-0 focus-visible:ring-0",
              "bg-white hover:bg-gray-50",
              (error || isInvalid) && "border-red-500 focus:border-red-500 focus:ring-0 focus:ring-offset-0 focus-visible:ring-offset-0 focus-visible:ring-0 bg-red-50",
              disabled && "bg-gray-50 text-gray-500 cursor-not-allowed"
            )}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {helperText && (
          <p className="text-xs text-gray-500 leading-relaxed">{helperText}</p>
        )}
        {error && (
          <p className="text-sm text-red-500 font-medium">{error}</p>
        )}
        {isInvalid && !error && validationMessage && (
          <p className="text-sm text-red-500 font-medium">{validationMessage}</p>
        )}
      </div>
    )
  }
)
FormSelect.displayName = "FormSelect"

export { FormSelect }
