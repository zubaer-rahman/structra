'use client'

import { forwardRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

// Input type configurations
const inputConfigs = {
  name: {
    icon: User,
    label: 'Name',
    placeholder: 'Enter your name',
    type: 'text'
  },
  email: {
    icon: Mail,
    label: 'Email',
    placeholder: 'john@example.com',
    type: 'email'
  },
  password: {
    icon: Lock,
    label: 'Password',
    placeholder: 'Enter your password',
    type: 'password'
  }
} as const

type InputType = keyof typeof inputConfigs

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  type: InputType
  label?: string
  icon?: boolean
  error?: string
  showPasswordToggle?: boolean
  helperText?: string
  className?: string
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ 
    type, 
    label, 
    icon = true, 
    error, 
    showPasswordToggle = false,
    helperText,
    className,
    ...props 
  }, ref) => {
    const config = inputConfigs[type as InputType]
    const IconComponent = config.icon
    const [showPassword, setShowPassword] = useState(false)
    
    // Determine if this should show password toggle
    const shouldShowToggle = showPasswordToggle && type === 'password'
    const inputType = shouldShowToggle && showPassword ? 'text' : config.type

    return (
      <div className="space-y-2">
        <Label htmlFor={type} className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          {icon && <IconComponent className="h-4 w-4" />}
          {label || config.label}
        </Label>
        
        <div className="relative">
          <Input
            ref={ref}
            id={type}
            type={inputType}
            placeholder={config.placeholder}
            className={cn(
              "h-10 text-sm border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-lg",
              shouldShowToggle && "pr-10",
              error && "border-red-300 focus:border-red-500 focus:ring-red-500",
              className
            )}
            {...props}
          />
          
          {shouldShowToggle && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-2 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        {helperText && (
          <p className="text-xs text-gray-500">{helperText}</p>
        )}
        
        {error && (
          <p className="text-red-600 text-xs">{error}</p>
        )}
      </div>
    )
  }
)

AuthInput.displayName = 'AuthInput'
