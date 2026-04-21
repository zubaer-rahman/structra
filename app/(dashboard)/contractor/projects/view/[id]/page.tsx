'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { ContractorProjectView } from '@/components/features/projects'
import { createClient } from '@/lib/supabase'

import { LoadingSpinner } from '@/components/shared'
import { toast } from 'sonner'
import { USER_ROLES } from '@/utils/constants'
import { Project } from '@/server/database/interfaces'
import { User } from '@/server/database/interfaces/auth'
import { trpc } from '@/utils/trpc'
import { CheckCircle, Eye } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface ProjectWithAccess extends Project {
  hasAccess: boolean
}

export default function ContractorProjectViewPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, userRole, loading } = useAuth()
  const [project, setProject] = useState<ProjectWithAccess | null>(null)
  const [projectLoading, setProjectLoading] = useState(true)
  const [error, setError] = useState('')
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false)
  const [paymentProcessing, setPaymentProcessing] = useState(false)

  const projectIdentifier = params.id as string
  const projectIdentifierIsUuid = useMemo(() => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(projectIdentifier)
  }, [projectIdentifier])

  // TRPC mutation for updating project access status
  const updateProjectAccessMutation = trpc.users.updateProjectAccessStatus.useMutation()

  // Refetch project access status
  const refetchProjectAccess = () => {
    accessQuery.refetch()
  }

  const handleProjectPaymentCancel = async (resolvedProjectId: string) => {
    if (!user?.id || !resolvedProjectId) return
    
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const sessionId = searchParams.get('session_id')

      // Call the project payment cancel API to clean up pending transactions
      const response = await fetch('/api/project-payment-cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          userId: user.id,
          projectId: resolvedProjectId,
          sessionId: sessionId || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Cancelled project payment transactions:', data.cancelledTransactions);
      } else {
        console.error('Failed to cancel project payment:', data.error);
      }
    } catch (error) {
      console.error('Error cancelling project payment:', error);
    } finally {
      refetchProjectAccess()
    }
  };

  // Check for payment success/cancelled parameter
  useEffect(() => {
    const paymentStatus = searchParams.get('payment')
    if (paymentStatus === 'success' && user?.id && project) {
      handleProjectPaymentSuccess()
    } else if (paymentStatus === 'cancelled' && user?.id) {
      const resolvedProjectId = project?.id || (projectIdentifierIsUuid ? projectIdentifier : '')
      if (!resolvedProjectId) return

      // Clean up pending transactions and show cancellation message
      handleProjectPaymentCancel(resolvedProjectId)
      toast.error('Payment was cancelled. You can try again anytime.')
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('payment')
      router.replace(newUrl.pathname + newUrl.search)
    }
  }, [searchParams, user?.id, project, projectIdentifier, projectIdentifierIsUuid, router])

  const handleProjectPaymentSuccess = async () => {
    if (paymentProcessing || !user?.id || !project) return
    
    setShowPaymentSuccess(true)
    setPaymentProcessing(true)
    
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const sessionId = searchParams.get('session_id')

      // Call the project payment success API to handle pending -> succeeded transaction update
      const response = await fetch('/api/project-payment-success', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          userId: user.id,
          projectId: project.id,
          sessionId: sessionId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process project payment');
      }

      if (data.success) {
        toast.success('Payment successful! You now have access to this project.')
        setPaymentProcessing(false)
        // Remove the payment parameter from URL
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.delete('payment')
        router.replace(newUrl.pathname + newUrl.search)
        // Refetch project access status
        refetchProjectAccess()
      } else {
        throw new Error(data.message || 'Project payment failed');
      }
      
    } catch (error) {
      console.error('Error processing project payment success:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to process payment')
      setShowPaymentSuccess(false)
      setPaymentProcessing(false)
    }
  }

  // Fetch project by identifier (slug or ID)
  useEffect(() => {
    if (projectIdentifier && !loading) {
      fetchProjectByIdentifier()
    }
  }, [projectIdentifier, loading])

  const fetchProjectByIdentifier = async () => {
    try {
      setProjectLoading(true)
      const supabase = createClient()

      // Check if the identifier looks like a UUID
      const isUuid = projectIdentifierIsUuid

      let projectData, projectError

      if (isUuid) {
        // Fetch by ID
        const result = await supabase
          .from('projects')
          .select(`
            *,
            homeowner:users!creator(
              id,
              full_name,
              profile_photo
            )
          `)
          .eq('id', projectIdentifier)
          .single()
        
        projectData = result.data
        projectError = result.error
      } else {
        // Fetch by slug
        const result = await supabase
          .from('projects')
          .select(`
            *,
            homeowner:users!creator(
              id,
              full_name,
              profile_photo
            )
          `)
          .eq('slug', projectIdentifier)
          .single()
        
        projectData = result.data
        projectError = result.error
      }

      if (projectError) {
        console.error('Error fetching project:', projectError)
        setError('Project not found')
        return
      }

      setProject(projectData)
    } catch (error) {
      console.error('Error fetching project:', error)
      setError('Failed to load project details')
    } finally {
      setProjectLoading(false)
    }
  }

  // TRPC queries for project access
  const accessQuery = trpc.projects.checkProjectAccess.useQuery(
    { projectId: project?.id || '', userId: user?.id || '' },
    { enabled: !!project?.id && !!user?.id && !loading }
  )

  // Update project with access data when access query completes
  useEffect(() => {
    if (project && accessQuery.data) {
      setProject(prevProject => {
        if (!prevProject) return null
        return {
          ...prevProject,
          hasAccess: accessQuery.data.hasAccess
        }
      })
    } else if (accessQuery.error) {
      setError('Failed to check project access')
    }
  }, [accessQuery.data, accessQuery.error]) // Only depend on access query data

  const handleSubmitProposal = () => {
    if (project) {
      router.push(`/contractor/projects/submit-proposal/${project.id}`)
    }
  }

  if (loading || projectLoading) {
    return <LoadingSpinner />
  }

  // Do not render project content until access check completes.
  const shouldCheckAccess = !!project?.id && !!user?.id
  if (shouldCheckAccess && (accessQuery.isLoading || accessQuery.isFetching)) {
    return <LoadingSpinner />
  }

  // Show payment success message
  if (showPaymentSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white p-4">
        <div className="w-full max-w-md">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-3">Payment Successful!</h2>
            <p className="text-sm text-gray-600 mb-4">
              {paymentProcessing 
                ? 'Processing your access to this project...'
                : 'You now have access to this project.'}
            </p>
            {paymentProcessing && (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
            )}
            {!paymentProcessing && (
              <a
                href={`/contractor/projects/view/${project?.slug || project?.id}`}
                className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium text-sm transition-colors"
              >
                <Eye className="h-4 w-4 mr-2" />
                View project
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (error || !project || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          {error || 'Project not found or you don&apos;t have access to view it'}
        </div>
        <div className="text-center mt-4">
          <button 
            onClick={() => router.push('/contractor/projects')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Back to Projects
          </button>
        </div>
      </div>
    )
  }

  // Hard access gate: blocked users must not view project details by direct URL.
  if (shouldCheckAccess && accessQuery.data && !accessQuery.data.hasAccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          You don&apos;t have access to view this project.
        </div>
        <div className="text-center mt-4">
          <button
            onClick={() => router.push('/contractor/projects')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Back to Projects
          </button>
        </div>
      </div>
    )
  }


  return (
    <ContractorProjectView
      project={project}
      user={user as unknown as User}
      userRole={userRole || USER_ROLES.CONTRACTOR}
      onSubmitProposal={handleSubmitProposal}
      loading={projectLoading}
    />
  )
}