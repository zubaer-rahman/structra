'use client'

import { useState } from 'react'
import { Project } from '@/server/database/interfaces'
import { User } from '@/server/database/interfaces/auth'
import { USER_ROLES } from '@/utils/constants'
import Breadcrumbs from '@/components/shared/Breadcrumbs'
import { LoadingSpinner } from '@/components/shared'
import { ContractorProjectViewHeader } from './ContractorProjectView/ContractorProjectViewHeader'
import { ContractorProjectViewTabs } from './ContractorProjectView/ContractorProjectViewTabs'
import { ContractorProjectDetailsTab } from './ContractorProjectView/ContractorProjectDetailsTab'
import { ContractorProjectRequirementsTab } from './ContractorProjectView/ContractorProjectRequirementsTab'
import ContractorProjectFilesTab from './ContractorProjectView/ContractorProjectFilesTab'
import ReviewsTabContent from './ReviewsTabContent'
import { ContractorStreetViewTab } from './ContractorProjectView/ContractorStreetViewTab'
import { ProjectPhotosTab } from './ProjectPhotosTab'
import SiteAmenitiesDisplay from './SiteAmenitiesDisplay'
import { CertificateTabContent } from './CertificateTabContent'

export type ContractorTabType = 'details' | 'requirements' | 'files' | 'photos' | 'amenities' | 'reviews' | 'streetview' | 'certificate'

interface ContractorProjectViewProps {
  project: Project
  user: User
  userRole: (typeof USER_ROLES)[keyof typeof USER_ROLES]
  onSubmitProposal: () => void
  loading?: boolean
}

export default function ContractorProjectView({
  project,
  user,
  userRole,
  onSubmitProposal,
  loading = false
}: ContractorProjectViewProps) {
  const [activeTab, setActiveTab] = useState<ContractorTabType>('details')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <LoadingSpinner size="lg" text="Loading project details..." />
      </div>
    )
  }

  const renderTabContent = () => {
    const commonProps = {
      project,
      userRole,
      user,
    }

    switch (activeTab) {
      case 'details':
        return <ContractorProjectDetailsTab {...commonProps} />
      case 'requirements':
        return <ContractorProjectRequirementsTab {...commonProps} />
      case 'files':
        return <ContractorProjectFilesTab {...commonProps} />
      case 'photos':
        return <ProjectPhotosTab {...commonProps} />
      case 'amenities':
        return <SiteAmenitiesDisplay amenities={project.site_amenities || {
          power: [],
          sanitation: [],
          water: [],
          parking: [],
          comfort: [],
          safety: [],
          security: [],
          logistics: []
        }} />
      case 'reviews':
        return <ReviewsTabContent {...commonProps} />
      case 'streetview':
        return <ContractorStreetViewTab {...commonProps} />
      case 'certificate':
        return <CertificateTabContent {...commonProps} />
      default:
        return <ContractorProjectDetailsTab {...commonProps} />
    }
  }

  const getAvailableTabs = (): ContractorTabType[] => {
    const tabs: ContractorTabType[] = ['details', 'requirements', 'files', 'photos', 'amenities', 'streetview', 'certificate']
    // Only show reviews tab if project is completed
    if (project.status === 'Completed') {
      tabs.push('reviews')
    }
    return tabs
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-4 sm:mb-6">
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: '/contractor/dashboard' },
              { label: 'Projects', href: '/contractor/projects' },
              { label: project.project_title || 'Project Details', href: '#' }
            ]}
          />
        </div>

        {/* Project Header */}
        <div className="mb-4 sm:mb-6">
          <ContractorProjectViewHeader 
            project={project} 
            user={user}
            onSubmitProposal={onSubmitProposal}
          />
        </div>

        {/* Navigation Tabs */}
        <div className="mb-4 sm:mb-6 overflow-x-auto">
          <ContractorProjectViewTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            availableTabs={getAvailableTabs()}
            project={project}
          />
        </div>

        {/* Tab Content */}
        <div className="overflow-hidden">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}
