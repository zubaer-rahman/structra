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
  }

  // Only render for authenticated users
  if (!user) {
    return null
  }

  // Get user initial for avatar fallback (only first letter)
  const getUserInitial = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name[0].toUpperCase()
    }
    if (user?.email) {
      return user.email[0].toUpperCase()
    }
    return 'U'
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="group cursor-pointer transition-all duration-300 p-0.5 rounded-full border-2 border-gray-100 hover:border-orange-200 hover:bg-orange-50/50 shadow-sm hover:shadow-md">
          <RoleBasedAvatar
            role={user?.user_role}
            isVerified={false}
            size={44}
            name={user?.user_metadata?.full_name || user?.email}
            showVerificationBadge={false}
            profilePhoto={user?.profile_photo}
            className="group-hover:scale-95 transition-transform duration-300"
          />
        </div>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-64 p-1.5" align="end" forceMount>
        <DropdownMenuLabel className="font-normal p-2.5 bg-gradient-to-r from-gray-50 to-orange-50 rounded-lg mb-1.5">
          {/* User Info Section */}
          <div className="flex flex-col space-y-2">
            {/* Username Row */}
            <div className="flex items-center">
              <p className="text-base font-semibold leading-tight text-gray-800 truncate">
                {capitalizeWords(user?.user_metadata?.full_name) || "User"}
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
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <p className="text-xs leading-tight text-gray-600 truncate whitespace-nowrap">
                {user?.email}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="my-1.5" />
        
        <DropdownMenuItem asChild className="p-2 rounded-lg hover:bg-orange-50 hover:text-orange-700 transition-colors">
          <Link
            href={`/${
              user?.user_role || "homeowner"
            }/profile`}
            className="cursor-pointer flex items-center w-full"
          >
            <User className="mr-2 h-4 w-4 text-orange-600" />
            <span className="font-medium">Profile</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild className="p-2 rounded-lg hover:bg-orange-50 hover:text-orange-700 transition-colors">
          <Link
            href={`/${
              user?.user_role || "homeowner"
            }/profile`}
            className="cursor-pointer flex items-center w-full"
          >
            <Camera className="mr-2 h-4 w-4 text-orange-600" />
            <span className="font-medium">Change Profile Picture</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="my-1.5" />
        
        <DropdownMenuItem
          onClick={handleSignOut}
          className="p-2 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span className="font-medium">Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
