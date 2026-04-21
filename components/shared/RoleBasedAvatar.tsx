'use client'

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
  size = 48,
  className,
  name,
  showVerificationBadge = true,
  profilePhoto
}: RoleBasedAvatarProps) {
  const sizeClasses: Record<number, string> = {
    24: "w-6 h-6",
    32: "w-8 h-8", 
    40: "w-10 h-10",
    48: "w-12 h-12",
    56: "w-14 h-14",
    64: "w-16 h-16",
    80: "w-20 h-20"
  }


  const getSizeClass = () => {
    return sizeClasses[size] || "w-12 h-12"
  }

  return (
    <div className={cn("relative", className)}>
      {/* Main Avatar */}
      <div className={cn(
        "relative rounded-full overflow-hidden transition-all duration-200",
        getSizeClass()
      )}>
        {profilePhoto ? (
          <Image
            src={profilePhoto}
            alt="Profile picture"
            fill
            className="object-cover"
            onError={() => {
              // Fallback to RandomAvatar if image fails to load
              console.warn('Profile photo failed to load, falling back to RandomAvatar')
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
        <div className="absolute -bottom-1 -right-1">
          <div className="w-5 h-5 bg-white rounded-full border-2 border-green-400 flex items-center justify-center">
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
