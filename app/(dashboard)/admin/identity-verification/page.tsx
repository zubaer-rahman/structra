'use client'

import { useState, useMemo } from 'react'
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
import { trpc } from '@/utils/trpc'
import toast from 'react-hot-toast'
import { LoadingSpinner } from '@/components/shared'

interface VerificationRequest {
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
    uploadedAt?: Date | string
  } | null
  priority: string
}

export default function IdentityVerificationPage() {
  const [selectedUser, setSelectedUser] = useState<VerificationRequest | null>(null)
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const { data: rawRequests, isLoading, refetch } = trpc.admin.getIdentityVerifications.useQuery()
  const approveMutation = trpc.admin.approveIdentityVerification.useMutation()
  const rejectMutation = trpc.admin.rejectIdentityVerification.useMutation()
  const loading = isLoading

  const verificationRequests: VerificationRequest[] = useMemo(() => {
    return (rawRequests || []).map((user: any) => {
      let governmentId = user.government_id
      if (typeof governmentId === 'string') {
        try {
          governmentId = JSON.parse(governmentId)
        } catch {}
      }

      const submittedAt = governmentId?.uploadedAt
        ? new Date(governmentId.uploadedAt).toLocaleDateString()
        : user.created_at
        ? new Date(user.created_at).toLocaleDateString()
        : 'N/A'

      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim()

      return {
        id: user.id,
        name: fullName || user.email,
        email: user.email,
        userType: user.user_role === 'contractor' ? 'Contractor' : 'Homeowner',
        submittedAt,
        status: user.government_id_verified ? 'approved' : 'pending',
        governmentId,
        priority: 'medium',
      }
    })
  }, [rawRequests])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50">Pending</Badge>
      case 'approved':
        return <Badge className="bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-400 border-green-200 dark:border-green-900/50">Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-400 border-red-200 dark:border-red-900/50">Rejected</Badge>
      default:
        return <Badge className="bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-zinc-700">{status}</Badge>
    }
  }

  const handleReview = (user: VerificationRequest) => {
    setSelectedUser(user)
    setIsReviewDialogOpen(true)
  }

  const handleApprove = async () => {
    if (!selectedUser) return

    try {
      await approveMutation.mutateAsync({ userId: selectedUser.id })
      toast.success('Government ID verified successfully')
      await refetch()
      setIsReviewDialogOpen(false)
    } catch (error: any) {
      console.error('Error approving verification:', error)
      toast.error(error?.message || 'Failed to approve verification')
    }
  }

  const handleReject = async () => {
    if (!selectedUser) return

    try {
      await rejectMutation.mutateAsync({ userId: selectedUser.id })
      toast.success('Government ID rejected and removed')
      await refetch()
      setIsReviewDialogOpen(false)
    } catch (error: any) {
      console.error('Error rejecting verification:', error)
      toast.error(error?.message || 'Failed to reject verification')
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Identity Verification</h1>
          <p className="text-gray-600 dark:text-gray-400">Review and verify user identity documents</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{verificationRequests.filter(r => r.status === 'pending').length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{verificationRequests.filter(r => r.status === 'approved').length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{verificationRequests.filter(r => r.status === 'rejected').length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{verificationRequests.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
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
              className="px-3 py-2 border border-gray-300 dark:border-zinc-800 rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <TableRow className="bg-gray-50 dark:bg-zinc-900/50">
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
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No verification requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => (
                  <TableRow key={request.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-gray-200 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{request.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{request.email}</p>
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
                          <ImageIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">Uploaded</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500">Not uploaded</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
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
                              className="text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 border-green-200 dark:border-green-900/50"
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
                              className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50"
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
          <DialogHeader className="flex-shrink-0 border-b dark:border-zinc-800 pb-3">
            <DialogTitle className="text-base font-semibold text-gray-900 dark:text-white">
              Identity Verification
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-600 dark:text-gray-400">
              {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-3">
            {selectedUser && (
              <div className="space-y-4">
                {/* User Information Section */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">User Details</h3>
                  <div className="bg-gray-50 dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800 rounded-lg p-3 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Name</span>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedUser.name}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">User Type</span>
                        <Badge variant="outline" className="text-xs">{selectedUser.userType}</Badge>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Email</span>
                        <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{selectedUser.email}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Submitted</span>
                        <p className="text-sm text-gray-900 dark:text-gray-100">{selectedUser.submittedAt}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Document Section */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Government ID</h3>
                  {selectedUser.governmentId ? (
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                            <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Document Uploaded</p>
                            <p className="text-xs text-blue-600 dark:text-blue-300 truncate max-w-[200px]">
                              {selectedUser.governmentId.filename || 'Government ID'}
                            </p>
                            {selectedUser.governmentId.size && (
                              <p className="text-xs text-blue-500 dark:text-blue-400">
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
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg p-3">
                      <div className="text-center">
                        <div className="w-6 h-6 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <Shield className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                        </div>
                        <p className="text-xs text-amber-800 dark:text-amber-300">No government ID uploaded</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-shrink-0 border-t dark:border-zinc-800 pt-3">
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
                className="text-xs text-red-600 dark:text-red-400 border-red-300 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <XCircle className="h-3 w-3 mr-1" />
                Reject
              </Button>
              <Button 
                size="sm"
                onClick={handleApprove}
                className="text-xs bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
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
