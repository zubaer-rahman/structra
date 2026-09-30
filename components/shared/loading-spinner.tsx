'use client'

interface LoadingSpinnerProps {
  text?: string
  subtitle?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'warning' | 'error' | 'white' | 'dark'
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
      spinner: 'border-orange-600 dark:border-orange-500',
      text: 'text-gray-800 dark:text-gray-100',
      subtitle: 'text-gray-600 dark:text-gray-400'
    },
    warning: {
      spinner: 'border-yellow-500 dark:border-yellow-400',
      text: 'text-yellow-800 dark:text-yellow-300',
      subtitle: 'text-gray-700 dark:text-gray-400'
    },
    error: {
      spinner: 'border-red-500 dark:border-red-400',
      text: 'text-red-700 dark:text-red-400',
      subtitle: 'text-gray-700 dark:text-gray-400'
    },
    white: {
      spinner: 'border-white',
      text: 'text-white',
      subtitle: 'text-gray-200'
    },
    dark: {
      spinner: 'border-orange-500',
      text: 'text-white',
      subtitle: 'text-gray-400'
    }
  }

  const currentVariant = variantClasses[variant]

  // Inline spinner for buttons and small spaces
  if (inline) {
    return (
      <div className={`inline-flex items-center ${className}`} suppressHydrationWarning>
        <div className={`animate-spin rounded-full border-b-2 ${currentVariant.spinner} ${sizeClasses[size]} ${showText ? 'mr-2' : ''}`} suppressHydrationWarning></div>
        {showText && (
          <span className={currentVariant.text} suppressHydrationWarning>{text}</span>
        )}
      </div>
    )
  }

  // Full spinner with text below
  return (
    <div className={`flex flex-col items-center justify-center ${className}`} suppressHydrationWarning>
      <div className={`animate-spin rounded-full border-b-2 ${currentVariant.spinner} ${sizeClasses[size]} ${showText ? 'mb-4' : ''}`} suppressHydrationWarning></div>
      {showText && (
        <div className="text-center" suppressHydrationWarning>
          <div className={`text-base font-semibold mb-1 ${currentVariant.text}`} suppressHydrationWarning>{text}</div>
          {subtitle && (
            <div className={`text-sm ${currentVariant.subtitle}`} suppressHydrationWarning>{subtitle}</div>
          )}
        </div>
      )}
    </div>
  )
}
