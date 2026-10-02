'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { RandomAvatar } from '@/components/ui/random-avatar'

interface RoleBasedAvatarProps {
  role?: string
  isVerified?: boolean
  size?: number
  className?: string
  name?: string
  showVerificationBadge?: boolean
  profilePhoto?: string
}

export function RoleBasedAvatar({
  role,
  isVerified = false,
  size = 40,
  className,
  name,
  showVerificationBadge = true,
  profilePhoto
}: RoleBasedAvatarProps) {
  const [imageError, setImageError] = useState(false)
  const hasPhoto = Boolean(profilePhoto && !imageError)

  const sizeClasses: Record<number, string> = {
    24: "w-6 h-6",
    28: "w-7 h-7",
    32: "w-8 h-8",
    36: "w-9 h-9",
    40: "w-10 h-10",
    44: "w-11 h-11",
    48: "w-12 h-12",
    56: "w-14 h-14",
    64: "w-16 h-16",
    80: "w-20 h-20"
  }

  const getSizeClass = () => {
    return sizeClasses[size] || ""
  }

  return (
    <div 
      className={cn("relative inline-flex items-center justify-center shrink-0", className)}
      style={{ width: size, height: size }}
    >
      {/* Main Avatar Container */}
      <div 
        className={cn(
          "relative w-full h-full rounded-full overflow-hidden flex items-center justify-center shrink-0 transition-all duration-200",
          getSizeClass()
        )}
      >
        {hasPhoto ? (
          <Image
            src={profilePhoto!}
            alt={name ? `${name}'s avatar` : "User avatar"}
            fill
            sizes={`${size}px`}
            className="object-cover"
            onError={() => {
              console.warn('Profile photo failed to load, falling back to text avatar')
              setImageError(true)
            }}
          />
        ) : (
          <RandomAvatar 
            name={name || 'User'} 
            size={size}
            className="w-full h-full"
          />
        )}
      </div>

      {/* Verification Badge */}
      {showVerificationBadge && isVerified && (
        <div className="absolute -bottom-1 -right-1 z-10 pointer-events-none">
          <div className="w-5 h-5 bg-white rounded-full border-2 border-green-400 flex items-center justify-center shadow-sm">
            <Image
              src="/assets/verified.png"
              alt="Verified"
              width={12}
              height={12}
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default RoleBasedAvatar
