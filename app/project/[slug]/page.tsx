'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, 
  Calendar, 
  DollarSign, 
  Clock, 
  User, 
  ArrowLeft,
  ExternalLink,
  Building,
  Wrench,
  CheckCircle,
  Star,
  Eye
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import LoadingSpinner from '@/components/shared/loading-spinner'
import { Project } from '@/server/database/interfaces'

interface ProjectWithCreator {
  id: string
  project_title: string
  statement_of_work: string
  budget: number
  category: string[]
  pid: string
  location: any
  location_geom?: any
  certificate_of_title?: string | null
  project_type: string
  status: string
  visibility_settings: string
  start_date: Date | string
  end_date: Date | string
  expiry_date: Date | string
  decision_date?: Date | string | null
  permit_required: boolean
  substantial_completion?: Date | string | null
  is_verified_project: boolean
  is_featured_project: boolean
  delay_penalty: number
  abandonment_penalty: number
  project_photos: any[]
  files: any[]
  after_photo?: any
  creator: string
  proposal_count: number
  site_amenities?: {
    [key: string]: string[]
  }
  title_awarded: boolean
  project_certificate?: any | null
  slug?: string
  created_at: Date | string
  updated_at: Date | string
  contractor?: {
    id: string
    full_name: string
    profile_photo?: string
    contractor_profile?: {
      id: string
      business_name?: string
      logo?: string
      featured_contractor_expiry?: string
      bio?: string
      trade_category?: string[]
      service_location?: string
      work_guarantee?: number
      work_guarantee_statement?: string
      portfolio?: string[]
      address?: {
        address: string
        latitude?: number | null
        longitude?: number | null
        city?: string | null
        province?: string | null
        postalCode?: string | null
        country?: string | null
      }
    }
  }
}

export default function PublicProjectViewPage() {
  const params = useParams()
  const projectSlug = params.slug as string
  
  const [project, setProject] = useState<ProjectWithCreator | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (projectSlug) {
      fetchProject()
    } else {
      setError('No project slug provided')
      setLoading(false)
    }
  }, [projectSlug])

  const fetchProject = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      // First, try to fetch the project with basic info to see if it exists
      const { data: basicProject, error: basicError } = await supabase
        .from('projects')
        .select('id, visibility_settings, status, project_title, slug')
        .eq('slug', projectSlug)
        .single()

      if (basicError) {
        console.error('Error fetching project basic info:', basicError)
        console.error('Project slug:', projectSlug)
        console.error('Error details:', JSON.stringify(basicError, null, 2))
        
        // If slug not found, try to fetch by ID as fallback
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        console.log('🔍 Testing UUID regex on:', projectSlug)
        console.log('🔍 UUID regex test result:', uuidRegex.test(projectSlug))
        
        if (uuidRegex.test(projectSlug)) {
          console.log('✅ Slug looks like a UUID, trying to fetch by ID...')
          console.log('🔍 About to execute fallback query for project ID:', projectSlug)
          const { data: basicProjectById, error: basicErrorById } = await supabase
            .from('projects')
            .select('id, visibility_settings, status, project_title, slug')
            .eq('id', projectSlug)
            .single()

          if (basicErrorById) {
            console.error('❌ Error fetching project by ID:', basicErrorById)
            setError('Project not found')
            return
          }

          console.log('✅ Successfully fetched project by ID:', basicProjectById)

          // Check if project is publicly available and completed
          if (basicProjectById.visibility_settings !== 'Public To Marketplace') {
            console.log('Project visibility:', basicProjectById.visibility_settings)
            setError('This project is not publicly available')
            return
          }

          if (basicProjectById.status !== 'Completed') {
            console.log('Project status:', basicProjectById.status)
            setError('This project is not completed yet')
            return
          }

          // Now fetch the full project data
          const { data: projectData, error: projectError } = await supabase
            .from('projects')
            .select(`
              *
            `)
            .eq('id', projectSlug)
            .single()

          if (projectError) {
            console.error('❌ Error fetching full project data:', projectError)
            setError('Failed to load project details')
            return
          }

          console.log('✅ Successfully fetched full project data:', projectData)
          console.log('🔍 Project slug from data:', projectData.slug)

          // If we found the project by ID and it has a slug, redirect to the slug URL
          if (projectData.slug) {
            console.log('🔄 Redirecting from UUID to slug URL:', `/project/${projectData.slug}`)
            window.location.href = `/project/${projectData.slug}`
            return
          }

          // Get contractor data if project has a selected proposal
          const { data: proposal } = await supabase
            .from("proposals")
            .select("contractor")
            .eq("project", projectData.id)
            .eq("is_selected", "yes")
            .single()

          let contractor = null
          if (proposal?.contractor) {
            const { data: contractorData } = await supabase
              .from("users")
              .select(`
                id,
                full_name,
                profile_photo,
                contractor_profile(*)
              `)
              .eq("id", proposal.contractor)
              .single()
            
            contractor = contractorData
          }

          setProject({
            ...projectData,
            contractor
          })
          return
        }
        
        setError('Project not found')
        return
      }

      console.log('Project found:', basicProject)

      // Check if project is publicly available and completed
      if (basicProject.visibility_settings !== 'Public To Marketplace') {
        console.log('Project visibility:', basicProject.visibility_settings)
        setError('This project is not publicly available')
        return
      }

      if (basicProject.status !== 'Completed') {
        console.log('Project status:', basicProject.status)
        setError('This project is not completed yet')
        return
      }

      // Now fetch the full project data
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          *
        `)
        .eq('slug', projectSlug)
        .single()

      if (projectError) {
        console.error('Error fetching full project data:', projectError)
        setError('Failed to load project details')
        return
      }

      // Get contractor data if project has a selected proposal
      const { data: proposal } = await supabase
        .from("proposals")
        .select("contractor")
        .eq("project", projectData.id)
        .eq("is_selected", "yes")
        .single()

      let contractor = null
      if (proposal?.contractor) {
        const { data: contractorData } = await supabase
          .from("users")
          .select(`
            id,
            full_name,
            profile_photo,
            contractor_profile(*)
          `)
          .eq("id", proposal.contractor)
          .single()
        
        contractor = contractorData
      }

      setProject({
        ...projectData,
        contractor
      })
    } catch (error) {
      console.error('Error fetching project:', error)
      setError('Failed to load project details')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading project details..." />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">
            {error || 'Project not found'}
          </div>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-sm font-medium"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="sm"
                  className="text-sm font-medium bg-orange-500 hover:bg-orange-600"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Project Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {project.project_title}
          </h1>
          
          {/* Contractor Information */}
          {project.contractor && (
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src={project.contractor.profile_photo || project.contractor.contractor_profile?.logo || "/assets/avatar.png"}
                  alt={project.contractor.contractor_profile?.business_name || project.contractor.full_name || "Contractor"}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/assets/avatar.png";
                  }}
                />
              </div>
              <div className="text-left">
                <p className="text-lg font-semibold text-blue-600">
                  {project.contractor.contractor_profile?.business_name || project.contractor.full_name}
                </p>
                <p className="text-sm text-gray-500">Contractor</p>
              </div>
            </div>
          )}
          
          <p className="text-xl text-gray-600 mb-6">
            {formatCurrency(project.budget)} • {project.category}
          </p>

          {/* Status Badge */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <span className="px-3 py-1 text-sm border border-gray-300 rounded-full text-gray-700">
              ✓ Completed
            </span>
            <span className="px-3 py-1 text-sm border border-gray-300 rounded-full text-gray-700">
              {project.project_type}
            </span>
          </div>

          {/* Project Meta */}
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center justify-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{project.location?.city}, {project.location?.province}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Completed {formatDate(project.end_date)}</span>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-12">
          {/* Project Description */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Project Description</h2>
            <p className="text-gray-700 leading-relaxed text-lg">{project.statement_of_work}</p>
          </div>

          {/* Project Photos */}
          {((project.project_photos && project.project_photos.length > 0) || project.after_photo) && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Project Photos</h2>
              
              {/* Before and After Comparison */}
              {project.project_photos && project.project_photos.length > 0 && project.after_photo ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Before Photo */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 text-center">Before</h4>
                      <div className="relative h-64 rounded-lg overflow-hidden border-2 border-gray-200">
                        <Image
                          src={typeof project.project_photos[0] === 'string' 
                            ? project.project_photos[0] 
                            : project.project_photos[0]?.url || "/images/placeholder-image.png"}
                          alt={`${project.project_title || "Project"} - Before`}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/images/placeholder-image.png";
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* After Photo */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 text-center">After</h4>
                      <div className="relative h-64 rounded-lg overflow-hidden border-2 border-green-200">
                        <Image
                          src={typeof project.after_photo === 'string' 
                            ? project.after_photo 
                            : project.after_photo?.url || "/images/placeholder-image.png"}
                          alt={`${project.project_title || "Project"} - After`}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/images/placeholder-image.png";
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Fallback to regular photo grid if no before/after available */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {project.project_photos
                    ?.filter(photo => {
                      // Handle both string URLs and objects with url property
                      if (typeof photo === 'string') {
                        return photo.trim() !== '';
                      }
                      if (photo && typeof photo === 'object' && photo.url) {
                        return photo.url.trim() !== '';
                      }
                      return false;
                    })
                    .map((photo, index) => {
                      // Extract URL from photo (could be string or object)
                      const photoUrl = typeof photo === 'string' ? photo : photo.url;
                      return (
                        <div key={index} className="relative h-64 border border-gray-200 overflow-hidden">
                          <Image
                            src={photoUrl || "/images/placeholder-image.png"}
                            alt={`Project photo ${index + 1}`}
                            fill
                            className="object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/images/placeholder-image.png";
                            }}
                          />
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* Site Amenities */}
          {project.site_amenities && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Site Amenities</h2>
              <div className="space-y-4">
                {Object.entries(project.site_amenities).map(([category, amenities]) => {
                  if (!amenities || amenities.length === 0) return null;
                  return (
                    <div key={category}>
                      <h4 className="font-medium text-gray-900 capitalize mb-2">
                        {category.replace(/_/g, ' ')}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {amenities.map((amenity, index) => (
                          <span key={index} className="px-3 py-1 text-sm border border-gray-300 rounded text-gray-700">
                            {amenity.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Project Details */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Project Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{project.project_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium">{project.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Permit Required:</span>
                  <span className="font-medium">
                    {project.permit_required ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">
                    {formatDate(project.created_at)}
                  </span>
                </div>
                {/* Contractor Information */}
                {project.contractor && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Contractor:</span>
                    <span className="font-medium text-blue-600">
                      {project.contractor.contractor_profile?.business_name || project.contractor.full_name}
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Start Date:</span>
                  <span className="font-medium">{formatDate(project.start_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">End Date:</span>
                  <span className="font-medium">{formatDate(project.end_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Budget:</span>
                  <span className="font-medium">{formatCurrency(project.budget)}</span>
                </div>
                {/* Contractor Trade Categories */}
                {project.contractor?.contractor_profile?.trade_category && project.contractor.contractor_profile.trade_category.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Specialties:</span>
                    <span className="font-medium text-right">
                      {project.contractor.contractor_profile.trade_category.slice(0, 2).join(", ")}
                      {project.contractor.contractor_profile.trade_category.length > 2 && "..."}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 360 Tours */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">360 Tours</h2>
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">360° Virtual Tours</h3>
                <p className="text-gray-600 mb-4">
                  Immersive 360° virtual tours coming soon! Experience this project through interactive panoramic views and virtual walkthroughs.
                </p>
                <div className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                  <span className="w-2 h-2 bg-orange-400 rounded-full mr-2 animate-pulse"></span>
                  Coming Soon
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
