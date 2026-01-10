'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

interface DashboardIconProps {
  iconType: 'dashboard' | 'projects' | 'proposals' | 'profile'
  size?: number
  className?: string
  variant?: 'icon' | 'button' | 'nav'
}

export function DashboardIcon({
  iconType,
  size = 24,
  className,
  variant = 'icon'
}: DashboardIconProps) {
  const getIconImage = () => {
    switch (iconType) {
      case 'dashboard':
        return '/assets/dashboard.png'
      case 'projects':
        return '/assets/projects.png'
      case 'proposals':
        return '/assets/proposal.png'
      case 'profile':
        return '/assets/profile.png'
      default:
        return '/assets/dashboard.png'
    }
  }

  const getIconLabel = () => {
    switch (iconType) {
      case 'dashboard':
        return 'Dashboard'
      case 'projects':
        return 'Projects'
      case 'proposals':
        return 'Proposals'
      case 'profile':
        return 'Profile'
      default:
        return 'Dashboard'
    }
  }

  if (variant === 'button') {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer",
        className
      )}>
        <Image
          src={getIconImage()}
          alt={getIconLabel()}
          width={size}
          height={size}
          className="object-contain"
        />
        <span className="text-sm font-medium text-gray-700">
          {getIconLabel()}
        </span>
      </div>
    )
  }

  if (variant === 'nav') {
    return (
      <div className={cn(
        "flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer",
        className
      )}>
        <Image
          src={getIconImage()}
          alt={getIconLabel()}
          width={size}
          height={size}
          className="object-contain"
        />
        <span className="text-sm font-medium text-gray-700">
          {getIconLabel()}
        </span>
      </div>
    )
  }

  // Default icon variant
  return (
    <div className={cn("relative", className)}>
      <Image
        src={getIconImage()}
        alt={getIconLabel()}
        width={size}
        height={size}
        className="object-contain"
      />
    </div>
  )
}

export default DashboardIcon
