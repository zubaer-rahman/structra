'use client'

import { Calendar, MapPin, DollarSign, Clock, User, Eye, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

import { Project } from '@/server/database/interfaces'
import { PROJECT_STATUSES } from "@/utils/constants"

interface ProjectCardProps {
  projects: Project[]
  onProjectClick?: (project: Project) => void
  onViewProject?: (project: Project) => void
  onEditProject?: (project: Project) => void
  onDeleteProject?: (project: Project) => void
}

export default function ProjectCard({ projects, onProjectClick, onViewProject, onEditProject, onDeleteProject }: ProjectCardProps) {

  const getStatusConfig = (status: string) => {
    const statusConfig = {
      [PROJECT_STATUSES.OPEN_FOR_PROPOSALS]: { label: PROJECT_STATUSES.OPEN_FOR_PROPOSALS, variant: 'default' as const, color: 'bg-gray-100 text-gray-800' },
      [PROJECT_STATUSES.PROPOSAL_SELECTED]: { label: PROJECT_STATUSES.PROPOSAL_SELECTED, variant: 'secondary' as const, color: 'bg-orange-100 text-orange-800' },
      [PROJECT_STATUSES.IN_PROGRESS]: { label: PROJECT_STATUSES.IN_PROGRESS, variant: 'outline' as const, color: 'bg-orange-100 text-orange-800' },
      [PROJECT_STATUSES.COMPLETED]: { label: PROJECT_STATUSES.COMPLETED, variant: 'outline' as const, color: 'bg-gray-900 text-white' },
      [PROJECT_STATUSES.CANCELLED]: { label: PROJECT_STATUSES.CANCELLED, variant: 'destructive' as const, color: 'bg-gray-100 text-gray-800' },
    }
    
    return statusConfig[status as keyof typeof statusConfig] || statusConfig[PROJECT_STATUSES.OPEN_FOR_PROPOSALS]
  }

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatBudget = (budget: number | null) => {
    if (!budget) return 'Not specified'
    return `$${budget.toLocaleString()}`
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => {
        const statusConfig = getStatusConfig(project.status)
        
        return (
          <Card 
            key={project.id} 
            className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/20"
            onClick={() => onProjectClick?.(project)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                    {project.project_title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-sm">
                    {project.statement_of_work || 'No description available'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={statusConfig.variant} className={statusConfig.color}>
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Location */}
              {project.location && (project.location.address || project.location.city || project.location.province) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="line-clamp-1">
                    {[project.location.address, project.location.city, project.location.province]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              )}
              
              {/* Budget */}
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="font-medium">{formatBudget(project.budget)}</span>
              </div>
              
              {/* Deadline */}
              {project.expiry_date && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>Due: {formatDate(project.expiry_date)}</span>
                </div>
              )}
              
              {/* Created Date */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span>Created: {formatDate(project.created_at)}</span>
              </div>
              
              {/* Owner */}
              {project.creator && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4 flex-shrink-0" />
                  <span>Creator ID: {project.creator}</span>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="pt-3">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onViewProject?.(project)
                    }}
                    className="h-8 px-3 text-xs"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  {project.status !== PROJECT_STATUSES.PROPOSAL_SELECTED && 
                   project.status !== PROJECT_STATUSES.COMPLETED && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditProject?.(project)
                      }}
                      className="h-8 px-3 text-xs"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  )}
                  {project.status === PROJECT_STATUSES.DRAFT && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteProject?.(project)
                      }}
                      className="h-8 px-3 text-xs text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
