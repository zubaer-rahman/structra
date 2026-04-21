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
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'submitted':
      case 'viewed':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'rejected':
      case 'withdrawn':
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'draft':
        return 'bg-gray-50 text-gray-700 border-gray-300'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-300'
    }
  }

  return (
    <Card 
      className="hover:shadow-lg transition-all duration-200 border border-gray-200 h-full flex flex-col cursor-pointer"
      onClick={() => onViewDetails(proposal)}
    >
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-900 mb-2 truncate">
              {capitalizeFirst(proposal.project_title || 'Project Title')}
            </CardTitle>
          </div>
          <Badge 
            variant={getStatusVariant(proposal.proposal?.status || 'no-proposal')}
            className={`${getStatusColor(proposal.proposal?.status || 'no-proposal')} px-3 py-1 text-xs font-medium shrink-0 capitalize`}
          >
            {proposal.proposal?.status || 'No Proposal'}
          </Badge>
        </div>
        
        {/* Work Description - Full width with max 2 lines */}
        <div className="mt-3">
          <div className="text-sm text-gray-600 leading-relaxed overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {proposal.proposal?.description_of_work || proposal.statement_of_work || 'No description provided'}
          </div>
        </div>

        {proposal.proposal?.status === 'rejected' && proposal.proposal.rejection_reason_notes?.trim() && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50/80 p-3 text-left">
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-700 mt-0.5" />
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-semibold text-red-900">Homeowner feedback</p>
                <p className="text-sm text-red-950 line-clamp-4">{proposal.proposal.rejection_reason_notes.trim()}</p>
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0 flex-1 flex flex-col">
        {/* Metadata Grid */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700">
              {formatCurrency(proposal.proposal?.total_amount || proposal.budget || 0)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700">
              {proposal.location ? 
                [proposal.location.address, proposal.location.city, proposal.location.province]
                  .filter(Boolean)
                  .join(', ') || 'Location not specified'
                : 'Not specified'
              }
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700">
              {proposal.proposal ? `Submitted ${formatDate(proposal.proposal.created_at)}` : `Created ${formatDate(proposal.created_at)}`}
            </span>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3 mt-auto">
          <Button 
            variant="outline" 
            onClick={(e) => {
              e.stopPropagation()
              onViewDetails(proposal)
            }}
            className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          {proposal.proposal?.status === 'accepted' && (
            <Button
              variant="outline"
              onClick={async (e) => {
                e.stopPropagation()
                try {
                  // Fetch the complete proposal data with joins before generating PDF
                  const supabase = createClient()
                  const { data, error } = await supabase
                    .from('proposals')
                    .select(`
                      *,
                      project:projects(*),
                      homeowner_details:users!proposals_homeowner_fkey(*),
                      project_details:projects(*)
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
              className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
            >
              <FileDown className="h-4 w-4 mr-2" />
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
