'use client'

import { usePasswordStrength } from '@/hooks/usePasswordStrength'

interface PasswordStrengthIndicatorProps {
  password: string
  className?: string
  compact?: boolean
}

export function PasswordStrengthIndicator({ password, className = '', compact = false }: PasswordStrengthIndicatorProps) {
  const { requirements, strengthMessage } = usePasswordStrength(password)

  if (compact) {
    // Compact version: dots only with inline message
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        {/* Visual Dots */}
        <div className="flex items-center space-x-2">
          {requirements.map((req) => (
            <div
              key={req.key}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                req.met ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
        
        {/* Inline Strength Message */}
        <span className="text-xs text-gray-500 ml-2">
          {strengthMessage}
        </span>
      </div>
    )
  }

  // Full version: message above dots
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Strength Message */}
      <div className="text-xs text-gray-500">
        {strengthMessage}
      </div>
      
      {/* Visual Dots */}
      <div className="flex items-center space-x-3">
        {requirements.map((req) => (
          <div
            key={req.key}
            className={`w-2 h-2 rounded-full transition-colors duration-200 ${
              req.met ? 'bg-green-500' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
