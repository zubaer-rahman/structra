'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { HomeownerProjectView } from '@/components/features/projects'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { USER_ROLES, PROPOSAL_STATUSES, PROJECT_STATUSES } from '@/utils/constants'
import { Project, SiteAmenities } from '@/server/database/interfaces'
import { Proposal, ProposalWithJoins } from '@/server/database/interfaces/proposals'
import { User } from '@/server/database/interfaces/auth'
import { trpc } from '@/utils/trpc'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/shared'
import { ProjectCompletionModal } from '@/components/shared/modals/ProjectCompletionModal'
import { AfterPhotoUploadModal } from '@/components/shared/modals/AfterPhotoUploadModal'
import { ReviewConsentModal } from '@/components/shared/modals/ReviewConsentModal'

export default function HomeownerProjectViewPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const { user } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [rawProposals, setRawProposals] = useState<ProposalWithJoins[]>([])
  const [loading, setLoading] = useState(true)
  const [proposalsLoading, setProposalsLoading] = useState(true)
  const [error, setError] = useState('')
  // Removed unused deleting state
  const [updatingProposal, setUpdatingProposal] = useState<string | null>(null)
  const [showMarkCompleteDialog, setShowMarkCompleteDialog] = useState(false)
  const [markingComplete, setMarkingComplete] = useState(false)
  const [showAfterPhotoUploadDialog, setShowAfterPhotoUploadDialog] = useState(false)
  const [uploadingAfterPhoto, setUploadingAfterPhoto] = useState(false)
  const [isProcessingPaymentSuccess, setIsProcessingPaymentSuccess] = useState(false)
  const [showReviewConsentDialog, setShowReviewConsentDialog] = useState(false)
  const [submittingReview, setSubmittingReview] = useState(false)

  // TRPC mutations
  const updateAmenitiesMutation = trpc.projects.updateAmenities.useMutation({
    onSuccess: (updatedProject) => {
      setProject(updatedProject)
      toast.success('Site amenities updated successfully!')
    },
    onError: (error) => {
      console.error('Error updating amenities:', error)
      toast.error('Failed to update site amenities. Please try again.')
    }
  })

  // Handle payment success/cancel
  useEffect(() => {
    const handlePaymentResult = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get('payment');
      const userId = urlParams.get('userId');
      const sessionId = urlParams.get('sessionId');

      if (paymentStatus === 'success' && userId && sessionId) {
        setIsProcessingPaymentSuccess(true);
        
        try {
          // Update the transaction status to succeeded
          const authClient = createClient();
          const { data: { session } } = await authClient.auth.getSession();
          const response = await fetch('/api/project-publish-success', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
            },
            body: JSON.stringify({
              userId,
              sessionId,
            }),
          });

          if (response.ok) {
            console.log('✅ Transaction status updated to succeeded');
            toast.success('Payment successful! Project is being published...');
            
            // Update project status to OPEN_FOR_PROPOSALS
            const supabase = createClient();
            const { error: updateError } = await supabase
              .from('projects')
              .update({
                status: PROJECT_STATUSES.OPEN_FOR_PROPOSALS,
                is_verified_project: true,
                updated_at: new Date().toISOString()
              })
              .eq('id', id)
              .eq('creator', user?.id);

            if (updateError) {
              throw updateError;
            }

            // Clean up URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Refresh the project data by refetching
            const supabaseClient = createClient();
            const { data: updatedProject, error: fetchError } = await supabaseClient
              .from('projects')
              .select('*, project_certificate, title_awarded')
              .eq('id', id)
              .eq('creator', user?.id)
              .single();
            
            if (!fetchError && updatedProject) {
              // Transform the data to match the expected Project interface
              const transformedProject: Project = {
                ...updatedProject,
                start_date: new Date(updatedProject.start_date),
                end_date: new Date(updatedProject.end_date),
                expiry_date: new Date(updatedProject.expiry_date),
                decision_date: updatedProject.decision_date ? new Date(updatedProject.decision_date) : undefined,
                substantial_completion: updatedProject.substantial_completion ? new Date(updatedProject.substantial_completion) : undefined,
                created_at: new Date(updatedProject.created_at),
                updated_at: new Date(updatedProject.updated_at),
                project_photos: updatedProject.project_photos || [],
                files: updatedProject.files || [],
                proposal_count: updatedProject.proposal_count || 0,
                is_verified_project: updatedProject.is_verified_project || false,
                permit_required: updatedProject.permit_required || false,
                title_awarded: updatedProject.title_awarded || false,
                project_certificate: updatedProject.project_certificate || null
              };
              setProject(transformedProject);
            }
          } else {
            console.error('Failed to update transaction status:', await response.text());
            toast.error('Payment successful but failed to update project status. Please contact support.');
          }
        } catch (error) {
          console.error('Error processing payment success:', error);
          toast.error('Payment successful but failed to publish project. Please contact support.');
        } finally {
          setIsProcessingPaymentSuccess(false);
        }
      } else if (paymentStatus === 'cancelled') {
        // Payment was cancelled, cancel transaction
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('userId');
        const sessionId = urlParams.get('sessionId');
        
        if (userId) {
          console.log('Calling project creation cancel API with:', { userId, sessionId });
          try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch('/api/project-creation-cancel', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
              },
              body: JSON.stringify({
                userId,
                sessionId,
              }),
            });
            
            if (response.ok) {
              const result = await response.json();
              console.log('Transaction cancelled successfully:', result);
            } else {
              console.error('Failed to cancel transaction:', await response.text());
            }
          } catch (error) {
            console.error('Error cancelling transaction:', error);
          }
        } else {
          console.warn('No userId found in URL parameters, cannot cancel transaction');
        }
        
        toast("Payment was cancelled. You can try again anytime.");
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    handlePaymentResult();
  }, [id, user?.id]);

  useEffect(() => {
    const fetchHomeownerProject = async () => {
      if (!id || !user) {
        setLoading(false)
        return
      }
      
      try {
        const supabase = createClient()
        const { data, error: fetchError } = await supabase
          .from('projects')
          .select('*, project_certificate, title_awarded')
          .eq('id', id)
          .eq('creator', user.id)
          .single()
        
        if (fetchError) {
          throw fetchError
        }
        
        if (data) {
          // Transform the data to match the expected Project interface
          const transformedProject: Project = {
            ...data,
            start_date: new Date(data.start_date),
            end_date: new Date(data.end_date),
            expiry_date: new Date(data.expiry_date),
            decision_date: data.decision_date ? new Date(data.decision_date) : undefined,
            substantial_completion: data.substantial_completion ? new Date(data.substantial_completion) : undefined,
            created_at: new Date(data.created_at),
            updated_at: new Date(data.updated_at),
            // Ensure required fields are present with defaults if missing
            project_photos: data.project_photos || [],
            files: data.files || [],
            proposal_count: data.proposal_count || 0,
            is_verified_project: data.is_verified_project || false,
            permit_required: data.permit_required || false,
            title_awarded: data.title_awarded || false,
            project_certificate: data.project_certificate || null
          }
          setProject(transformedProject)
        }
      } catch (error) {
        console.error('Error fetching homeowner project:', error)
        setError('Failed to load your project details')
      } finally {
        setLoading(false)
      }
    }
    
    const fetchHomeownerProposals = async () => {
      if (!id || !user) {
        setProposalsLoading(false)
        return
      }
      
      try {
          const supabase = createClient()
        // First, get proposals with contractor profiles
        const { data: proposalsData, error: proposalsError } = await supabase
          .from('proposals')
          .select(`
            *,
            project_details:projects!proposals_project_fkey (
              id,
              project_title,
              statement_of_work,
              category,
              location,
              status,
              budget,
              pid
            ),
            contractor_profile:users!proposals_contractor_fkey (
              id,
              full_name,
              email,
              phone_number,
              address
            )
          `)
          .eq('project', id)
          .eq('homeowner', user.id)
          .eq('is_deleted', 'no')
          .in('status', [PROPOSAL_STATUSES.SUBMITTED, PROPOSAL_STATUSES.VIEWED, PROPOSAL_STATUSES.ACCEPTED, PROPOSAL_STATUSES.REJECTED])
          .order('created_at', { ascending: false })

        if (proposalsError) {
          throw proposalsError
        }

        // Get contractor ratings for each proposal
        const proposalsWithRatings = await Promise.all(
          (proposalsData || []).map(async (proposal) => {
            const { data: ratingsData } = await supabase
              .from('reviews')
              .select('rating')
              .eq('recipient', proposal.contractor)
              .eq('is_verified', 'yes')

            const averageRating = ratingsData && ratingsData.length > 0 
              ? ratingsData.reduce((sum, review) => sum + review.rating, 0) / ratingsData.length
              : 0

            return {
              ...proposal,
              contractor_rating: averageRating,
              rating_count: ratingsData?.length || 0
            }
          })
        )

        const data = proposalsWithRatings
        
        if (data) {
            // Store raw data for PDF generator (ProposalWithJoins type)
            setRawProposals(data as ProposalWithJoins[])
          
          // Transform the data to match the expected Proposal interface
          const transformedProposals: Proposal[] = data.map(proposal => ({
            ...proposal,
            createdAt: new Date(proposal.created_at),
            updatedAt: new Date(proposal.updated_at),
            proposed_start_date: new Date(proposal.proposed_start_date),
            proposed_end_date: new Date(proposal.proposed_end_date),
            expiry_date: new Date(proposal.expiry_date),
            deposit_due_on: proposal.deposit_due_on, // Keep as string for PDF generator compatibility
            submitted_date: proposal.submitted_date ? new Date(proposal.submitted_date) : undefined,
            accepted_date: proposal.accepted_date ? new Date(proposal.accepted_date) : undefined,
            rejected_date: proposal.rejected_date ? new Date(proposal.rejected_date) : undefined,
            withdrawn_date: proposal.withdrawn_date ? new Date(proposal.withdrawn_date) : undefined,
            viewed_date: proposal.viewed_date ? new Date(proposal.viewed_date) : undefined,
            last_updated: new Date(proposal.updated_at),
            // Ensure required fields are present with defaults if missing
            attached_files: proposal.attached_files || [],
            proposals: proposal.proposals || [],
            visibility_settings: proposal.visibility_settings || 'private',
            created_by: proposal.created_by || proposal.contractor,
              last_modified_by: proposal.last_modified_by || proposal.contractor
            }))
            setProposals(transformedProposals)
        }
      } catch (error) {
        console.error('Error fetching homeowner proposals:', error)
      } finally {
        setProposalsLoading(false)
      }
    }
    
    fetchHomeownerProject()
    fetchHomeownerProposals()
  }, [id, user])

  const handleEditHomeownerProject = () => {
    const guardAndNavigate = async () => {
      if (!project || !user) return

      try {
        const supabase = createClient()
        const { data: selectedProposal, error: selectedProposalError } = await supabase
          .from('proposals')
          .select('id')
          .eq('project', project.id)
          .eq('homeowner', user.id)
          .eq('is_selected', 'yes')
          .maybeSingle()

        if (selectedProposalError) {
          throw selectedProposalError
        }

        if (selectedProposal) {
          toast.error('Project editing is disabled after selecting a proposal')
          return
        }

        router.push(`/homeowner/projects/edit/${project.id}`)
      } catch (error) {
        console.error('Error checking edit eligibility:', error)
        toast.error('Unable to verify edit permissions right now')
      }
    }

    void guardAndNavigate()
  }

  const handleUpdateAmenities = async (amenities: SiteAmenities) => {
    if (!project) return
    
    try {
      await updateAmenitiesMutation.mutateAsync({
        id: project.id,
        site_amenities: amenities
      })
    } catch (error) {
      console.error('Error updating amenities:', error)
      throw error
    }
  }

  const handleDeleteHomeownerProject = async () => {
    if (!project || !user) return
    
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone and will remove all associated proposals.')) {
      return
    }
    
    // Removed setDeleting call since deleting state was removed
    
    try {
      const supabase = createClient()
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id)
        .eq('creator', user.id)
      
      if (deleteError) {
        throw deleteError
      }
      
      toast.success('Your project has been deleted successfully')
      router.push('/homeowner/projects')
    } catch (error) {
      console.error('Error deleting homeowner project:', error)
      toast.error('Failed to delete your project')
    } finally {
      // Removed setDeleting call since deleting state was removed
    }
  }

  const handleAcceptContractorProposal = async (proposalId: string) => {
    if (!user) return

    setUpdatingProposal(proposalId)
    
    try {
      const supabase = createClient()
      
      // First, mark the selected proposal as viewed (if not already)
      await supabase
        .from('proposals')
        .update({
          status: PROPOSAL_STATUSES.VIEWED,
          viewed_date: new Date().toISOString(),
          last_updated: new Date().toISOString(),
          last_modified_by: user.id
        })
        .eq('id', proposalId)
        .eq('status', PROPOSAL_STATUSES.SUBMITTED)
      
      // Accept the selected proposal
      const { error: acceptError } = await supabase
        .from('proposals')
        .update({
          status: PROPOSAL_STATUSES.ACCEPTED,
          is_selected: 'yes',
          accepted_date: new Date().toISOString(),
          contract_reviewed: true,
          homeowner_contract_reviewed: true,
          contract_reviewed_at: new Date().toISOString(),
          homeowner_contract_reviewed_at: new Date().toISOString(),
          last_updated: new Date().toISOString(),
          last_modified_by: user.id
        })
        .eq('id', proposalId)
        .eq('homeowner', user.id)
      
      if (acceptError) {
        throw acceptError
      }

      // Ensure only the accepted proposal remains selected.
      const { error: clearSelectionError } = await supabase
        .from('proposals')
        .update({
          is_selected: 'no',
          last_updated: new Date().toISOString(),
          last_modified_by: user.id
        })
        .eq('project', id)
        .eq('homeowner', user.id)
        .neq('id', proposalId)

      if (clearSelectionError) {
        throw clearSelectionError
      }
      
      // Reject all other proposals for this project
      const { error: rejectError } = await supabase
        .from('proposals')
        .update({
          status: PROPOSAL_STATUSES.REJECTED,
          rejected_date: new Date().toISOString(),
          rejection_reason: 'other',
          rejection_reason_notes: 'Another proposal was selected by the homeowner',
          is_selected: 'no',
          last_updated: new Date().toISOString(),
          last_modified_by: user.id
        })
        .eq('project', id)
        .neq('id', proposalId)
        .in('status', [PROPOSAL_STATUSES.SUBMITTED, PROPOSAL_STATUSES.VIEWED])
      
      if (rejectError) {
        throw rejectError
      }
      
      // Update project status to proposal selected
      await supabase
        .from('projects')
        .update({
          status: PROJECT_STATUSES.PROPOSAL_SELECTED,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
      
      toast.success('Contractor proposal accepted successfully! Your project is now in proposal selected status.')
      
      // Refresh proposals
      const { data: updatedProposals } = await supabase
        .from('proposals')
        .select(`
          *,
          project_details:projects!proposals_project_fkey (
            id,
            project_title,
            statement_of_work,
            category,
            location,
            status,
            budget,
            pid
          ),
          contractor_profile:users!proposals_contractor_fkey (
            id,
            full_name,
            email,
            phone_number,
            address
          )
        `)
        .eq('project', id)
        .eq('homeowner', user.id)
        .eq('is_deleted', 'no')
        .in('status', ['submitted', 'viewed', 'accepted', 'rejected'])
        .order('created_at', { ascending: false })
      
      if (updatedProposals) {
        // Update rawProposals for the UI component
        setRawProposals(updatedProposals as ProposalWithJoins[])
        
        const transformedProposals: Proposal[] = updatedProposals.map(proposal => ({
          ...proposal,
          createdAt: new Date(proposal.created_at),
          updatedAt: new Date(proposal.updated_at),
          proposed_start_date: new Date(proposal.proposed_start_date),
          proposed_end_date: new Date(proposal.proposed_end_date),
          expiry_date: new Date(proposal.expiry_date),
          deposit_due_on: proposal.deposit_due_on, // Keep as string for PDF generator compatibility
          submitted_date: proposal.submitted_date ? new Date(proposal.submitted_date) : undefined,
          accepted_date: proposal.accepted_date ? new Date(proposal.accepted_date) : undefined,
          rejected_date: proposal.rejected_date ? new Date(proposal.rejected_date) : undefined,
          withdrawn_date: proposal.withdrawn_date ? new Date(proposal.withdrawn_date) : undefined,
          viewed_date: proposal.viewed_date ? new Date(proposal.viewed_date) : undefined,
          last_updated: new Date(proposal.updated_at),
          attached_files: proposal.attached_files || [],
          proposals: proposal.proposals || [],
          visibility_settings: proposal.visibility_settings || 'private',
          created_by: proposal.created_by || proposal.contractor,
          last_modified_by: proposal.last_modified_by || proposal.contractor
        }))
        setProposals(transformedProposals)
      }
      
    } catch (error) {
      console.error('Error accepting contractor proposal:', error)
      toast.error('Failed to accept the contractor proposal')
    } finally {
      setUpdatingProposal(null)
    }
  }

  const handleMarkComplete = async () => {
    setShowMarkCompleteDialog(true)
  }

  const handleUploadAfterPhoto = () => {
    setShowAfterPhotoUploadDialog(true)
  }

  const handleAfterPhotoUpload = async (afterPhoto: { id: string; filename: string; url: string; size?: number; mimeType?: string; uploadedAt?: Date; }) => {
    if (!user || !project) return
    
    setUploadingAfterPhoto(true)
    
    try {
      const supabase = createClient()
      
      // Update project with after photo
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          after_photo: afterPhoto,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('creator', user.id)
      
      if (updateError) {
        throw updateError
      }
      
      // Update the local project state
      setProject(prev => prev ? { 
        ...prev, 
        after_photo: afterPhoto
      } : null)
      
      toast.success('After photo uploaded successfully!')
      setShowAfterPhotoUploadDialog(false)
      
    } catch (error) {
      console.error('Error uploading after photo:', error)
      toast.error('Failed to upload after photo')
      throw error // Re-throw to let the modal handle the error
    } finally {
      setUploadingAfterPhoto(false)
    }
  }

  const confirmMarkComplete = async (afterPhoto: { id: string; filename: string; url: string; size?: number; mimeType?: string; uploadedAt?: Date; }) => {
    if (!user || !project) return
    
    setMarkingComplete(true)
    
    try {
      const supabase = createClient()
      
      // Update project status to completed and add after photo
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          status: PROJECT_STATUSES.COMPLETED,
          after_photo: afterPhoto,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('creator', user.id)
      
      if (updateError) {
        throw updateError
      }
      
      // Update the local project state
      setProject(prev => prev ? { 
        ...prev, 
        status: PROJECT_STATUSES.COMPLETED,
        after_photo: afterPhoto
      } : null)
      
      toast.success('Project marked as complete!')
      setShowMarkCompleteDialog(false)
      
      // Show review consent modal after project completion
      setShowReviewConsentDialog(true)
      
    } catch (error) {
      console.error('Error marking project as complete:', error)
      toast.error('Failed to mark project as complete')
      throw error // Re-throw to let the modal handle the error
    } finally {
      setMarkingComplete(false)
    }
  }

  const handleReviewSubmission = async (reviewData: {
    consent: boolean
    rating: number
    recommendScore: number
    text: string
  }) => {
    if (!user || !project) return
    
    setSubmittingReview(true)
    
    try {
      // Get the contractor from the selected proposal
      const selectedProposal = proposals.find(p => p.is_selected === 'yes')
      if (!selectedProposal) {
        throw new Error('No selected proposal found')
      }

      const response = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          userId: user.id,
          recipientId: selectedProposal.contractor,
          rating: reviewData.rating,
          recommendScore: reviewData.recommendScore,
          text: reviewData.text,
          homeownerConsentForPhotos: reviewData.consent,
          files: []
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit review')
      }

      toast.success('Review submitted successfully!')
      setShowReviewConsentDialog(false)
      
    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit review')
      throw error
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleRejectContractorProposal = async (proposalId: string, reason?: string, notes?: string) => {
    if (!user) return

    setUpdatingProposal(proposalId)
    
    try {
      const supabase = createClient()
      
      // First, mark the proposal as viewed (if not already)
      await supabase
        .from('proposals')
        .update({
          status: PROPOSAL_STATUSES.VIEWED,
          viewed_date: new Date().toISOString(),
          last_updated: new Date().toISOString(),
          last_modified_by: user.id
        })
        .eq('id', proposalId)
        .eq('status', PROPOSAL_STATUSES.SUBMITTED)
      
      // Reject the proposal
      const { error: rejectError } = await supabase
        .from('proposals')
        .update({
          status: PROPOSAL_STATUSES.REJECTED,
          rejected_date: new Date().toISOString(),
          rejection_reason: reason || 'other',
          rejection_reason_notes: notes,
          last_updated: new Date().toISOString(),
          last_modified_by: user.id
        })
        .eq('id', proposalId)
        .eq('homeowner', user.id)
      
      if (rejectError) {
        throw rejectError
      }
      
      toast.success('Contractor proposal rejected successfully')
      
      // Refresh proposals
      const { data: updatedProposals } = await supabase
        .from('proposals')
        .select(`
          *,
          project_details:projects!proposals_project_fkey (
            id,
            project_title,
            statement_of_work,
            category,
            location,
            status,
            budget,
            pid
          ),
          contractor_profile:users!proposals_contractor_fkey (
            id,
            full_name,
            email,
            phone_number,
            address
          )
        `)
        .eq('project', id)
        .eq('homeowner', user.id)
        .eq('is_deleted', 'no')
        .in('status', [PROPOSAL_STATUSES.SUBMITTED, PROPOSAL_STATUSES.VIEWED, PROPOSAL_STATUSES.ACCEPTED, PROPOSAL_STATUSES.REJECTED])
        .order('created_at', { ascending: false })
      
      if (updatedProposals) {
        // Update rawProposals for the UI component
        setRawProposals(updatedProposals as ProposalWithJoins[])
        
        const transformedProposals: Proposal[] = updatedProposals.map(proposal => ({
          ...proposal,
          createdAt: new Date(proposal.created_at),
          updatedAt: new Date(proposal.updated_at),
          proposed_start_date: new Date(proposal.proposed_start_date),
          proposed_end_date: new Date(proposal.proposed_end_date),
          expiry_date: new Date(proposal.expiry_date),
          deposit_due_on: new Date(proposal.deposit_due_on),
          submitted_date: proposal.submitted_date ? new Date(proposal.submitted_date) : undefined,
          accepted_date: proposal.accepted_date ? new Date(proposal.accepted_date) : undefined,
          rejected_date: proposal.rejected_date ? new Date(proposal.rejected_date) : undefined,
          withdrawn_date: proposal.withdrawn_date ? new Date(proposal.withdrawn_date) : undefined,
          viewed_date: proposal.viewed_date ? new Date(proposal.viewed_date) : undefined,
          last_updated: new Date(proposal.updated_at),
          attached_files: proposal.attached_files || [],
          proposals: proposal.proposals || [],
          visibility_settings: proposal.visibility_settings || 'private',
          created_by: proposal.created_by || proposal.contractor,
          last_modified_by: proposal.last_modified_by || proposal.contractor
        }))
        setProposals(transformedProposals)
      }
      
    } catch (error) {
      console.error('Error rejecting contractor proposal:', error)
      toast.error('Failed to reject the contractor proposal')
    } finally {
      setUpdatingProposal(null)
    }
  }

  const handleViewContractorProposal = (proposalId: string) => {
    // Navigate to proposal detail view for homeowner
    router.push(`/homeowner/proposals/${proposalId}`)
  }



  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <LoadingSpinner size="lg" variant="default" text="Loading your project details..." />
        </div>
      </div>
    )
  }

  if (error || !project || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          {error || 'Project not found or you don\'t have access to view it'}
        </div>
        <div className="text-center mt-4">
          <button 
            onClick={() => router.push('/homeowner/projects')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Back to Your Projects
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {isProcessingPaymentSuccess && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center max-w-md mx-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Publishing your project...</p>
            <p className="text-gray-500 text-sm mt-2">Please wait while we process your payment and publish your project.</p>
          </div>
        </div>
      )}
      <HomeownerProjectView
        project={project} 
        proposals={rawProposals}
        user={user as unknown as User}
        userRole={USER_ROLES.HOMEOWNER}
        onAcceptProposal={handleAcceptContractorProposal}
        onRejectProposal={handleRejectContractorProposal}
        onViewProposal={handleViewContractorProposal}
        onEdit={handleEditHomeownerProject}
        onMarkComplete={handleMarkComplete}
        onUploadAfterPhoto={handleUploadAfterPhoto}
        onUpdateAmenities={handleUpdateAmenities}
        loading={loading}
        proposalsLoading={proposalsLoading}
        updatingProposal={updatingProposal}
        updateAmenitiesLoading={updateAmenitiesMutation.isPending}
      />

      {/* Project Completion Modal */}
      <ProjectCompletionModal
        isOpen={showMarkCompleteDialog}
        onClose={() => setShowMarkCompleteDialog(false)}
        onConfirm={confirmMarkComplete}
        projectTitle={project?.project_title || ''}
        projectPhotos={project?.project_photos || []}
        existingAfterPhoto={project?.after_photo}
        loading={markingComplete}
      />

      {/* After Photo Upload Modal */}
      <AfterPhotoUploadModal
        isOpen={showAfterPhotoUploadDialog}
        onClose={() => setShowAfterPhotoUploadDialog(false)}
        onConfirm={handleAfterPhotoUpload}
        projectTitle={project?.project_title || ''}
        projectPhotos={project?.project_photos || []}
        existingAfterPhoto={project?.after_photo || null}
        loading={uploadingAfterPhoto}
      />

      {/* Review Consent Modal */}
      <ReviewConsentModal
        isOpen={showReviewConsentDialog}
        onClose={() => setShowReviewConsentDialog(false)}
        onConfirm={handleReviewSubmission}
        projectTitle={project?.project_title || ''}
        contractorName={rawProposals.find(p => p.is_selected === 'yes')?.contractor_profile?.full_name || 'Contractor'}
        beforePhoto={project?.project_photos && project.project_photos.length > 0 ? project.project_photos[0] : null}
        afterPhoto={project?.after_photo || null}
        loading={submittingReview}
      />
    </>
  )
}
