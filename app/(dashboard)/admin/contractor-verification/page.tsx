'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AdminVerificationBadge } from '@/components/shared/AdminVerificationBadge'
import { 
  Wrench, 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Building,
  Shield
} from 'lucide-react'
import { trpc } from '@/utils/trpc'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { LoadingSpinner } from '@/components/shared'

interface ContractorProfile {
  id: string
  user_id: string
  business_name: string
  bio?: string
  gst_hst_number?: string
  wcb_number?: string
  insurance_general_liability?: number
  insurance_builders_risk?: number
  insurance_expiry?: string
  insurance_upload?: string | {
    id: string
    filename: string
    url: string
    size?: number
    mimeType?: string
    uploadedAt?: string
  }
  gst_hst_clearance_document?: {
    id: string
    filename: string
    url: string
    size?: number
    mimeType?: string
    uploadedAt?: string
  }
  wcb_clearance_document?: {
    id: string
    filename: string
    url: string
    size?: number
    mimeType?: string
    uploadedAt?: string
  }
  is_admin_verified: boolean
  admin_verification_date?: string
  is_insurance_verified: boolean
  trade_category: string[]
  service_location?: string
  created_at: string
  updated_at: string
  user: {
    id: string
    full_name: string
    first_name: string
    last_name: string
    email: string
    phone_number?: string
    address?: string
    user_role: string
    is_verified_contractor: boolean
    government_id?: {
      id: string
      filename: string
      url: string
      size?: number
      mimeType?: string
      uploadedAt?: string
    } | null
    government_id_verified: boolean
    created_at: string
  }
}

export default function ContractorVerificationPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'unverified'>('all')

  // Fetch contractors for verification
  const { data: contractors, isLoading, refetch } = trpc.users.getContractorsForVerification.useQuery({
    limit: 50,
    offset: 0,
    status: statusFilter
  })

  // Debug: Log contractors data when it changes
  useEffect(() => {
    if (contractors) {
      console.log('Contractors data received:', contractors)
      contractors.forEach((contractor, index) => {
        console.log(`Contractor ${index}:`, {
          id: contractor.id,
          business_name: contractor.business_name,
          gst_hst_clearance_document: contractor.gst_hst_clearance_document,
          wcb_clearance_document: contractor.wcb_clearance_document,
          is_admin_verified: contractor.is_admin_verified
        })
      })
    }
  }, [contractors])


  const handleReview = (contractor: ContractorProfile) => {
    // Navigate to the detail page instead of opening modal
    window.location.href = `/admin/contractor-verification/${contractor.id}`
  }

  const filteredContractors = contractors?.filter(contractor => {
    const matchesSearch = contractor.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contractor.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contractor.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  }) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contractor Verification</h1>
          <p className="text-gray-600">Review and approve contractor applications</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{contractors?.filter(c => !c.is_admin_verified).length || 0}</p>
                <p className="text-sm text-gray-600">Pending Verification</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{contractors?.filter(c => c.is_admin_verified).length || 0}</p>
                <p className="text-sm text-gray-600">Admin Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{contractors?.filter(c => c.user.is_verified_contractor).length || 0}</p>
                <p className="text-sm text-gray-600">Payment Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Wrench className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{contractors?.length || 0}</p>
                <p className="text-sm text-gray-600">Total Contractors</p>
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
                  placeholder="Search by name, business, or email..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'verified' | 'unverified')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending Verification</option>
              <option value="verified">Admin Verified</option>
              <option value="unverified">Not Verified</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Contractor Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contractor Verification Requests</CardTitle>
          <CardDescription>Review and verify contractor applications with government ID, GST/HST and WCB clearance documents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Contractor</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Trade Category</TableHead>
                  <TableHead>GST/HST Number</TableHead>
                  <TableHead>WCB Number</TableHead>
                  <TableHead>Government ID</TableHead>
                  <TableHead>Admin Status</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <LoadingSpinner 
                        text="Loading contractors..."
                        size="md"
                        variant="default"
                        className="justify-center"
                      />
                    </TableCell>
                  </TableRow>
                ) : filteredContractors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      No contractors found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContractors.map((contractor) => (
                    <TableRow key={contractor.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <Wrench className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium">{contractor.user.full_name}</p>
                            <p className="text-sm text-gray-600">{contractor.user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{contractor.business_name}</span>
                        </div>
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
                        <div className="text-sm">
                          {contractor.gst_hst_number ? (
                            <span className="text-green-600 font-medium">{contractor.gst_hst_number}</span>
                          ) : (
                            <span className="text-gray-400">Not provided</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {contractor.wcb_number ? (
                            <span className="text-green-600 font-medium">{contractor.wcb_number}</span>
                          ) : (
                            <span className="text-gray-400">Not provided</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          {contractor.user.government_id ? (
                            contractor.user.government_id_verified ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-yellow-500" />
                            )
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          {contractor.is_admin_verified ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {contractor.user.is_verified_contractor ? (
                          <Badge className="bg-blue-100 text-blue-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Payment Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending Payment
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleReview(contractor)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Review
                          </Button>
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

    </div>
  )
}
