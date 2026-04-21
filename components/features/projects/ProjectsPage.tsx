'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { USER_ROLES, PROJECT_STATUSES } from '@/utils/constants'
import ProjectList from './ProjectList'
import { Project } from '@/server/database/interfaces'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { useHomeownerProfileStatus } from '@/hooks/useHomeownerProfileStatus'

interface ProjectsPageProps {
  projects: Project[]
  userRole?: string
  className?: string
  onProjectsUpdate?: (updatedProjects: Project[]) => void
  projectProposalCounts?: Record<string, number>
}

export default function ProjectsPage({ projects, userRole, className = '', onProjectsUpdate, projectProposalCounts = {} }: ProjectsPageProps) {
  const router = useRouter()
  const { canPostProject, isProfileComplete, isGovernmentIdVerified, loading } = useHomeownerProfileStatus()

  const handlePostProject = useCallback(() => {
    if (userRole === USER_ROLES.HOMEOWNER) {
      if (canPostProject) {
        router.push('/homeowner/projects/create')
      }
    } else {
      router.push('/projects/create')
    }
  }, [router, userRole, canPostProject])

  const handleViewProject = useCallback((project: Project) => {
    // Use slug if available, otherwise fall back to ID
    const projectIdentifier = project.slug || project.id
    
    if (userRole === USER_ROLES.HOMEOWNER) {
      router.push(`/homeowner/projects/view/${projectIdentifier}`)
    } else if (userRole === USER_ROLES.CONTRACTOR) {
      router.push(`/contractor/projects/view/${projectIdentifier}`)
    } else {
      router.push(`/projects/view/${projectIdentifier}`)
    }
  }, [router, userRole])

  const handleEditProject = useCallback((project: Project) => {
    const guardAndNavigate = async () => {
      if (userRole === USER_ROLES.HOMEOWNER) {
        try {
          const supabase = createClient()
          const { data: selectedProposal, error } = await supabase
            .from('proposals')
            .select('id')
            .eq('project', project.id)
            .eq('is_selected', 'yes')
            .maybeSingle()

          if (error) throw error

          if (selectedProposal) {
            toast.error('Project editing is disabled after selecting a proposal')
            return
          }
        } catch (error) {
          console.error('Error checking project edit eligibility:', error)
          toast.error('Unable to verify edit permissions right now')
          return
        }

        router.push(`/homeowner/projects/edit/${project.id}`)
      } else {
        router.push(`/projects/edit/${project.id}`)
      }
    }

    void guardAndNavigate()
  }, [router, userRole])

  const handleDeleteProject = useCallback(async (project: Project) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone and will remove all associated proposals.')) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id)

      if (error) {
        throw error
      }

      toast.success('Project deleted successfully')
      // Refresh the page to update the project list
      window.location.reload()
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Failed to delete project')
    }
  }, [])

  return (
    <div className={`space-y-6 ${className}`}>
             <ProjectList
         projects={projects}
         onPostProject={handlePostProject}
         onViewProject={handleViewProject}
         onEditProject={handleEditProject}
         onDeleteProject={handleDeleteProject}
         projectProposalCounts={projectProposalCounts}
         canPostProject={userRole === USER_ROLES.HOMEOWNER ? canPostProject : true}
         isProfileComplete={userRole === USER_ROLES.HOMEOWNER ? isProfileComplete : true}
         isGovernmentIdVerified={userRole === USER_ROLES.HOMEOWNER ? isGovernmentIdVerified : true}
         loading={userRole === USER_ROLES.HOMEOWNER ? loading : false}
       />
      

    </div>
  )
}
