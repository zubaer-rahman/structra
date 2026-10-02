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
import { AlertCircle } from "lucide-react"

export interface FormSelectOption {
  value: string
  label: string
  disabled?: boolean
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
    const hasError = Boolean(error || isInvalid)
    const errorMessage = error || validationMessage
    
    return (
      <div className={cn("space-y-1.5", containerClassName)}>
        {label && (
          <div className="flex items-center justify-between">
            <Label htmlFor={selectId} className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {label}
              {required && <span className="text-red-500 font-bold ml-1">*</span>}
            </Label>
            {hasError && (
              <span className="text-xs font-medium text-red-500">Required</span>
            )}
          </div>
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
              "w-full transition-all h-10 text-sm dark:bg-[#141414] dark:text-white",
              hasError
                ? "border-red-500 focus-visible:ring-red-400 bg-red-50/20 dark:bg-red-950/20"
                : "border-gray-200 dark:border-white/10 focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-orange-500",
              disabled && "bg-gray-50 dark:bg-zinc-900 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            )}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-[#141414] border-gray-200 dark:border-white/10 text-gray-900 dark:text-gray-100 shadow-xl">
            {options.map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
                className="text-gray-900 dark:text-gray-100 focus:bg-gray-100 dark:focus:bg-white/10 focus:text-gray-900 dark:focus:text-white cursor-pointer"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
FormSelect.displayName = "FormSelect"

export { FormSelect }

