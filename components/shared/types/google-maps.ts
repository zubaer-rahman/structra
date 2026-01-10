// Shared Google Maps types to avoid conflicts

export interface GoogleMaps {
  maps: {
    places: {
      PlacesService: new (element: HTMLElement) => any
      AutocompleteService: new () => any
      PlacesServiceStatus: {
        OK: string
        ZERO_RESULTS: string
        OVER_QUERY_LIMIT: string
        REQUEST_DENIED: string
        INVALID_REQUEST: string
        UNKNOWN_ERROR: string
      }
    }
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

export interface MapOptions {
  center: { lat: number; lng: number }
  zoom: number
  mapTypeId: string
  disableDefaultUI?: boolean
  zoomControl?: boolean
  streetViewControl?: boolean
  fullscreenControl?: boolean
  mapTypeControl?: boolean
}

export interface MarkerOptions {
  position: { lat: number; lng: number }
  map: any
  title?: string
  animation?: number
}

export interface InfoWindowOptions {
  content: string
  position?: { lat: number; lng: number }
}

export interface StreetViewPanoramaOptions {
  position: { lat: number; lng: number }
  pov: { heading: number; pitch: number }
  visible: boolean
}

export interface AutocompleteService {
  getPlacePredictions(
    request: {
      input: string
      types?: string[]
      componentRestrictions?: { country: string }
    },
    callback: (predictions: PlacePrediction[] | null, status: string) => void
  ): void
}

export interface PlacePrediction {
  description: string
  place_id: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
}

export interface PlacesService {
  getDetails(
    request: {
      placeId: string
      fields: string[]
    },
    callback: (place: PlaceResult | null, status: string) => void
  ): void
}

export interface PlaceResult {
  formatted_address: string
  geometry: {
    location: {
      lat(): number
      lng(): number
    }
  }
  address_components: Array<{
    long_name: string
    short_name: string
    types: string[]
  }>
}

declare global {
  interface Window {
    google: GoogleMaps
    initGoogleMaps?: () => void
    initGoogleMapsLocation?: () => void
  }
}
