'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Building2, 
  DollarSign, 
  TrendingUp, 
  Clock
} from 'lucide-react'
import { Project } from '@/server/database/interfaces'
import { PROJECT_STATUSES } from '@/utils/constants'

interface ProjectStatsProps {
  projects: Project[]
}

export default function ProjectStats({ projects }: ProjectStatsProps) {
  const stats = {
    total: projects.length,
    published: projects.filter(p => p.status === PROJECT_STATUSES.OPEN_FOR_PROPOSALS).length,
    bidding: projects.filter(p => p.status === PROJECT_STATUSES.IN_PROGRESS).length,
    awarded: projects.filter(p => p.status === PROJECT_STATUSES.PROPOSAL_SELECTED).length,
    completed: projects.filter(p => p.status === PROJECT_STATUSES.COMPLETED).length,
    cancelled: projects.filter(p => p.status === PROJECT_STATUSES.CANCELLED).length,
    totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
    withLocation: projects.filter(p => p.location?.address).length,
    upcomingDeadlines: projects.filter(p => {
      if (!p.expiry_date) return false
      const deadline = new Date(p.expiry_date)
      const now = new Date()
      const diffTime = deadline.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays > 0 && diffDays <= 30
    }).length
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Projects */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All time projects
            </p>
          </CardContent>
        </Card>

        {/* Total Budget */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalBudget.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Combined project value
            </p>
          </CardContent>
        </Card>

        {/* Active Projects */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.published + stats.bidding + stats.awarded}</div>
            <p className="text-xs text-muted-foreground">
              Open + Bidding + Awarded
            </p>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingDeadlines}</div>
            <p className="text-xs text-muted-foreground">
              Due within 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Project Status Breakdown</CardTitle>
          <CardDescription>
            Overview of all project statuses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <div className="font-medium">{stats.published}</div>
                <div className="text-sm text-muted-foreground">Open</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div>
                <div className="font-medium">{stats.bidding}</div>
                <div className="text-sm text-muted-foreground">Bidding</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <div>
                <div className="font-medium">{stats.awarded}</div>
                <div className="text-sm text-muted-foreground">Awarded</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <div>
                <div className="font-medium">{stats.completed}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div>
                <div className="font-medium">{stats.cancelled}</div>
                <div className="text-sm text-muted-foreground">Cancelled</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
