'use client'

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MapPin, DollarSign, Calendar, Building2, Search } from 'lucide-react'
import { Project } from '@/server/database/interfaces'
import Image from 'next/image'
import { useGoogleMaps } from '@/hooks/useGoogleMaps'

// Use any for Google Maps types to avoid conflicts

// Global types are already declared in the shared GoogleMap component

interface MapViewProps {
  projects: Project[]
  selectedProject: Project | null
  mapCenter: [number, number]
  isClient: boolean
  onProjectClick: (project: Project) => void
  formatBudget: (budget: number) => string
  formatDate: (dateString: string) => string
  onSearch: (query: string) => void
  searchQuery: string
  obfuscate?: boolean
}

export default function GoogleMapView({
  projects,
  selectedProject,
  mapCenter,
  isClient,
  onProjectClick,
  formatBudget,
  formatDate,
  onSearch,
  searchQuery,
  obfuscate = true
}: MapViewProps) {
  const [error, setError] = useState<string | null>(null)
  
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const infoWindowRef = useRef<any>(null)

  // Use the centralized Google Maps hook
  const { isLoaded, error: mapsError } = useGoogleMaps()

  const addMarkersToMap = useCallback(() => {
    if (!mapInstanceRef.current || !projects.length) {
      return;
    }
    
    // Clear existing markers
    markersRef.current.forEach(marker => {
      marker.setPosition({ lat: 0, lng: 0 })
    })
    markersRef.current = []

    // Add markers for filtered projects
    
    const projectsWithCoords = projects.filter((project) => {
      const hasCoords = project.location?.latitude && project.location?.longitude;
      return hasCoords;
    });
    
    
    // Helper: stable seeded random for consistent jitter per project
    const seededRandom = (seedStr: string) => {
      let h = 2166136261 >>> 0
      for (let i = 0; i < seedStr.length; i++) {
        h ^= seedStr.charCodeAt(i)
        h = Math.imul(h, 16777619)
      }
      // Mulberry32
      let t = (h + 0x6D2B79F5) >>> 0
      return () => {
        t += 0x6D2B79F5
        let r = Math.imul(t ^ (t >>> 15), 1 | t)
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296
      }
    }

    const metersToDegrees = (meters: number, latDeg: number) => {
      const metersPerDegLat = 111320
      const metersPerDegLng = 111320 * Math.cos((latDeg * Math.PI) / 180)
      return { degLat: meters / metersPerDegLat, metersPerDegLng }
    }

    const getJitteredPosition = (lat: number, lng: number, key: string) => {
      const rand = seededRandom(key)
      // uniform in circle: r = R * sqrt(u), theta = 2pi*v
      const u = rand()
      const v = rand()
      const R = 500; // meters
      const r = R * Math.sqrt(u)
      const theta = 2 * Math.PI * v
      const { degLat, metersPerDegLng } = metersToDegrees(1, lat)
      const deltaLat = (r * Math.cos(theta)) * degLat
      const deltaLng = metersPerDegLng === 0 ? 0 : (r * Math.sin(theta)) / metersPerDegLng
      return { lat: lat + deltaLat, lng: lng + deltaLng }
    }

    projectsWithCoords.forEach((project) => {
      const isSelected = selectedProject?.id === project.id
      
      const baseLat = Number(project.location.latitude);
      const baseLng = Number(project.location.longitude);
      const pos = obfuscate
        ? getJitteredPosition(baseLat, baseLng, String(project.id || project.slug || 'project'))
        : { lat: baseLat, lng: baseLng }
      

      const marker = new window.google.maps.Marker({
        position: {
          lat: pos.lat,
          lng: pos.lng
        },
        map: mapInstanceRef.current!,
        title: project.project_title || 'Project'
      })

        // Create info window content
        const infoContent = `
          <div style="padding: 8px 12px; max-width: calc(100vw - 40px); min-width: 200px; width: 280px; position: relative; z-index: 1001; pointer-events: auto; font-family: system-ui, -apple-system, sans-serif; box-sizing: border-box; cursor: pointer;" onclick="window.open('/recent-project-preview/${project.slug || project.id}', '_blank')">
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
                  max-width: 280px !important;
                  width: 280px !important;
                  max-height: 200px !important;
                  overflow: hidden !important;
                }
              }
              @media (max-width: 480px) {
                .gm-style .gm-style-iw-c {
                  max-width: 240px !important;
                  width: 240px !important;
                  max-height: 180px !important;
                  overflow: hidden !important;
                }
              }
            </style>
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; line-height: 1.3; color: #1f2937; word-wrap: break-word; overflow-wrap: break-word;">
              ${project.project_title || 'Untitled Project'}
            </h3>
          
            ${project.homeowner ? `
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <img 
                  src="${project.homeowner.profile_photo || '/assets/avatar.png'}" 
                  alt="${project.homeowner.full_name || 'Homeowner'}"
                  style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover; flex-shrink: 0;"
                  onerror="this.src='/assets/avatar.png'"
                />
                <span style="font-size: 13px; color: #6b7280; font-weight: 500; word-wrap: break-word; overflow-wrap: break-word;">
                  ${project.homeowner.full_name || 'Homeowner'}
                </span>
              </div>
            ` : ''}
          
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 10px;">
              ${project.category && project.category.length > 0 ? `
                <div style="display: flex; flex-wrap: wrap; gap: 3px; margin-top: 4px;">
                  ${project.category.slice(0, 2).map(cat => 
                    `<span style="background: #f3f4f6; color: #374151; padding: 3px 6px; border-radius: 4px; font-size: 10px; font-weight: 500; word-wrap: break-word; overflow-wrap: break-word; max-width: 100px; display: inline-block;">${cat}</span>`
                  ).join('')}
                  ${project.category.length > 2 ? 
                    `<span style="background: #e5e7eb; color: #6b7280; padding: 3px 6px; border-radius: 4px; font-size: 10px;">+${project.category.length - 2}</span>` 
                    : ''
                  }
                </div>
              ` : ''}
            </div>
          
            <button 
              id="project-details-btn-${project.id}"
              style="
                background: #f97316; 
                color: white; 
                border: none; 
                padding: 3px 6px; 
                border-radius: 3px; 
                font-size: 9px; 
                font-weight: 500;
                cursor: pointer; 
                margin-top: 3px;
                transition: background-color 0.2s ease;
                box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                word-wrap: break-word;
                overflow-wrap: break-word;
                display: inline-block;
              "
              onmouseover="this.style.background='#ea580c'"
              onmouseout="this.style.background='#f97316'"
              onclick="event.stopPropagation(); window.open('/recent-project-preview/${project.slug || project.id}', '_blank')"
            >
              View Project Details
            </button>
        </div>
      `

      // Add hover listener for popup-like behavior
      let hoverTimeout: NodeJS.Timeout | null = null
      
      marker.addListener('mouseover', () => {
        if (hoverTimeout) {
          clearTimeout(hoverTimeout)
          hoverTimeout = null
        }
        
        if (infoWindowRef.current && mapInstanceRef.current) {
          infoWindowRef.current.setContent(infoContent)
          infoWindowRef.current.open(mapInstanceRef.current, marker)
          
          // Add event listener to the button after the info window is opened
          setTimeout(() => {
            const button = document.getElementById(`project-details-btn-${project.id}`)
            if (button) {
              // Remove any existing listeners first
              button.replaceWith(button.cloneNode(true))
              const newButton = document.getElementById(`project-details-btn-${project.id}`)
              if (newButton) {
                newButton.addEventListener('click', (e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  window.open(`/recent-project-preview/${project.slug || project.id}`, '_blank')
                })
              }
            }
          }, 100)
        }
      })

      marker.addListener('mouseout', () => {
        // Add a longer delay before closing to allow user to move to popup
        hoverTimeout = setTimeout(() => {
          if (infoWindowRef.current) {
            infoWindowRef.current.close()
          }
        }, 1000) // 1 second delay - gives plenty of time to move to popup
      })

      // Add click listener to marker
      marker.addListener('click', () => {
        if (hoverTimeout) {
          clearTimeout(hoverTimeout)
          hoverTimeout = null
        }
        
        if (infoWindowRef.current && mapInstanceRef.current) {
          infoWindowRef.current.setContent(infoContent)
          infoWindowRef.current.open(mapInstanceRef.current, marker)
        }
        onProjectClick(project)
      })

      markersRef.current.push(marker)
    })

    // Center map on selected project
    if (selectedProject && selectedProject.location?.latitude && selectedProject.location?.longitude) {
      const baseLat = Number(selectedProject.location.latitude)
      const baseLng = Number(selectedProject.location.longitude)
      const pos = obfuscate
        ? getJitteredPosition(baseLat, baseLng, String(selectedProject.id || selectedProject.slug || 'project'))
        : { lat: baseLat, lng: baseLng }
      mapInstanceRef.current.setCenter({
        lat: pos.lat,
        lng: pos.lng
      })
      mapInstanceRef.current.setZoom(15)
    }
  }, [projects, selectedProject, onProjectClick, formatBudget, obfuscate])

  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google || !window.google.maps || !window.google.maps.MapTypeId || !isClient) {
      return
    }

    // If map is already loaded, just add markers
    if (mapInstanceRef.current && isLoaded) {
      addMarkersToMap();
      return
    }

    try {
      const normalizedQuery = (searchQuery || '').trim().toLowerCase()
      const isCanadaSearch = normalizedQuery === '' || normalizedQuery === 'canada'
      const mapOptions = {
        center: {
          lat: mapCenter[0],
          lng: mapCenter[1]
        },
        zoom: selectedProject ? 15 : (isCanadaSearch ? 4 : 10),
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        mapTypeControl: false
      }

      // Create map
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions)

      // Create info window
      infoWindowRef.current = new window.google.maps.InfoWindow({ 
        content: '',
        position: { lat: mapCenter[0], lng: mapCenter[1] }
      })

      // Add markers to the map
      addMarkersToMap();

      // Add map click listener to close popup when clicking elsewhere
      mapInstanceRef.current.addListener('click', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.close()
        }
      })

      setError(null)
    } catch (err) {
      setError('Failed to initialize map')
    }
  }, [mapCenter, selectedProject, isClient, projects.length, onProjectClick, formatBudget, obfuscate])

  // Initialize map when Google Maps is loaded
  useEffect(() => {
    if (isLoaded && isClient && mapRef.current) {
      initializeMap()
    }
  }, [isLoaded, isClient, initializeMap])

  // Handle Google Maps loading errors
  useEffect(() => {
    if (mapsError) {
      setError(mapsError)
    }
  }, [mapsError])

  // Update map when selected project changes
  useEffect(() => {
    if (mapInstanceRef.current && selectedProject && selectedProject.location?.latitude && selectedProject.location?.longitude) {
      const baseLat = Number(selectedProject.location.latitude)
      const baseLng = Number(selectedProject.location.longitude)
      const pos = obfuscate
        ? (function(){
            // inline to avoid dependency on helper
            const seedStr = String(selectedProject.id || selectedProject.slug || 'project')
            let h = 2166136261 >>> 0
            for (let i = 0; i < seedStr.length; i++) { h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619) }
            let t = (h + 0x6D2B79F5) >>> 0
            const rnd = () => { t += 0x6D2B79F5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296 }
            const u = rnd(); const v = rnd(); const R = 100; const r = R * Math.sqrt(u); const theta = 2 * Math.PI * v
            const metersPerDegLat = 111320
            const metersPerDegLng = 111320 * Math.cos((baseLat * Math.PI) / 180)
            const deltaLat = (r * Math.cos(theta)) / metersPerDegLat
            const deltaLng = metersPerDegLng === 0 ? 0 : (r * Math.sin(theta)) / metersPerDegLng
            return { lat: baseLat + deltaLat, lng: baseLng + deltaLng }
          })()
        : { lat: baseLat, lng: baseLng }
      mapInstanceRef.current.setCenter({
        lat: pos.lat,
        lng: pos.lng
      })
      mapInstanceRef.current.setZoom(15)
    }
  }, [selectedProject, obfuscate])

  // Add markers when projects change
  useEffect(() => {
    if (mapInstanceRef.current && isLoaded && projects.length > 0) {
      addMarkersToMap();
    }
  }, [projects, addMarkersToMap, isLoaded])

  if (error) {
    return (
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-6 min-h-[500px] lg:h-[800px]">
        <div className="lg:col-span-1 overflow-hidden order-2 lg:order-1">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4" />
                Available Projects
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[400px] lg:max-h-[600px] overflow-y-auto">
                <div className="p-6 text-center text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Map unavailable</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2 order-1 lg:order-2">
          <Card className="h-full">
            <CardContent className="p-0 h-full">
              <div className="h-full rounded-lg overflow-hidden flex items-center justify-center bg-gray-100">
                <div className="text-center p-4">
                  <div className="text-gray-500 mb-2">
                    <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-6 min-h-[500px]">
      {/* Project List Sidebar */}
      <div className="lg:col-span-1 overflow-hidden order-2 lg:order-1">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4" />
              Available Projects
            </CardTitle>
            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by location or project..."
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] lg:max-h-[600px] overflow-y-auto">
              {projects.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>
                    {searchQuery.trim() 
                      ? `No projects found for "${searchQuery}"`
                      : "No projects in Canada"
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-2 p-4">
                  {projects.map((project, index) => (
                    <div
                      key={project.id || `project-${index}`}
                      onClick={() => onProjectClick(project)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                        selectedProject?.id === project.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="space-y-2">
                        <h3 className="font-semibold text-sm line-clamp-2">
                          {project.project_title}
                        </h3>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">
                            {project.location?.city && project.location?.province
                              ? `${project.location.city}, ${project.location.province}`
                              : project.location?.address || 'Location available'
                            }
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <DollarSign className="h-3 w-3" />
                          <span>{formatBudget(project.budget)}</span>
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
                            <span>Starts {formatDate(String(project.start_date))}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
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
                style={{ minHeight: '500px' }}
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
    </div>
  )
}
