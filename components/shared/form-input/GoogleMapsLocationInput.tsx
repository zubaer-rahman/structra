'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { MapPin, Search, X, Navigation } from 'lucide-react'
import { useGoogleMaps } from '@/hooks/useGoogleMaps'

interface LocationData {
  address: string
  latitude: number
  longitude: number
  city: string | null
  province: string | null
  postalCode: string | null
  country: string | null
}

interface GoogleMapsLocationInputProps {
  value: LocationData | null
  onChange: (location: LocationData | null) => void
  onBlur?: () => void
  label?: string
  placeholder?: string
  required?: boolean
  error?: string
  helperText?: string
  className?: string
  showMap?: boolean
  showSelectedLocation?: boolean
}

import type { GoogleMaps, MapOptions, MarkerOptions, InfoWindowOptions, AutocompleteService, PlacePrediction, PlacesService, PlaceResult } from '../types/google-maps'

// Simple Map Component using Google Maps
function GoogleLocationMap({
  latitude,
  longitude,
  address,
  className = "",
}: {
  latitude: number
  longitude: number
  address: string
  className?: string
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mapInstanceRef = useRef<any | null>(null)
  const markerRef = useRef<any | null>(null)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google || !window.google.maps || !window.google.maps.MapTypeId || !latitude || !longitude) {
      return
    }

    try {
      const mapOptions = {
        center: { lat: latitude, lng: longitude },
        zoom: 15,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      }

      const map = new window.google.maps.Map(mapRef.current, mapOptions)
      mapInstanceRef.current = map

      // Add marker
      const marker = new window.google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: map,
        title: address,
      })
      markerRef.current = marker

      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <div style="font-weight: 600; margin-bottom: 4px;">${address}</div>
            <div style="font-size: 12px; color: #666;">
              ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
            </div>
          </div>
        `,
        position: { lat: latitude, lng: longitude },
      })

      marker.addListener('click', () => {
        infoWindow.open(map, marker)
      })

      setIsLoaded(true)
    } catch (err) {
      console.error('Error initializing Google Map:', err)
      setError('Failed to initialize map')
    }
  }, [latitude, longitude, address])

  useEffect(() => {
    if (!apiKey) {
      setError('Google Maps API key is not configured')
      return
    }

    if (!latitude || !longitude) {
      setError('Location coordinates are not available')
      return
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initializeMap()
      return
    }

    // Load Google Maps script
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`
    script.async = true
    script.defer = true
    
    window.initGoogleMapsLocation = () => {
      setIsLoaded(true)
      initializeMap()
    }
    
    script.onload = window.initGoogleMapsLocation
    script.onerror = () => {
      setError('Failed to load Google Maps')
    }

    document.head.appendChild(script)

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
      delete window.initGoogleMapsLocation
    }
  }, [apiKey, latitude, longitude, initializeMap])

  if (error) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center p-6">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  if (!latitude || !longitude) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center p-6">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            Select a location to view on map
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      <div className="p-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Navigation className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">
            Location Map
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1 truncate">{address}</p>
      </div>
      <div className="relative">
        <div ref={mapRef} style={{ height: '200px', width: '100%' }} />
      </div>
      <div className="p-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>
            Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </span>
          <a
            href={`https://www.google.com/maps?q=${latitude},${longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            Open in Google Maps
          </a>
        </div>
      </div>
    </div>
  )
}

export function GoogleMapsLocationInput({
  value,
  onChange,
  onBlur,
  label,
  placeholder = "Search for a location...",
  required = false,
  error,
  helperText,
  className = "",
  showMap = false,
  showSelectedLocation = true,
}: GoogleMapsLocationInputProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<PlacePrediction[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(value)
  
  // Use the singleton Google Maps hook
  const { isLoaded: isGoogleMapsLoaded, error: googleMapsError } = useGoogleMaps()

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const autocompleteServiceRef = useRef<AutocompleteService | null>(null)
  const placesServiceRef = useRef<PlacesService | null>(null)

  // Initialize Google Maps services when loaded
  useEffect(() => {
    if (isGoogleMapsLoaded) {
      // Add a small delay to ensure Places library is fully loaded
      const timer = setTimeout(() => {
        initializeServices()
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [isGoogleMapsLoaded])

  // Handle Google Maps loading errors
  useEffect(() => {
    if (googleMapsError) {
      console.error('Google Maps loading error:', googleMapsError)
    }
  }, [googleMapsError])

  const initializeServices = useCallback(() => {
    if (!window.google || !window.google.maps || !window.google.maps.places) return

    try {
      // Create a dummy div for PlacesService
      const dummyDiv = document.createElement('div')
      placesServiceRef.current = new window.google.maps.places.PlacesService(dummyDiv)
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService()
    } catch (error) {
      console.error('Failed to initialize Google Places services:', error)
    }
  }, [])

  // Update selected location when value prop changes
  useEffect(() => {
    setSelectedLocation(value)
  }, [value])

  // Debounced search function using Google Places Autocomplete
  const searchLocation = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3 || !autocompleteServiceRef.current) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: query,
          types: ['address'],
          componentRestrictions: { country: 'ca' }, // Restrict to Canada
        },
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSearchResults(predictions)
          } else {
            setSearchResults([])
          }
          setIsSearching(false)
        }
      )
    } catch (error) {
      console.error("Location search failed:", error)
      setSearchResults([])
      setIsSearching(false)
    }
  }, [])

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    setShowResults(true)

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(query)
    }, 300)
  }

  // Handle location selection from search results
  const handleLocationSelect = useCallback((prediction: PlacePrediction) => {
    if (!placesServiceRef.current) return

    placesServiceRef.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: [
          'formatted_address',
          'geometry',
          'address_components',
        ],
      },
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          const locationData: LocationData = {
            address: place.formatted_address,
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
            city: null,
            province: null,
            postalCode: null,
            country: null,
          }

          // Extract address components
          place.address_components.forEach((component) => {
            const types = component.types
            if (types.includes('locality')) {
              locationData.city = component.long_name
            } else if (types.includes('administrative_area_level_1')) {
              locationData.province = component.long_name
            } else if (types.includes('postal_code')) {
              locationData.postalCode = component.long_name
            } else if (types.includes('country')) {
              locationData.country = component.long_name
            }
          })

          setSelectedLocation(locationData)
          onChange(locationData)
          setSearchQuery(place.formatted_address)
          setShowResults(false)
        }
      }
    )
  }, [onChange])

  // Handle clearing location
  const handleClearLocation = () => {
    setSelectedLocation(null)
    onChange(null)
    setSearchQuery("")
    setShowResults(false)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  // Handle clicking outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      {label && (
        <Label htmlFor="location-input" className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={inputRef}
            id="location-input"
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onBlur={onBlur}
            placeholder={placeholder}
            className={`pl-10 pr-10 ${error ? 'border-red-500' : ''}`}
            disabled={!isGoogleMapsLoaded}
          />
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearLocation}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div
            ref={resultsRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {searchResults.map((result, index) => (
              <button
                key={result.place_id}
                type="button"
                onClick={() => handleLocationSelect(result)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {result.structured_formatting.main_text}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {result.structured_formatting.secondary_text}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Loading State */}
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Selected Location Display */}
      {selectedLocation && showSelectedLocation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="font-medium text-blue-900 text-lg">
                {selectedLocation.address}
              </div>
              <div className="text-sm text-blue-700 mt-1">
                {[
                  selectedLocation.city,
                  selectedLocation.province,
                  selectedLocation.postalCode,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </div>
              {/* Show country if available */}
              {selectedLocation.country && (
                <div className="text-xs text-blue-600 mt-1 flex items-center space-x-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {selectedLocation.country}
                  </span>
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearLocation}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Location Map */}
          {showMap && (
            <GoogleLocationMap
              latitude={selectedLocation.latitude}
              longitude={selectedLocation.longitude}
              address={selectedLocation.address}
              className="mt-3"
            />
          )}
        </div>
      )}

      {/* Helper Text */}
      {helperText && <p className="text-sm text-gray-600">{helperText}</p>}

    </div>
  )
}
