'use client'

import { usePasswordStrength } from '@/hooks/usePasswordStrength'
import { CheckCircle, XCircle } from 'lucide-react'

interface DetailedPasswordStrengthIndicatorProps {
  password: string
  className?: string
  showLabels?: boolean
}

export function DetailedPasswordStrengthIndicator({ 
  password, 
  className = '',
  showLabels = false 
}: DetailedPasswordStrengthIndicatorProps) {
  const { requirements, strengthLevel, strengthMessage } = usePasswordStrength(password)

  const getStrengthColor = (level: string) => {
    switch (level) {
      case 'very-strong': return 'text-green-600'
      case 'strong': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'weak': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Strength Level */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Password Strength</span>
        <span className={`text-sm font-semibold capitalize ${getStrengthColor(strengthLevel)}`}>
          {strengthLevel.replace('-', ' ')}
        </span>
      </div>

      {/* Requirements Grid */}
      <div className="grid grid-cols-1 gap-2">
        {requirements.map((req) => (
          <div key={req.key} className="flex items-center space-x-2">
            {req.met ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-gray-400" />
            )}
            {showLabels && (
              <span className={`text-xs ${req.met ? 'text-green-700' : 'text-gray-500'}`}>
                {req.label}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Strength Message */}
      <div className="text-xs text-gray-500 text-center">
        {strengthMessage}
      </div>
    </div>
  )
}
