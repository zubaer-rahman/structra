'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  User, 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText,
  Download,
  Image as ImageIcon,
  Shield
} from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { LoadingSpinner } from '@/components/shared'

export default function IdentityVerificationPage() {
  const [selectedUser, setSelectedUser] = useState<{
    id: string
    name: string
    email: string
    userType: string
    submittedAt: string
    status: string
    governmentId: {
      id: string
      filename: string
      url: string
      size?: number
      mimeType?: string
      uploadedAt?: Date
    } | null
    priority: string
  } | null>(null)
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [verificationRequests, setVerificationRequests] = useState<{
    id: string
    name: string
    email: string
    userType: string
    submittedAt: string
    status: string
    governmentId: {
      id: string
      filename: string
      url: string
      size?: number
      mimeType?: string
      uploadedAt?: Date
    } | null
    priority: string
  }[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchVerificationRequests()
  }, [])

  const fetchVerificationRequests = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, user_role, government_id, government_id_verified, created_at')
        .not('government_id', 'is', null)
        .order('created_at', { ascending: false })

      if (error) throw error

      const requests = data?.map(user => ({
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        userType: user.user_role === 'contractor' ? 'Contractor' : 'Homeowner',
        submittedAt: new Date(user.created_at).toLocaleDateString(),
        status: user.government_id_verified ? 'approved' : 'pending',
        governmentId: user.government_id,
        priority: 'medium'
      })) || []

      setVerificationRequests(requests)
    } catch (error) {
      console.error('Error fetching verification requests:', error)
      toast.error('Failed to load verification requests')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
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

  const handleReview = (user: {
    id: string
    name: string
    email: string
    userType: string
    submittedAt: string
    status: string
    governmentId: {
      id: string
      filename: string
      url: string
      size?: number
      mimeType?: string
      uploadedAt?: Date
    } | null
    priority: string
  }) => {
    setSelectedUser(user)
    setIsReviewDialogOpen(true)
  }

  const handleApprove = async () => {
    if (!selectedUser) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('users')
        .update({ government_id_verified: true })
        .eq('id', selectedUser.id)

      if (error) throw error

      toast.success('Government ID verified successfully')
      fetchVerificationRequests()
      setIsReviewDialogOpen(false)
    } catch (error) {
      console.error('Error approving verification:', error)
      toast.error('Failed to approve verification')
    }
  }

  const handleReject = async () => {
    if (!selectedUser) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('users')
        .update({ 
          government_id: null,
          government_id_verified: false 
        })
        .eq('id', selectedUser.id)

      if (error) throw error

      toast.success('Government ID rejected and removed')
      fetchVerificationRequests()
      setIsReviewDialogOpen(false)
    } catch (error) {
      console.error('Error rejecting verification:', error)
      toast.error('Failed to reject verification')
    }
  }

  const filteredRequests = verificationRequests.filter(request => {
    const matchesSearch = request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Identity Verification</h1>
          <p className="text-gray-600">Review and verify user identity documents</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{verificationRequests.filter(r => r.status === 'pending').length}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{verificationRequests.filter(r => r.status === 'approved').length}</p>
                <p className="text-sm text-gray-600">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{verificationRequests.filter(r => r.status === 'rejected').length}</p>
                <p className="text-sm text-gray-600">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{verificationRequests.length}</p>
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
                  placeholder="Search by name or email..."
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

      {/* Verification Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Requests</CardTitle>
          <CardDescription>Review and process identity verification requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Government ID</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <LoadingSpinner 
                        text="Loading verification requests..."
                        size="md"
                        variant="default"
                        className="justify-center"
                      />
                    </TableCell>
                  </TableRow>
                ) : filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No verification requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => (
                  <TableRow key={request.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">{request.name}</p>
                          <p className="text-sm text-gray-600">{request.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{request.userType}</Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(request.status)}
                    </TableCell>
                    <TableCell>
                      {request.governmentId ? (
                        <div className="flex items-center space-x-2">
                          <ImageIcon className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-gray-600">Uploaded</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Not uploaded</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {request.submittedAt}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleReview(request)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Review
                        </Button>
                        {request.status === 'pending' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-green-600 hover:bg-green-50"
                              onClick={() => {
                                setSelectedUser(request)
                                handleApprove()
                              }}
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => {
                                setSelectedUser(request)
                                handleReject()
                              }}
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </>
                        )}
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
              Identity Verification
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-600">
              {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-3">
            {selectedUser && (
              <div className="space-y-4">
                {/* User Information Section */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-900">User Details</h3>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-gray-500">Name</span>
                        <p className="text-sm font-medium text-gray-900">{selectedUser.name}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">User Type</span>
                        <Badge variant="outline" className="text-xs">{selectedUser.userType}</Badge>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Email</span>
                        <p className="text-sm text-gray-900 truncate">{selectedUser.email}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Submitted</span>
                        <p className="text-sm text-gray-900">{selectedUser.submittedAt}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Document Section */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-900">Government ID</h3>
                  {selectedUser.governmentId ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Shield className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-blue-900">Document Uploaded</p>
                            <p className="text-xs text-blue-600 truncate max-w-[200px]">
                              {selectedUser.governmentId.filename || 'Government ID'}
                            </p>
                            {selectedUser.governmentId.size && (
                              <p className="text-xs text-blue-500">
                                {(selectedUser.governmentId.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-xs h-8"
                          onClick={() => {
                            if (selectedUser.governmentId?.url) {
                              window.open(selectedUser.governmentId.url, '_blank')
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
                          <Shield className="h-3 w-3 text-amber-600" />
                        </div>
                        <p className="text-xs text-amber-800">No government ID uploaded</p>
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
                onClick={() => setIsReviewDialogOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleReject}
                className="text-xs text-red-600 border-red-300 hover:bg-red-50"
              >
                <XCircle className="h-3 w-3 mr-1" />
                Reject
              </Button>
              <Button 
                size="sm"
                onClick={handleApprove}
                className="text-xs bg-gray-900 text-white hover:bg-gray-800"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Approve
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
