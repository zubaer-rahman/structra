'use client'

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useGoogleMaps } from '@/hooks/useGoogleMaps'

interface Project {
  id: string;
  project_title: string;
  statement_of_work: string;
  budget: number;
  category: string[];
  location: {
    city: string;
    province: string;
    address: string;
    latitude?: number;
    longitude?: number;
  };
  project_type: string;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
  project_photos: string[];
  creator: string;
  slug: string;
  homeowner: {
    id: string;
    full_name: string;
    profile_photo: string;
  };
}

interface ProjectMapViewProps {
  projects: Project[]
  selectedProject: Project | null
  mapCenter: [number, number]
  isClient: boolean
  onProjectClick: (project: Project) => void
  formatBudget: (budget: number) => string
  formatDate: (dateString: string) => string
}

export default function ProjectMapView({
  projects,
  selectedProject,
  mapCenter,
  isClient,
  onProjectClick,
  formatBudget,
  formatDate
}: ProjectMapViewProps) {
  const [error, setError] = useState<string | null>(null)
  
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const infoWindowRef = useRef<any>(null)
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Use the centralized Google Maps hook
  const { isLoaded, error: mapsError } = useGoogleMaps()

  // Filter projects that have valid coordinates
  const filteredProjects = useMemo(() => {
    return projects.filter(project => 
      project.location?.latitude && 
      project.location?.longitude &&
      !isNaN(Number(project.location.latitude)) &&
      !isNaN(Number(project.location.longitude))
    )
  }, [projects])

  const addMarkersToMap = useCallback(() => {
    if (!mapInstanceRef.current || !filteredProjects.length) return

    // Clear existing markers and timeouts
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []
    
    // Clear any pending tooltip timeout
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current)
      tooltipTimeoutRef.current = null
    }

    filteredProjects.forEach((project) => {
      if (!project.location?.latitude || !project.location?.longitude) return

      const position = {
        lat: Number(project.location.latitude),
        lng: Number(project.location.longitude)
      }

      const marker = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: project.project_title
      })

      const infoContent = `
        <div style="padding: 10px; max-width: calc(100vw - 40px); min-width: 200px; width: 260px; font-family: system-ui, -apple-system, sans-serif; box-sizing: border-box; cursor: pointer;" onclick="event.stopPropagation(); window.open('/recent-project-preview/${project.slug || project.id}', '_blank')">
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
                max-width: 260px !important;
                width: 260px !important;
              }
            }
            @media (max-width: 480px) {
              .gm-style .gm-style-iw-c {
                max-width: 220px !important;
                width: 220px !important;
              }
            }
          </style>
          <h3 style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600; color: #1f2937; line-height: 1.3; word-wrap: break-word; overflow-wrap: break-word;">${project.project_title}</h3>
          <p style="font-size: 12px; color: #6b7280; margin-bottom: 8px; line-height: 1.4; word-wrap: break-word; overflow-wrap: break-word;">${project.statement_of_work.substring(0, 80)}...</p>
          <div style="display: flex; align-items: center; font-size: 11px; color: #6b7280; margin-bottom: 6px;">
            <svg style="width: 12px; height: 12px; margin-right: 4px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span style="word-wrap: break-word; overflow-wrap: break-word;">${project.location?.city}, ${project.location?.province}</span>
          </div>
          <div style="display: flex; align-items: center; justify-between; margin-bottom: 8px;">
            <span style="font-size: 12px; font-weight: 600; color: #f97316; word-wrap: break-word; overflow-wrap: break-word;">${formatBudget(project.budget)}</span>
            <span style="padding: 2px 6px; background: #fed7aa; color: #9a3412; border-radius: 8px; font-size: 10px; word-wrap: break-word; overflow-wrap: break-word;">${project.project_type}</span>
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
              display: inline-block;
              transition: background-color 0.2s;
              word-wrap: break-word;
              overflow-wrap: break-word;
            "
            onmouseover="this.style.background='#ea580c'"
            onmouseout="this.style.background='#f97316'"
            onclick="event.stopPropagation(); window.open('/recent-project-preview/${project.slug || project.id}', '_blank')"
          >
            View Project Details
          </button>
        </div>
      `

      // Create tooltip content for hover
      const tooltipContent = `
        <div style="padding: 6px; max-width: 200px; min-width: 160px; width: 180px; background: white; border-radius: 6px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; font-family: system-ui, -apple-system, sans-serif; box-sizing: border-box; cursor: pointer;" onclick="event.stopPropagation(); window.open('/recent-project-preview/${project.slug || project.id}', '_blank')">
          <h4 style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #1f2937; line-height: 1.3; word-wrap: break-word; overflow-wrap: break-word;">${project.project_title}</h4>
          <div style="display: flex; align-items: center; font-size: 10px; color: #6b7280; margin-bottom: 4px;">
            <svg style="width: 10px; height: 10px; margin-right: 3px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span style="word-wrap: break-word; overflow-wrap: break-word;">${project.location?.city}, ${project.location?.province}</span>
          </div>
          <div style="display: flex; align-items: center; justify-between; margin-bottom: 6px;">
            <span style="font-size: 10px; font-weight: 600; color: #f97316; word-wrap: break-word; overflow-wrap: break-word;">${formatBudget(project.budget)}</span>
            <span style="padding: 1px 4px; background: #fed7aa; color: #9a3412; border-radius: 6px; font-size: 9px; word-wrap: break-word; overflow-wrap: break-word;">${project.project_type}</span>
          </div>
          <button 
            id="project-tooltip-btn-${project.id}"
            style="
              background: #f97316; 
              color: white; 
              border: none; 
              padding: 2px 4px; 
              border-radius: 2px; 
              font-size: 8px; 
              font-weight: 500;
              cursor: pointer; 
              display: inline-block;
              transition: background-color 0.2s;
              word-wrap: break-word;
              overflow-wrap: break-word;
            "
            onmouseover="this.style.background='#ea580c'"
            onmouseout="this.style.background='#f97316'"
            onclick="event.stopPropagation(); window.open('/recent-project-preview/${project.slug || project.id}', '_blank')"
          >
            View Details
          </button>
        </div>
      `

      // Create tooltip info window
      const tooltipInfoWindow = new window.google.maps.InfoWindow({
        content: tooltipContent,
        position: position
      })

      // Add hover listeners with delay to prevent flickering
      marker.addListener('mouseover', () => {
        // Clear any existing timeout
        if (tooltipTimeoutRef.current) {
          clearTimeout(tooltipTimeoutRef.current)
        }
        
        // Show tooltip after a short delay
        tooltipTimeoutRef.current = setTimeout(() => {
          tooltipInfoWindow.open(mapInstanceRef.current, marker)
        }, 300)
      })

      marker.addListener('mouseout', () => {
        // Clear timeout and close tooltip immediately
        if (tooltipTimeoutRef.current) {
          clearTimeout(tooltipTimeoutRef.current)
        }
        tooltipInfoWindow.close()
      })

      marker.addListener('click', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.close()
        }
        
        infoWindowRef.current = new window.google.maps.InfoWindow({
          content: infoContent,
          position: position
        })
        
        infoWindowRef.current.open(mapInstanceRef.current, marker)
        
        // Call onProjectClick to update selected project state
        onProjectClick(project)
      })

      markersRef.current.push(marker)
    })

    // Center map on selected project or first project
    if (selectedProject && selectedProject.location?.latitude && selectedProject.location?.longitude) {
      mapInstanceRef.current.setCenter({
        lat: Number(selectedProject.location.latitude),
        lng: Number(selectedProject.location.longitude)
      })
      mapInstanceRef.current.setZoom(15)
    } else if (filteredProjects.length > 0) {
      const firstProject = filteredProjects[0]
      mapInstanceRef.current.setCenter({
        lat: Number(firstProject.location.latitude),
        lng: Number(firstProject.location.longitude)
      })
      mapInstanceRef.current.setZoom(12)
    }
  }, [filteredProjects, selectedProject, onProjectClick, formatBudget])

  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google || !window.google.maps || !window.google.maps.MapTypeId || !isClient) return

    try {
      const mapOptions = {
        center: {
          lat: mapCenter[0],
          lng: mapCenter[1]
        },
        zoom: selectedProject ? 15 : 12,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        mapTypeControl: false
      }

      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions)
      infoWindowRef.current = new window.google.maps.InfoWindow({ 
        content: '',
        position: { lat: mapCenter[0], lng: mapCenter[1] }
      })

      addMarkersToMap()

      mapInstanceRef.current.addListener('click', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.close()
        }
      })

      setError(null)
    } catch (err) {
      console.error('Error initializing Google Maps:', err)
      setError('Failed to load map')
    }
  }, [mapCenter, selectedProject, addMarkersToMap, isClient])

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
      mapInstanceRef.current.setCenter({
        lat: Number(selectedProject.location.latitude),
        lng: Number(selectedProject.location.longitude)
      })
      mapInstanceRef.current.setZoom(15)
    }
  }, [selectedProject])

  // Add markers when projects change
  useEffect(() => {
    if (mapInstanceRef.current && isLoaded && filteredProjects.length > 0) {
      addMarkersToMap()
    }
  }, [filteredProjects, addMarkersToMap, isLoaded])

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg">
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
    )
  }

  return (
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
  )
}
