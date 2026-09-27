'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, Camera, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { supabaseStorageService } from "@/server/services/SupabaseStorageService"
import { toast } from "react-hot-toast"
import Image from "next/image"

interface FileReference {
  id: string
  filename: string
  url: string
  size?: number
  mimeType?: string
  uploadedAt?: Date
}

interface ProfilePictureUploadProps {
  currentPhoto?: string
  onPhotoChange: (photoUrl: string | null) => Promise<void>
  onUploadStart?: () => void
  onUploadComplete?: () => void
  onUploadSuccess?: () => void
  className?: string
  size?: number
  disabled?: boolean
  compact?: boolean
}

export function ProfilePictureUpload({
  currentPhoto,
  onPhotoChange,
  onUploadStart,
  onUploadComplete,
  onUploadSuccess,
  className = "",
  size = 120,
  disabled = false,
  compact = false
}: ProfilePictureUploadProps) {
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

  const uploadFileToSupabase = async (file: File): Promise<string> => {
    try {
      const uploadResult = await supabaseStorageService.uploadFile(file, {
        fileType: 'photos',
        bucket: 'structra-files'
      })

      return uploadResult.url
    } catch (error) {
      console.error('Upload failed for file:', file.name, error)
      throw new Error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error(`${file.name} is not an image file`)
      return
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`${file.name} is larger than 5MB`)
      return
    }

    setIsUploading(true)
    onUploadStart?.()

    try {
      const photoUrl = await uploadFileToSupabase(file)
      await onPhotoChange(photoUrl)
      toast.success("Profile picture updated successfully!")
      onUploadSuccess?.()
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload profile picture')
    } finally {
      setIsUploading(false)
      onUploadComplete?.()
    }
  }

  const handleRemovePhoto = async () => {
    try {
      await onPhotoChange(null)
      toast.success("Profile picture removed")
      onUploadSuccess?.()
    } catch (error) {
      console.error('Remove error:', error)
      toast.error("Failed to remove profile picture")
    }
  }

  const handleClick = () => {
    if (disabled || isUploading) return
    fileInputRef.current?.click()
  }

  return (
    <div className={cn("flex flex-col items-center space-y-3", className)}>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileChange(e.target.files)}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Profile Picture Display */}
      <div 
        className="relative inline-block"
        onDragEnter={compact ? handleDrag : undefined}
        onDragLeave={compact ? handleDrag : undefined}
        onDragOver={compact ? handleDrag : undefined}
        onDrop={compact ? (e) => {
          e.preventDefault()
          e.stopPropagation()
          setDragActive(false)
          if (!disabled && !isUploading) {
            handleFileChange(e.dataTransfer.files)
          }
        } : undefined}
      >
        <div
          className={cn(
            "relative rounded-full overflow-hidden border-2 border-gray-200 shadow-sm transition-all duration-200 group cursor-pointer",
            dragActive && "border-orange-500 ring-4 ring-orange-100 bg-orange-50",
            isUploading && "opacity-50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          style={{ width: size, height: size }}
          onClick={handleClick}
        >
          {currentPhoto ? (
            <Image
              src={currentPhoto}
              alt="Profile picture"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
              onError={() => {
                // Fallback to default avatar if image fails to load
                onPhotoChange(null)
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <User className="w-10 h-10 text-gray-400" />
            </div>
          )}

          {/* Hover overlay */}
          {!isUploading && !disabled && (
            <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white">
              <Camera className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-semibold tracking-tight">Edit</span>
            </div>
          )}

          {/* Loading overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mb-1"></div>
              <span className="text-[10px] font-medium">Uploading</span>
            </div>
          )}
        </div>

        {/* Visible, permanent Edit / Camera badge at bottom-right of avatar */}
        {!isUploading && !disabled && (
          <button
            type="button"
            onClick={handleClick}
            title={currentPhoto ? "Change profile photo" : "Upload profile photo"}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center shadow-md border-2 border-white transition-transform hover:scale-110 active:scale-95 z-10 cursor-pointer"
          >
            <Camera className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Upload Area (Full mode only) */}
      {!compact && !isUploading ? (
        <div
          className={cn(
            "w-full max-w-sm border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer",
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
          <div className="flex flex-col items-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">
                {currentPhoto ? "Change profile picture" : "Upload profile picture"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Drag and drop or click to browse
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                PNG, JPG, WebP up to 5MB
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Upload Button (Full mode only) */}
      {!compact && !isUploading ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClick}
          disabled={disabled}
          className="w-full max-w-sm font-semibold border-gray-200 hover:border-orange-200 hover:bg-orange-50/40 text-gray-700 hover:text-orange-700 transition-colors shadow-2xs"
        >
          <Camera className="w-3.5 h-3.5 mr-1.5 text-orange-600" />
          {currentPhoto ? "Change Photo" : "Upload Photo"}
        </Button>
      ) : null}
    </div>
  )
}
