export interface LocationObject {
  address?: string
  city?: string
  province?: string
  postalCode?: string
  latitude?: number
  longitude?: number
}

/**
 * Safely format project location whether it is an object, stringified JSON, or plain text.
 */
export function formatLocation(location: unknown): string {
  if (!location) return 'Location not specified'

  if (typeof location === 'string') {
    const trimmed = location.trim()
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed) as LocationObject
        if (parsed && typeof parsed === 'object') {
          const parts = [parsed.address, parsed.city, parsed.province].filter(Boolean)
          if (parts.length > 0) {
            return parts.join(', ')
          }
          if (parsed.city && parsed.province) {
            return `${parsed.city}, ${parsed.province}`
          }
          if (parsed.city) return parsed.city
          if (parsed.postalCode) return parsed.postalCode
        }
      } catch {
        return location
      }
    }
    return location
  }

  if (typeof location === 'object' && location !== null) {
    const locObj = location as LocationObject
    const parts = [locObj.address, locObj.city, locObj.province].filter(Boolean)
    if (parts.length > 0) {
      return parts.join(', ')
    }
    if (locObj.city && locObj.province) {
      return `${locObj.city}, ${locObj.province}`
    }
    if (locObj.city) return locObj.city
    if (locObj.postalCode) return locObj.postalCode
  }

  return 'Location not specified'
}
