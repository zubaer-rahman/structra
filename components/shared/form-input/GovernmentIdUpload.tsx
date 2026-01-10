'use client'

import * as React from "react"
import { Upload, X, FileText, Camera, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { supabaseStorageService } from "@/server/services/SupabaseStorageService"
import { toast } from "react-hot-toast"
import Image from "next/image"
import { LoadingSpinner } from "@/components/shared"

// Define the file type for government ID
type GovernmentIdFile = {
  id: string
  filename: string
  url: string
  size?: number
  mimeType?: string
  uploadedAt?: Date
}

interface GovernmentIdUploadProps {
  currentIdFile?: GovernmentIdFile | null
  onIdFileChange: (file: GovernmentIdFile | null) => Promise<void>
  onUploadStart?: () => void
  onUploadComplete?: () => void
  onUploadSuccess?: () => void
  className?: string
  disabled?: boolean
}

export function GovernmentIdUpload({
  currentIdFile,
  onIdFileChange,
  onUploadStart,
  onUploadComplete,
  onUploadSuccess,
  className = "",
  disabled = false
}: GovernmentIdUploadProps) {
  const [isUploading, setIsUploading] = React.useState(false)
  const [dragActive, setDragActive] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const uploadFileToSupabase = async (file: File): Promise<GovernmentIdFile> => {
    try {
      const uploadResult = await supabaseStorageService.uploadFile(file, {
        fileType: 'documents',
        bucket: 'buildready-files'
      })

      return {
        id: crypto.randomUUID(),
        filename: file.name,
        url: uploadResult.url,
        size: uploadResult.size,
        mimeType: uploadResult.mimeType,
        uploadedAt: new Date(uploadResult.uploadedAt),
      }
    } catch (error) {
      console.error('Upload failed for file:', file.name, error)
      throw new Error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]

    // Check file type - allow images and PDFs
    const isImage = file.type.startsWith("image/")
    const isPDF = file.type === "application/pdf"
    
    if (!isImage && !isPDF) {
      toast.error(`${file.name} is not a supported file type. Please upload a photo or PDF.`)
      return
    }

    // Check file size (10MB limit for government IDs)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(`${file.name} is larger than 10MB`)
      return
    }

    setIsUploading(true)
    onUploadStart?.()

    try {
      const idFile = await uploadFileToSupabase(file)
      await onIdFileChange(idFile)
      toast.success("Government ID uploaded successfully!")
      onUploadSuccess?.()
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload government ID')
    } finally {
      setIsUploading(false)
      onUploadComplete?.()
    }
  }

  const handleRemoveFile = async () => {
    try {
      await onIdFileChange(null)
      toast.success("Government ID removed")
      onUploadSuccess?.()
    } catch (error) {
      console.error('Remove error:', error)
      toast.error("Failed to remove government ID")
    }
  }

  const handleClick = () => {
    if (disabled || isUploading) return
    fileInputRef.current?.click()
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const isImageFile = currentIdFile?.mimeType?.startsWith('image/') || false

  return (
    <div className={cn("space-y-4", className)}>
      {/* Current File Display */}
      {currentIdFile && (
        <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* File preview */}
              <div className="w-16 h-12 bg-white rounded border flex items-center justify-center flex-shrink-0 overflow-hidden">
                {isImageFile ? (
                  <Image
                    src={currentIdFile.url}
                    alt="Government ID preview"
                    width={64}
                    height={48}
                    className="object-cover w-full h-full"
                    onError={() => {
                      // Fallback to icon if image fails to load
                    }}
                  />
                ) : (
                  <FileText className="w-6 h-6 text-gray-400" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {currentIdFile.filename}
                </p>
                <p className="text-xs text-gray-500">
                  {currentIdFile.size ? formatFileSize(currentIdFile.size) : 'Unknown size'} • {currentIdFile.mimeType}
                </p>
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                  onClick={() => window.open(currentIdFile.url, '_blank')}
                >
                  View file
                </button>
              </div>
            </div>

            {/* Remove button */}
            {!isUploading && !disabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={handleRemoveFile}
                title="Remove government ID"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Upload Area */}
      {!isUploading && (
        <div
          className={cn(
            "w-full border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200",
            dragActive
              ? "border-blue-400 bg-blue-50"
              : "border-gray-300 hover:border-gray-400",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setDragActive(false)
            if (!disabled && !isUploading) {
              handleFileChange(e.dataTransfer.files)
            }
          }}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => handleFileChange(e.target.files)}
            className="hidden"
            disabled={disabled || isUploading}
          />

          <div className="flex flex-col items-center space-y-3">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-gray-400" />
              <div className="flex space-x-1">
                <Camera className="w-6 h-6 text-gray-400" />
                <FileText className="w-6 h-6 text-gray-400" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                {currentIdFile ? "Replace government ID" : "Upload government issued photo ID"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Drag and drop or click to browse
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Photos (JPG, PNG, GIF) or PDF up to 10MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Button */}
      {!isUploading && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClick}
          disabled={disabled}
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          {currentIdFile ? "Replace ID" : "Upload Government ID"}
        </Button>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Acceptable documents: Driver&apos;s license, passport, state ID, or other government-issued photo ID</p>
        <p>• File formats: JPG, PNG, GIF, or PDF</p>
        <p>• Maximum file size: 10MB</p>
        <p>• Your ID will be securely stored and used for verification purposes only</p>
      </div>
    </div>
  )
}
