'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  FileText, 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin,
  DollarSign,
  Upload,
  Award
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { generateProjectSlug, generateUniqueSlug } from '@/utils/helpers/slugUtils'
import { LoadingSpinner } from '@/components/shared'
import { PROJECT_STATUSES } from '@/utils/constants/projects'

export default function ProjectVerificationPage() {
  const [selectedProject, setSelectedProject] = useState<{
    id: string
    title: string
    homeowner: string
    homeownerEmail?: string
    location: {
      address: string
      city: string
      province: string
      postalCode: string
      latitude?: number
      longitude?: number
    }
    budget: string
    category: string
    submittedAt: string
    status: string
    description?: string
    titleAwarded?: boolean
    certificateOfTitle?: {
      name: string
      url: string
      type: string
      size: number
    } | null
    priority: string
  } | null>(null)
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [projectRequests, setProjectRequests] = useState<{
    id: string
    title: string
    homeowner: string
    homeownerEmail?: string
    location: {
      address: string
      city: string
      province: string
      postalCode: string
      latitude?: number
      longitude?: number
    }
    budget: string
    category: string
    submittedAt: string
    status: string
    description?: string
    titleAwarded?: boolean
    certificateOfTitle?: {
      name: string
      url: string
      type: string
      size: number
    } | null
    priority: string
  }[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [certificateFile, setCertificateFile] = useState<File | null>(null)
  const [uploadingCertificate, setUploadingCertificate] = useState(false)

  useEffect(() => {
    fetchProjectRequests()
  }, [])

  const fetchProjectRequests = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          project_title,
          statement_of_work,
          budget,
          category,
          location,
          created_at,
          title_awarded,
          project_certificate,
          creator,
          status,
          homeowner:users!creator (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const projects = data?.map(project => ({
        id: project.id,
        title: project.project_title,
        homeowner: project.homeowner && !Array.isArray(project.homeowner)
          ? `${(project.homeowner as { first_name?: string; last_name?: string; email?: string }).first_name || ''} ${(project.homeowner as { first_name?: string; last_name?: string; email?: string }).last_name || ''}`.trim() || 'Unknown'
          : 'Unknown',
        homeownerEmail: project.homeowner && !Array.isArray(project.homeowner) ? (project.homeowner as { first_name?: string; last_name?: string; email?: string }).email || '' : '',
        location: {
          address: project.location?.address || 'Location not specified',
          city: project.location?.city || '',
          province: project.location?.province || '',
          postalCode: project.location?.postalCode || '',
          latitude: project.location?.latitude,
          longitude: project.location?.longitude
        },
        budget: `$${project.budget?.toLocaleString()}`,
        category: Array.isArray(project.category) ? project.category.join(', ') : project.category,
        submittedAt: new Date(project.created_at).toLocaleDateString(),
        status: project.title_awarded
          ? 'approved'
          : project.status === PROJECT_STATUSES.CANCELLED
            ? 'rejected'
            : 'pending',
        description: project.statement_of_work,
        titleAwarded: project.title_awarded === true,
        certificateOfTitle: project.project_certificate,
        priority: 'medium'
      })) || []

      setProjectRequests(projects)
    } catch (error) {
      console.error('Error fetching project requests:', error)
      toast.error('Failed to load project requests')
    } finally {
      setLoading(false)
    }
  }

  // const mockProjectRequests = [
  //   {
  //     id: 1,
  //     title: 'Kitchen Renovation',
  //     homeowner: 'John Smith',
  //     location: 'New York, NY',
  //     budget: '$15,000',
  //     category: 'Kitchen',
  //     submittedAt: '2024-01-15',
  //     status: 'pending',
  //     priority: 'high',
  //     description: 'Complete kitchen renovation including cabinets, countertops, and appliances',
  //     images: ['kitchen1.jpg', 'kitchen2.jpg', 'kitchen3.jpg']
  //   },
  //   {
  //     id: 2,
  //     title: 'Bathroom Remodel',
  //     homeowner: 'Sarah Johnson',
  //     location: 'Los Angeles, CA',
  //     budget: '$8,500',
  //     category: 'Bathroom',
  //     submittedAt: '2024-01-14',
  //     status: 'pending',
  //     priority: 'medium',
  //     description: 'Modern bathroom remodel with new fixtures and tiling',
  //     images: ['bathroom1.jpg', 'bathroom2.jpg']
  //   },
  //   {
  //     id: 3,
  //     title: 'Deck Construction',
  //     homeowner: 'Mike Wilson',
  //     location: 'Chicago, IL',
  //     budget: '$12,000',
  //     category: 'Outdoor',
  //     submittedAt: '2024-01-13',
  //     status: 'approved',
  //     priority: 'low',
  //     description: 'New wooden deck construction in backyard',
  //     images: ['deck1.jpg', 'deck2.jpg', 'deck3.jpg']
  //   },
  //   {
  //     id: 4,
  //     title: 'Roof Repair',
  //     homeowner: 'Lisa Brown',
  //     location: 'Miami, FL',
  //     budget: '$5,000',
  //     category: 'Roofing',
  //     submittedAt: '2024-01-12',
  //     status: 'rejected',
  //     priority: 'high',
  //     description: 'Emergency roof repair due to storm damage',
  //     images: ['roof1.jpg']
  //   }
  // ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Rejected</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">{status}</Badge>
    }
  }

  // const getPriorityBadge = (priority: string) => {
  //   switch (priority) {
  //     case 'high':
  //       return <Badge className="bg-red-100 text-red-800">High</Badge>
  //     case 'medium':
  //       return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
  //     case 'low':
  //       return <Badge className="bg-green-100 text-green-800">Low</Badge>
  //     default:
  //       return <Badge className="bg-gray-100 text-gray-800">{priority}</Badge>
  //   }
  // }

  const handleReview = (project: {
    id: string
    title: string
    homeowner: string
    homeownerEmail?: string
    location: {
      address: string
      city: string
      province: string
      postalCode: string
      latitude?: number
      longitude?: number
    }
    budget: string
    category: string
    submittedAt: string
    status: string
    description?: string
    titleAwarded?: boolean
    certificateOfTitle?: {
      name: string
      url: string
      type: string
      size: number
    } | null
    priority: string
  }) => {
    setSelectedProject(project)
    setIsReviewDialogOpen(true)
  }

  const handleCertificateUpload = async () => {
    if (!certificateFile || !selectedProject) return

    setUploadingCertificate(true)
    try {
      const supabase = createClient()
      
      // Upload the certificate file
      const fileExt = certificateFile.name.split('.').pop()
      const fileName = `${selectedProject.id}_certificate_${Date.now()}.${fileExt}`
      const filePath = `certificates/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('buildready-files')
        .upload(filePath, certificateFile)

      if (uploadError) throw uploadError

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('buildready-files')
        .getPublicUrl(filePath)

      // Generate unique slug for the project when admin approves it
      const baseSlug = generateProjectSlug(selectedProject.title, {
        city: selectedProject.location?.city || '',
        province: selectedProject.location?.province || ''
      })
      
      // Get existing slugs to ensure uniqueness
      const { data: existingProjects } = await supabase
        .from('projects')
        .select('slug')
        .not('slug', 'is', null)
      
      const existingSlugs = existingProjects?.map(p => p.slug) || []
      const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs)

      // Update the project with certificate, mark as title awarded, and add slug
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          project_certificate: {
            name: certificateFile.name,
            url: publicUrl,
            type: certificateFile.type,
            size: certificateFile.size
          },
          title_awarded: true,
          slug: uniqueSlug
        })
        .eq('id', selectedProject.id)

      if (updateError) throw updateError

      toast.success('Certificate of title uploaded and project approved')
      fetchProjectRequests()
      setIsReviewDialogOpen(false)
      setCertificateFile(null)
    } catch (error) {
      console.error('Error uploading certificate:', error)
      toast.error('Failed to upload certificate')
    } finally {
      setUploadingCertificate(false)
    }
  }

  const handleApprove = () => {
    if (!selectedProject) return
    // This will be handled by certificate upload
    handleCertificateUpload()
  }

  const handleReject = async () => {
    if (!selectedProject) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('projects')
        .update({ 
          title_awarded: false,
          project_certificate: null,
          status: PROJECT_STATUSES.CANCELLED
        })
        .eq('id', selectedProject.id)

      if (error) throw error

      toast.success('Project rejected and certificate removed')
      fetchProjectRequests()
      setIsReviewDialogOpen(false)
    } catch (error) {
      console.error('Error rejecting project:', error)
      toast.error('Failed to reject project')
    }
  }

  const filteredRequests = projectRequests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.homeowner.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Verification</h1>
          <p className="text-gray-600">Review and verify project authenticity and quality</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{projectRequests.filter(p => p.status === 'pending').length}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{projectRequests.filter(p => p.status === 'approved').length}</p>
                <p className="text-sm text-gray-600">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{projectRequests.filter(p => p.status === 'rejected').length}</p>
                <p className="text-sm text-gray-600">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{projectRequests.length}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by project title or homeowner..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Project Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Project Verification Requests</CardTitle>
          <CardDescription>Review and verify project authenticity and quality</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Project</TableHead>
                  <TableHead>Homeowner</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Certificate</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <LoadingSpinner 
                        text="Loading projects..."
                        size="md"
                        variant="default"
                        className="justify-center"
                      />
                    </TableCell>
                  </TableRow>
                ) : filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No projects found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((project) => (
                  <TableRow key={project.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <p className="font-medium">{project.title}</p>
                        <p className="text-sm text-gray-600">{project.category}</p>
                        <p className="text-xs text-gray-500 mt-1">{project.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="h-6 w-6 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium">{project.homeowner.charAt(0)}</span>
                        </div>
                        <span className="text-sm">{project.homeowner}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-sm">{project.location.address}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-gray-900">{project.budget}</span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(project.status)}
                    </TableCell>
                    <TableCell>
                      {project.certificateOfTitle ? (
                        <div className="flex items-center space-x-2">
                          <Award className="h-4 w-4 text-gray-600" />
                          <span className="text-sm text-gray-700">Uploaded</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Not uploaded</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {project.submittedAt}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleReview(project)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Review
                        </Button>
                        <>
                          {project.titleAwarded ? (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-gray-300 text-gray-700 hover:bg-gray-50"
                              onClick={() => {
                                setSelectedProject(project)
                                handleReject()
                              }}
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-gray-300 text-gray-700 hover:bg-gray-50"
                              onClick={() => {
                                setSelectedProject(project)
                                handleApprove()
                              }}
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          )}
                        </>
                      </div>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[70vh] flex flex-col">
          <DialogHeader className="flex-shrink-0 border-b pb-3">
            <DialogTitle className="text-base font-semibold text-gray-900">
              Project Verification
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-600">
              {selectedProject?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-3">
            {selectedProject && (
              <div className="space-y-4">
                {/* Project Information Section */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-900">Project Details</h3>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-gray-500">Title</span>
                        <p className="text-sm font-medium text-gray-900 truncate">{selectedProject.title}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Budget</span>
                        <p className="text-sm font-medium text-gray-900">{selectedProject.budget}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Homeowner</span>
                        <p className="text-sm font-medium text-gray-900">{selectedProject.homeowner}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Category</span>
                        <Badge variant="outline" className="text-xs">{selectedProject.category}</Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Location</span>
                      <p className="text-sm text-gray-900">{selectedProject.location.address}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Description</span>
                      <p className="text-sm text-gray-700 mt-1 line-clamp-3">{selectedProject.description}</p>
                    </div>
                  </div>
                </div>

                {/* Certificate Section */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-900">Certificate of Title</h3>
                  {selectedProject.certificateOfTitle ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Award className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-blue-900">Certificate Uploaded</p>
                            <p className="text-xs text-blue-600 truncate max-w-[200px]">
                              {selectedProject.certificateOfTitle.name}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-xs h-8"
                          onClick={() => {
                            if (selectedProject.certificateOfTitle?.url) {
                              window.open(selectedProject.certificateOfTitle.url, '_blank')
                            }
                          }}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <div className="text-center">
                        <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <Award className="h-3 w-3 text-amber-600" />
                        </div>
                        <p className="text-xs text-amber-800 mb-2">
                          No certificate uploaded. Upload to approve.
                        </p>
                        <div>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                            className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border file:border-gray-300 file:text-xs file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50"
                          />
                          {certificateFile && (
                            <p className="text-xs text-gray-600 mt-2 truncate">
                              {certificateFile.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-shrink-0 border-t pt-3">
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setIsReviewDialogOpen(false)
                  setCertificateFile(null)
                }}
                className="text-xs"
              >
                Cancel
              </Button>
              {selectedProject?.titleAwarded ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleReject}
                  className="text-xs text-red-600 border-red-300 hover:bg-red-50"
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Reject
                </Button>
              ) : (
                <Button 
                  size="sm"
                  onClick={handleApprove}
                  disabled={!certificateFile || uploadingCertificate}
                  className="text-xs bg-gray-900 text-white hover:bg-gray-800"
                >
                  {uploadingCertificate ? (
                    <>
                      <Clock className="h-3 w-3 mr-1 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3 w-3 mr-1" />
                      Approve
                    </>
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
