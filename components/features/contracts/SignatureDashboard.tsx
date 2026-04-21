'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SignatureViewer from '@/components/shared/SignatureViewer'
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  FileText,
  Users,
  X
} from 'lucide-react'
import { format } from 'date-fns'
import { SIGNATURE_STATUSES, SIGNATURE_STATUS_DESCRIPTIONS } from '@/utils/constants/signatures'
import { SignatureWithUser } from '@/server/database/schemas/signatures'

interface SignatureDashboardProps {
  userId?: string
  documentId?: string
  documentType?: string
  className?: string
}

interface SignatureFilters {
  status: string
  signerRole: string
  dateRange: string
  search: string
}

export function SignatureDashboard({
  userId,
  documentId,
  documentType,
  className = ''
}: SignatureDashboardProps) {
  const [signatures, setSignatures] = useState<SignatureWithUser[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<SignatureFilters>({
    status: 'all',
    signerRole: 'all',
    dateRange: 'all',
    search: ''
  })
  const [selectedSignature, setSelectedSignature] = useState<SignatureWithUser | null>(null)
  const [showSignatureViewer, setShowSignatureViewer] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    signed: 0,
    verified: 0,
    rejected: 0,
    expired: 0
  })

  // Load signatures
  useEffect(() => {
    loadSignatures()
  }, [userId, documentId, documentType, filters])

  const loadSignatures = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (userId) params.append('user_id', userId)
      if (documentId) params.append('document_id', documentId)
      if (documentType) params.append('document_type', documentType)
      
      const response = await fetch(`/api/signatures?${params.toString()}`)
      const data = await response.json()
      
      if (response.ok) {
        setSignatures(data.signatures || [])
        calculateStats(data.signatures || [])
      } else {
        console.error('Error loading signatures:', data.error)
      }
    } catch (error) {
      console.error('Error loading signatures:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (signatureList: SignatureWithUser[]) => {
    const newStats = {
      total: signatureList.length,
      pending: 0,
      signed: 0,
      verified: 0,
      rejected: 0,
      expired: 0
    }

    signatureList.forEach(signature => {
      switch (signature.status) {
        case SIGNATURE_STATUSES.PENDING:
          newStats.pending++
          break
        case SIGNATURE_STATUSES.SIGNED:
          newStats.signed++
          break
        case SIGNATURE_STATUSES.VERIFIED:
          newStats.verified++
          break
        case SIGNATURE_STATUSES.REJECTED:
          newStats.rejected++
          break
        case SIGNATURE_STATUSES.EXPIRED:
          newStats.expired++
          break
      }
    })

    setStats(newStats)
  }

  const filteredSignatures = signatures.filter(signature => {
    if (filters.status !== 'all' && signature.status !== filters.status) return false
    if (filters.signerRole !== 'all' && signature.signer_role !== filters.signerRole) return false
    if (filters.search && !signature.signer_name.toLowerCase().includes(filters.search.toLowerCase())) return false
    
    if (filters.dateRange !== 'all') {
      const signatureDate = new Date(signature.created_at)
      const now = new Date()
      const daysDiff = Math.floor((now.getTime() - signatureDate.getTime()) / (1000 * 60 * 60 * 24))
      
      switch (filters.dateRange) {
        case 'today':
          if (daysDiff !== 0) return false
          break
        case 'week':
          if (daysDiff > 7) return false
          break
        case 'month':
          if (daysDiff > 30) return false
          break
      }
    }
    
    return true
  })

  const handleViewSignature = (signature: SignatureWithUser) => {
    setSelectedSignature(signature)
    setShowSignatureViewer(true)
  }

  const handleDownloadSignature = (signature: SignatureWithUser) => {
    const link = document.createElement('a')
    link.download = `signature-${signature.signer_name}-${signature.id}.png`
    link.href = signature.signature_data
    link.click()
  }

  const handleBulkDownload = () => {
    filteredSignatures.forEach(signature => {
      setTimeout(() => {
        handleDownloadSignature(signature)
      }, 100)
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case SIGNATURE_STATUSES.VERIFIED:
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case SIGNATURE_STATUSES.SIGNED:
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case SIGNATURE_STATUSES.REJECTED:
        return <XCircle className="h-4 w-4 text-red-600" />
      case SIGNATURE_STATUSES.EXPIRED:
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      case SIGNATURE_STATUSES.PENDING:
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case SIGNATURE_STATUSES.VERIFIED:
        return 'bg-green-100 text-green-800'
      case SIGNATURE_STATUSES.SIGNED:
        return 'bg-blue-100 text-blue-800'
      case SIGNATURE_STATUSES.REJECTED:
        return 'bg-red-100 text-red-800'
      case SIGNATURE_STATUSES.EXPIRED:
        return 'bg-orange-100 text-orange-800'
      case SIGNATURE_STATUSES.PENDING:
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={`signature-dashboard ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Signature Management</h2>
            <p className="text-gray-600">Manage and track digital signatures</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleBulkDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download All
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-gray-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-gray-600">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-xs text-gray-600">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.signed}</p>
                  <p className="text-xs text-gray-600">Signed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.verified}</p>
                  <p className="text-xs text-gray-600">Verified</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                  <p className="text-xs text-gray-600">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.expired}</p>
                  <p className="text-xs text-gray-600">Expired</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value={SIGNATURE_STATUSES.PENDING}>Pending</SelectItem>
                    <SelectItem value={SIGNATURE_STATUSES.SIGNED}>Signed</SelectItem>
                    <SelectItem value={SIGNATURE_STATUSES.VERIFIED}>Verified</SelectItem>
                    <SelectItem value={SIGNATURE_STATUSES.REJECTED}>Rejected</SelectItem>
                    <SelectItem value={SIGNATURE_STATUSES.EXPIRED}>Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Role</label>
                <Select value={filters.signerRole} onValueChange={(value) => setFilters(prev => ({ ...prev, signerRole: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                    <SelectItem value="homeowner">Homeowner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="witness">Witness</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Date Range</label>
                <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signatures List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Signatures ({filteredSignatures.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              </div>
            ) : filteredSignatures.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No signatures found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSignatures.map((signature) => (
                  <div key={signature.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(signature.status)}
                          <Badge className={getStatusColor(signature.status)}>
                            {signature.status.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold">{signature.signer_name}</h4>
                          <p className="text-sm text-gray-600">
                            {signature.signer_role && (
                              <span className="capitalize">{signature.signer_role} • </span>
                            )}
                            {format(new Date(signature.created_at), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewSignature(signature)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadSignature(signature)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Signature Viewer Modal */}
      {selectedSignature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Signature Details</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSignatureViewer(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <SignatureViewer signature={selectedSignature} showDetails={true} />
          </div>
        </div>
      )}
    </div>
  )
}

export default SignatureDashboard
