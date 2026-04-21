'use client'

import { Project } from '@/server/database/interfaces'
import { User } from '@/server/database/interfaces/auth'
import { MapPin, Navigation, Compass, Clock, DollarSign } from 'lucide-react'
import { USER_ROLES } from '@/utils/constants'
import { LocationDisplay } from '@/components/shared'

interface ContractorStreetViewTabProps {
  project: Project
  user: User
  userRole: typeof USER_ROLES[keyof typeof USER_ROLES]
}

export function ContractorStreetViewTab({ project }: ContractorStreetViewTabProps) {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Street View Header */}
      <div>
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <Navigation className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Street View & Location</h3>
        </div>
        <p className="text-sm sm:text-base text-gray-600 mb-6">
          Explore the project location with interactive maps and street view imagery to better understand the work site.
        </p>
      </div>

      {/* Interactive Map */}
      <div>
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          <h4 className="text-base font-semibold text-gray-900">Interactive Map</h4>
        </div>
        
        <div className="mb-6">
          <LocationDisplay 
            location={project.location} 
            className="w-full"
            height="500px"
          />
        </div>
      </div>

      {/* Location Details */}
      <div>
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          <h4 className="text-base font-semibold text-gray-900">Address Information</h4>
        </div>
        
        <div className="space-y-3">
          {project.location.address && (
            <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100">
              <span className="text-sm sm:text-base text-gray-600 font-medium mb-1 sm:mb-0">Address</span>
              <span className="text-sm sm:text-base text-gray-900">{project.location.address}</span>
            </div>
          )}
          {project.location.city && (
            <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100">
              <span className="text-sm sm:text-base text-gray-600 font-medium mb-1 sm:mb-0">City</span>
              <span className="text-sm sm:text-base text-gray-900">{project.location.city}</span>
            </div>
          )}
          {project.location.province && (
            <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100">
              <span className="text-sm sm:text-base text-gray-600 font-medium mb-1 sm:mb-0">Province</span>
              <span className="text-sm sm:text-base text-gray-900">{project.location.province}</span>
            </div>
          )}
          {project.location.postalCode && (
            <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100">
              <span className="text-sm sm:text-base text-gray-600 font-medium mb-1 sm:mb-0">Postal Code</span>
              <span className="text-sm sm:text-base text-gray-900">{project.location.postalCode}</span>
            </div>
          )}
        </div>
      </div>

      {/* Project Context for Contractors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            <h4 className="text-base font-semibold text-gray-900">Project Timeline</h4>
          </div>
          <div className="space-y-3">
            {project.start_date && (
              <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100">
                <span className="text-sm sm:text-base text-gray-600 font-medium mb-1 sm:mb-0">Start Date</span>
                <span className="text-sm sm:text-base text-gray-900">
                  {new Date(project.start_date).toLocaleDateString()}
                </span>
              </div>
            )}
            {project.end_date && (
              <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100">
                <span className="text-sm sm:text-base text-gray-600 font-medium mb-1 sm:mb-0">End Date</span>
                <span className="text-sm sm:text-base text-gray-900">
                  {new Date(project.end_date).toLocaleDateString()}
                </span>
              </div>
            )}
            {project.expiry_date && (
              <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100">
                <span className="text-sm sm:text-base text-gray-600 font-medium mb-1 sm:mb-0">Proposal Deadline</span>
                <span className="text-sm sm:text-base text-gray-900">
                  {new Date(project.expiry_date).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            <h4 className="text-base font-semibold text-gray-900">Project Budget</h4>
          </div>
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100">
              <span className="text-sm sm:text-base text-gray-600 font-medium mb-1 sm:mb-0">Budget Range</span>
              <span className="text-sm sm:text-base text-gray-900 font-semibold">
                ${project.budget?.toLocaleString() || 'Not specified'}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100">
              <span className="text-sm sm:text-base text-gray-600 font-medium mb-1 sm:mb-0">Project Type</span>
              <span className="text-sm sm:text-base text-gray-900 capitalize">
                {project.project_type || 'Not specified'}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
