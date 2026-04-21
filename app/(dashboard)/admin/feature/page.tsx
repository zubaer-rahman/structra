'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { 
  Search, 
  Building,
  FileText
} from 'lucide-react'
import { trpc } from '@/utils/trpc'
import toast from 'react-hot-toast'

interface Homeowner {
  id: string
  full_name: string
  email: string
}

interface Project {
  id: string
  project_title: string
  budget: number
  status: string
  is_featured_project: boolean
  created_at: string
  homeowner: Homeowner | Homeowner[]
}

interface User {
  id: string
  full_name: string
  email: string
}

interface Contractor {
  id: string
  business_name: string
  trade_category: string[]
  is_featured_contractor: boolean
  is_admin_verified: boolean
  created_at: string
  user: User | User[]
}

export default function FeatureManagementPage() {
  const [projectSearchTerm, setProjectSearchTerm] = useState('')
  const [contractorSearchTerm, setContractorSearchTerm] = useState('')

  // Fetch projects
  const { data: projects, isLoading: projectsLoading, refetch: refetchProjects } = trpc.admin.getProjectsForFeatureManagement.useQuery()
  
  // Fetch contractors
  const { data: contractors, isLoading: contractorsLoading, refetch: refetchContractors } = trpc.admin.getContractorsForFeatureManagement.useQuery()

  // Toggle featured project
  const toggleFeaturedProject = trpc.admin.toggleFeaturedProject.useMutation({
    onSuccess: () => {
      toast.success('Project featured status updated')
      refetchProjects()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update project')
    }
  })

  // Toggle featured contractor
  const toggleFeaturedContractor = trpc.admin.toggleFeaturedContractor.useMutation({
    onSuccess: () => {
      toast.success('Contractor featured status updated')
      refetchContractors()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update contractor')
    }
  })

  const handleToggleProject = (projectId: string, currentStatus: boolean) => {
    toggleFeaturedProject.mutate({
      projectId,
      isFeatured: !currentStatus
    })
  }

  const handleToggleContractor = (contractorId: string, currentStatus: boolean) => {
    toggleFeaturedContractor.mutate({
      contractorId,
      isFeatured: !currentStatus
    })
  }

  const filteredProjects = projects?.filter((project: Project) => 
    project.project_title.toLowerCase().includes(projectSearchTerm.toLowerCase()) ||
    (Array.isArray(project.homeowner) ? project.homeowner[0]?.full_name : (project.homeowner as Homeowner)?.full_name)?.toLowerCase().includes(projectSearchTerm.toLowerCase())
  ) || []

  const filteredContractors = contractors?.filter((contractor: Contractor) => 
    contractor.business_name.toLowerCase().includes(contractorSearchTerm.toLowerCase()) ||
    (Array.isArray(contractor.user) ? contractor.user[0]?.full_name : (contractor.user as User)?.full_name)?.toLowerCase().includes(contractorSearchTerm.toLowerCase())
  ) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Featured Project Management</h1>
          <p className="text-gray-600">Manage featured projects and contractors</p>
        </div>
      </div>

      {/* Featured Projects Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Featured Projects
          </CardTitle>
          <CardDescription>
            Toggle projects as featured to highlight them in the marketplace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search projects..."
                  value={projectSearchTerm}
                  onChange={(e) => setProjectSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Projects Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Title</TableHead>
                    <TableHead>Homeowner</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading projects...
                      </TableCell>
                    </TableRow>
                  ) : filteredProjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No projects found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProjects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">
                          {project.project_title}
                        </TableCell>
                        <TableCell>
                          {Array.isArray(project.homeowner) ? project.homeowner[0]?.full_name || 'N/A' : (project.homeowner as Homeowner)?.full_name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          ${project.budget.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={project.status === 'Open for Proposals' ? 'default' : 'secondary'}>
                            {project.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={project.is_featured_project ? 'default' : 'outline'}>
                            {project.is_featured_project ? 'Featured' : 'Not Featured'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={project.is_featured_project}
                              onCheckedChange={() => handleToggleProject(project.id, project.is_featured_project)}
                              disabled={toggleFeaturedProject.isPending}
                            />
                            <span className="text-sm text-gray-500">
                              {project.is_featured_project ? 'On' : 'Off'}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Featured Contractors Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Featured Contractors
          </CardTitle>
          <CardDescription>
            Toggle contractors as featured to highlight them in the marketplace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search contractors..."
                  value={contractorSearchTerm}
                  onChange={(e) => setContractorSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Contractors Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Contact Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Trade Category</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contractorsLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading contractors...
                      </TableCell>
                    </TableRow>
                  ) : filteredContractors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No contractors found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredContractors.map((contractor) => (
                      <TableRow key={contractor.id}>
                        <TableCell className="font-medium">
                          {contractor.business_name}
                        </TableCell>
                        <TableCell>
                          {Array.isArray(contractor.user) ? contractor.user[0]?.full_name || 'N/A' : (contractor.user as User)?.full_name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {Array.isArray(contractor.user) ? contractor.user[0]?.email || 'N/A' : (contractor.user as User)?.email || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {contractor.trade_category.slice(0, 2).map((category: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {category}
                              </Badge>
                            ))}
                            {contractor.trade_category.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{contractor.trade_category.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={contractor.is_admin_verified ? 'default' : 'secondary'}>
                            {contractor.is_admin_verified ? 'Verified' : 'Not Verified'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={contractor.is_featured_contractor ? 'default' : 'outline'}>
                            {contractor.is_featured_contractor ? 'Featured' : 'Not Featured'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={contractor.is_featured_contractor}
                              onCheckedChange={() => handleToggleContractor(contractor.id, contractor.is_featured_contractor)}
                              disabled={toggleFeaturedContractor.isPending}
                            />
                            <span className="text-sm text-gray-500">
                              {contractor.is_featured_contractor ? 'On' : 'Off'}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
