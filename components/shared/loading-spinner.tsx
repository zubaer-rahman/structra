'use client'

interface LoadingSpinnerProps {
  text?: string
  subtitle?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'warning' | 'error' | 'white'
  className?: string
  showText?: boolean
  inline?: boolean
}

export default function LoadingSpinner({ 
  text = "Loading...", 
  subtitle,
  size = 'md',
  variant = 'default',
  className = "",
  showText = true,
  inline = false
}: LoadingSpinnerProps) {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  }

  const variantClasses = {
    default: {
      spinner: 'border-orange-600',
      text: 'text-gray-800',
      subtitle: 'text-gray-600'
    },
    warning: {
      spinner: 'border-yellow-500',
      text: 'text-yellow-800',
      subtitle: 'text-gray-700'
    },
    error: {
      spinner: 'border-red-500',
      text: 'text-red-700',
      subtitle: 'text-gray-700'
    },
    white: {
      spinner: 'border-white',
      text: 'text-white',
      subtitle: 'text-gray-200'
    }
  }

  const currentVariant = variantClasses[variant]

  // Inline spinner for buttons and small spaces
  if (inline) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <div className={`animate-spin rounded-full border-b-2 ${currentVariant.spinner} ${sizeClasses[size]} ${showText ? 'mr-2' : ''}`}></div>
        {showText && (
          <span className={currentVariant.text}>{text}</span>
        )}
      </div>
    )
  }

  // Full spinner with text below
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full border-b-2 ${currentVariant.spinner} ${sizeClasses[size]} ${showText ? 'mb-4' : ''}`}></div>
      {showText && (
        <div className="text-center">
          <div className={`text-base font-semibold mb-1 ${currentVariant.text}`}>{text}</div>
          {subtitle && (
            <div className={`text-sm ${currentVariant.subtitle}`}>{subtitle}</div>
          )}
        </div>
      )}
    </div>
  )
}
