'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Wrench, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin,
  Star,
  FileText,
  Filter,
  Building,
  Shield,
  Upload,
  Download,
  AlertCircle,
  ArrowLeft,
  Trash2
} from 'lucide-react'
import { trpc } from '@/utils/trpc'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'

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
  insurance_certificate?: {
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

export default function ContractorVerificationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const contractorId = params.id as string
  
  const [contractor, setContractor] = useState<ContractorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [gstHstFile, setGstHstFile] = useState<File | null>(null)
  const [wcbFile, setWcbFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [insuranceGeneralLiability, setInsuranceGeneralLiability] = useState<number>(0)
  const [insuranceBuildersRisk, setInsuranceBuildersRisk] = useState<number>(0)
  const [insuranceExpiry, setInsuranceExpiry] = useState<string>('')
  const [adminEditingInsurance, setAdminEditingInsurance] = useState(false)
  const [tempGeneralLiability, setTempGeneralLiability] = useState<number>(0)
  const [tempBuildersRisk, setTempBuildersRisk] = useState<number>(0)
  const [tempInsuranceExpiry, setTempInsuranceExpiry] = useState<string>('')
  const [savingInsurance, setSavingInsurance] = useState(false)

  // Fetch contractor details
  const { data: contractors, isLoading, refetch } = trpc.users.getContractorsForVerification.useQuery({
    limit: 100,
    offset: 0,
    status: 'all'
  })

  useEffect(() => {
    if (contractors && contractorId) {
      const foundContractor = contractors.find(c => c.id === contractorId)
      if (foundContractor) {
        setContractor(foundContractor)
        setInsuranceGeneralLiability(foundContractor.insurance_general_liability || 0)
        setInsuranceBuildersRisk(foundContractor.insurance_builders_risk || 0)
        setInsuranceExpiry(foundContractor.insurance_expiry || '')
      }
      setLoading(false)
    }
  }, [contractors, contractorId])

  const uploadFileToSupabase = async (file: File, type: 'gst_hst' | 'wcb' | 'insurance_certificate') => {
    if (!contractor) return null

    const supabase = createClient()
    
    // Upload file to Supabase storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${contractor.user_id}_${type}_clearance_${Date.now()}.${fileExt}`
    const filePath = `documents/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('structra-files')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      throw uploadError
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('structra-files')
      .getPublicUrl(filePath)

    // Create file reference
    return {
      id: crypto.randomUUID(),
      filename: file.name,
      url: publicUrl,
      size: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString()
    }
  }

  const handleVerifyContractor = async () => {
    if (!contractor) return

    // Check if all required documents are provided (either already uploaded or being uploaded now)
    const hasGstHstDocument = contractor.gst_hst_clearance_document || gstHstFile
    const hasWcbDocument = contractor.wcb_clearance_document || wcbFile
    const hasGovernmentId = contractor.user.government_id

    if (!hasGstHstDocument || !hasWcbDocument) {
      toast.error('Both GST/HST and WCB clearance documents must be uploaded before verification')
      return
    }

    if (!hasGovernmentId) {
      toast.error('Government ID must be uploaded before verification')
      return
    }

    setUploading(true)
    try {
      const supabase = createClient()
      
      // Prepare update data
      const updateData: {
        is_admin_verified: boolean;
        admin_verification_date: string;
        insurance_general_liability?: number;
        insurance_builders_risk?: number;
        insurance_expiry?: string;
        is_insurance_verified?: boolean;
        gst_hst_clearance_document?: {
          id: string;
          filename: string;
          url: string;
          size?: number;
          mimeType?: string;
          uploadedAt?: string;
        };
        wcb_clearance_document?: {
          id: string;
          filename: string;
          url: string;
          size?: number;
          mimeType?: string;
          uploadedAt?: string;
        };
        insurance_certificate?: {
          id: string;
          filename: string;
          url: string;
          size?: number;
          mimeType?: string;
          uploadedAt?: string;
        };
      } = {
        is_admin_verified: true,
        admin_verification_date: new Date().toISOString(),
        insurance_general_liability: insuranceGeneralLiability,
        insurance_builders_risk: insuranceBuildersRisk,
        // Only mark insurance as verified if there's an insurance document and amounts are set
        is_insurance_verified: Boolean(contractor.insurance_upload && 
          (insuranceGeneralLiability > 0 || insuranceBuildersRisk > 0))
      }

      // If insurance is being verified, preserve the user-entered expiry date
      if (updateData.is_insurance_verified) {
        const hasInsuranceDocument = contractor.insurance_upload && contractor.insurance_upload !== '';
        if (hasInsuranceDocument) {
          // Use the user-entered expiry date instead of overriding it
          updateData.insurance_expiry = insuranceExpiry || undefined;
        } else {
          updateData.insurance_expiry = undefined;
        }
      }

      // Upload files if they are selected
      if (gstHstFile) {
        console.log('Uploading GST/HST document...')
        const gstHstDocument = await uploadFileToSupabase(gstHstFile, 'gst_hst')
        if (gstHstDocument) {
          updateData.gst_hst_clearance_document = gstHstDocument
        }
      }

      if (wcbFile) {
        console.log('Uploading WCB document...')
        const wcbDocument = await uploadFileToSupabase(wcbFile, 'wcb')
        if (wcbDocument) {
          updateData.wcb_clearance_document = wcbDocument
        }
      }


      // Update contractor profile
      const { error } = await supabase
        .from('contractor_profiles')
        .update(updateData)
        .eq('user_id', contractor.user_id)

      if (error) {
        console.error('Error verifying contractor:', error)
        throw error
      }

      // Update user government ID verification status
      const { error: userError } = await supabase
        .from('users')
        .update({ government_id_verified: true })
        .eq('id', contractor.user_id)

      if (userError) {
        console.error('Error updating user government ID verification:', userError)
        throw userError
      }

      const successMessage = updateData.is_insurance_verified 
        ? updateData.insurance_expiry 
          ? `Contractor verified successfully. Insurance expiry preserved as ${updateData.insurance_expiry}`
          : 'Contractor verified successfully (insurance verified but no document uploaded)'
        : 'Contractor verified successfully'
      toast.success(successMessage)
      refetch()
      router.push('/admin/contractor-verification')
    } catch (error) {
      console.error('Error verifying contractor:', error)
      toast.error('Failed to verify contractor')
    } finally {
      setUploading(false)
    }
  }

  const handleVerifyInsurance = async () => {
    if (!contractor) return

    // Check if contractor has uploaded an insurance document
    if (!contractor.insurance_upload || contractor.insurance_upload === '') {
      toast.error('Contractor must upload an insurance document before verification')
      return
    }

    setUploading(true)
    try {
      const supabase = createClient()
      
      // Use the user-entered insurance expiry date instead of overriding it
      const hasInsuranceDocument = contractor.insurance_upload && contractor.insurance_upload !== '';
      const userInsuranceExpiry = hasInsuranceDocument ? insuranceExpiry : null;
      
      // Prepare update data
      const updateData: {
        insurance_general_liability: number;
        insurance_builders_risk: number;
        insurance_expiry: string | null;
        is_insurance_verified: boolean;
        updated_at: string;
        insurance_certificate?: {
          id: string;
          filename: string;
          url: string;
          size?: number;
          mimeType?: string;
          uploadedAt?: string;
        };
      } = {
        insurance_general_liability: insuranceGeneralLiability,
        insurance_builders_risk: insuranceBuildersRisk,
        insurance_expiry: userInsuranceExpiry,
        is_insurance_verified: true,
        updated_at: new Date().toISOString()
      }

      
      console.log('Updating contractor profile with data:', updateData)
      const { error } = await supabase
        .from('contractor_profiles')
        .update(updateData)
        .eq('user_id', contractor.user_id)

      if (error) {
        console.error('Error verifying insurance:', error)
        throw error
      }

      console.log('Insurance verification successful')
      const successMessage = userInsuranceExpiry 
        ? `Insurance verified successfully. Expiry date preserved as ${userInsuranceExpiry}`
        : 'Insurance verified successfully (no document uploaded)'
      toast.success(successMessage)
      refetch()
      // Update local state
      setContractor(prev => prev ? { 
        ...prev, 
        is_insurance_verified: true,
        insurance_certificate: updateData.insurance_certificate || prev.insurance_certificate
      } : null)
    } catch (error) {
      console.error('Error verifying insurance:', error)
      toast.error('Failed to verify insurance')
    } finally {
      setUploading(false)
    }
  }

  const handleRejectContractor = async () => {
    if (!contractor) return

    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('contractor_profiles')
        .update({
          is_admin_verified: false,
          admin_verification_date: null
        })
        .eq('user_id', contractor.user_id)

      if (error) {
        console.error('Error rejecting contractor:', error)
        throw error
      }

      toast.success('Contractor verification rejected')
      refetch()
      router.push('/admin/contractor-verification')
    } catch (error) {
      console.error('Error rejecting contractor:', error)
      toast.error('Failed to reject contractor')
    }
  }

  // Admin insurance editing functions
  const handleAdminEditInsurance = () => {
    setAdminEditingInsurance(true)
    setTempGeneralLiability(insuranceGeneralLiability)
    setTempBuildersRisk(insuranceBuildersRisk)
    setTempInsuranceExpiry(insuranceExpiry)
  }

  const handleAdminCancelInsurance = () => {
    setAdminEditingInsurance(false)
    setTempGeneralLiability(insuranceGeneralLiability)
    setTempBuildersRisk(insuranceBuildersRisk)
    setTempInsuranceExpiry(insuranceExpiry)
  }

  const handleAdminSaveInsurance = async () => {
    if (!contractor) return

    setSavingInsurance(true)
    try {
      const supabase = createClient()
      
      // Prepare update data
      const updateData: {
        insurance_general_liability: number;
        insurance_builders_risk: number;
        insurance_expiry: string | null;
        updated_at: string;
        insurance_certificate?: {
          id: string;
          filename: string;
          url: string;
          size?: number;
          mimeType?: string;
          uploadedAt?: string;
        };
      } = {
        insurance_general_liability: tempGeneralLiability,
        insurance_builders_risk: tempBuildersRisk,
        insurance_expiry: tempInsuranceExpiry || null,
        updated_at: new Date().toISOString()
      }

      
      // Update insurance amounts, expiry, and certificate
      const { error } = await supabase
        .from('contractor_profiles')
        .update(updateData)
        .eq('user_id', contractor.user_id)

      if (error) {
        console.error('Error updating insurance amounts:', error)
        throw error
      }

      // Update local state
      setInsuranceGeneralLiability(tempGeneralLiability)
      setInsuranceBuildersRisk(tempBuildersRisk)
      setInsuranceExpiry(tempInsuranceExpiry)
      setContractor(prev => prev ? { 
        ...prev, 
        insurance_general_liability: tempGeneralLiability,
        insurance_builders_risk: tempBuildersRisk,
        insurance_expiry: tempInsuranceExpiry,
        insurance_certificate: updateData.insurance_certificate || prev.insurance_certificate
      } : null)


      toast.success('Insurance details updated successfully')
      setAdminEditingInsurance(false)
    } catch (error) {
      console.error('Error updating insurance amounts:', error)
      toast.error('Failed to update insurance details')
    } finally {
      setSavingInsurance(false)
    }
  }

  const handleRejectInsurance = async () => {
    if (!contractor) return

    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('contractor_profiles')
        .update({ 
          is_insurance_verified: false,
          insurance_upload: null,
          insurance_general_liability: 0,
          insurance_builders_risk: 0,
          insurance_expiry: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', contractor.user_id)

      if (error) {
        console.error('Error rejecting insurance:', error)
        throw error
      }

      toast.success('Insurance verification rejected and document removed. Contractor can upload a new one.')
      refetch()
      
      // Update local state
      setContractor(prev => prev ? { 
        ...prev, 
        is_insurance_verified: false,
        insurance_upload: undefined,
        insurance_general_liability: 0,
        insurance_builders_risk: 0,
        insurance_expiry: undefined
      } : null)
      
      // Reset local state
      setInsuranceGeneralLiability(0)
      setInsuranceBuildersRisk(0)
      setInsuranceExpiry('')
    } catch (error) {
      console.error('Error rejecting insurance:', error)
      toast.error('Failed to reject insurance verification')
    }
  }

  const handleDeleteGstHstDocument = async () => {
    if (!contractor || !contractor.gst_hst_clearance_document) return

    if (!confirm('Are you sure you want to delete the GST/HST clearance document? This action cannot be undone.')) {
      return
    }

    try {
      const supabase = createClient()
      
      // Delete from database
      const { error } = await supabase
        .from('contractor_profiles')
        .update({ 
          gst_hst_clearance_document: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', contractor.user_id)

      if (error) {
        console.error('Error deleting GST/HST document:', error)
        throw error
      }

      toast.success('GST/HST clearance document deleted successfully')
      refetch()
      
      // Update local state
      setContractor(prev => prev ? { 
        ...prev, 
        gst_hst_clearance_document: undefined
      } : null)
    } catch (error) {
      console.error('Error deleting GST/HST document:', error)
      toast.error('Failed to delete GST/HST clearance document')
    }
  }

  const handleDeleteWcbDocument = async () => {
    if (!contractor || !contractor.wcb_clearance_document) return

    if (!confirm('Are you sure you want to delete the WCB clearance document? This action cannot be undone.')) {
      return
    }

    try {
      const supabase = createClient()
      
      // Delete from database
      const { error } = await supabase
        .from('contractor_profiles')
        .update({ 
          wcb_clearance_document: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', contractor.user_id)

      if (error) {
        console.error('Error deleting WCB document:', error)
        throw error
      }

      toast.success('WCB clearance document deleted successfully')
      refetch()
      
      // Update local state
      setContractor(prev => prev ? { 
        ...prev, 
        wcb_clearance_document: undefined
      } : null)
    } catch (error) {
      console.error('Error deleting WCB document:', error)
      toast.error('Failed to delete WCB clearance document')
    }
  }



  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 animate-spin" />
          <span>Loading contractor details...</span>
        </div>
      </div>
    )
  }

  if (!contractor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Contractor Not Found</h1>
          <p className="text-gray-600 mb-4">The contractor you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push('/admin/contractor-verification')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contractor List
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin/contractor-verification')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contractor Verification</h1>
            <p className="text-gray-600">Review and verify contractor application</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contractor Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contractor Information</CardTitle>
            <CardDescription>Basic contractor details and contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                <Wrench className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <h3 className="font-medium">{contractor.user.full_name}</h3>
                <p className="text-sm text-gray-600">{contractor.user.email}</p>
              </div>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Business Name:</span>
                <span>{contractor.business_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Phone:</span>
                <span>{contractor.user.phone_number || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Trade Categories:</span>
                <div className="flex flex-wrap gap-1">
                  {contractor.trade_category.map((category, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Service Location:</span>
                <span>{contractor.service_location || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">GST/HST Number:</span>
                <span className={contractor.gst_hst_number ? 'text-green-600 font-medium' : 'text-gray-400'}>
                  {contractor.gst_hst_number || 'Not provided'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">WCB Number:</span>
                <span className={contractor.wcb_number ? 'text-green-600 font-medium' : 'text-gray-400'}>
                  {contractor.wcb_number || 'Not provided'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Government ID:</span>
                <span className={contractor.user.government_id ? 'text-green-600 font-medium' : 'text-gray-400'}>
                  {contractor.user.government_id ? 'Uploaded' : 'Not uploaded'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">ID Verification:</span>
                <Badge className={contractor.user.government_id_verified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                  {contractor.user.government_id_verified ? 'Verified' : 'Pending'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insurance Information */}
        <Card>
          <CardHeader>
            <CardTitle>Insurance Information</CardTitle>
            <CardDescription>Insurance coverage details and verification status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">General Liability:</span>
                <span className={contractor.insurance_general_liability ? 'text-green-600 font-medium' : 'text-gray-400'}>
                  {contractor.insurance_general_liability ? `$${contractor.insurance_general_liability.toLocaleString()} CAD` : 'Not provided'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Builders Risk:</span>
                <span className={contractor.insurance_builders_risk ? 'text-green-600 font-medium' : 'text-gray-400'}>
                  {contractor.insurance_builders_risk ? `$${contractor.insurance_builders_risk.toLocaleString()} CAD` : 'Not provided'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Insurance Expiry:</span>
                <span className={contractor.insurance_expiry ? 'text-green-600 font-medium' : 'text-gray-400'}>
                  {contractor.insurance_expiry ? new Date(contractor.insurance_expiry).toLocaleDateString() : 'Not provided'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Insurance Document:</span>
                <span className={contractor.insurance_upload ? 'text-green-600 font-medium' : 'text-gray-400'}>
                  {contractor.insurance_upload ? 'Uploaded' : 'Not uploaded'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Insurance Status:</span>
                <Badge className={contractor.is_insurance_verified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                  {contractor.is_insurance_verified ? 'Verified' : 'Pending'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insurance Verification Section - Only show if insurance document is uploaded */}
      {contractor.insurance_upload ? (
        <Card>
          <CardHeader>
            <CardTitle>Insurance Verification</CardTitle>
            <CardDescription>Review and verify insurance coverage amounts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Instructions:</strong> Review the contractor&apos;s insurance document and verify the coverage amounts. Update the amounts if needed to match the policy, then mark insurance as verified. No additional file upload is required.
              </p>
            </div>
            
            {/* Insurance Verification Info */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <div>
                  <h5 className="text-sm font-medium text-blue-800">Insurance Verification</h5>
                  <p className="text-sm text-blue-700">
                    You can verify insurance coverage by reviewing the contractor&apos;s uploaded document and confirming the coverage amounts. No additional file upload is required from admin.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Insurance Document Display */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Insurance Certificate</span>
                <Badge className={contractor.is_insurance_verified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                  {contractor.is_insurance_verified ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Pending Verification
                    </>
                  )}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const url = typeof contractor.insurance_upload === 'string' 
                      ? contractor.insurance_upload 
                      : contractor.insurance_upload?.url;
                    if (url) {
                      try {
                        const response = await fetch(url);
                        const blob = await response.blob();
                        const blobUrl = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = blobUrl;
                        link.download = typeof contractor.insurance_upload === 'string' 
                          ? 'insurance-certificate.pdf' 
                          : contractor.insurance_upload?.filename || 'insurance-certificate.pdf';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(blobUrl);
                      } catch (error) {
                        console.error('Download failed:', error);
                        // Fallback to direct link
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = typeof contractor.insurance_upload === 'string' 
                          ? 'insurance-certificate.pdf' 
                          : contractor.insurance_upload?.filename || 'insurance-certificate.pdf';
                        link.target = '_blank';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }
                    }
                  }}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download Insurance Certificate
                </Button>
              </div>
            </div>
            
            {/* Admin Edit Controls - Only show if contractor has uploaded insurance document */}
            {contractor.is_insurance_verified && !adminEditingInsurance && contractor.insurance_upload && (
              <div className="flex justify-end mb-4">
                <Button
                  onClick={handleAdminEditInsurance}
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Edit Insurance Details
                </Button>
              </div>
            )}

            {/* Insurance Amounts Editing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  General Liability (CAD)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={adminEditingInsurance ? tempGeneralLiability : insuranceGeneralLiability}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    if (adminEditingInsurance) {
                      setTempGeneralLiability(value);
                    } else {
                      setInsuranceGeneralLiability(value);
                    }
                  }}
                  placeholder="Enter coverage amount"
                  className="w-full"
                  disabled={contractor.is_insurance_verified && !adminEditingInsurance}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Builders Risk (CAD)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={adminEditingInsurance ? tempBuildersRisk : insuranceBuildersRisk}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    if (adminEditingInsurance) {
                      setTempBuildersRisk(value);
                    } else {
                      setInsuranceBuildersRisk(value);
                    }
                  }}
                  placeholder="Enter coverage amount"
                  className="w-full"
                  disabled={contractor.is_insurance_verified && !adminEditingInsurance}
                />
              </div>
            </div>

            {/* Insurance Expiry Date */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Insurance Expiry Date
              </label>
              <Input
                type="date"
                value={adminEditingInsurance ? tempInsuranceExpiry : insuranceExpiry}
                onChange={(e) => {
                  if (adminEditingInsurance) {
                    setTempInsuranceExpiry(e.target.value);
                  } else {
                    setInsuranceExpiry(e.target.value);
                  }
                }}
                className="w-full"
                disabled={contractor.is_insurance_verified && !adminEditingInsurance}
              />
            </div>

            
            {/* Insurance Verification Status */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-sm font-medium text-gray-700">Insurance Verification Status</h5>
                  <p className="text-xs text-gray-500">
                    {contractor.is_insurance_verified 
                      ? adminEditingInsurance 
                        ? 'Editing insurance amounts - changes will be saved when you click Save Changes'
                        : contractor.insurance_upload
                          ? 'Insurance has been verified. You can edit amounts using the Edit button above.'
                          : 'Insurance has been verified but no document was uploaded by contractor.'
                      : 'Insurance verification is pending admin review'
                    }
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-700">
                    {contractor.is_insurance_verified ? 'Verified' : 'Pending'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {contractor.is_insurance_verified && contractor.admin_verification_date
                      ? `Verified on ${new Date(contractor.admin_verification_date).toLocaleDateString()}`
                      : 'Not yet verified'
                    }
                  </div>
                </div>
              </div>
            </div>
            

            {/* Admin Save/Cancel Buttons - Only show when editing */}
            {adminEditingInsurance && (
              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  onClick={handleAdminCancelInsurance}
                  variant="outline"
                  size="sm"
                  disabled={savingInsurance}
                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAdminSaveInsurance}
                  size="sm"
                  disabled={savingInsurance}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {savingInsurance ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Insurance Verification Buttons */}
            <div className="flex justify-end space-x-2">
              {contractor.is_insurance_verified ? (
                <Button 
                  onClick={handleRejectInsurance}
                  disabled={uploading}
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  title="Reject Insurance Verification"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Insurance
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={handleRejectInsurance}
                    disabled={uploading}
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    title="Reject Insurance Verification"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Insurance
                  </Button>
                  <Button 
                    onClick={handleVerifyInsurance}
                    disabled={uploading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    title="Verify Insurance Coverage"
                  >
                    {uploading ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Verifying Insurance...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Verify Insurance
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>

          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Insurance Verification</CardTitle>
            <CardDescription>Insurance verification is not available</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-gray-500" />
                <div>
                  <h5 className="text-sm font-medium text-gray-700">No Insurance Document Uploaded</h5>
                  <p className="text-sm text-gray-600">
                    The contractor has not uploaded an insurance document. Insurance verification is not available until a certificate is provided.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Government ID Verification Section */}
      <Card>
        <CardHeader>
          <CardTitle>Government ID Verification</CardTitle>
          <CardDescription>Review and verify contractor's government-issued photo ID</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Instructions:</strong> Review the contractor's government-issued photo ID document. Verify the identity matches the contractor information, then mark as verified.
            </p>
          </div>
          
          {/* Government ID Status */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">Government ID Document:</span>
              <span className={contractor.user.government_id ? 'text-green-600 font-medium' : 'text-gray-400'}>
                {contractor.user.government_id ? 'Uploaded' : 'Not uploaded'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">ID Verification Status:</span>
              <Badge className={contractor.user.government_id_verified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                {contractor.user.government_id_verified ? 'Verified' : 'Pending'}
              </Badge>
            </div>
          </div>

          {/* Government ID Document Display */}
          {contractor.user.government_id ? (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Government ID Document</span>
                <Badge className={contractor.user.government_id_verified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                  {contractor.user.government_id_verified ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Pending Verification
                    </>
                  )}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const url = contractor.user.government_id?.url;
                    if (url) {
                      try {
                        const response = await fetch(url);
                        const blob = await response.blob();
                        const blobUrl = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = blobUrl;
                        link.download = contractor.user.government_id?.filename || 'government-id.pdf';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(blobUrl);
                      } catch (error) {
                        console.error('Download failed:', error);
                        // Fallback to direct link
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = contractor.user.government_id?.filename || 'government-id.pdf';
                        link.target = '_blank';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }
                    }
                  }}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download Government ID
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-gray-500" />
                <div>
                  <h5 className="text-sm font-medium text-gray-700">No Government ID Uploaded</h5>
                  <p className="text-sm text-gray-600">
                    The contractor has not uploaded a government-issued photo ID. Government ID verification is not available until a document is provided.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Government ID Verification Buttons */}
          {contractor.user.government_id && (
            <div className="flex justify-end space-x-2">
              {contractor.user.government_id_verified ? (
                <Button 
                  onClick={async () => {
                    if (!contractor) return
                    setUploading(true)
                    try {
                      const supabase = createClient()
                      const { error } = await supabase
                        .from('users')
                        .update({ government_id_verified: false })
                        .eq('id', contractor.user_id)

                      if (error) throw error
                      toast.success('Government ID verification rejected')
                      refetch()
                    } catch (error) {
                      console.error('Error rejecting government ID verification:', error)
                      toast.error('Failed to reject government ID verification')
                    } finally {
                      setUploading(false)
                    }
                  }}
                  disabled={uploading}
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  title="Reject Government ID Verification"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject ID Verification
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={async () => {
                      if (!contractor) return
                      setUploading(true)
                      try {
                        const supabase = createClient()
                        const { error } = await supabase
                          .from('users')
                          .update({ government_id_verified: false })
                          .eq('id', contractor.user_id)

                        if (error) throw error
                        toast.success('Government ID verification rejected')
                        refetch()
                      } catch (error) {
                        console.error('Error rejecting government ID verification:', error)
                        toast.error('Failed to reject government ID verification')
                      } finally {
                        setUploading(false)
                      }
                    }}
                    disabled={uploading}
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    title="Reject Government ID Verification"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject ID Verification
                  </Button>
                  <Button 
                    onClick={async () => {
                      if (!contractor) return
                      setUploading(true)
                      try {
                        const supabase = createClient()
                        const { error } = await supabase
                          .from('users')
                          .update({ government_id_verified: true })
                          .eq('id', contractor.user_id)

                        if (error) throw error
                        toast.success('Government ID verified successfully')
                        refetch()
                      } catch (error) {
                        console.error('Error verifying government ID:', error)
                        toast.error('Failed to verify government ID')
                      } finally {
                        setUploading(false)
                      }
                    }}
                    disabled={uploading}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    title="Verify Government ID"
                  >
                    {uploading ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Verifying ID...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Verify Government ID
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clearance Documents Section */}
      <Card>
        <CardHeader>
          <CardTitle>Clearance Documents</CardTitle>
          <CardDescription>Upload and manage GST/HST and WCB clearance documents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Instructions:</strong> Government ID, GST/HST, and WCB clearance documents are all required for contractor verification. Upload both clearance documents below, then click &quot;Upload Documents &amp; Verify Contractor&quot; to complete verification, or &quot;Reject Verification&quot; to discard and reject.
            </p>
          </div>
          
          {/* Missing Requirements Warning for Overall Contractor Verification */}
          {(!contractor.gst_hst_number || !contractor.wcb_number || !contractor.user.government_id) && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <h5 className="text-sm font-medium text-yellow-800">Missing Required Information for Contractor Verification</h5>
                  <p className="text-sm text-yellow-700">
                    {!contractor.gst_hst_number && !contractor.wcb_number && !contractor.user.government_id
                      ? 'GST/HST Number, WCB Number, and Government ID must be provided before contractor can be fully verified.'
                      : !contractor.gst_hst_number && !contractor.wcb_number
                      ? 'GST/HST Number and WCB Number must be provided before contractor can be fully verified.'
                      : !contractor.gst_hst_number && !contractor.user.government_id
                      ? 'GST/HST Number and Government ID must be provided before contractor can be fully verified.'
                      : !contractor.wcb_number && !contractor.user.government_id
                      ? 'WCB Number and Government ID must be provided before contractor can be fully verified.'
                      : !contractor.gst_hst_number
                      ? 'GST/HST Number must be provided before contractor can be fully verified.'
                      : !contractor.wcb_number
                      ? 'WCB Number must be provided before contractor can be fully verified.'
                      : 'Government ID must be provided before contractor can be fully verified.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Missing Clearance Documents Warning */}
          {((!contractor.gst_hst_clearance_document && !gstHstFile) || (!contractor.wcb_clearance_document && !wcbFile) || !contractor.user.government_id) && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <h5 className="text-sm font-medium text-red-800">Missing Required Documents</h5>
                  <p className="text-sm text-red-700">
                    {(!contractor.gst_hst_clearance_document && !gstHstFile) && (!contractor.wcb_clearance_document && !wcbFile) && !contractor.user.government_id
                      ? 'Government ID, GST/HST, and WCB clearance documents must all be uploaded before contractor verification.'
                      : (!contractor.gst_hst_clearance_document && !gstHstFile) && (!contractor.wcb_clearance_document && !wcbFile)
                      ? 'Both GST/HST and WCB clearance documents must be uploaded before contractor verification.'
                      : (!contractor.gst_hst_clearance_document && !gstHstFile) && !contractor.user.government_id
                      ? 'Government ID and GST/HST clearance document must be uploaded before contractor verification.'
                      : (!contractor.wcb_clearance_document && !wcbFile) && !contractor.user.government_id
                      ? 'Government ID and WCB clearance document must be uploaded before contractor verification.'
                      : !contractor.gst_hst_clearance_document && !gstHstFile
                      ? 'GST/HST clearance document must be uploaded before contractor verification.'
                      : !contractor.wcb_clearance_document && !wcbFile
                      ? 'WCB clearance document must be uploaded before contractor verification.'
                      : 'Government ID must be uploaded before contractor verification.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* GST/HST Clearance Document */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">GST/HST Clearance Document</span>
              {contractor.gst_hst_clearance_document ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Uploaded
                </Badge>
              ) : (
                <Badge variant="outline" className="text-gray-600">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Not uploaded
                </Badge>
              )}
            </div>
            {contractor.gst_hst_clearance_document ? (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const url = contractor.gst_hst_clearance_document?.url;
                    if (url) {
                      try {
                        const response = await fetch(url);
                        const blob = await response.blob();
                        const blobUrl = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = blobUrl;
                        link.download = contractor.gst_hst_clearance_document?.filename || 'gst-hst-clearance-document.pdf';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(blobUrl);
                      } catch (error) {
                        console.error('Download failed:', error);
                        // Fallback to direct link
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = contractor.gst_hst_clearance_document?.filename || 'gst-hst-clearance-document.pdf';
                        link.target = '_blank';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }
                    }
                  }}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download Document
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteGstHstDocument}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete Document
                </Button>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload GST/HST Clearance Document
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setGstHstFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {gstHstFile && (
                  <p className="text-xs text-gray-600 mt-1">
                    Selected: {gstHstFile.name}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* WCB Clearance Document */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">WCB Clearance Document</span>
              {contractor.wcb_clearance_document ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Uploaded
                </Badge>
              ) : (
                <Badge variant="outline" className="text-gray-600">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Not uploaded
                </Badge>
              )}
            </div>
            {contractor.wcb_clearance_document ? (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const url = contractor.wcb_clearance_document?.url;
                    if (url) {
                      try {
                        const response = await fetch(url);
                        const blob = await response.blob();
                        const blobUrl = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = blobUrl;
                        link.download = contractor.wcb_clearance_document?.filename || 'wcb-clearance-document.pdf';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(blobUrl);
                      } catch (error) {
                        console.error('Download failed:', error);
                        // Fallback to direct link
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = contractor.wcb_clearance_document?.filename || 'wcb-clearance-document.pdf';
                        link.target = '_blank';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }
                    }
                  }}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download Document
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteWcbDocument}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete Document
                </Button>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload WCB Clearance Document
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setWcbFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {wcbFile && (
                  <p className="text-xs text-gray-600 mt-1">
                    Selected: {wcbFile.name}
                  </p>
                )}
              </div>
            )}
          </div>

        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-end">
            <div className="flex space-x-2">
              {contractor.is_admin_verified ? (
                <Button 
                  onClick={handleRejectContractor}
                  disabled={uploading}
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Verification
                </Button>
              ) : (
                <Button 
                  onClick={handleVerifyContractor}
                  disabled={
                    uploading || 
                    !contractor.gst_hst_number || 
                    !contractor.wcb_number ||
                    (!contractor.gst_hst_clearance_document && !gstHstFile) ||
                    (!contractor.wcb_clearance_document && !wcbFile)
                  }
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  title={
                    !contractor.gst_hst_number || !contractor.wcb_number
                      ? 'GST/HST Number and WCB Number must be provided before verifying contractor'
                      : (!contractor.gst_hst_clearance_document && !gstHstFile) || (!contractor.wcb_clearance_document && !wcbFile)
                      ? 'Both GST/HST and WCB clearance documents must be uploaded before verification'
                      : 'Upload Documents & Verify Contractor'
                  }
                >
                  {uploading ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Uploading & Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Upload Documents & Verify Contractor
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
