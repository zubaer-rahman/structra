'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { GeospatialLocation } from '@/server/database/interfaces/common'
import { useGoogleMaps } from '@/hooks/useGoogleMaps'
import './types/google-maps'

interface GoogleMapProps {
  location: GeospatialLocation
  height?: string
  width?: string
  zoom?: number
  className?: string
  showInfoWindow?: boolean
  title?: string
}

// Google Maps types
interface GoogleMaps {
  maps: {
    Map: new (element: HTMLElement, options: MapOptions) => any
    Marker: new (options: MarkerOptions) => any
    InfoWindow: new (options: InfoWindowOptions) => any
    StreetViewService: new () => any
    StreetViewPanorama: new (element: HTMLElement, options: StreetViewPanoramaOptions) => any
    MapTypeId: {
      ROADMAP: string
      SATELLITE: string
      HYBRID: string
      TERRAIN: string
    }
  }
}

interface MapOptions {
  center: { lat: number; lng: number }
  zoom: number
  mapTypeId: string
  disableDefaultUI: boolean
  zoomControl: boolean
  streetViewControl: boolean
  fullscreenControl: boolean
  mapTypeControl: boolean
}

interface MarkerOptions {
  position: { lat: number; lng: number }
  map: any
  title: string
  animation: number
}

interface InfoWindowOptions {
  content: string
}

interface Map {
  setCenter: (position: { lat: number; lng: number }) => void
}

interface Marker {
  setPosition: (position: { lat: number; lng: number }) => void
  addListener: (event: string, callback: () => void) => void
}

interface InfoWindow {
  open: (map: Map, marker: Marker) => void
}

interface StreetViewService {
  getPanorama: (request: StreetViewRequest, callback: (data: StreetViewData | null, status: string) => void) => void
}

interface StreetViewData {
  location: {
    pano: string
  }
}

interface StreetViewPanoramaOptions {
  position: { lat: number; lng: number }
  pov: { heading: number; pitch: number }
  visible: boolean
}

interface StreetViewPanorama {
  setPano: (pano: string) => void
  setVisible: (visible: boolean) => void
}

interface StreetViewRequest {
  location: { lat: number; lng: number }
  radius: number
}


export default function GoogleMap({
  location,
  height = '300px',
  width = '100%',
  zoom = 15,
  className = '',
  showInfoWindow = true,
  title = 'Project Location'
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const mapInstanceRef = useRef<any | null>(null)
  const markerRef = useRef<any | null>(null)
  const streetViewRef = useRef<HTMLDivElement>(null)

  // Use the centralized Google Maps hook
  const { isLoaded, error: mapsError } = useGoogleMaps()

  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google || !window.google.maps || !window.google.maps.MapTypeId || !location.latitude || !location.longitude) {
      return
    }

    try {
      const mapOptions = {
        center: {
          lat: location.latitude,
          lng: location.longitude
        },
        zoom: zoom,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        mapTypeControl: false
      }

      // Create map
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions)

      // Create marker
      markerRef.current = new window.google.maps.Marker({
        position: {
          lat: location.latitude,
          lng: location.longitude
        },
        map: mapInstanceRef.current,
        title: title
      })

      // Create info window if enabled
      if (showInfoWindow) {
        const infoContent = `
          <div style="padding: 8px; max-width: 250px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${title}</h3>
            <p style="margin: 0; font-size: 14px; color: #666;">
              ${location.address}<br>
              ${location.city}, ${location.province}<br>
              ${location.postalCode}
            </p>
          </div>
        `

        const infoWindow = new window.google.maps.InfoWindow({
          content: infoContent
        })

        // Show info window on marker click
        markerRef.current.addListener('click', () => {
          if (mapInstanceRef.current && markerRef.current) {
            infoWindow.open(mapInstanceRef.current, markerRef.current)
          }
        })

        // Auto-open info window
        if (mapInstanceRef.current && markerRef.current) {
          infoWindow.open(mapInstanceRef.current, markerRef.current)
        }
      }

      // Initialize Street View if enabled
      if (showInfoWindow && streetViewRef.current) {
        const streetViewService = new window.google.maps.StreetViewService()
        const streetViewPanorama = new window.google.maps.StreetViewPanorama(streetViewRef.current, {
          position: { lat: location.latitude, lng: location.longitude },
          pov: { heading: 0, pitch: 0 },
          visible: true
        })

        streetViewService.getPanorama({
          location: { lat: location.latitude, lng: location.longitude },
          radius: 50
        }, (data: any, status: string) => {
          if (status === 'OK' && data) {
            streetViewPanorama.setPano(data.location.pano)
            streetViewPanorama.setVisible(true)
          }
        })
      }

      setError(null)
    } catch (err) {
      console.error('Error initializing Google Maps:', err)
      setError('Failed to initialize map')
    }
  }, [location.latitude, location.longitude, zoom, title, showInfoWindow, location.address, location.city, location.postalCode, location.province])

  // Initialize map when Google Maps is loaded
  useEffect(() => {
    if (isLoaded && mapRef.current && location.latitude && location.longitude) {
      // Add a small delay to ensure all Google Maps properties are fully loaded
      const timer = setTimeout(() => {
        initializeMap()
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [isLoaded, location.latitude, location.longitude])

  // Handle Google Maps loading errors
  useEffect(() => {
    if (mapsError) {
      setError(mapsError)
    }
  }, [mapsError])

  // Update map when location changes
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && location.latitude && location.longitude) {
      const newPosition = {
        lat: location.latitude,
        lng: location.longitude
      }
      
      mapInstanceRef.current.setCenter(newPosition)
      markerRef.current.setPosition(newPosition)
    }
  }, [location.latitude, location.longitude])

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 border border-gray-200 rounded-lg ${className}`}
        style={{ height, width }}
      >
        <div className="text-center p-4">
          <div className="text-gray-500 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-sm text-gray-600">{error}</p>
          <div className="mt-2 text-xs text-gray-500">
            <p>{location.address}</p>
            <p>{location.city}, {location.province} {location.postalCode}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={{ height, width }}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        {/* Map View */}
        <div className="relative">
          <div 
            ref={mapRef} 
            className="w-full h-full rounded-lg border border-gray-200"
            style={{ minHeight: '400px' }}
          />
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading map...</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Street View */}
        <div className="relative">
          <div 
            ref={streetViewRef} 
            className="w-full h-full rounded-lg border border-gray-200"
            style={{ minHeight: '400px' }}
          />
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading street view...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Export a lightweight version for cases where we just want to show address
export function LocationDisplay({ location, className = '', height = '250px' }: { location: GeospatialLocation, className?: string, height?: string }) {
  if (!location.latitude || !location.longitude) {
    return (
      <div className={`p-3 bg-gray-50 rounded-lg border ${className}`}>
        <div className="flex items-center gap-2 text-gray-600 mb-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm font-medium">Address</span>
        </div>
        <div className="text-sm text-gray-700">
          <p>{location.address || 'Address not specified'}</p>
          <p>
            {[location.city, location.province, location.postalCode]
              .filter(Boolean)
              .join(', ') || 'Location details not available'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <GoogleMap 
        location={location} 
        height={height} 
        zoom={15}
        title="Project Location"
      />
    </div>
  )
}