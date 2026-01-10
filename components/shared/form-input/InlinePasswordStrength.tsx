'use client'

import { usePasswordStrength } from '@/hooks/usePasswordStrength'

interface InlinePasswordStrengthProps {
  password: string
  className?: string
}

export function InlinePasswordStrength({ password, className = '' }: InlinePasswordStrengthProps) {
  const { requirements, strengthMessage } = usePasswordStrength(password)

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Left: Dots */}
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
      
      {/* Right: Message */}
      <span className="text-xs text-gray-500">
        {strengthMessage}
      </span>
    </div>
  )
}
