'use client'

import { trpc } from '@/utils/trpc'
import { LoadingSpinner } from '@/components/shared'
import ProjectStats from './ProjectStats'
import RecentProjects from './RecentProjects'
import { useAuth } from '@/contexts/AuthContext'


export default function TRPCHomeownerDashboard() {
  const { user } = useAuth()

  // Fetch homeowner's projects using TRPC
  const { data: projects, isLoading: projectsLoading, error: projectsError } = trpc.projects.getMy.useQuery(
    {
      limit: 20,
      offset: 0,
    },
    {
      enabled: !!user,
    }
  )

  // Fetch user stats using TRPC
  const { isLoading: statsLoading } = trpc.users.getStats.useQuery(
    undefined,
    {
      enabled: !!user,
    }
  )

  if (projectsLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  if (projectsError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600">Unable to load your dashboard data. Please try again later.</p>
        </div>
      </div>
    )
  }

  const projectsData = projects || []

  return (
    <div className="space-y-8">
      {/* Project Statistics */}
      <ProjectStats
        stats={{
          total: projectsData.length,
          open: projectsData.filter(p => ['Draft', 'Open for Proposals'].includes(p.status)).length,
          accepted: projectsData.filter(p => ['Awarded', 'In Progress'].includes(p.status)).length,
          completed: projectsData.filter(p => p.status === 'Completed').length
        }}
      />

      {/* Recent Projects */}
      <RecentProjects projects={projectsData.slice(0, 5)} />
    </div>
  )
}