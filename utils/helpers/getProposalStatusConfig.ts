import { PROPOSAL_STATUSES } from '@/utils/constants'
import { FileText, CheckCircle2, XCircle, AlertCircle, Eye } from 'lucide-react'

export interface ProposalStatusConfig {
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
}

export function getProposalStatusConfig(status: string): ProposalStatusConfig {
  const statusConfigs: Record<string, ProposalStatusConfig> = {
    [PROPOSAL_STATUSES.SUBMITTED]: { 
      label: 'Submitted', 
      icon: FileText, 
      color: 'text-blue-700', 
      bgColor: 'bg-blue-50' 
    },
    [PROPOSAL_STATUSES.ACCEPTED]: { 
      label: 'Accepted', 
      icon: CheckCircle2, 
      color: 'text-green-700', 
      bgColor: 'bg-green-50' 
    },
    [PROPOSAL_STATUSES.REJECTED]: { 
      label: 'Rejected', 
      icon: XCircle, 
      color: 'text-red-700', 
      bgColor: 'bg-red-50' 
    },
    [PROPOSAL_STATUSES.WITHDRAWN]: { 
      label: 'Withdrawn', 
      icon: AlertCircle, 
      color: 'text-gray-700', 
      bgColor: 'bg-gray-50' 
    },
    'viewed': { 
      label: 'Viewed', 
      icon: Eye, 
      color: 'text-purple-700', 
      bgColor: 'bg-purple-50' 
    },
    'draft': { 
      label: 'Draft', 
      icon: FileText, 
      color: 'text-gray-700', 
      bgColor: 'bg-gray-50' 
    }
  }
  
  return statusConfigs[status] || statusConfigs[PROPOSAL_STATUSES.SUBMITTED]
}
