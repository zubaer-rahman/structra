export interface NormalizedFileReference {
  id: string
  filename: string
  url: string
  size?: number
  mimeType?: string
  uploadedAt?: Date
}

/**
 * Normalizes a single file reference that may be a JSON-encoded string,
 * a plain URL string, or a FileReference object.
 */
export function normalizeFileReference(
  file: unknown,
  defaultName = 'File'
): NormalizedFileReference | null {
  if (!file) return null

  let parsed: any = file

  if (typeof file === 'string') {
    const trimmed = file.trim()
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        parsed = JSON.parse(trimmed)
      } catch {
        // Fall through to plain URL check
      }
    }
    
    if (typeof parsed === 'string') {
      const url = parsed.trim()
      if (
        url.startsWith('http://') ||
        url.startsWith('https://') ||
        url.startsWith('/') ||
        url.startsWith('blob:') ||
        url.startsWith('data:')
      ) {
        return {
          id: crypto.randomUUID(),
          filename: defaultName,
          url,
          uploadedAt: new Date()
        }
      }
      return null
    }
  }

  if (typeof parsed === 'object' && parsed !== null) {
    let url = parsed.url || parsed.path || parsed.publicUrl || ''
    if (typeof url !== 'string' || url.trim() === '') return null

    // In case url was itself a serialized JSON object string
    url = url.trim()
    if (url.startsWith('{') && url.endsWith('}')) {
      try {
        const nested = JSON.parse(url)
        if (nested.url && typeof nested.url === 'string') {
          url = nested.url.trim()
        }
      } catch {}
    }

    return {
      id: parsed.id || crypto.randomUUID(),
      filename: parsed.filename || parsed.name || defaultName,
      url,
      size: typeof parsed.size === 'number' ? parsed.size : undefined,
      mimeType: parsed.mimeType || parsed.type || 'image/jpeg',
      uploadedAt: parsed.uploadedAt ? new Date(parsed.uploadedAt) : new Date()
    }
  }

  return null
}

/**
 * Normalizes an array of file references (which may contain objects, JSON strings, or plain URLs).
 */
export function normalizeFileReferences(
  files: unknown,
  defaultName = 'File'
): NormalizedFileReference[] {
  if (!files || !Array.isArray(files)) return []
  return files
    .map((f, i) => normalizeFileReference(f, `${defaultName} ${i + 1}`))
    .filter((f): f is NormalizedFileReference => f !== null)
}
