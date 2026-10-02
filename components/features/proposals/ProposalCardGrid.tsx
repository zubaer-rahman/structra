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
      <div className="rounded-xl border border-dashed border-border/80 bg-card/50 p-8 lg:p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground mb-4">
          <FileText className="h-6 w-6" />
        </div>
        <h3 className="text-base lg:text-lg font-semibold text-foreground mb-2">
          No proposals yet
        </h3>
        <p className="text-sm lg:text-base text-muted-foreground max-w-md mx-auto mb-6">
          Start by browsing available projects and submitting your first proposal.
        </p>
        {onBrowseProjects && (
          <Button onClick={onBrowseProjects}>
            Browse Projects
          </Button>
        )}
      </div>
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
