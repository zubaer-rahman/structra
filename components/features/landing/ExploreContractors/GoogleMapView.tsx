'use client'

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, MapPin, Star, Shield, Wrench } from 'lucide-react'
import { User, ContractorProfile } from '@/server/database/interfaces'
import Image from 'next/image'
import { useGoogleMaps } from '@/hooks/useGoogleMaps'

// Use any for Google Maps types to avoid conflicts

// Global types are already declared in the shared GoogleMap component

interface ContractorWithProfile extends Omit<User, 'contractor_profile'> {
  contractor_profile?: ContractorProfile
  average_rating?: number
  rating_count?: number
  slug?: string
}

interface MapViewProps {
  contractors: ContractorWithProfile[]
  selectedContractor: ContractorWithProfile | null
  mapCenter: [number, number]
  isClient: boolean
  onContractorClick: (contractor: ContractorWithProfile) => void
  formatDate: (dateString: string) => string
  onSearch: (query: string) => void
  searchQuery: string
}

// Helper function to safely access contractor profile
const getContractorProfile = (contractor: ContractorWithProfile): ContractorProfile | null => {
  return contractor.contractor_profile || null
}

export default function GoogleMapView({
  contractors,
  selectedContractor,
  mapCenter,
  isClient,
  onContractorClick,
  formatDate,
  onSearch,
  searchQuery
}: MapViewProps) {
  const [error, setError] = useState<string | null>(null)
  
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const infoWindowRef = useRef<any>(null)

  // Use the centralized Google Maps hook
  const { isLoaded, error: mapsError } = useGoogleMaps()

  // Function to generate approximate coordinates very close to origin (~10 meters radius)
  const getApproximateLocation = useCallback((exactLat: number, exactLng: number, city?: string) => {
    // Random small offset within a 10m circle to avoid exact pinpointing while staying very close
    const metersRadius = 100; // desired max offset in meters
    const angle = Math.random() * 2 * Math.PI;
    const radius = Math.random() * metersRadius; // uniform in circle

    const metersToLat = 1 / 111320; // approx meters per degree latitude
    const metersToLng = 1 / (111320 * Math.cos((exactLat * Math.PI) / 180)); // adjust for latitude

    const dLat = radius * metersToLat * Math.sin(angle);
    const dLng = radius * metersToLng * Math.cos(angle);

    return {
      lat: exactLat + dLat,
      lng: exactLng + dLng
    }
  }, [])

  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google || !window.google.maps || !window.google.maps.MapTypeId || !isClient) {
      return
    }

    try {
      const mapOptions = {
        center: {
          lat: mapCenter[0],
          lng: mapCenter[1]
        },
        zoom: selectedContractor ? 15 : 10,
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
        position: { lat: mapCenter[0], lng: mapCenter[1] },
        disableAutoPan: true
      })

      // Clear existing markers
      markersRef.current.forEach(marker => {
        marker.setPosition({ lat: 0, lng: 0 })
      })
      markersRef.current = []

      // Add markers for filtered contractors
      contractors.forEach((contractor) => {
        const profile = getContractorProfile(contractor)
        if (!profile?.address?.latitude || !profile?.address?.longitude) return

        const isSelected = selectedContractor?.id === contractor.id

        const marker = new window.google.maps.Marker({
          position: getApproximateLocation(
            Number(profile.address.latitude),
            Number(profile.address.longitude),
            profile.address.city || undefined
          ),
          map: mapInstanceRef.current!,
          title: profile.business_name || `${contractor.first_name} ${contractor.last_name}`
        })

        // Create info window content
        const infoContent = `
          <div style="padding: 8px 12px; max-width: calc(100vw - 40px); min-width: 200px; width: 280px; position: relative; font-family: system-ui, -apple-system, sans-serif; box-sizing: border-box;">
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
            <h3 style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600; line-height: 1.2; color: #1f2937; word-wrap: break-word; overflow-wrap: break-word;">
              ${profile.business_name || `${contractor.first_name} ${contractor.last_name}`}
            </h3>
            
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
              <img 
                src="${contractor.profile_photo || '/assets/avatar.png'}" 
                alt="${contractor.first_name} ${contractor.last_name}"
                style="width: 20px; height: 20px; border-radius: 50%; object-fit: cover; flex-shrink: 0;"
                onerror="this.src='/assets/avatar.png'"
              />
              <span style="font-size: 11px; color: #6b7280; font-weight: 500; word-wrap: break-word; overflow-wrap: break-word;">
                ${contractor.first_name} ${contractor.last_name}
              </span>
            </div>
            
            <div style="font-size: 10px; color: #6b7280; margin-bottom: 8px;">
              <div style="margin-bottom: 3px; font-size: 9px; color: #9ca3af;">
                📍 Approximate location in ${profile.address?.city || 'area'}
              </div>
              ${contractor.average_rating && contractor.rating_count && contractor.rating_count > 0 ? `
                <div style="display: flex; align-items: center; gap: 3px; margin-bottom: 4px;">
                  <span style="font-size: 12px;">⭐</span>
                  <span style="font-weight: 500; color: #374151; word-wrap: break-word; overflow-wrap: break-word;">${contractor.average_rating.toFixed(1)} (${contractor.rating_count} reviews)</span>
                </div>
              ` : ''}
              
              ${profile.trade_category && profile.trade_category.length > 0 ? `
                <div style="display: flex; flex-wrap: wrap; gap: 2px; margin-top: 3px;">
                  ${profile.trade_category.slice(0, 1).map(trade => 
                    `<span style="background: #f3f4f6; color: #374151; padding: 2px 4px; border-radius: 3px; font-size: 9px; font-weight: 500; word-wrap: break-word; overflow-wrap: break-word; max-width: 80px; display: inline-block;">${trade}</span>`
                  ).join('')}
                  ${profile.trade_category.length > 1 ? 
                    `<span style="background: #e5e7eb; color: #6b7280; padding: 2px 4px; border-radius: 3px; font-size: 9px;">+${profile.trade_category.length - 1}</span>` 
                    : ''
                  }
                </div>
              ` : ''}
            </div>
            
            <button 
              onclick="window.open('/profile/${contractor.slug || contractor.id}', '_blank')"
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
            >
              View Profile
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
          onContractorClick(contractor)
        })

        markersRef.current.push(marker)
      })

      // Center map on selected contractor
      if (selectedContractor) {
        const profile = getContractorProfile(selectedContractor)
        if (profile?.address?.latitude && profile?.address?.longitude) {
          mapInstanceRef.current.setCenter({
            lat: Number(profile.address.latitude),
            lng: Number(profile.address.longitude)
          })
          mapInstanceRef.current.setZoom(15)
        }
      }

      // Add map click listener to close popup when clicking elsewhere
      mapInstanceRef.current.addListener('click', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.close()
        }
      })

      setError(null)
    } catch (err) {
      console.error('Error initializing Google Maps:', err)
      setError('Failed to initialize map')
    }
  }, [mapCenter, selectedContractor, isClient, contractors, onContractorClick])

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

  // Update map when selected contractor changes
  useEffect(() => {
    if (mapInstanceRef.current && selectedContractor) {
      const profile = getContractorProfile(selectedContractor)
      if (profile?.address?.latitude && profile?.address?.longitude) {
        mapInstanceRef.current.setCenter({
          lat: Number(profile.address.latitude),
          lng: Number(profile.address.longitude)
        })
        mapInstanceRef.current.setZoom(15)
      }
    }
  }, [selectedContractor])

  if (error) {
    return (
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-6 min-h-[500px] lg:h-[800px]">
        <div className="lg:col-span-1 overflow-hidden order-2 lg:order-1">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Wrench className="h-4 w-4" />
                Available Contractors
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[400px] lg:max-h-[600px] overflow-y-auto">
                <div className="p-6 text-center text-gray-500">
                  <Wrench className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Map unavailable</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2 order-1 lg:order-2">
          <Card className="h-full">
            <CardContent className="p0 h-full">
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
      {/* Contractor List Sidebar */}
      <div className="lg:col-span-1 overflow-hidden order-2 lg:order-1">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Wrench className="h-4 w-4" />
              Available Contractors
            </CardTitle>
            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by location or name..."
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] lg:max-h-[600px] overflow-y-auto">
              {contractors.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Wrench className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>
                    {searchQuery.trim() 
                      ? `No contractors found for "${searchQuery}"`
                      : "No contractors nearby"
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-2 p-4">
                  {contractors
                    .filter((contractor) => getContractorProfile(contractor))
                    .map((contractor, index) => {
                      const profile = getContractorProfile(contractor)!

                      return (
                      <div
                        key={contractor.id || `contractor-${index}`}
                        onClick={() => onContractorClick(contractor)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                          selectedContractor?.id === contractor.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Image
                              src={contractor.profile_photo || "/assets/avatar.png"}
                              alt={`${contractor.first_name} ${contractor.last_name}`}
                              width={32}
                              height={32}
                              className="rounded-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/assets/avatar.png";
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm line-clamp-1">
                                {profile.business_name || `${contractor.first_name} ${contractor.last_name}`}
                              </h3>
                              <p className="text-xs text-gray-600 truncate">
                                {contractor.first_name} {contractor.last_name}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">
                              {profile.address?.city && profile.address?.province
                                ? `${profile.address.city}, ${profile.address.province}`
                                : profile.address?.address || 'Location available'
                              }
                            </span>
                          </div>


                          {profile.trade_category && profile.trade_category.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {profile.trade_category.slice(0, 2).map((trade, index) => (
                                <Badge key={`trade-${contractor.id}-${index}-${trade}`} variant="secondary" className="text-xs">
                                  {trade}
                                </Badge>
                              ))}
                              {profile.trade_category.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{profile.trade_category.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}

                          {profile.is_admin_verified && (
                            <div className="flex items-center gap-1 text-xs text-green-600">
                              <Shield className="h-3 w-3" />
                              <span>Verified</span>
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
            <div className="h-full rounded-lg overflow-hidden">
              <div 
                ref={mapRef} 
                className="w-full h-full"
                style={{ minHeight: '500px' }}
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
