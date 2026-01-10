import { createClient } from '@/lib/supabase'

export interface SupabaseUploadResult {
  id: string
  url: string
  path: string
  size: number
  mimeType: string
  uploadedAt: string
  bucket: string
}

export interface FileValidationResult {
  isValid: boolean
  error?: string
}

export interface UploadOptions {
  folder?: string
  bucket?: string
  fileType?: 'photos' | 'documents' | 'contracts' | 'invoices' | 'blueprints' | 'other'
  transform?: {
    width?: number
    height?: number
    quality?: number
    format?: string
  }
}

class SupabaseStorageService {
  private supabase = createClient()
  private defaultBucket = 'buildready-files'

  /**
   * Check if the service is properly configured
   */
  isServiceConfigured(): boolean {
    // Check if we're in a browser environment and if Supabase client is working
    if (typeof window === 'undefined') return false
    
    try {
      // Try to access the Supabase client to see if it's configured
      const hasClient = !!(this.supabase && this.supabase.storage)
      console.log('Supabase client check:', { hasClient, supabase: !!this.supabase, storage: !!this.supabase?.storage })
      return hasClient
    } catch (error) {
      console.error('Error checking Supabase configuration:', error)
      return false
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): FileValidationResult {
    // Check file size (default 10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File size exceeds ${(maxSize / 1024 / 1024).toFixed(1)}MB limit`
      }
    }

    // Check file type
    const allowedTypes = [
      // Images
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      // Documents
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv'
    ]

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'File type not allowed'
      }
    }

    return { isValid: true }
  }

  /**
   * Upload file to Supabase storage
   */
  async uploadFile(file: File, options: UploadOptions = {}): Promise<SupabaseUploadResult> {
    if (!this.isServiceConfigured()) {
      throw new Error('Supabase storage is not configured')
    }

    const bucket = options.bucket || this.defaultBucket
    
    // Determine folder based on file type or use provided folder
    let folder = options.folder || ''
    if (!folder && options.fileType) {
      folder = options.fileType
    } else if (!folder) {
      // Auto-detect folder based on MIME type if no folder or fileType specified
      if (file.type.startsWith('image/')) {
        folder = 'photos'
      } else if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text')) {
        folder = 'documents'
      } else {
        folder = 'other'
      }
    }
    
    // Generate unique filename
    const timestamp = Date.now()
    const randomId = crypto.randomUUID().slice(0, 8)
    const extension = file.name.split('.').pop()
    const filename = `${timestamp}_${randomId}.${extension}`
    
    // Only add folder to path if folder is specified
    const filePath = folder ? `${folder}/${filename}` : filename

    try {
      // Upload file to Supabase storage
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw new Error(`Upload failed: ${error.message}`)
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      const result: SupabaseUploadResult = {
        id: data.path,
        url: urlData.publicUrl,
        path: filePath,
        size: file.size,
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
        bucket
      }

      return result
    } catch (error) {
      throw new Error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete file from Supabase storage
   */
  async deleteFile(filePath: string, bucket?: string): Promise<void> {
    if (!this.isServiceConfigured()) {
      throw new Error('Supabase storage is not configured')
    }

    const targetBucket = bucket || this.defaultBucket

    try {
      const { error } = await this.supabase.storage
        .from(targetBucket)
        .remove([filePath])

      if (error) {
        throw new Error(`Delete failed: ${error.message}`)
      }
    } catch (error) {
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get file URL (public or signed)
   */
  getFileUrl(filePath: string, bucket?: string, signed: boolean = false): string {
    const targetBucket = bucket || this.defaultBucket
    
    if (signed) {
      // For signed URLs, you would need to implement a server-side endpoint
      // This is a placeholder - implement based on your needs
      return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/sign/${targetBucket}/${filePath}`
    }

    const { data } = this.supabase.storage
      .from(targetBucket)
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  /**
   * List files in a folder
   */
  async listFiles(folder: string, bucket?: string): Promise<string[]> {
    if (!this.isServiceConfigured()) {
      throw new Error('Supabase storage is not configured')
    }

    const targetBucket = bucket || this.defaultBucket

    try {
      const { data, error } = await this.supabase.storage
        .from(targetBucket)
        .list(folder)

      if (error) {
        throw new Error(`List failed: ${error.message}`)
      }

      return data?.map(item => item.name) || []
    } catch (error) {
      throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * List all folders in the bucket
   */
  async listFolders(bucket?: string): Promise<string[]> {
    if (!this.isServiceConfigured()) {
      throw new Error('Supabase storage is not configured')
    }

    const targetBucket = bucket || this.defaultBucket

    try {
      const { data, error } = await this.supabase.storage
        .from(targetBucket)
        .list('')

      if (error) {
        throw new Error(`List folders failed: ${error.message}`)
      }

      // Return only folders (items with no extension)
      return data?.filter(item => !item.name.includes('.')).map(item => item.name) || []
    } catch (error) {
      throw new Error(`Failed to list folders: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get organized file structure
   */
  async getFileStructure(bucket?: string): Promise<Record<string, string[]>> {
    if (!this.isServiceConfigured()) {
      throw new Error('Supabase storage is not configured')
    }

    const targetBucket = bucket || this.defaultBucket
    const folders = await this.listFolders(targetBucket)
    const structure: Record<string, string[]> = {}

    for (const folder of folders) {
      structure[folder] = await this.listFiles(folder, targetBucket)
    }

    return structure
  }

  /**
   * Create a new bucket (admin only)
   */
  async createBucket(bucketName: string, isPublic: boolean = true): Promise<void> {
    if (!this.isServiceConfigured()) {
      throw new Error('Supabase storage is not configured')
    }

    try {
      const { error } = await this.supabase.storage
        .createBucket(bucketName, {
          public: isPublic,
          allowedMimeTypes: [
            'image/*',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'text/csv'
          ]
        })

      if (error) {
        throw new Error(`Bucket creation failed: ${error.message}`)
      }
    } catch (error) {
      throw new Error(`Failed to create bucket: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Move file between folders
   */
  async moveFile(oldPath: string, newPath: string, bucket?: string): Promise<void> {
    if (!this.isServiceConfigured()) {
      throw new Error('Supabase storage is not configured')
    }

    const targetBucket = bucket || this.defaultBucket

    try {
      // Download the file
      const { data: fileData, error: downloadError } = await this.supabase.storage
        .from(targetBucket)
        .download(oldPath)

      if (downloadError) {
        throw new Error(`Download failed: ${downloadError.message}`)
      }

      // Upload to new location
      const { error: uploadError } = await this.supabase.storage
        .from(targetBucket)
        .upload(newPath, fileData, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw new Error(`Upload to new location failed: ${uploadError.message}`)
      }

      // Delete from old location
      await this.deleteFile(oldPath, targetBucket)
    } catch (error) {
      throw new Error(`Failed to move file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Copy file to another folder
   */
  async copyFile(sourcePath: string, destPath: string, bucket?: string): Promise<void> {
    if (!this.isServiceConfigured()) {
      throw new Error('Supabase storage is not configured')
    }

    const targetBucket = bucket || this.defaultBucket

    try {
      // Download the file
      const { data: fileData, error: downloadError } = await this.supabase.storage
        .from(targetBucket)
        .download(sourcePath)

      if (downloadError) {
        throw new Error(`Download failed: ${downloadError.message}`)
      }

      // Upload to new location
      const { error: uploadError } = await this.supabase.storage
        .from(targetBucket)
        .upload(destPath, fileData, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw new Error(`Upload to new location failed: ${uploadError.message}`)
      }
    } catch (error) {
      throw new Error(`Failed to copy file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

// Export singleton instance
export const supabaseStorageService = new SupabaseStorageService()
