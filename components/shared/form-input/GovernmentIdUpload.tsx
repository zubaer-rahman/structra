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
        bucket: 'structra-files'
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
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={(e) => handleFileChange(e.target.files)}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Loading State */}
      {isUploading && (
        <div className="rounded-xl border border-gray-200 p-8 text-center bg-gray-50/70 space-y-3">
          <LoadingSpinner text="Uploading government ID..." size="md" variant="default" />
          <p className="text-xs text-gray-500">Please wait while your document is being securely uploaded.</p>
        </div>
      )}

      {/* When file is uploaded: single file preview card with Replace and Remove actions */}
      {!isUploading && currentIdFile && (
        <div className="rounded-xl border border-gray-200 p-4 bg-gray-50/70">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3 min-w-0">
              {/* File preview */}
              <div className="w-14 h-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-xs">
                {isImageFile ? (
                  <Image
                    src={currentIdFile.url}
                    alt="Government ID preview"
                    width={56}
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
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {currentIdFile.filename}
                </p>
                <p className="text-xs text-gray-500">
                  {currentIdFile.size ? formatFileSize(currentIdFile.size) : 'Unknown size'} • {currentIdFile.mimeType || 'Document'}
                </p>
                <button
                  type="button"
                  className="text-xs text-orange-600 hover:text-orange-700 font-medium hover:underline inline-block mt-0.5 cursor-pointer"
                  onClick={() => window.open(currentIdFile.url, '_blank')}
                >
                  View uploaded document ↗
                </button>
              </div>
            </div>

            {/* Actions: Replace and Remove */}
            {!disabled && (
              <div className="flex items-center gap-2 self-end sm:self-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClick}
                  className="h-8 text-xs font-medium border-gray-200 hover:bg-white text-gray-700 hover:text-orange-600 shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5 mr-1 text-gray-500" />
                  Replace
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg px-2.5"
                  onClick={handleRemoveFile}
                  title="Remove government ID"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Remove
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* When no file is uploaded: single unified upload zone */}
      {!isUploading && !currentIdFile && (
        <div
          className={cn(
            "w-full border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer",
            dragActive
              ? "border-orange-500 bg-orange-50/50"
              : "border-gray-200 hover:border-orange-400 hover:bg-orange-50/10",
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
          <div className="flex flex-col items-center space-y-2.5">
            <div className="w-10 h-10 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Upload government-issued photo ID
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Drag and drop your file here, or click to browse
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                JPG, PNG, or PDF up to 10MB
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-xs transition-colors pointer-events-none mt-1">
              <Upload className="w-3.5 h-3.5" />
              Choose File
            </span>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="text-[11px] text-gray-500 space-y-0.5 pt-1">
        <p>• Acceptable documents: Driver&apos;s license, passport, or government photo ID</p>
        <p>• File formats: JPG, PNG, or PDF (up to 10MB)</p>
      </div>
    </div>
  )
}
