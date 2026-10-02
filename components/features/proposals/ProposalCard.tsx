'use client'

import { Calendar, MapPin, DollarSign, Eye, FileDown, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { capitalizeFirst } from '@/utils/helpers'
import { generateEnhancedProposalPDF } from '@/utils/helpers/enhancedPdfGenerator'
import { ProposalWithJoins } from '@/server/database/interfaces/proposals'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { ProjectWithProposal } from '@/types/project'
import SignatureRequiredDialog from '@/components/modals/SignatureRequiredDialog'
import { useState } from 'react'

interface ProposalCardProps {
  proposal: ProjectWithProposal
  onViewDetails: (proposal: ProjectWithProposal) => void
  formatDate: (date: string) => string
}

export default function ProposalCard({ 
  proposal, 
  onViewDetails, 
  formatDate
}: ProposalCardProps) {
  const [showSignatureDialog, setShowSignatureDialog] = useState(false)
  const [missingSignatures, setMissingSignatures] = useState<string[]>([])
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'accepted':
        return 'default'
      case 'submitted':
      case 'viewed':
        return 'secondary'
      case 'rejected':
      case 'withdrawn':
      case 'expired':
        return 'destructive'
      case 'draft':
      default:
        return 'outline'
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
      case 'submitted':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30'
      case 'viewed':
      case 'under_review':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30'
      case 'rejected':
      case 'withdrawn':
      case 'expired':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
      case 'draft':
      default:
        return 'bg-muted/60 text-muted-foreground border-border/60'
    }
  }

  return (
    <Card 
      className="group hover:shadow-md transition-all duration-200 border border-border/60 bg-card hover:border-border h-full flex flex-col cursor-pointer"
      onClick={() => onViewDetails(proposal)}
    >
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate">
              {capitalizeFirst(proposal.project_title || 'Project Title')}
            </CardTitle>
          </div>
          <Badge 
            variant="outline"
            className={`${getStatusColor(proposal.proposal?.status || 'no-proposal')} px-2.5 py-0.5 text-xs font-medium shrink-0 capitalize`}
          >
            {proposal.proposal?.status || 'No Proposal'}
          </Badge>
        </div>
        
        {/* Work Description - Full width with max 2 lines */}
        <div className="mt-2.5">
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {proposal.proposal?.description_of_work || proposal.statement_of_work || 'No description provided'}
          </p>
        </div>

        {proposal.proposal?.status === 'rejected' && proposal.proposal.rejection_reason_notes?.trim() && (
          <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-left">
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">Homeowner feedback</p>
                <p className="text-xs text-rose-900 dark:text-rose-200 line-clamp-3">{proposal.proposal.rejection_reason_notes.trim()}</p>
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0 flex-1 flex flex-col">
        {/* Metadata Grid */}
        <div className="space-y-2 mb-4 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
            <span className="font-mono font-medium text-foreground">
              {formatCurrency(proposal.proposal?.total_amount || proposal.budget || 0)}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
            <span className="truncate">
              {proposal.location ? 
                [proposal.location.address, proposal.location.city, proposal.location.province]
                  .filter(Boolean)
                  .join(', ') || 'Location not specified'
                : 'Not specified'
              }
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
            <span>
              {proposal.proposal ? `Submitted ${formatDate(proposal.proposal.created_at)}` : `Created ${formatDate(proposal.created_at)}`}
            </span>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2 mt-auto pt-3 border-t border-border/40">
          <Button 
            variant="outline" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onViewDetails(proposal)
            }}
            className="flex-1 text-xs h-8 border-border/60 hover:bg-accent hover:text-foreground"
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            View Details
          </Button>
          {proposal.proposal?.status === 'accepted' && (
            <Button
              variant="outline"
              size="sm"
              onClick={async (e) => {
                e.stopPropagation()
                try {
                  // Fetch the complete proposal data with joins before generating PDF
                  const supabase = createClient()
                  const { data, error } = await supabase
                    .from('proposals')
                    .select(`
                      *,
                      project:projects!proposals_project_fkey(*),
                      homeowner_details:users!proposals_homeowner_fkey(*),
                      project_details:projects!proposals_project_fkey(*)
                    `)
                    .eq('id', proposal.proposal!.id)
                    .single()
                  
                  if (error) {
                    throw new Error(`Error fetching proposal data: ${error.message}`)
                  }
                  
                  if (!data) {
                    throw new Error('Proposal data not found')
                  }
                  
                  // Fetch contractor profile separately
                  const { data: contractorProfile, error: contractorError } = await supabase
                    .from('contractor_profiles')
                    .select('*')
                    .eq('user_id', data.contractor)
                    .single()
                  
                  // Fetch contractor user data for full_name and other user fields
                  const { data: contractorUser, error: contractorUserError } = await supabase
                    .from('users')
                    .select('id, full_name, email, phone_number, address')
                    .eq('id', data.contractor)
                    .single()
                  
                  if (contractorUserError) {
                    console.error('Error fetching contractor user data:', contractorUserError)
                  }
                  
                  // Attach contractor profile and user data to the proposal data
                  const proposalWithContractor = {
                    ...data,
                    contractor_profile: {
                      ...contractorProfile,
                      ...contractorUser
                    }
                  }
                  
                  // Convert to ProposalWithJoins type and generate PDF
                  const fullProposal = proposalWithContractor as unknown as ProposalWithJoins
                  const result = await generateEnhancedProposalPDF(fullProposal)
                  
                  if (result.success) {
                    toast.success('PDF generated successfully')
                  } else {
                    if (result.requiresSignatures) {
                      setMissingSignatures(result.missingSignatures || [])
                      setShowSignatureDialog(true)
                    } else {
                      toast.error(result.error || 'Failed to generate PDF')
                    }
                  }
                } catch (error) {
                  console.error('PDF generation error:', error)
                  toast.error('Failed to generate PDF')
                }
              }}
              className="text-xs h-8 border-border/60 hover:bg-accent hover:text-foreground"
            >
              <FileDown className="h-3.5 w-3.5 mr-1.5" />
              PDF
            </Button>
          )}
        </div>
      </CardContent>

      {/* Signature Required Dialog */}
      <SignatureRequiredDialog
        isOpen={showSignatureDialog}
        onClose={() => setShowSignatureDialog(false)}
        missingSignatures={missingSignatures}
        onSignatureAdded={() => {
          setShowSignatureDialog(false)
          // Optionally retry PDF generation
          toast.success('Signature added! You can now try downloading the PDF again.')
        }}
      />
    </Card>
  )
}
