'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, 
  Star, 
  Shield, 
  Clock, 
  Mail, 
  Building, 
  Wrench,
  CheckCircle,
  ArrowLeft,
  Calendar,
  Award,
  FileText,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import LoadingSpinner from '@/components/shared/loading-spinner'
import CompletedProjectCard from '@/components/features/contractor/CompletedProjectCard'

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
  trade_category: string[]
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
  is_admin_verified: boolean
  admin_verification_date?: string
  is_insurance_verified: boolean
  slug?: string
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
    profile_photo?: string
    user_role: string
    is_verified_contractor: boolean
    created_at: string
  }
}

interface Review {
  id: string
  rating: number
  text: string
  created_at: string
  author: {
    full_name: string
    profile_photo?: string
  }
}

export default function LegacyPublicContractorProfilePage() {
  const params = useParams()
  const contractorId = params.id as string
  
  const [contractor, setContractor] = useState<ContractorProfile | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [completedProjects, setCompletedProjects] = useState<any[]>([])
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (contractorId) {
      // Check if this is a UUID and redirect to slug-based URL
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (uuidRegex.test(contractorId)) {
        // Redirect to the redirect API which will handle the slug lookup
        window.location.href = `/api/redirects/profile/${contractorId}`
        return
      }
      fetchContractorProfile()
    } else {
      setError('No contractor ID provided')
      setLoading(false)
    }
  }, [contractorId])

  const fetchContractorProfile = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      // Fetch contractor profile with user data by ID
      const { data: contractorData, error: contractorError } = await supabase
        .from('contractor_profiles')
        .select(`
          *,
          user:users!user_id (
            id,
            full_name,
            first_name,
            last_name,
            email,
            phone_number,
            address,
            profile_photo,
            user_role,
            is_verified_contractor,
            created_at
          )
        `)
        .eq('user_id', contractorId)
        .eq('user.is_active', true)
        .single()

      if (contractorError) {
        console.error('Error fetching contractor by ID:', contractorError)
        setError('Contractor not found')
        return
      }

      // If contractor has a slug, redirect to the new URL
      if (contractorData.slug) {
        window.location.href = `/profile/${contractorData.slug}`
        return
      }

      setContractor(contractorData)

      // Fetch reviews for this contractor
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          text,
          created_at,
          author:users!reviews_author_fkey (
            full_name,
            profile_photo
          )
        `)
        .eq('recipient', contractorData.user_id)
        .eq('is_verified', 'yes')
        .order('created_at', { ascending: false })
        .limit(3)

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError)
      } else {
        // Transform the data to match our interface
        const transformedReviews = (reviewsData || []).map(review => ({
          ...review,
          author: Array.isArray(review.author) ? review.author[0] : review.author
        }))
        setReviews(transformedReviews)
      }

      // Fetch completed projects with consent
      const completedProjectsResponse = await fetch(`/api/reviews/contractor/${contractorData.user_id}`)
      if (completedProjectsResponse.ok) {
        const completedProjectsData = await completedProjectsResponse.json()
        // Filter and transform projects with photos and consent
        const projectsWithPhotos = completedProjectsData.reviews
          .filter((review: any) => 
            review.project?.photos?.before && review.project?.photos?.after
          )
          .map((review: any) => ({
            id: review.project.id,
            project_title: review.project.project_title,
            photos: review.project.photos,
            rating: review.rating,
            text: review.text,
            created_at: review.created_at,
            author_user: review.author_user
          }))
        setCompletedProjects(projectsWithPhotos)
      }

    } catch (error) {
      console.error('Error fetching contractor profile:', error)
      setError('Failed to load contractor profile')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const calculateAverageRating = () => {
    if (reviews.length === 0) return "0"
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
    return (sum / reviews.length).toFixed(1)
  }

  const nextProject = () => {
    const maxIndex = Math.max(0, Math.min(completedProjects.length - 1, 5)) // Max 6 items (0-5)
    setCurrentProjectIndex((prev) => (prev + 1) % (maxIndex + 1))
  }

  const prevProject = () => {
    const maxIndex = Math.max(0, Math.min(completedProjects.length - 1, 5)) // Max 6 items (0-5)
    setCurrentProjectIndex((prev) => (prev - 1 + maxIndex + 1) % (maxIndex + 1))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !contractor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Contractor Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The contractor profile you are looking for does not exist.'}</p>
          <Link href="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const averageRating = calculateAverageRating()

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
        {/* Profile Header */}
        <div className="text-center mb-12">
          <div className="relative inline-block mb-6">
            <Image
              src={contractor.user.profile_photo || "/assets/avatar.png"}
              alt={contractor.user.full_name}
              width={120}
              height={120}
              className="rounded-full object-cover border-2 border-gray-200"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/assets/avatar.png";
              }}
            />
            {contractor.user.is_verified_contractor && (
              <div className="absolute -bottom-1 -right-1 bg-gray-900 rounded-full p-2">
                <Shield className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {contractor.user.full_name}
          </h1>
          
          <p className="text-xl text-gray-600 mb-6">
            {contractor.business_name}
          </p>

          {/* Rating */}
          {reviews.length > 0 && (
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(parseFloat(averageRating))
                        ? 'text-gray-900 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-lg font-semibold text-gray-900 ml-2">
                {averageRating}
              </span>
              <span className="text-sm text-gray-500 ml-1">
                ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
              </span>
            </div>
          )}


          {/* Contact Info - HIDDEN FROM PUBLIC PROFILE */}
          {/* <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center justify-center gap-2">
              <Mail className="h-4 w-4" />
              <span>{contractor.user.email}</span>
            </div>
            {(contractor.address?.address || contractor.user.address) && (
              <div className="flex items-center justify-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="text-center">
                  {contractor.address?.address || contractor.user.address}
                </span>
              </div>
            )}
          </div> */}
        </div>

        {/* Content Sections */}
        <div className="space-y-12">
          {/* About */}
          {contractor.bio && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About</h2>
              <p className="text-gray-700 leading-relaxed text-lg">{contractor.bio}</p>
            </div>
          )}

          {/* Trade Categories */}
          {contractor.trade_category && contractor.trade_category.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Specialties</h2>
              <div className="flex flex-wrap gap-2">
                {contractor.trade_category.map((category, index) => (
                  <span key={index} className="px-3 py-1 text-sm border border-gray-300 rounded text-gray-700">
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Work Guarantee */}
          {contractor.work_guarantee && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Work Guarantee</h2>
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {contractor.work_guarantee} Month{contractor.work_guarantee !== 1 ? 's' : ''}
                </div>
                {contractor.work_guarantee_statement && (
                  <p className="text-gray-600">
                    {contractor.work_guarantee_statement}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Portfolio */}
          {contractor.portfolio && contractor.portfolio.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Portfolio</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {contractor.portfolio.map((imageUrl, index) => (
                  <div key={index} className="relative h-64 border border-gray-200 overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt={`Portfolio image ${index + 1}`}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/images/placeholder-image.png";
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                    <div className="flex items-start gap-4">
                      <Image
                        src={review.author.profile_photo || "/assets/avatar.png"}
                        alt={review.author.full_name}
                        width={48}
                        height={48}
                        className="rounded-full object-cover border border-gray-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/assets/avatar.png";
                        }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-gray-900">
                            {review.author.full_name}
                          </span>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? 'text-gray-900 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-700 mb-2">{review.text}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(review.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Projects */}
          {completedProjects.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Completed Projects</h2>
                {completedProjects.length > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevProject}
                      className="w-8 h-8 p-0 rounded-full"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextProject}
                      className="w-8 h-8 p-0 rounded-full"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="relative overflow-hidden">
                <div 
                  className="flex transition-transform duration-300 ease-in-out"
                  style={{ 
                    transform: `translateX(-${currentProjectIndex * (100 / 3)}%)`,
                    width: `${Math.min(completedProjects.length, 3) * 100}%`
                  }}
                >
                  {completedProjects.slice(0, 6).map((project, index) => (
                    <div 
                      key={project.id} 
                      className="flex-shrink-0 px-2" 
                      style={{ width: `${100 / 3}%` }}
                    >
                      <CompletedProjectCard project={project} />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Project indicators */}
              {completedProjects.length > 1 && (
                <div className="flex items-center justify-center mt-4 space-x-2">
                  {Array.from({ length: Math.min(completedProjects.length, 6) }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentProjectIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentProjectIndex ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

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
                  Immersive 360° virtual tours coming soon! Experience this contractor's work through interactive panoramic views and virtual walkthroughs.
                </p>
                <div className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                  <span className="w-2 h-2 bg-orange-400 rounded-full mr-2 animate-pulse"></span>
                  Coming Soon
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center border-t border-gray-200 pt-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to work with {contractor.user.full_name}?
            </h3>
            <p className="text-gray-600 mb-8 text-lg">
              Sign up to connect with this contractor and start your project.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white">
                  Get Started
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
