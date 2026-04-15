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
  Eye,
  Tag
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import LoadingSpinner from '@/components/shared/loading-spinner'
import { Project } from '@/server/database/interfaces'
import { Navbar } from '@/components/shared'
import { motion } from 'framer-motion'

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
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] pt-16">
          <LoadingSpinner size="lg" text="Loading project details..." />
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] pt-16 px-4">
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
      <Navbar />

      <main className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Glassmorphic Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Link href="/">
              <motion.button
                whileHover={{ x: -4, backgroundColor: "rgba(255, 247, 237, 0.8)" }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-orange-100 shadow-sm text-orange-600 hover:text-orange-700 font-bold text-sm cursor-pointer transition-all duration-300"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </motion.button>
            </Link>
          </motion.div>

          {/* Hero Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              {project.project_title}
            </h1>
            
            {/* Contractor Section */}
            {project.contractor && (
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200">
                  <Image
                    src={project.contractor.profile_photo || project.contractor.contractor_profile?.logo || "/assets/avatar.png"}
                    alt="Contractor" width={40} height={40} className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-left">
                  <p className="text-lg font-semibold text-blue-600 leading-tight">
                    {project.contractor.contractor_profile?.business_name || project.contractor.full_name}
                  </p>
                  <p className="text-xs text-gray-500 font-medium">Verified Contractor</p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-center items-center gap-4 text-gray-600 text-sm">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1.5 text-gray-400" />
                <span>{project.location?.city}, {project.location?.province}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
                <span>Completed {formatDate(project.end_date)}</span>
              </div>
              <div className="flex items-center">
                <Tag className="w-4 h-4 mr-1.5 text-gray-400" />
                <span>{project.project_type}</span>
              </div>
              <div className="flex items-center text-green-600 font-semibold">
                <CheckCircle className="w-4 h-4 mr-1.5" />
                <span>{formatCurrency(project.budget)}</span>
              </div>
            </div>
          </motion.div>

          <div className="space-y-16">
            {/* Project Photos */}
            {((project.project_photos && project.project_photos.length > 0) || project.after_photo) && (
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Project Photos</h2>
                {project.project_photos && project.project_photos.length > 0 && project.after_photo ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-500 text-center uppercase tracking-wider">Before</h4>
                      <div className="aspect-[4/3] relative rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                        <Image
                          src={typeof project.project_photos[0] === 'string' ? project.project_photos[0] : project.project_photos[0]?.url || "/images/placeholder-image.png"}
                          alt="Before" fill className="object-cover"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-500 text-center uppercase tracking-wider">After</h4>
                      <div className="aspect-[4/3] relative rounded-2xl overflow-hidden border border-green-100 shadow-md">
                        <Image
                          src={typeof project.after_photo === 'string' ? project.after_photo : project.after_photo?.url || "/images/placeholder-image.png"}
                          alt="After" fill className="object-cover"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    {project.project_photos?.map((photo, i) => (
                      <div key={i} className="aspect-video relative rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                        <Image
                          src={typeof photo === 'string' ? photo : photo.url || "/images/placeholder-image.png"}
                          alt={`Photo ${i + 1}`} fill className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Description */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Project Description</h2>
              <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">
                {project.statement_of_work}
              </p>
            </section>

            {/* Site Amenities */}
            {project.site_amenities && Object.values(project.site_amenities).some(a => a.length > 0) && (
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Site Amenities</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  {Object.entries(project.site_amenities).map(([category, amenities]) => {
                    if (!amenities || amenities.length === 0) return null;
                    return (
                      <div key={category} className="space-y-3">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{category.replace(/_/g, ' ')}</h4>
                        <div className="flex flex-wrap gap-2">
                          {amenities.map((amenity, index) => (
                            <span key={index} className="px-3 py-1.5 bg-gray-50 text-gray-700 text-sm font-medium rounded-lg border border-gray-100">
                              {amenity.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Project Details */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Project Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 px-8 bg-gray-50 rounded-3xl border border-gray-100">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-500 font-medium">Type</span>
                    <span className="text-gray-900 font-bold">{project.project_type}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-500 font-medium">Category</span>
                    <span className="text-gray-900 font-bold">{project.category}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-500 font-medium">Permit Required</span>
                    <span className="text-gray-900 font-bold">{project.permit_required ? 'Yes' : 'No'}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-500 font-medium">Start Date</span>
                    <span className="text-gray-900 font-bold">{formatDate(project.start_date)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-500 font-medium">End Date</span>
                    <span className="text-gray-900 font-bold">{formatDate(project.end_date)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-500 font-medium">Budget</span>
                    <span className="text-gray-900 font-bold text-blue-600">{formatCurrency(project.budget)}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 360 Tours - Restored as requested */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">360 Tours</h2>
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">360° Virtual Tours</h3>
                  <p className="text-gray-600 mb-6">
                    Immersive 360° virtual tours coming soon! Experience this project through interactive panoramic views and virtual walkthroughs.
                  </p>
                  <div className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                    <span className="w-2 h-2 bg-orange-400 rounded-full mr-2 animate-pulse"></span>
                    Coming Soon
                  </div>
                </div>
              </div>
            </section>

            {/* Bottom CTA */}
            <div className="text-center pt-8">
              <Button className="h-14 px-10 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-lg shadow-orange-100 transition-all hover:scale-105">
                Inquire Similar Project
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
