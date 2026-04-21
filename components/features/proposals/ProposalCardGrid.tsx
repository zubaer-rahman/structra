'use client'

import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import ProposalCard from './ProposalCard'
import { ProjectWithProposal } from '@/types/project'

interface ProposalCardGridProps {
  proposals: ProjectWithProposal[]
  onViewDetails: (proposal: ProjectWithProposal) => void
  formatDate: (date: string) => string
  onBrowseProjects?: () => void
}

export default function ProposalCardGrid({
  proposals,
  onViewDetails,
  formatDate,
  onBrowseProjects
}: ProposalCardGridProps) {
  if (proposals.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No proposals yet
          </h3>
          <p className="text-gray-600 text-center mb-6">
            Start by browsing available projects and submitting your first proposal.
          </p>
          {onBrowseProjects && (
            <Button onClick={onBrowseProjects}>
              Browse Projects
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
      {proposals.map((proposal) => (
        <ProposalCard
          key={proposal.id}
          proposal={proposal}
          onViewDetails={onViewDetails}
          formatDate={formatDate}
        />
      ))}
    </div>
  )
}
