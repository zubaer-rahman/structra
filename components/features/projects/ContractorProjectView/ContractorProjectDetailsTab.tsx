'use client'

import { useState } from 'react'
import { Project } from '@/server/database/interfaces'
import { User } from '@/server/database/interfaces/auth'
import { FileText, MapPin, Building2, Clock, DollarSign, Edit3, AlertCircle } from 'lucide-react'
import { USER_ROLES } from '@/utils/constants'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { SubstantialCompletionModal } from '@/components/shared/modals'
import { trpc } from '@/utils/trpc'

interface ContractorProjectDetailsTabProps {
  project: Project
  user: User
  userRole: typeof USER_ROLES[keyof typeof USER_ROLES]
}

export function ContractorProjectDetailsTab({ project }: ContractorProjectDetailsTabProps) {
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
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Project Description</h3>
          </div>
          <div className="border-l-4 border-gray-200 dark:border-l-white/20 pl-3 sm:pl-6">
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
              {project.statement_of_work}
            </p>
          </div>
        </div>
      )}


      {/* Substantial Completion Section - Only show for Proposal Selected status */}
      {project.status === 'Proposal Selected' && (
        <div>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Project Completion</h3>
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
          <div className="border border-gray-200 dark:border-white/10 rounded-lg p-4 bg-white dark:bg-[#141414]">
            {!project.after_photo && (
              <div className="mb-4 p-3 border border-red-200 dark:border-red-900/50 rounded-lg bg-red-50/50 dark:bg-red-950/20">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <p className="text-sm text-red-700 dark:text-red-300">
                    After photo must be uploaded before setting substantial completion date.
                  </p>
                </div>
              </div>
            )}
            
            {project.substantial_completion ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Substantial Completion Date</span>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {formatDate(project.substantial_completion)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  The project has been marked as substantially completed (98% complete) on this date.
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  No substantial completion date has been set yet.
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  You can set this date when the major work requirements are met.
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
        isContractor={true}
        hasAfterPhoto={!!project.after_photo}
      />

      {/* Financial Information */}
      <div>
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Financial Details</h3>
        </div>
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100 dark:border-white/10">
            <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium mb-1 sm:mb-0">Project Budget</span>
            <span className="text-sm sm:text-base text-gray-900 dark:text-white font-semibold">
              {formatCurrency(project.budget || 0)}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100 dark:border-white/10">
            <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium mb-1 sm:mb-0">Project Type</span>
            <span className="text-sm sm:text-base text-gray-900 dark:text-white capitalize">
              {project.project_type || 'Not specified'}
            </span>
          </div>
        </div>
      </div>

      {/* Location Information */}
      <div>
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Location Details</h3>
        </div>
        
        {/* Address Details */}
        <div className="space-y-3">
          {project.location.address && (
            <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100 dark:border-white/10">
              <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium mb-1 sm:mb-0">Address</span>
              <span className="text-sm sm:text-base text-gray-900 dark:text-white">{project.location.address}</span>
            </div>
          )}
          {project.location.city && (
            <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100 dark:border-white/10">
              <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium mb-1 sm:mb-0">City</span>
              <span className="text-sm sm:text-base text-gray-900 dark:text-white">{project.location.city}</span>
            </div>
          )}
          {project.location.province && (
            <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100 dark:border-white/10">
              <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium mb-1 sm:mb-0">Province</span>
              <span className="text-sm sm:text-base text-gray-900 dark:text-white">{project.location.province}</span>
            </div>
          )}
          {project.location.postalCode && (
            <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100 dark:border-white/10">
              <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium mb-1 sm:mb-0">Postal Code</span>
              <span className="text-sm sm:text-base text-gray-900 dark:text-white">{project.location.postalCode}</span>
            </div>
          )}
        </div>
      </div>

      {/* Project Categories */}
      {project.category && project.category.length > 0 && (
        <div>
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Trade Categories</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {project.category.map((cat, index) => (
              <span key={index} className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-md">
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Timeline Information */}
      <div>
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Timeline</h3>
        </div>
        <div className="space-y-3">
          {project.start_date && (
            <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100">
              <span className="text-sm sm:text-base text-gray-600 font-medium mb-1 sm:mb-0">Start Date</span>
              <span className="text-sm sm:text-base text-gray-900">{formatDate(project.start_date)}</span>
            </div>
          )}
          {project.end_date && (
            <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100">
              <span className="text-sm sm:text-base text-gray-600 font-medium mb-1 sm:mb-0">End Date</span>
              <span className="text-sm sm:text-base text-gray-900">{formatDate(project.end_date)}</span>
            </div>
          )}
          {project.expiry_date && (
            <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100">
              <span className="text-sm sm:text-base text-gray-600 font-medium mb-1 sm:mb-0">Proposal Deadline</span>
              <span className="text-sm sm:text-base text-gray-900">{formatDate(project.expiry_date)}</span>
            </div>
          )}
        </div>
      </div>


    </div>
  )
}
