import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export interface FormSwitchProps {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  containerClassName?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
}

const FormSwitch = React.forwardRef<HTMLButtonElement, FormSwitchProps>(
  ({ 
    label, 
    error, 
    helperText, 
    required, 
    containerClassName,
    checked,
    onCheckedChange,
    disabled = false
  }, ref) => {
    const switchId = `form-switch-${Math.random().toString(36).substr(2, 9)}`
    
    return (
      <div className={cn("space-y-3", containerClassName)}>
        <div className="flex items-center space-x-3">
          <Switch
            id={switchId}
            ref={ref}
            checked={checked}
            onCheckedChange={onCheckedChange}
            disabled={disabled}
            className={cn(
              "transition-all duration-200",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          />
          {label && (
            <Label htmlFor={switchId} className="text-sm font-medium text-gray-700 cursor-pointer">
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          )}
        </div>
        {helperText && (
          <p className="text-xs text-gray-500 leading-relaxed ml-11">{helperText}</p>
        )}
        {error && (
          <p className="text-sm text-red-500 font-medium ml-11">{error}</p>
        )}
      </div>
    )
  }
)
FormSwitch.displayName = "FormSwitch"

export { FormSwitch }
