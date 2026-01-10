'use client'

import { useState } from 'react'
import { Project } from '@/server/database/interfaces'
import { User } from '@/server/database/interfaces/auth'
import { FileText, Calendar, User as UserIcon, MapPin, Building2, CheckCircle, AlertCircle, Edit3 } from 'lucide-react'
import { USER_ROLES } from '@/utils/constants'
import { Button } from '@/components/ui/button'
import { SubstantialCompletionModal } from '@/components/shared/modals'
import { trpc } from '@/utils/trpc'

interface DetailsTabContentProps {
  project: Project
  user: User
  userRole: typeof USER_ROLES[keyof typeof USER_ROLES]
}

export function DetailsTabContent({ project, user }: DetailsTabContentProps) {
  const [showSubstantialCompletionModal, setShowSubstantialCompletionModal] = useState(false)
  
  const updateSubstantialCompletionMutation = trpc.projects.updateSubstantialCompletion.useMutation({
    onSuccess: () => {
      // Refresh the page to show updated data
      window.location.reload()
    }
  })

  const handleUpdateSubstantialCompletion = async (date: string) => {
    await updateSubstantialCompletionMutation.mutateAsync({
      projectId: project.id,
      substantialCompletion: date
    })
  }


  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Project Description */}
      {project.statement_of_work && (
        <div>
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Project Description</h3>
          </div>
          <div className="border-l-4 border-gray-200 pl-3 sm:pl-6">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              {project.statement_of_work}
            </p>
          </div>
        </div>
      )}


      {/* Location Information */}
      <div>
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Location Details</h3>
        </div>
        
        {/* Address Details */}
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

      {/* Project Categories */}
      {project.category && project.category.length > 0 && (
        <div>
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Trade Categories</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {project.category.map((cat, index) => (
              <span key={index} className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-md">
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Substantial Completion Section - Only show for Proposal Selected status */}
      {project.status === 'Proposal Selected' && (
        <div>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Project Completion</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSubstantialCompletionModal(true)}
              className="flex items-center gap-2"
            >
              <Edit3 className="h-4 w-4" />
              {project.substantial_completion ? 'Edit Date' : 'Set Date'}
            </Button>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            {!project.after_photo && (
              <div className="mb-4 p-3 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-700">
                    After photo must be uploaded before setting substantial completion date.
                  </p>
                </div>
              </div>
            )}
            
            {project.substantial_completion ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Substantial Completion Date</span>
                  <span className="text-sm font-semibold text-gray-700">
                    {new Date(project.substantial_completion).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  The project has been marked as substantially completed (98% complete) on this date.
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-700 mb-2">
                  No substantial completion date has been set yet.
                </p>
                <p className="text-xs text-gray-600">
                  The contractor or you can set this date when the major work requirements are met.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Substantial Completion Modal */}
      <SubstantialCompletionModal
        isOpen={showSubstantialCompletionModal}
        onClose={() => setShowSubstantialCompletionModal(false)}
        onSave={handleUpdateSubstantialCompletion}
        currentDate={project.substantial_completion?.toString() || null}
        isContractor={false}
        hasAfterPhoto={!!project.after_photo}
      />

      {/* Project Requirements & Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Project Requirements</h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 sm:py-3 border-b border-gray-100">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-0">
                {project.permit_required ? (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                <span className="text-sm sm:text-base text-gray-600">Permit Required</span>
              </div>
              <span className={`text-sm sm:text-base font-medium ${
                project.permit_required ? 'text-red-600' : 'text-green-600'
              }`}>
                {project.permit_required ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 sm:py-3 border-b border-gray-100">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-0">
                {project.is_verified_project ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-sm sm:text-base text-gray-600">Verified Project</span>
              </div>
              <span className={`text-sm sm:text-base font-medium ${
                project.is_verified_project ? 'text-green-600' : 'text-gray-500'
              }`}>
                {project.is_verified_project ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Project Statistics</h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between py-2 sm:py-3 border-b border-gray-100">
              <span className="text-sm sm:text-base text-gray-600 mb-1 sm:mb-0">Proposal Count</span>
              <span className="text-sm sm:text-base font-semibold text-blue-600">
                {project.proposal_count || 0}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between py-2 sm:py-3 border-b border-gray-100">
              <span className="text-sm sm:text-base text-gray-600 mb-1 sm:mb-0">Project Photos</span>
              <span className="text-sm sm:text-base font-semibold text-gray-900">
                {project.project_photos?.length || 0}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between py-2 sm:py-3 border-b border-gray-100">
              <span className="text-sm sm:text-base text-gray-600 mb-1 sm:mb-0">Attached Files</span>
              <span className="text-sm sm:text-base font-semibold text-gray-900">
                {project.files?.length || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Project Owner */}
      <div>
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Project Owner</h3>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-gray-200 rounded-lg">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
            <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
              {user?.full_name || 'Unknown User'}
            </p>
            <p className="text-xs sm:text-sm text-gray-600">Project Creator</p>
            {user?.created_at && (
              <p className="text-xs text-gray-500 mt-1">
                Member since {new Date(user.created_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Project Timeline */}
      <div>
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Project Timeline</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100">
              <span className="text-sm sm:text-base text-gray-600 mb-1 sm:mb-0">Created</span>
              <span className="text-sm sm:text-base font-medium text-gray-900">
                {new Date(project.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100">
              <span className="text-sm sm:text-base text-gray-600 mb-1 sm:mb-0">Last Updated</span>
              <span className="text-sm sm:text-base font-medium text-gray-900">
                {new Date(project.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {project.decision_date && (
              <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100">
                <span className="text-sm sm:text-base text-gray-600 mb-1 sm:mb-0">Decision Date</span>
                <span className="text-sm sm:text-base font-medium text-gray-900">
                  {new Date(project.decision_date).toLocaleDateString()}
                </span>
              </div>
            )}
            {project.substantial_completion && (
              <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100">
                <span className="text-sm sm:text-base text-gray-600 mb-1 sm:mb-0">Substantial Completion</span>
                <span className="text-sm sm:text-base font-medium text-gray-900">
                  {new Date(project.substantial_completion).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
