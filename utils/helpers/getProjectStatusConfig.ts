import { PROJECT_STATUSES } from '@/utils/constants'

export interface ProjectStatusConfig {
  label: string
  variant: 'default' | 'secondary' | 'outline' | 'destructive'
  color: string
}

export function getProjectStatusConfig(status: string): ProjectStatusConfig {
  const statusConfig: Record<string, ProjectStatusConfig> = {
    [PROJECT_STATUSES.DRAFT]: { 
      label: PROJECT_STATUSES.DRAFT, 
      variant: 'outline', 
      color: 'bg-gray-50 text-gray-700 border-gray-300' 
    },
    [PROJECT_STATUSES.OPEN_FOR_PROPOSALS]: { 
      label: PROJECT_STATUSES.OPEN_FOR_PROPOSALS, 
      variant: 'default', 
      color: 'bg-blue-100 text-blue-800 border-blue-300' 
    },
    [PROJECT_STATUSES.PROPOSAL_SELECTED]: { 
      label: PROJECT_STATUSES.PROPOSAL_SELECTED, 
      variant: 'secondary', 
      color: 'bg-green-100 text-green-800 border-green-300' 
    },
    [PROJECT_STATUSES.IN_PROGRESS]: { 
      label: PROJECT_STATUSES.IN_PROGRESS, 
      variant: 'secondary', 
      color: 'bg-orange-100 text-orange-800 border-orange-300' 
    },
    [PROJECT_STATUSES.COMPLETED]: { 
      label: PROJECT_STATUSES.COMPLETED, 
      variant: 'outline', 
      color: 'bg-gray-900 text-white border-gray-900' 
    },
    [PROJECT_STATUSES.CANCELLED]: { 
      label: PROJECT_STATUSES.CANCELLED, 
      variant: 'destructive', 
      color: 'bg-red-100 text-red-800 border-red-300' 
    },
  }
  
  return statusConfig[status] || statusConfig[PROJECT_STATUSES.DRAFT]
}
