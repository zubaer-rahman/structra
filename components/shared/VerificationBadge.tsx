'use client'

import { Badge } from '@/components/ui/badge'
import { Shield, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface VerificationBadgeProps {
  isVerified: boolean
  className?: string
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
  useCustomIcon?: boolean
}

export function VerificationBadge({ 
  isVerified, 
  className, 
  showIcon = true, 
  size = 'md',
  useCustomIcon = false
}: VerificationBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4', 
    lg: 'h-5 w-5'
  }

  const customIconSizes = {
    sm: 12,
    md: 16,
    lg: 20
  }

  if (isVerified) {
    return (
      <Badge 
        className={cn(
          'bg-green-100 text-green-800 border-green-300 hover:bg-green-200 font-medium',
          sizeClasses[size],
          showIcon && 'flex items-center gap-1.5',
          className
        )}
      >
        {showIcon && (
          useCustomIcon ? (
            <Image
              src="/assets/verified.png"
              alt="Verified"
              width={customIconSizes[size]}
              height={customIconSizes[size]}
              className="object-contain"
            />
          ) : (
            <CheckCircle className={iconSizes[size]} />
          )
        )}
        Verified
      </Badge>
    )
  }

  return (
    <Badge 
      className={cn(
        'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200 font-medium',
        sizeClasses[size],
        showIcon && 'flex items-center gap-1.5',
        className
      )}
    >
      {showIcon && <Shield className={iconSizes[size]} />}
      Unverified
    </Badge>
  )
}