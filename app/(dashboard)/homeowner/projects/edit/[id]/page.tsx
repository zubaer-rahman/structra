'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingSpinner, Breadcrumbs } from '@/components/shared'
import { createClient } from '@/lib/supabase'
import dynamic from 'next/dynamic'

const EditProjectForm = dynamic(
  () =>
    import("@/components/features/projects/EditProjectForm").then((mod) => ({
      default: mod.default,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </div>
    ),
  }
)

export default function EditProjectPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const checkProjectAccess = async () => {
      if (!id || !user) {
        setLoading(false)
        return
      }
      
      try {
        const supabase = createClient()
        const { data, error: fetchError } = await supabase
          .from('projects')
          .select('id, creator, status')
          .eq('id', id)
          .single()
        
        if (fetchError || !data) {
          setError('Project not found or access denied')
          router.push('/homeowner/projects')
          return
        }

        if (data.creator && data.creator !== user.id) {
          setError('Project not found or access denied')
          router.push('/homeowner/projects')
          return
        }

        // Block edits once a proposal has been selected or work is in progress.
        if (
          data.status === 'Proposal Selected' ||
          data.status === 'In Progress' ||
          data.status === 'Completed'
        ) {
          setError('This project can no longer be edited after selecting a proposal')
          router.push(`/homeowner/projects/view/${id}`)
          return
        }

        // Check if there is an accepted proposal in proposals table
        if (data.status !== 'Draft') {
          const { data: selectedProposal } = await supabase
            .from('proposals')
            .select('id')
            .eq('project_id', id)
            .eq('status', 'accepted')
            .maybeSingle()

          if (selectedProposal) {
            setError('This project can no longer be edited after selecting a proposal')
            router.push(`/homeowner/projects/view/${id}`)
            return
          }
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Error checking project access:', error)
        setError('Failed to verify project access')
        setLoading(false)
      }
    }
    
    checkProjectAccess()
  }, [id, user, router])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center text-red-600">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Project</h1>
          <p className="text-muted-foreground">
            Update your project details and requirements
          </p>
        </div>
      </div>
      <EditProjectForm user={user} projectId={id} />
    </div>
  )
}
