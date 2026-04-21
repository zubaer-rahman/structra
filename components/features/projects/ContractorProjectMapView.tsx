'use client'

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MapPin, DollarSign, Calendar, Building2, Search, Eye, Lock, CheckCircle } from 'lucide-react'
import { BaseProject } from '@/server/services/ProjectService'
import { clientConfig } from '@/config/client-env'
import { toast } from 'sonner'
import { ProjectPaymentModal } from '@/components/shared/modals/ProjectPaymentModal'
import { VerificationRedirectModal } from '@/components/shared/modals/VerificationRedirectModal'
import { ProfileCompletionModal } from '@/components/shared/modals/ProfileCompletionModal'
import { trpc } from '@/utils/trpc'
import { validateContractorProfileForVerification } from '@/utils/validation'
import { useGoogleMaps } from '@/hooks/useGoogleMaps'

interface ContractorProjectMapViewProps {
  projects: BaseProject[]
  onViewDetails: (project: BaseProject) => void
  formatCurrency: (amount: number) => string
  formatDate: (date: Date | string) => string
  user?: any // Add user prop for paywall functionality
}

export default function ContractorProjectMapView({
  projects,
  onViewDetails,
  formatCurrency,
  formatDate,
  user
}: ContractorProjectMapViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<BaseProject | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [showProfileCompletionModal, setShowProfileCompletionModal] = useState(false)
  const [paymentProject, setPaymentProject] = useState<BaseProject | null>(null)
  
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const infoWindowRef = useRef<any>(null)

  // Use the centralized Google Maps hook
  const { isLoaded, error: mapsError } = useGoogleMaps()

  // Fetch user profile data
  const { data: userProfile, isLoading: userProfileLoading } = trpc.users.getProfile.useQuery(undefined, {
    enabled: !!user?.id,
  })
  
  // Fetch contractor profile data
  const { data: contractorProfile, isLoading: contractorProfileLoading } = trpc.users.getContractorProfile.useQuery(undefined, {
    enabled: !!user?.id,
  })
  
  // Get verification status
  const { data: verificationStatus, isLoading: verificationLoading } = trpc.users.checkVerificationStatus.useQuery(undefined, {
    enabled: !!user?.id,
  })

  // Debounce search query with 500ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Filter projects based on search query
  const filteredProjects = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return projects.filter(project => 
        project.location?.latitude && project.location?.longitude
      )
    }

    const query = debouncedSearchQuery.toLowerCase().trim()
    return projects.filter(project => {
      const city = project.location?.city?.toLowerCase() || ''
      const province = project.location?.province?.toLowerCase() || ''
      const address = project.location?.address?.toLowerCase() || ''
      const title = project.project_title?.toLowerCase() || ''
      
      return (city.includes(query) || 
              province.includes(query) || 
              address.includes(query) ||
              title.includes(query)) &&
             project.location?.latitude && 
             project.location?.longitude
    })
  }, [projects, debouncedSearchQuery])

  // Use server data directly like the grid view does
  const projectAccessData = useMemo(() => {
    const data: Record<string, { hasAccess: boolean; isLoading: boolean }> = {}
    
    filteredProjects.forEach((project) => {
      data[project.id] = {
        hasAccess: project.hasAccess || false,
        isLoading: false // Server data is immediately available
      }
    })
    
    return data
  }, [filteredProjects])

  // Handle project click - run all verification checks like card view
  const handleProjectClick = useCallback(async (project: BaseProject) => {
    if (!user || !project.id) {
      toast.error('Please log in to access this project')
      return
    }
    
    // Wait for all data to load before performing validations
    if (userProfileLoading || contractorProfileLoading || verificationLoading) {
      return // Don't proceed if data is still loading
    }
    
    // Check profile completeness
    const profileValidation = validateContractorProfileForVerification(userProfile, contractorProfile)
    if (!profileValidation.isComplete) {
      setShowProfileCompletionModal(true)
      return
    }
    
    // Check verification status
    if (!verificationStatus?.isVerified) {
      toast.error('You need to be a verified contractor to view project details')
      setShowVerificationModal(true)
      return
    }
    
    // Check project view access (payment)
    if (!project.hasAccess) {
      // Show payment modal for verified users
      setPaymentProject(project)
      setShowPaymentModal(true)
      return
    }
    
    // All checks passed, proceed with viewing details
    onViewDetails(project)
  }, [user, userProfile, contractorProfile, verificationStatus, userProfileLoading, contractorProfileLoading, verificationLoading, onViewDetails])

  // Handle payment modal close
  const handlePaymentModalClose = () => {
    setShowPaymentModal(false)
    setPaymentProject(null)
  }

  // Handle payment success
  const handlePaymentSuccess = () => {
    setShowPaymentModal(false)
    setPaymentProject(null)
    // Refresh the page to get updated project data
    window.location.reload()
    toast.success('Payment successful! You now have access to this project.')
  }



  // Calculate map center based on filtered projects
  const mapCenter = useMemo(() => {
    if (filteredProjects.length === 0) {
      return [43.6532, -79.3832] // Default to Toronto
    }

    const validProjects = filteredProjects.filter(p => 
      p.location?.latitude && p.location?.longitude
    )

    if (validProjects.length === 0) {
      return [43.6532, -79.3832]
    }

    // Use privacy-aware coordinates for center calculation
    const coordinates = validProjects.map(p => {
      const hasAccess = projectAccessData[p.id]?.hasAccess || false
      if (hasAccess) {
        return {
          lat: Number(p.location!.latitude),
          lng: Number(p.location!.longitude)
        }
      } else {
        // Use approximate city center coordinates for privacy
        return {
          lat: Number(p.location!.latitude) + (Math.random() - 0.5) * 0.01,
          lng: Number(p.location!.longitude) + (Math.random() - 0.5) * 0.01
        }
      }
    })

    const avgLat = coordinates.reduce((sum, coord) => sum + coord.lat, 0) / coordinates.length
    const avgLng = coordinates.reduce((sum, coord) => sum + coord.lng, 0) / coordinates.length

    return [avgLat, avgLng]
  }, [filteredProjects, projectAccessData])

  const addMarkersToMap = useCallback(() => {
    if (!mapInstanceRef.current || !filteredProjects.length) {
      return
    }
    
    // Clear existing markers
    markersRef.current.forEach(marker => {
      marker.setMap(null)
    })
    markersRef.current = []

    // Add markers for filtered projects
    filteredProjects.forEach((project) => {
      const hasAccess = projectAccessData[project.id]?.hasAccess || false
      
      // Use exact coordinates only if contractor has purchased access
      // Otherwise, use approximate city center coordinates
      let lat, lng
      if (hasAccess) {
        lat = Number(project.location!.latitude)
        lng = Number(project.location!.longitude)
      } else {
        // Use approximate city center coordinates for privacy
        // This is a simplified approach - in production, you might want to use a geocoding service
        // to get the actual city center coordinates
        lat = Number(project.location!.latitude) + (Math.random() - 0.5) * 0.01 // Add small random offset
        lng = Number(project.location!.longitude) + (Math.random() - 0.5) * 0.01
      }
      
      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: mapInstanceRef.current,
        title: project.project_title || 'Project',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#f97316" stroke="white" stroke-width="2"/>
              <path d="M16 8l-4 8h8l-4-8z" fill="white"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 16)
        } as google.maps.Icon
      })

      // Check if user has access to this project using server data
      const projectAccessFee = clientConfig.pricing.getProjectAccessFeeInDollars()

      // Create clean info window content
      const infoContent = `
        <div style="padding: 12px; max-width: calc(100vw - 40px); min-width: 200px; width: 280px; font-family: system-ui, -apple-system, sans-serif; box-sizing: border-box;">
          <style>
            .gm-style .gm-style-iw-c button[title="Close"] {
              display: none !important;
            }
            .gm-style .gm-style-iw-c button[aria-label="Close"] {
              display: none !important;
            }
            .gm-style .gm-style-iw-c button:not([onclick]) {
              display: none !important;
            }
            .gm-style .gm-style-iw-tc {
              display: none !important;
            }
            .gm-style .gm-style-iw-tc::after {
              display: none !important;
            }
            @media (max-width: 640px) {
              .gm-style .gm-style-iw-c {
                max-width: calc(100vw - 20px) !important;
                width: calc(100vw - 20px) !important;
              }
            }
          </style>
          <div style="margin-bottom: 10px;">
            <h3 style="margin: 0 0 6px 0; font-size: 15px; font-weight: 600; color: #1f2937; line-height: 1.3; word-wrap: break-word; overflow-wrap: break-word;">
              ${project.project_title || 'Untitled Project'}
            </h3>
            
            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 6px;">
              <span style="color: #16a34a; font-weight: 500; font-size: 13px; word-wrap: break-word; overflow-wrap: break-word;">
                ${formatCurrency(project.budget || 0)}
              </span>
            </div>
            
            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 6px; font-size: 12px; color: #6b7280;">
              <span>📍</span>
              <span style="word-wrap: break-word; overflow-wrap: break-word;">
                ${hasAccess ? (
                  // Show full address if contractor has purchased access
                  project.location?.address && project.location?.city
                    ? `${project.location.address}, ${project.location.city}`
                    : project.location?.city && project.location?.province
                    ? `${project.location.city}, ${project.location.province}`
                    : 'Location available'
                ) : (
                  // Show only city and province for privacy
                  project.location?.city && project.location?.province
                    ? `${project.location.city}, ${project.location.province}`
                    : 'Location available'
                )}
              </span>
            </div>
            
            ${project.start_date ? `
              <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 6px; font-size: 12px; color: #6b7280;">
                <span>📅</span>
                <span style="word-wrap: break-word; overflow-wrap: break-word;">Starts ${formatDate(project.start_date)}</span>
              </div>
            ` : ''}
            
            ${project.category && project.category.length > 0 ? `
              <div style="display: flex; flex-wrap: wrap; gap: 3px; margin-bottom: 10px;">
                ${project.category.slice(0, 2).map(cat => 
                  `<span style="background: #f3f4f6; color: #374151; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: 500; word-wrap: break-word; overflow-wrap: break-word; max-width: 80px; display: inline-block;">${cat}</span>`
                ).join('')}
                ${project.category.length > 2 ? 
                  `<span style="background: #e5e7eb; color: #6b7280; padding: 2px 6px; border-radius: 10px; font-size: 10px;">+${project.category.length - 2}</span>` 
                  : ''
                }
              </div>
            ` : ''}
            
            ${!hasAccess ? `
              <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 6px; padding: 6px; background: #fef3c7; border-radius: 4px; border: 1px solid #f59e0b;">
                <span style="color: #92400e;">🔒</span>
                <span style="color: #92400e; font-size: 11px; font-weight: 500; word-wrap: break-word; overflow-wrap: break-word;">Access Required: $${projectAccessFee.toFixed(2)}</span>
              </div>
            ` : `
              <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 6px; padding: 6px; background: #f0f9ff; border-radius: 4px; border: 1px solid #0ea5e9;">
                <span style="color: #0369a1;">✓</span>
                <span style="color: #0369a1; font-size: 11px; font-weight: 500; word-wrap: break-word; overflow-wrap: break-word;">You have access to this project</span>
              </div>
            `}
          </div>
          
          <button 
            id="project-details-btn-${project.id}"
            style="
              background: ${hasAccess ? '#f97316' : '#f59e0b'}; 
              color: white; 
              border: none; 
              padding: 6px 12px; 
              border-radius: 4px; 
              font-size: 12px; 
              font-weight: 500;
              cursor: pointer; 
              width: 100%; 
              transition: background-color 0.2s;
              word-wrap: break-word;
              overflow-wrap: break-word;
            "
            onmouseover="this.style.background='${hasAccess ? '#ea580c' : '#d97706'}'"
            onmouseout="this.style.background='${hasAccess ? '#f97316' : '#f59e0b'}'"
          >
            ${hasAccess ? 'View Project Details' : `Pay $${projectAccessFee.toFixed(2)} for Access`}
          </button>
        </div>
      `

      // Add click listener to marker
      marker.addListener('click', () => {
        if (infoWindowRef.current && mapInstanceRef.current) {
          infoWindowRef.current.setContent(infoContent)
          infoWindowRef.current.open(mapInstanceRef.current, marker)
          
          // Add event listener to the button after the info window is opened
          setTimeout(() => {
            const button = document.getElementById(`project-details-btn-${project.id}`)
            if (button) {
              button.replaceWith(button.cloneNode(true))
              const newButton = document.getElementById(`project-details-btn-${project.id}`)
              if (newButton) {
                newButton.addEventListener('click', (e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  
                  handleProjectClick(project)
                })
              }
            }
          }, 100)
        }
        setSelectedProject(project)
      })

      markersRef.current.push(marker)
    })

    // Center map on filtered projects
    if (filteredProjects.length > 0) {
      const bounds = new window.google.maps.LatLngBounds()
      filteredProjects.forEach(project => {
        const hasAccess = projectAccessData[project.id]?.hasAccess || false
        let lat, lng
        if (hasAccess) {
          lat = Number(project.location!.latitude)
          lng = Number(project.location!.longitude)
        } else {
          // Use approximate city center coordinates for privacy
          lat = Number(project.location!.latitude) + (Math.random() - 0.5) * 0.01
          lng = Number(project.location!.longitude) + (Math.random() - 0.5) * 0.01
        }
        bounds.extend({ lat, lng })
      })
      mapInstanceRef.current.fitBounds(bounds)
    }
  }, [filteredProjects, onViewDetails, formatCurrency, formatDate, projectAccessData])

  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google || !window.google.maps || !window.google.maps.MapTypeId) {
      return
    }

    try {
      const mapOptions = {
        center: {
          lat: mapCenter[0],
          lng: mapCenter[1]
        },
        zoom: filteredProjects.length === 1 ? 15 : 10,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        mapTypeControl: false,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      }

      // Create map
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions)

      // Create info window
      infoWindowRef.current = new window.google.maps.InfoWindow({ 
        content: '',
        position: { lat: mapCenter[0], lng: mapCenter[1] }
      })

      // Add markers to the map
      addMarkersToMap()

      // Add map click listener to close popup when clicking elsewhere
      mapInstanceRef.current.addListener('click', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.close()
        }
        setSelectedProject(null)
      })

      setError(null)
    } catch (err) {
      setError('Failed to initialize map')
    }
  }, [mapCenter, filteredProjects.length, addMarkersToMap])

  // Initialize map when Google Maps is loaded
  useEffect(() => {
    if (isLoaded && mapRef.current) {
      initializeMap()
    }
  }, [isLoaded, initializeMap])

  // Handle Google Maps loading errors
  useEffect(() => {
    if (mapsError) {
      setError(mapsError)
    }
  }, [mapsError])

  // Update markers when projects change
  useEffect(() => {
    if (mapInstanceRef.current && isLoaded && filteredProjects.length > 0) {
      addMarkersToMap()
    }
  }, [filteredProjects, addMarkersToMap, isLoaded])

  if (error) {
    return (
      <div className="h-[600px] rounded-lg border bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Map Unavailable</h3>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Project List Sidebar */}
      <div className="lg:col-span-1 order-2 lg:order-1">
        <Card className="h-full">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4 text-gray-600" />
              <h3 className="font-semibold text-sm">Available Projects</h3>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <CardContent className="p-0">
            <div className="h-[480px] overflow-y-auto">
              {filteredProjects.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">
                    {debouncedSearchQuery.trim() 
                      ? `No projects found for "${debouncedSearchQuery}"`
                      : "No projects with location data found."
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-2 p-4">
                  {filteredProjects.map((project, index) => {
                    const hasAccess = projectAccessData[project.id]?.hasAccess || false
                    const projectAccessFee = clientConfig.pricing.getProjectAccessFeeInDollars()
                    
                    return (
                      <div
                        key={project.id || `project-${index}`}
                        onClick={() => {
                          setSelectedProject(project)
                          handleProjectClick(project)
                        }}
                        className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                          selectedProject?.id === project.id
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm line-clamp-2 text-gray-900">
                          {project.project_title}
                        </h4>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">
                            {hasAccess ? (
                              // Show full address if contractor has purchased access
                              project.location?.address && project.location?.city
                                ? `${project.location.address}, ${project.location.city}`
                                : project.location?.city && project.location?.province
                                ? `${project.location.city}, ${project.location.province}`
                                : 'Location available'
                            ) : (
                              // Show only city and province for privacy
                              project.location?.city && project.location?.province
                                ? `${project.location.city}, ${project.location.province}`
                                : 'Location available'
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
                          <DollarSign className="h-3 w-3" />
                          <span>{formatCurrency(project.budget || 0)}</span>
                        </div>

                        {project.category && project.category.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {project.category.slice(0, 2).map((cat, index) => (
                              <Badge key={`category-${project.id}-${index}-${cat}`} variant="secondary" className="text-xs">
                                {cat}
                              </Badge>
                            ))}
                            {project.category.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{project.category.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}

                        {project.start_date && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>Starts {formatDate(project.start_date)}</span>
                          </div>
                        )}

                        {!hasAccess ? (
                          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                            <Lock className="h-3 w-3" />
                            <span>Access Required: ${projectAccessFee.toFixed(2)}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                            <CheckCircle className="h-3 w-3" />
                            <span>You have access</span>
                          </div>
                        )}
                      </div>
                    </div>
                    )
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Google Map */}
      <div className="lg:col-span-2 order-1 lg:order-2">
        <Card className="h-full">
          <CardContent className="p-0 h-full">
            <div className="h-full rounded-lg overflow-hidden relative">
              <div 
                ref={mapRef} 
                className="w-full h-full relative z-10"
                style={{ minHeight: '300px' }}
              />
              {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-20">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading map...</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && paymentProject && user && (
        <ProjectPaymentModal
          isOpen={showPaymentModal}
          onClose={handlePaymentModalClose}
          project={paymentProject}
          userId={user.id}
          isVerified={verificationStatus?.isVerified || false}
        />
      )}
      
      {/* Profile Completion Modal */}
      <ProfileCompletionModal 
        isOpen={showProfileCompletionModal}
        onClose={() => setShowProfileCompletionModal(false)}
        userProfile={userProfile}
        contractorProfile={contractorProfile}
      />
      
      {/* Verification Redirect Modal */}
      <VerificationRedirectModal 
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        user={user ? { id: user.id, email: user.email } : undefined}
      />
    </div>
  )
}
