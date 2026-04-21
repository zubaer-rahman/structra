'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { USER_ROLES, TRADE_CATEGORIES, PROPOSAL_STATUSES } from '@/utils/constants'
import { AVAILABLE_TRADE_CATEGORIES } from '@/utils/constants/trades'
import { createClient } from '@/lib/supabase'
import { proposalService } from '@/server/services'
import { Project } from '@/server/database/interfaces'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, DollarSign, FileText, ArrowLeft, Shield, Upload, Eye } from 'lucide-react'
import { FileReference } from '@/server/database/schemas/base'
import { supabaseStorageService } from '@/server/services'
import { generateProposalPDFBlob } from '@/utils/helpers/pdfPreviewGenerator'
import PDFPreviewModal from '@/components/shared/PDFPreviewModal'
import toast from 'react-hot-toast'
import Breadcrumbs from '@/components/shared/Breadcrumbs'

export default function SubmitProposalPage() {
  const { user, userRole, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const projectId = params?.projectId as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [projectLoading, setProjectLoading] = useState(true)
  const [error, setError] = useState('')
  const [delayPenaltyChanged, setDelayPenaltyChanged] = useState(false)
  const [originalDelayPenalty, setOriginalDelayPenalty] = useState<number>(0)
  const [contractorProfile, setContractorProfile] = useState<{ 
    work_guarantee_statement?: string
    phone_number?: string
    address?: any
  } | null>(null)
  const [existingProposals, setExistingProposals] = useState<{ id: string; status: string; created_at: string }[]>([])
  const [proposalsLoading, setProposalsLoading] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set())
  const [uploadErrors, setUploadErrors] = useState<Map<string, string>>(new Map())
  
  // Preview state
  const [showPreview, setShowPreview] = useState(false)
  const [previewPDFBlob, setPreviewPDFBlob] = useState<Blob | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    // Core proposal fields
    title: '',
    description_of_work: '',
    
    // Financial fields
    subtotal_amount: '',
    custom_tax_amount: '',
    total_amount: '',
    deposit_amount: '',
    deposit_due_on: '',
    delay_penalty: '',
    abandonment_penalty: '',
    
    // Timeline fields
    proposed_start_date: '',
    proposed_end_date: '',
    expiry_date: '',
    
    // Content and documentation
    clause_preview_html: '',
    attached_files: [] as FileReference[], // Enable file upload
    notes: '',
    
    // Trade category removed - not stored in proposals
    
  })

  // Check for existing proposals
  const checkExistingProposals = useCallback(async () => {
    if (!projectId || !user?.id) return

    try {
      setProposalsLoading(true)
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('proposals')
        .select('id, status, created_at')
        .eq('project', projectId)
        .eq('contractor', user.id)
        .eq('is_deleted', 'no')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching existing proposals:', error)
        return
      }

      setExistingProposals(data || [])
    } catch (error) {
      console.error('Error checking existing proposals:', error)
    } finally {
      setProposalsLoading(false)
    }
  }, [projectId, user?.id])

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) {
        setError('Project ID is required')
        setProjectLoading(false)
        return
      }
      
      // Validate project ID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(projectId)) {
        setError('Invalid project ID format')
        setProjectLoading(false)
        return
      }
      
      try {
        const supabase = createClient()
        
        // Check if the project exists and is accessible
        
        // First, let's see what projects the user can access
        const { data: allProjects, error: allProjectsError } = await supabase
          .from('projects')
          .select('id, project_title, status, creator')
          .limit(5)
        
        const { error: projectCheckError } = await supabase
          .from('projects')
          .select('id, project_title, status, creator')
          .eq('id', projectId)
          .single()
        
        let { data: projectCheck } = await supabase
          .from('projects')
          .select('id, project_title, status, creator')
          .eq('id', projectId)
          .single()
          
          
        if (projectCheckError) {
          console.error('Project not found or access denied:', projectCheckError)
          
          // Try a different approach - maybe the project exists but with different permissions
          const { data: altProject, error: altError } = await supabase
            .from('projects')
            .select('id, project_title, status, creator')
            .eq('id', projectId)
            .maybeSingle()
          
          if (altError || !altProject) {
            throw new Error(`Project not found: ${projectCheckError.message}`)
          }
          
          // Use the alternative result
          projectCheck = altProject
        }
        
        // Fetch only essential project data
        
        // First try with just the basic fields to see what works
        const { data: basicData, error: basicError } = await supabase
          .from('projects')
          .select('id, project_title, status, creator')
          .eq('id', projectId)
          .single()
        
        if (basicError) {
          console.error('Even basic project fetch failed:', basicError)
          throw basicError
        }
        
        // Now try to get additional fields
        const { data, error: fetchError } = await supabase
          .from('projects')
          .select(`
            id,
            project_title,
            statement_of_work,
            budget,
            category,
            location,
            delay_penalty,
            creator,
            status,
            pid
          `)
          .eq('id', projectId)
          .single()
          
        
        // Check if the project status allows proposals
        if (data && !['Draft', 'Open for Proposals'].includes(data.status)) {
          console.error('Project status does not allow proposals:', data.status)
          throw new Error(`This project is ${data.status.toLowerCase()} and not accepting proposals`)
        }
          
        if (fetchError) {
          console.error('Error fetching project details:', fetchError.message)
          console.error('Full fetch error:', fetchError)
          
          // Try with minimal fields if the full query fails
          const { data: minimalData, error: minimalError } = await supabase
            .from('projects')
            .select('id, project_title, status, creator')
            .eq('id', projectId)
            .single()
          
          if (minimalError) {
            throw fetchError // Use original error
          }
          
          // Use basic data and set defaults for missing fields
          const projectData = {
            ...basicData,
            pid: '', // Don't set pid to project ID - leave it empty
            statement_of_work: 'Project details not available',
            budget: 0,
            category: ['General'],
            location: { 
              address: 'Location not specified',
              latitude: 0,
              longitude: 0,
              city: 'Unknown',
              province: 'Unknown',
              postalCode: 'Unknown'
            },
            delay_penalty: 0,
            project_type: 'New Build' as const,
            status: basicData.status || 'published' as const,
            visibility_settings: 'Public To Marketplace' as const,
            start_date: new Date(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            decision_date: null,
            permit_required: false,
            substantial_completion: null,
            is_verified_project: false,
            is_featured_project: false,
            abandonment_penalty: 0,
            project_photos: [],
            files: [],
            after_photo: undefined,
            proposal_count: 0,
            site_amenities: undefined,
            title_awarded: false,
            project_certificate: null,
            created_at: new Date(),
            updated_at: new Date(),
            homeowner: undefined
          }
          
          setProject(projectData)
          return
        }
        
        // Create a proper Project object from the partial data
        const projectData: Project = {
          ...data,
          pid: data.pid || '', // Use the actual pid from database, not project ID
          project_type: 'New Build' as const,
          visibility_settings: 'Public To Marketplace' as const,
          start_date: new Date(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          decision_date: null,
          permit_required: false,
          substantial_completion: null,
          is_verified_project: false,
          is_featured_project: false,
          abandonment_penalty: 0,
          project_photos: [],
          files: [],
          after_photo: undefined,
          proposal_count: 0,
          site_amenities: undefined,
          title_awarded: false,
          project_certificate: null,
          created_at: new Date(),
          updated_at: new Date(),
          homeowner: undefined
        }
        
        setProject(projectData)
        
        // Prefill delay penalty from project data
        if (data.delay_penalty !== undefined && data.delay_penalty !== null) {
          setOriginalDelayPenalty(data.delay_penalty)
          setFormData(prev => ({
            ...prev,
            delay_penalty: data.delay_penalty.toString(),
            abandonment_penalty: (data.delay_penalty * 30).toString()
          }))
        }

        // Check for existing proposals
        await checkExistingProposals()
      } catch (error) {
        console.error('Error fetching project:', error)
        setError(`Failed to load project details: ${error instanceof Error ? error.message : 'Unknown error'}`)
      } finally {
        setProjectLoading(false)
      }
    }

    const fetchContractorProfile = async () => {
      if (!user?.id) return
      
      try {
        const supabase = createClient()
        const { data: profileData, error: profileError } = await supabase
          .from('contractor_profiles')
          .select('work_guarantee_statement, phone_number, address')
          .eq('user_id', user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching contractor profile:', profileError.message)
        } else if (profileData) {
          setContractorProfile(profileData)
        }
      } catch (error) {
        console.error('Error fetching contractor profile:', error)
      }
    }
    
    if (!loading && user && userRole === USER_ROLES.CONTRACTOR) {
      fetchProject()
      fetchContractorProfile()
    } else if (!loading) {
      setProjectLoading(false)
    }
  }, [projectId, user, userRole, loading, checkExistingProposals])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => {
      const newFormData = { ...prev, [field]: value }
      
      // Special handling for delay penalty changes
      if (field === 'delay_penalty') {
        const newValue = parseFloat(value as string) || 0
        if (newValue !== originalDelayPenalty) {
          setDelayPenaltyChanged(true)
        } else {
          setDelayPenaltyChanged(false)
        }
        // Auto-calculate abandonment penalty
        newFormData.abandonment_penalty = (newValue * 30).toString()
      }
      
      // Auto-calculate total amount when subtotal or custom tax amount changes
      if (field === 'subtotal_amount' || field === 'custom_tax_amount') {
        const subtotal = field === 'subtotal_amount' ? parseFloat(value as string) || 0 : parseFloat(prev.subtotal_amount) || 0
        const customTaxAmount = field === 'custom_tax_amount' ? parseFloat(value as string) || 0 : parseFloat(prev.custom_tax_amount) || 0
        
        // Always add custom tax amount to subtotal
        newFormData.total_amount = (subtotal + customTaxAmount).toString()
      }
      
      return newFormData
    })
  }

  // File upload handlers
  const uploadFileToSupabase = async (file: File): Promise<FileReference> => {
    try {
      const uploadResult = await supabaseStorageService.uploadFile(file, {
        fileType: 'documents',
        bucket: 'structra-files'
      });

      return {
        id: crypto.randomUUID(),
        filename: file.name,
        url: uploadResult.url,
        size: uploadResult.size,
        mimeType: uploadResult.mimeType,
        uploadedAt: new Date(uploadResult.uploadedAt),
      };
    } catch (error) {
      console.error('Upload failed for file:', file.name, error);
      throw new Error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate files
    const validFiles = files.filter((file) => {
      // Check file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setUploadErrors(prev => new Map(prev).set(file.name, 'File size must be less than 10MB'));
        return false;
      }

      // Check file type
      const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.dwg', '.skp'];
      const fileExtension = file.name.toLowerCase().split('.').pop();
      if (!fileExtension || !allowedTypes.includes(`.${fileExtension}`)) {
        setUploadErrors(prev => new Map(prev).set(file.name, 'File type not supported'));
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) {
      toast.error('No valid files to upload');
      return;
    }

    // Upload files one by one
    for (const file of validFiles) {
      const fileId = `${file.name}-${Date.now()}`;
      setUploadingFiles(prev => new Set(prev).add(fileId));
      setUploadErrors(prev => {
        const newMap = new Map(prev);
        newMap.delete(file.name);
        return newMap;
      });

      try {
        const uploadedFile = await uploadFileToSupabase(file);
        setFormData(prev => ({
          ...prev,
          attached_files: [...prev.attached_files, uploadedFile]
        }));
        toast.success(`Successfully uploaded ${file.name}`);
      } catch (error) {
        console.error('Upload failed for file:', file.name, error);
        setUploadErrors(prev => new Map(prev).set(file.name, error instanceof Error ? error.message : 'Upload failed'));
        toast.error(`Failed to upload ${file.name}`);
      } finally {
        setUploadingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(fileId);
          return newSet;
        });
      }
    }

    // Clear the input
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attached_files: prev.attached_files.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    // Title validation
    if (!formData.title || formData.title.trim().length < 3) {
      setError('Title must be at least 3 characters')
      return false
    }
    
    // Description validation
    if (!formData.description_of_work || formData.description_of_work.trim().length < 10) {
      setError('Description of work must be at least 10 characters')
      return false
    }
    
    // Amount validations
    const subtotalAmount = parseFloat(formData.subtotal_amount)
    const totalAmount = parseFloat(formData.total_amount)
    const depositAmount = parseFloat(formData.deposit_amount)
    
    if (!formData.subtotal_amount || isNaN(subtotalAmount) || subtotalAmount <= 0) {
      setError('Subtotal amount must be a positive number')
      return false
    }
    
    if (!formData.total_amount || isNaN(totalAmount) || totalAmount <= 0) {
      setError('Total amount must be a positive number')
      return false
    }
    
    if (!formData.deposit_amount || isNaN(depositAmount) || depositAmount <= 0) {
      setError('Deposit amount must be a positive number')
      return false
    }
    
    if (depositAmount > totalAmount) {
      setError('Deposit amount cannot exceed total amount')
      return false
    }
    
    // Tax amount validation (always required now)
    const customTaxAmount = parseFloat(formData.custom_tax_amount)
    if (!formData.custom_tax_amount || isNaN(customTaxAmount) || customTaxAmount < 0) {
      setError('GST/HST amount must be a positive number')
      return false
    }
    
    // Date validations
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (!formData.deposit_due_on) {
      setError('Deposit due date is required')
      return false
    }
    
    const depositDueDate = new Date(formData.deposit_due_on)
    if (depositDueDate < today) {
      setError('Deposit due date cannot be in the past')
      return false
    }
    
    if (!formData.proposed_start_date || !formData.proposed_end_date) {
      setError('Start and end dates are required')
      return false
    }
    
    const startDate = new Date(formData.proposed_start_date)
    const endDate = new Date(formData.proposed_end_date)
    
    if (startDate < today) {
      setError('Proposed start date cannot be in the past')
      return false
    }
    
    if (endDate < startDate) {
      setError('Proposed end date cannot be before start date')
      return false
    }
    
    if (!formData.expiry_date) {
      setError('Proposal expiry date is required')
      return false
    }
    
    const expiryDate = new Date(formData.expiry_date)
    if (expiryDate < today) {
      setError('Proposal expiry date cannot be in the past')
      return false
    }
    
    if (expiryDate > startDate) {
      setError('Proposal expiry date should be before the proposed start date')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || userRole !== USER_ROLES.CONTRACTOR) {
      setError('Only contractors can submit proposals')
      return
    }
    
    if (!validateForm()) {
      return
    }
    
    setSubmitting(true)
    setError('')
    
    try {
      const proposalData = {
        title: formData.title,
        description_of_work: formData.description_of_work,
        project: projectId,
        contractor: user.id,
        homeowner: project?.creator || '',
        subtotal_amount: parseFloat(formData.subtotal_amount),
        tax_included: 'no' as 'yes' | 'no', // Always 'no' since we now always require separate tax amount
        total_amount: parseFloat(formData.total_amount),
        deposit_amount: parseFloat(formData.deposit_amount),
        deposit_due_on: new Date(formData.deposit_due_on),
        delay_penalty: parseFloat(formData.delay_penalty) || 0,
        abandonment_penalty: parseFloat(formData.abandonment_penalty) || 0,
        proposed_start_date: new Date(formData.proposed_start_date),
        proposed_end_date: new Date(formData.proposed_end_date),
        expiry_date: new Date(formData.expiry_date),
        clause_preview_html: formData.clause_preview_html || '',
        attached_files: formData.attached_files, // Include uploaded files
        notes: formData.notes || '',
        work_guarantee_statement: contractorProfile?.work_guarantee_statement || '',
        created_by: user.id
      }
      
      
      const result = await proposalService.createProposal(proposalData, user.id)
      
      if (!result.success) {
        console.error('Proposal creation failed:', result.error)
        throw new Error(result.error || 'Failed to submit proposal')
      }
      
      toast.success("Your proposal has been submitted successfully. The homeowner will review it and get back to you.")
      router.push('/contractor/my-projects')
    } catch (error) {
      console.error('Error submitting proposal:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(`Failed to submit proposal: ${errorMessage}`)
    } finally {
      setSubmitting(false)
    }
  }

  const generateMockProposal = () => {
    if (!user || !project) return null
    
    // Debug: Log the project data to see what's in pid
    console.log('Project data for preview:', {
      id: project.id,
      pid: project.pid,
      project_title: project.project_title
    })
    
    return {
      id: 'preview-' + Date.now(), // Temporary ID for preview
      title: formData.title || 'Preview Proposal',
      description_of_work: formData.description_of_work || '',
      project: projectId,
      contractor: user.id,
      homeowner: project.creator || '',
      subtotal_amount: parseFloat(formData.subtotal_amount) || 0,
      tax_included: 'no' as 'yes' | 'no',
      total_amount: parseFloat(formData.total_amount) || 0,
      deposit_amount: parseFloat(formData.deposit_amount) || 0,
      deposit_due_on: formData.deposit_due_on || '',
      delay_penalty: parseFloat(formData.delay_penalty) || 0,
      abandonment_penalty: parseFloat(formData.abandonment_penalty) || 0,
      proposed_start_date: formData.proposed_start_date || '',
      proposed_end_date: formData.proposed_end_date || '',
      expiry_date: formData.expiry_date || '',
      clause_preview_html: formData.clause_preview_html || '',
      attached_files: formData.attached_files,
      notes: formData.notes || '',
      work_guarantee_statement: contractorProfile?.work_guarantee_statement || '',
      created_by: user.id,
      last_modified_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      status: 'draft',
      is_selected: 'no' as 'yes' | 'no',
      is_deleted: 'no' as 'yes' | 'no',
      contract_reviewed: false,
      homeowner_contract_reviewed: false,
      proposals: [],
      visibility_settings: 'private' as 'private' | 'public' | 'shared',
      // Project details
      project_details: {
        id: project.id,
        project_title: project.project_title || '',
        statement_of_work: project.statement_of_work || '',
        category: project.category || [],
        location: project.location || {},
        status: project.status || 'Draft',
        budget: project.budget || 0,
        pid: project.pid && project.pid !== project.id ? project.pid : undefined
      },
      // Contractor profile
      contractor_profile: {
        id: user.id,
        full_name: user.full_name || '',
        email: user.email || '',
        phone_number: contractorProfile?.phone_number || '',
        address: contractorProfile?.address || ''
      }
    }
  }

  const handlePreviewProposal = async () => {
    const mockProposal = generateMockProposal()
    if (!mockProposal) return
    
    setPreviewLoading(true)
    setError('')
    
    try {
      // Generate PDF blob for preview
      const result = await generateProposalPDFBlob(mockProposal as any, true) // Skip signature validation for preview
      
      if (result.success && result.blob) {
        setPreviewPDFBlob(result.blob)
        setShowPreview(true)
      } else {
        toast.error(result.error || 'Failed to generate preview')
      }
    } catch (error) {
      console.error('Preview error:', error)
      toast.error('Failed to generate preview')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleRefreshPreview = async () => {
    const mockProposal = generateMockProposal()
    if (!mockProposal) return
    
    setPreviewLoading(true)
    
    try {
      const result = await generateProposalPDFBlob(mockProposal as any, true)
      if (result.success && result.blob) {
        setPreviewPDFBlob(result.blob)
      } else {
        toast.error(result.error || 'Failed to refresh preview')
      }
    } catch (error) {
      console.error('Preview refresh error:', error)
      toast.error('Failed to refresh preview')
    } finally {
      setPreviewLoading(false)
    }
  }

  if (loading || projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (error && !project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    )
  }

      if (!user || userRole !== USER_ROLES.CONTRACTOR) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Access denied. Only contractors can submit proposals.</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Project not found or no longer accepting proposals.</div>
      </div>
    )
  }

  // Check if contractor already has an active proposal
  const hasActiveProposal = existingProposals.length > 0 && 
    (existingProposals[0].status === PROPOSAL_STATUSES.ACCEPTED || 
     existingProposals[0].status === PROPOSAL_STATUSES.SUBMITTED)

  if (hasActiveProposal) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-4">
            You have already submitted a proposal for this project
          </div>
          <div className="text-sm text-gray-600 mb-4">
            Status: {existingProposals[0].status}
          </div>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Breadcrumbs */}
      <div className="mb-4">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/contractor/dashboard' },
            { label: 'Projects', href: '/contractor/projects' },
            { label: project.project_title || 'Project Details', href: `/contractor/projects/view/${project.id}` },
            { label: 'Submit Proposal', href: '#' }
          ]}
        />
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
         
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Submit Proposal</h1>
          <p className="text-gray-600 mt-2">
            Submit your detailed proposal for: <span className="font-semibold">{project.project_title}</span>
          </p>
        </div>
      </div>

      {/* Project Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Project Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Category</Label>
              <p className="text-sm">{Array.isArray(project.category) ? project.category.join(', ') : 'Not specified'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Location</Label>
              <p className="text-sm">{project.location?.address || 'Not specified'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Budget Range</Label>
              <p className="text-sm">${project.budget.toLocaleString()}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Project Status</Label>
              <p className="text-sm">{project.status}</p>
            </div>
          </div>
          <div className="mt-4">
            <Label className="text-sm font-medium text-gray-600">Description</Label>
            <p className="text-sm text-gray-700 mt-1">{project.statement_of_work}</p>
          </div>
          
          {/* Work Guarantee Statement */}
          {contractorProfile?.work_guarantee_statement && (
            <div className="mt-4">
              <Label className="text-sm font-medium text-gray-600">Work Guarantee Statement</Label>
              <p className="text-sm text-gray-700 mt-1">{contractorProfile.work_guarantee_statement}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Proposal Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Proposal Information
            </CardTitle>
            <CardDescription>
              Provide basic information about your proposal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Proposal Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter a descriptive title for your proposal"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description_of_work">Description of Work</Label>
              <Textarea
                id="description_of_work"
                name="description_of_work"
                value={formData.description_of_work || ''}
                onChange={(e) => handleInputChange('description_of_work', e.target.value)}
                placeholder="Provide a detailed description of the work you&apos;ll perform..."
                rows={4}
                required
              />
            </div>
            
            {/* Trade category removed - not stored in proposals */}
          </CardContent>
        </Card>

        {/* Financial Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Details
            </CardTitle>
            <CardDescription>
              Provide detailed cost breakdown for the project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subtotal_amount">Subtotal Amount ($)</Label>
                <Input
                  id="subtotal_amount"
                  name="subtotal_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.subtotal_amount}
                  onChange={(e) => handleInputChange('subtotal_amount', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="custom_tax_amount">GST/HST ($)</Label>
                <Input
                  id="custom_tax_amount"
                  name="custom_tax_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.custom_tax_amount}
                  onChange={(e) => handleInputChange('custom_tax_amount', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div>
                <Label htmlFor="total_amount">Total Amount ($)</Label>
                <Input
                  id="total_amount"
                  name="total_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.total_amount}
                  onChange={(e) => handleInputChange('total_amount', e.target.value)}
                  placeholder="0.00"
                  required
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deposit_amount">Deposit Amount ($)</Label>
                <Input
                  id="deposit_amount"
                  name="deposit_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.deposit_amount}
                  onChange={(e) => handleInputChange('deposit_amount', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="deposit_due_on">Deposit Due Date</Label>
                <Input
                  id="deposit_due_on"
                  name="deposit_due_on"
                  type="date"
                  value={formData.deposit_due_on || ''}
                  onChange={(e) => handleInputChange('deposit_due_on', e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="delay_penalty">Delay Penalty (Per Day) ($)</Label>
              <Input
                id="delay_penalty"
                name="delay_penalty"
                type="number"
                step="0.01"
                min="0"
                value={formData.delay_penalty || '0'}
                onChange={(e) => handleInputChange('delay_penalty', e.target.value)}
                placeholder="0.00"
                className={delayPenaltyChanged ? "border-orange-500 bg-orange-50" : ""}
              />
              {delayPenaltyChanged && (
                <div className="mt-2 p-3 bg-orange-100 border border-orange-300 rounded-md">
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 text-orange-600 mr-2" />
                    <p className="text-sm text-orange-800 font-medium">
                      Warning: You are changing the homeowner&apos;s requested delay penalty from ${originalDelayPenalty.toFixed(2)} to ${parseFloat(formData.delay_penalty || '0').toFixed(2)}. Are you sure you want to do this?
                    </p>
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Per day penalty for missed deadlines. Prefilled from homeowner&apos;s request.
              </p>
            </div>
            
            <div>
              <Label htmlFor="abandonment_penalty">Abandonment Penalty (Max) ($)</Label>
              <Input
                id="abandonment_penalty"
                name="abandonment_penalty"
                type="number"
                step="0.01"
                min="0"
                value={formData.abandonment_penalty || '0'}
                onChange={(e) => handleInputChange('abandonment_penalty', e.target.value)}
                placeholder="0.00"
                disabled
                className="bg-gray-50"
              />
              <p className="text-sm text-gray-500 mt-1">
                Penalty for abandoning the contract after signing but before start date. Auto-calculated as delay penalty × 30 days.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Timeline Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Timeline Details
            </CardTitle>
            <CardDescription>
              Specify your proposed project timeline and proposal validity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="proposed_start_date">Proposed Start Date</Label>
                <Input
                  id="proposed_start_date"
                  name="proposed_start_date"
                  type="date"
                  value={formData.proposed_start_date || ''}
                  onChange={(e) => handleInputChange('proposed_start_date', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="proposed_end_date">Proposed End Date</Label>
                <Input
                  id="proposed_end_date"
                  name="proposed_end_date"
                  type="date"
                  value={formData.proposed_end_date || ''}
                  onChange={(e) => handleInputChange('proposed_end_date', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="expiry_date">Proposal Expiry Date</Label>
                <Input
                  id="expiry_date"
                  name="expiry_date"
                  type="date"
                  value={formData.expiry_date || ''}
                  onChange={(e) => handleInputChange('expiry_date', e.target.value)}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Date until which this proposal remains valid
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Additional Details
            </CardTitle>
            <CardDescription>
              Provide additional information and contract preview
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="clause_preview_html">Contract Clause Preview</Label>
              <Textarea
                id="clause_preview_html"
                name="clause_preview_html"
                value={formData.clause_preview_html}
                onChange={(e) => handleInputChange('clause_preview_html', e.target.value)}
                placeholder="Enter key contract clauses or terms that will be included in the agreement..."
                rows={4}
              />
              <p className="text-sm text-gray-500 mt-1">
                This will be displayed to the homeowner as a preview of contract terms
              </p>
            </div>
            
            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any additional information, special considerations, or clarifications..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* File Uploads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Supporting Documents
            </CardTitle>
            <CardDescription>
              Upload relevant files, plans, or documentation to support your proposal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file_upload">Upload Files</Label>
              <Input
                id="file_upload"
                name="file_upload"
                type="file"
                multiple
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.dwg,.skp"
                className="cursor-pointer"
                disabled={uploadingFiles.size > 0}
              />
              <p className="text-sm text-gray-500 mt-1">
                Accepted formats: PDF, DOC, DOCX, JPG, PNG, DWG, SKP. Maximum file size: 10MB per file.
              </p>
              {uploadingFiles.size > 0 && (
                <p className="text-sm text-blue-600 mt-1">
                  Uploading {uploadingFiles.size} file(s)...
                </p>
              )}
            </div>
            
            {formData.attached_files.length > 0 && (
              <div className="space-y-2">
                <Label>Attached Files:</Label>
                {formData.attached_files.map((file, index) => (
                  <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{file.filename}</span>
                      <span className="text-xs text-gray-500">
                        ({file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'})
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Errors */}
            {uploadErrors.size > 0 && (
              <div className="space-y-2">
                <Label className="text-red-600">Upload Errors:</Label>
                {Array.from(uploadErrors.entries()).map(([filename, error]) => (
                  <div key={filename} className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                    <strong>{filename}:</strong> {error}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handlePreviewProposal}
            disabled={previewLoading || submitting}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            {previewLoading ? 'Generating Preview...' : 'Preview Proposal'}
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="min-w-[120px]"
          >
            {submitting ? 'Submitting...' : 'Submit Proposal'}
          </Button>
        </div>
      </form>

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        isOpen={showPreview}
        onClose={() => {
          setShowPreview(false)
          setPreviewPDFBlob(null)
        }}
        pdfBlob={previewPDFBlob}
        title="Proposal Preview"
        allowDownload={false}
        showConfirmContract={false}
        userRole="contractor"
      />
    </div>
  )
}
