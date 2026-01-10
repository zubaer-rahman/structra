'use client'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CalendarDays, DollarSign, MapPin, Plus, Edit, Building2, XCircle, MoreHorizontal, Clock, Star, FileText, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"


interface Proposal {
  id: string
  title: string
  status: string
  subtotal_amount: number | null
  total_amount: number | null
  created_at: string
  description_of_work: string
  proposed_start_date: string | null
  proposed_end_date: string | null
  project?: {
    id: string
    project_title: string
    statement_of_work: string
    category: string
    location: string | { city: string; province: string; address?: string }
    status: string
    budget: number | null
    creator: string
  }
}

interface RecentProposalsProps {
  proposals: Proposal[]
}

function getStatusBadgeStyle(status: string) {
  const badgeStyles = {
    'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'accepted': 'bg-green-100 text-green-800 border-green-300',
    'rejected': 'bg-red-100 text-red-800 border-red-300',
    'under_review': 'bg-blue-100 text-blue-800 border-blue-300',
    'withdrawn': 'bg-gray-100 text-gray-800 border-gray-300'
  }
  return badgeStyles[status as keyof typeof badgeStyles] || 'bg-gray-100 text-gray-800 border-gray-200'
}

function getStatusIcon(status: string) {
  const icons = {
    'pending': Clock,
    'accepted': Star,
    'rejected': XCircle,
    'under_review': TrendingUp,
    'withdrawn': XCircle
  }
  return icons[status as keyof typeof icons] || Clock
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function getDaysAgo(date: string | Date) {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - dateObj.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

export default function RecentProposals({ proposals }: RecentProposalsProps) {
  const router = useRouter()
  
  // Filter out proposals with missing project data
  const validProposals = proposals.filter(proposal => 
    proposal.project && proposal.project.id && proposal.project.project_title
  )
  
  const displayProposals = validProposals.slice(0, 5)

  // Handle row click to navigate to proposal view
  const handleRowClick = (proposalId: string, event: React.MouseEvent) => {
    // Prevent navigation if clicking on the dropdown menu or its trigger
    const target = event.target as HTMLElement
    if (target.closest('[data-dropdown-trigger]') || target.closest('[data-dropdown-content]')) {
      return
    }
    router.push(`/contractor/my-projects/${proposalId}`)
  }

  return (
    <div className="space-y-4">
      {/* Enhanced Header Section */}
      <div className="py-2 sm:py-2 lg:py-3">
        {/* Main Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-2 w-full sm:w-auto">
            <div className="text-center sm:text-left">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                Recent Proposals
              </h2>
              <p className="text-xs text-gray-600 mt-1">
                Track your latest proposal submissions and their status
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {displayProposals.length === 0 ? (
        <div className="text-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <FileText className="h-10 w-10 text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {validProposals.length === 0 ? 'No proposals yet' : 'No valid proposals to display'}
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto text-base leading-relaxed">
            {validProposals.length === 0 
              ? "You haven't submitted any proposals yet. Start browsing projects to find opportunities!"
              : "Some proposals may have incomplete project data and cannot be displayed."
            }
          </p>
          <Link href="/contractor/projects">
            <Button className="gap-2 bg-gray-600 hover:bg-gray-700 text-white transition-all duration-300 px-4 py-2 text-sm">
              <Plus className="h-4 w-4" />
              Browse Projects
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Enhanced Proposal Cards for Mobile */}
          <div className="block lg:hidden space-y-3">
            {displayProposals.map((proposal) => {
              const StatusIcon = getStatusIcon(proposal.status)
              const project = proposal.project
              
              // Safety check: ensure project exists and has required fields
              if (!project || !project.id) {
                console.warn('Proposal missing project data:', proposal)
                return null
              }
              
              return (
                <Card key={proposal.id} className="group bg-white border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] overflow-hidden">
                  <CardContent className="p-5">
                    {/* Header with project type */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="h-4 w-4 text-gray-600" />
                          <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
                            {Array.isArray(project.category) && project.category.length > 0 
                              ? project.category[0] 
                              : 'General'}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors line-clamp-1">
                          {project.project_title}
                        </h3>
                      </div>
                      <div className="ml-4">
                        <Badge className={`${getStatusBadgeStyle(proposal.status)} font-medium px-3 py-1 text-xs border shadow-sm`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {proposal.status?.replace('_', ' ') || 'Unknown'}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Project details grid */}
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="flex items-center gap-2 text-gray-700 bg-gray-50 p-2 rounded-lg">
                        <MapPin className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium truncate">
                          {project.location && typeof project.location === 'object' && 'city' in project.location && 'province' in project.location
                            ? `${project.location.city}, ${project.location.province}` 
                            : typeof project.location === 'string' ? project.location : 'Not specified'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700 bg-gray-50 p-2 rounded-lg">
                        <DollarSign className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium truncate">{formatCurrency(proposal.total_amount || proposal.subtotal_amount || 0)}</span>
                      </div>
                    </div>
                    
                    {/* Proposal details */}
                    <div className="bg-blue-50 p-3 rounded-lg mb-3">
                      <div className="flex items-center justify-between text-sm">
                                                 <span className="text-gray-700">Your Bid: <span className="font-semibold">{formatCurrency(proposal.total_amount || proposal.subtotal_amount || 0)}</span></span>
                         <span className="text-gray-600">Timeline: <span className="font-medium">{proposal.proposed_start_date && proposal.proposed_end_date ? `${proposal.proposed_start_date} - ${proposal.proposed_end_date}` : 'Not specified'}</span></span>
                      </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-gray-600">
                        <CalendarDays className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium">{getDaysAgo(proposal.created_at)}</span>
                      </div>
                      <div className="flex gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" data-dropdown-trigger>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" data-dropdown-content>
                            <DropdownMenuItem asChild>
                              <Link href={`/contractor/my-projects/${proposal.id}`} className="flex items-center">
                                <Edit className="h-4 w-4 mr-2" />
                                View Proposal
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Enhanced Table for Desktop */}
          <div className="hidden lg:block">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Your Bid
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timeline
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayProposals.map((proposal) => {
                      const StatusIcon = getStatusIcon(proposal.status)
                      const project = proposal.project
                      
                      // Safety check: ensure project exists and has required fields
                      if (!project || !project.id) {
                        console.warn('Proposal missing project data:', proposal)
                        return null
                      }
                      
                      return (
                        <tr 
                          key={proposal.id} 
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={(e) => handleRowClick(proposal.id, e)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                  <Building2 className="h-5 w-5 text-gray-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {project.project_title}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {project.location && typeof project.location === 'object' && 'city' in project.location && 'province' in project.location
                                    ? `${project.location.city}, ${project.location.province}` 
                                    : typeof project.location === 'string' ? project.location : 'Location not specified'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(proposal.total_amount || proposal.subtotal_amount || 0)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {proposal.proposed_start_date && proposal.proposed_end_date ? `${proposal.proposed_start_date} - ${proposal.proposed_end_date}` : 'Not specified'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={`${getStatusBadgeStyle(proposal.status)} font-medium px-3 py-1 text-xs border`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {proposal.status?.replace('_', ' ') || 'Unknown'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getDaysAgo(proposal.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" data-dropdown-trigger>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" data-dropdown-content>
                            <DropdownMenuItem asChild>
                              <Link href={`/contractor/my-projects/${proposal.id}`} className="flex items-center">
                                <Edit className="h-4 w-4 mr-2" />
                                View Proposal
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* View All link centered below the table */}
          <div className="flex justify-center pt-4">
            <Link href="/contractor/my-projects" className="text-orange-600 hover:text-orange-700 font-medium text-sm transition-colors">
              View All Proposals
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
