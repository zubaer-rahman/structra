'use client'

import { Project } from '@/server/database/interfaces'
import { User } from '@/server/database/interfaces/auth'
import { Camera } from 'lucide-react'
import { USER_ROLES } from '@/utils/constants'

interface ProjectPhotosTabProps {
  project: Project
  user: User
  userRole: typeof USER_ROLES[keyof typeof USER_ROLES]
}

export function ProjectPhotosTab({ project }: ProjectPhotosTabProps) {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Before/After Photos */}
      {((project.project_photos && project.project_photos.length > 0) || project.after_photo) ? (
        <div>
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Project Photos</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Before Photo - from first project_photo */}
            {project.project_photos && project.project_photos.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Before (Project Start)
                </h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="aspect-video bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={project.project_photos[0].url}
                      alt="Before photo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3 bg-gray-50">
                    <p className="text-xs text-gray-600 truncate">
                      {project.project_photos[0].filename}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* After Photo */}
            {project.after_photo && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  After (Project Complete)
                </h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="aspect-video bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={project.after_photo.url}
                      alt="After photo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3 bg-gray-50">
                    <p className="text-xs text-gray-600 truncate">
                      {project.after_photo.filename}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Show message if only before photo is available and project status is Proposal Selected */}
          {project.project_photos && project.project_photos.length > 0 && !project.after_photo && project.status === 'Proposal Selected' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> After photo will be available once the homeowner uploads it.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Photos Available</h3>
          <p className="text-gray-600">
            Project photos will appear here once they are uploaded.
          </p>
        </div>
      )}
    </div>
  )
}
