'use client'

import { useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { Icon } from 'leaflet'
import type { Map as LeafletMap } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, Search, X } from 'lucide-react'

// Fix for default marker icons in react-leaflet
const customIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

interface LocationMapProps {
  onLocationSelect: (coordinates: { lat: number; lng: number; address: string }) => void
  initialCoordinates?: { lat: number; lng: number }
  className?: string
  readOnly?: boolean
}

// Component to handle map click events
function MapClickHandler({ onLocationSelect, readOnly }: { onLocationSelect: (coordinates: { lat: number; lng: number; address: string }) => void; readOnly: boolean }) {
  useMapEvents({
    click: async (e) => {
      if (readOnly) return // Don't handle clicks in read-only mode
      
      const { lat, lng } = e.latlng
      
      try {
        // Reverse geocode to get address
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        )
        const data = await response.json()
        
        const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        
        onLocationSelect({ lat, lng, address })
      } catch {
        // Fallback to coordinates if geocoding fails
        const address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        onLocationSelect({ lat, lng, address })
      }
    }
  })
  
  return null
}

export default function LocationMap({ onLocationSelect, initialCoordinates, className = '', readOnly = false }: LocationMapProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{
    lat: string
    lon: string
    display_name: string
  }>>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number
    lng: number
    address: string
  } | null>(initialCoordinates ? {
    lat: initialCoordinates.lat,
    lng: initialCoordinates.lng,
    address: `${initialCoordinates.lat.toFixed(6)}, ${initialCoordinates.lng.toFixed(6)}`
  } : null)

  const mapRef = useRef<LeafletMap | null>(null)

  // Default center (can be customized based on user's location)
  const defaultCenter = { lat: 40.7128, lng: -74.0060 } // New York City

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`
      )
      const data = await response.json()
      setSearchResults(data)
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleLocationSelect = (coordinates: { lat: number; lng: number; address: string }) => {
    setSelectedLocation(coordinates)
    onLocationSelect(coordinates)
    
    // Center map on selected location
    if (mapRef.current) {
      mapRef.current.setView([coordinates.lat, coordinates.lng], 16)
    }
  }

  const handleSearchResultSelect = (result: { lat: string; lon: string; display_name: string }) => {
    const coordinates = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      address: result.display_name
    }
    
    handleLocationSelect(coordinates)
    setSearchQuery('')
    setSearchResults([])
  }

  const clearLocation = () => {
    setSelectedLocation(null)
    onLocationSelect({ lat: 0, lng: 0, address: '' })
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar - Hidden in read-only mode */}
      {!readOnly && (
        <div className="space-y-2">
          <Label htmlFor="location-search">Search for a location</Label>
          <div className="flex space-x-2">
            <Input
              id="location-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter address, city, or landmark..."
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button 
              onClick={handleSearch} 
              disabled={isSearching || !searchQuery.trim()}
              className="h-4 w-4"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="border rounded-md max-h-40 overflow-y-auto">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleSearchResultSelect(result)}
                  className="w-full text-left p-2 hover:bg-gray-50 border-b last:border-b-0 text-sm"
                >
                  <div className="font-medium">{result.display_name.split(',')[0]}</div>
                  <div className="text-gray-500 text-xs">
                    {result.display_name.split(',').slice(1).join(', ')}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Map Container */}
      <div className="border rounded-lg overflow-hidden">
        <MapContainer
          ref={mapRef}
          center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : [defaultCenter.lat, defaultCenter.lng]}
          zoom={selectedLocation ? 16 : 10}
          style={{ height: '400px', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Show marker for selected location */}
          {selectedLocation && (
            <Marker
              position={[selectedLocation.lat, selectedLocation.lng]}
              icon={customIcon}
            />
          )}
          
          <MapClickHandler onLocationSelect={handleLocationSelect} readOnly={readOnly} />
        </MapContainer>
      </div>

      {/* Selected Location Display - Hidden in read-only mode */}
      {selectedLocation && !readOnly && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2">
              <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">Selected Location</p>
                <p className="text-xs text-blue-700 mt-1">{selectedLocation.address}</p>
                <p className="text-xs text-blue-600 mt-1">
                  Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearLocation}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Instructions - Hidden in read-only mode */}
      {!readOnly && (
        <div className="text-xs text-gray-500">
          <p>• Click on the map to select a location</p>
          <p>• Use the search bar to find specific addresses</p>
          <p>• Selected coordinates will be saved with your project</p>
        </div>
      )}
    </div>
  )
}
