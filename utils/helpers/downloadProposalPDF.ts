import { createClient } from '@/lib/supabase'
import { generateProposalPDFBlob } from '@/utils/helpers/pdfPreviewGenerator'
import { ProposalWithJoins } from '@/server/database/interfaces/proposals'
import toast from 'react-hot-toast'

export async function downloadProposalPDF(proposalId: string) {
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
      .eq('id', proposalId)
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
    
    // Convert to ProposalWithJoins type and generate PDF blob.
    // Skip signature validation so accepted contracts can be downloaded immediately.
    const fullProposal = proposalWithContractor as unknown as ProposalWithJoins
    const result = await generateProposalPDFBlob(fullProposal, true)
    
    if (result.success && result.blob) {
      const blobUrl = URL.createObjectURL(result.blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `${fullProposal.title || 'proposal-agreement'}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
      toast.success('PDF generated successfully')
    } else {
      toast.error(result.error || 'Failed to generate PDF')
    }
  } catch (error) {
    console.error('PDF generation error:', error)
    toast.error('Failed to generate PDF')
  }
}


