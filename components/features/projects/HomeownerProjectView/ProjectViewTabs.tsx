'use client'

import { Project } from '@/server/database/interfaces'
import { Badge } from '@/components/ui/badge'
import { Eye, FileText, FolderOpen, Camera, MessageSquare, MapPin, Home, Award } from 'lucide-react'
import { TabType } from './index'
import { cn } from '@/lib/utils'
import { USER_ROLES, PROJECT_STATUSES } from '@/utils/constants'

interface ProjectViewTabsProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  userRole: typeof USER_ROLES[keyof typeof USER_ROLES]
  availableTabs: TabType[]
  proposalCount: number
  project: Project
}

export function ProjectViewTabs({ activeTab, onTabChange, userRole, availableTabs, proposalCount, project }: ProjectViewTabsProps) {
  const getTabIcon = (tab: TabType) => {
    switch (tab) {
      case 'details': return <Eye className="h-4 w-4" />
      case 'proposals': return <FileText className="h-4 w-4" />
      case 'files': return <FolderOpen className="h-4 w-4" />
      case 'photos': return <Camera className="h-4 w-4" />
      case 'amenities': return <Home className="h-4 w-4" />
      case 'reviews': return <MessageSquare className="h-4 w-4" />
      case 'streetview': return <MapPin className="h-4 w-4" />
      case 'certificate': return <Award className="h-4 w-4" />
      default: return <Eye className="h-4 w-4" />
    }
  }

  const getTabLabel = (tab: TabType) => {
    switch (tab) {
      case 'details': return 'Details'
      case 'proposals':
        if (userRole === USER_ROLES.HOMEOWNER) {
          return 'Proposals'
        }
        return userRole === USER_ROLES.CONTRACTOR ? 'My Proposals' : 'Proposals'
      case 'files': return 'Files'
      case 'photos': return 'Before / After'
      case 'amenities': return 'Site Amenities'
      case 'reviews': return 'Reviews'
      case 'streetview': return 'Street View'
      case 'certificate': return 'Certificate of Title'
      default: return 'details'
    }
  }



  const isTabDisabled = (tab: TabType) => {
    if (tab === 'proposals' && userRole === USER_ROLES.CONTRACTOR && project.status === PROJECT_STATUSES.COMPLETED) return true
    return false
  }

  const getTabBadge = (tab: TabType) => {
    switch (tab) {
      case 'proposals':
        if (userRole === USER_ROLES.HOMEOWNER && proposalCount > 0) {
          return (
            <Badge variant="secondary" className="ml-2 px-2 py-0.5 text-xs font-semibold bg-orange-100 text-orange-800">
              {proposalCount}
            </Badge>
          )
        }
        return null
      default: return null
    }
  }

  return (
         <nav className="flex overflow-x-auto space-x-2 sm:space-x-8 my-6 border-b border-gray-200 scrollbar-hide" aria-label="Tabs">
          {availableTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              disabled={isTabDisabled(tab)}
              className={cn(
                "flex items-center gap-1 sm:gap-2 py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors duration-200 flex-shrink-0",
                activeTab === tab
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
                isTabDisabled(tab) && "opacity-50 cursor-not-allowed"
              )}
            >
              {getTabIcon(tab)}
              <span className="hidden sm:inline">{getTabLabel(tab)}</span>
              <span className="sm:hidden">{getTabLabel(tab).split(' ')[0]}</span>
              {getTabBadge(tab)}
            </button>
          ))}
        </nav>
    )
}
