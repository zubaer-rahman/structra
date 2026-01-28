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
}

export function ProfilePictureUpload({
  currentPhoto,
  onPhotoChange,
  onUploadStart,
  onUploadComplete,
  onUploadSuccess,
  className = "",
  size = 120,
  disabled = false
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
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      {/* Profile Picture Display */}
      <div className="relative">
        <div
          className={cn(
            "relative rounded-full overflow-hidden border-2 border-gray-200 transition-all duration-200",
            dragActive && "border-blue-400 bg-blue-50",
            isUploading && "opacity-50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          style={{ width: size, height: size }}
        >
          {currentPhoto ? (
            <Image
              src={currentPhoto}
              alt="Profile picture"
              fill
              className="object-cover"
              onError={() => {
                // Fallback to default avatar if image fails to load
                onPhotoChange(null)
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <User className="w-8 h-8 text-gray-400" />
            </div>
          )}

          {/* Upload overlay */}
          {!isUploading && (
            <div
              className={cn(
                "absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center cursor-pointer",
                disabled && "cursor-not-allowed"
              )}
              onClick={handleClick}
            >
              <div className="opacity-0 hover:opacity-100 transition-opacity duration-200">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
          )}

          {/* Loading overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
            </div>
          )}

          {/* Remove button */}
          {currentPhoto && !isUploading && !disabled && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleRemovePhoto()
              }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Upload Area */}
      {!isUploading ? (
        <div
          className={cn(
            "w-full max-w-sm border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200",
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
            accept="image/*"
            onChange={(e) => handleFileChange(e.target.files)}
            className="hidden"
            disabled={disabled || isUploading}
          />

          <div className="flex flex-col items-center space-y-2">
            <Upload className="w-8 h-8 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                {currentPhoto ? "Change profile picture" : "Upload profile picture"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Drag and drop or click to browse
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PNG, JPG, GIF up to 5MB
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Upload Button */}
      {!isUploading ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClick}
          disabled={disabled}
          className="w-full max-w-sm"
        >
          <Camera className="w-4 h-4 mr-2" />
          {currentPhoto ? "Change Picture" : "Upload Picture"}
        </Button>
      ) : null}
    </div>
  )
}
