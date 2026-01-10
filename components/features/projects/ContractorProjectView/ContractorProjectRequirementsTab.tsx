'use client'

import { Project } from '@/server/database/interfaces'
import { User } from '@/server/database/interfaces/auth'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Calendar,
  Clock
} from 'lucide-react'
import { USER_ROLES } from '@/utils/constants'
import { formatDate } from '@/lib/utils'

interface ContractorProjectRequirementsTabProps {
  project: Project
  user: User
  userRole: typeof USER_ROLES[keyof typeof USER_ROLES]
}

export function ContractorProjectRequirementsTab({ project }: ContractorProjectRequirementsTabProps) {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Legal & Verification Requirements */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">Legal & Verification</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-4 h-4 text-black" />
              <div>
                <p className="text-sm text-gray-600 font-medium">Permit Required</p>
                <Badge className={project.permit_required ? 'bg-black text-white' : 'bg-gray-100 text-black'}>
                  {project.permit_required ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="w-4 h-4 text-black" />
              <div>
                <p className="text-sm text-gray-600 font-medium">Verified Project</p>
                <Badge className={project.is_verified_project ? 'bg-black text-white' : 'bg-gray-100 text-black'}>
                  {project.is_verified_project ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Timeline Requirements */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">Timeline Requirements</h3>
        <div className="space-y-3">
          {project.start_date && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-4 h-4 text-black" />
              <div>
                <p className="text-sm text-black font-medium">Project Start Date</p>
                <p className="text-sm text-gray-600">{formatDate(project.start_date)}</p>
              </div>
            </div>
          )}
          
          {project.end_date && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-4 h-4 text-black" />
              <div>
                <p className="text-sm text-black font-medium">Project End Date</p>
                <p className="text-sm text-gray-600">{formatDate(project.end_date)}</p>
              </div>
            </div>
          )}
          
          {project.expiry_date && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Clock className="w-4 h-4 text-black" />
              <div>
                <p className="text-sm text-black font-medium">Proposal Deadline</p>
                <p className="text-sm text-gray-600">{formatDate(project.expiry_date)}</p>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Additional Information */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">Additional Information</h3>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-black" />
            <h4 className="font-medium text-black">Project Requirements</h4>
          </div>
          <p className="text-gray-600 text-sm">
            This project is open for contractor proposals. Please review all requirements carefully before submitting your proposal.
            Ensure you have the necessary qualifications and can meet the timeline requirements.
          </p>
        </div>
      </div>

    </div>
  )
}
