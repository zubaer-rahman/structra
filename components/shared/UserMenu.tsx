'use client'

import { User, LogOut, Camera } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { capitalizeWords } from '@/utils/helpers'
import { RoleBasedAvatar } from './RoleBasedAvatar'

export function UserMenu() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/login'
  }

  // Only render for authenticated users
  if (!user) {
    return null
  }

  const userDisplayName =
    user?.user_metadata?.full_name ||
    user?.full_name ||
    (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '') ||
    user?.email ||
    'User'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="User account menu"
          className="group cursor-pointer transition-all duration-300 p-0.5 rounded-full border-2 border-gray-100 dark:border-white/10 hover:border-orange-200 dark:hover:border-orange-500/40 hover:bg-orange-50/50 dark:hover:bg-orange-500/10 shadow-sm hover:shadow-md inline-flex items-center justify-center shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        >
          <RoleBasedAvatar
            role={user?.user_role}
            isVerified={false}
            size={40}
            name={userDisplayName}
            showVerificationBadge={false}
            profilePhoto={user?.profile_photo}
            className="group-hover:scale-95 transition-transform duration-300"
          />
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-64 p-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xl text-gray-900 dark:text-gray-100" align="end" forceMount>
        <DropdownMenuLabel className="font-normal p-2.5 bg-gradient-to-r from-gray-50 to-orange-50 dark:from-white/5 dark:to-orange-500/10 rounded-lg mb-1.5 border border-gray-100/50 dark:border-white/5">
          {/* User Info Section */}
          <div className="flex flex-col space-y-2">
            {/* Username Row */}
            <div className="flex items-center">
              <p className="text-base font-semibold leading-tight text-gray-800 dark:text-white truncate">
                {capitalizeWords(userDisplayName)}
              </p>
            </div>
            
            {/* Role Badge Row */}
            <div className="flex items-center">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-500 text-white capitalize">
                {user?.user_role || "User"}
              </span>
            </div>
            
            {/* Email Row */}
            <div className="flex items-center space-x-1.5">
              <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
              <p className="text-xs leading-tight text-gray-600 dark:text-gray-400 truncate whitespace-nowrap">
                {user?.email}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="my-1.5 dark:bg-white/10" />
        
        <DropdownMenuItem asChild className="p-2 rounded-lg hover:bg-orange-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200 hover:text-orange-700 dark:hover:text-orange-400 transition-colors">
          <Link
            href={`/${
              user?.user_role || "homeowner"
            }/profile`}
            className="cursor-pointer flex items-center w-full"
          >
            <User className="mr-2 h-4 w-4 text-orange-600 dark:text-orange-400" />
            <span className="font-medium">Profile</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild className="p-2 rounded-lg hover:bg-orange-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200 hover:text-orange-700 dark:hover:text-orange-400 transition-colors">
          <Link
            href={`/${
              user?.user_role || "homeowner"
            }/profile`}
            className="cursor-pointer flex items-center w-full"
          >
            <Camera className="mr-2 h-4 w-4 text-orange-600 dark:text-orange-400" />
            <span className="font-medium">Change Profile Picture</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="my-1.5 dark:bg-white/10" />
        
        <DropdownMenuItem
          onClick={handleSignOut}
          className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span className="font-medium">Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
