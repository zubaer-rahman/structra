import * as React from "react"
import { Paperclip, X, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { FormField } from "./FormField"
import { CreateProjectFormInputData } from "@/utils/validation/projects"
import { supabaseStorageService } from "@/server/services/SupabaseStorageService"
import { LoadingSpinner } from "@/components/shared"

// Define the file type based on the validation schema
type FileReference = {
  id: string
  filename: string
  url: string
  size: number
  mimeType?: string
  uploadedAt?: Date
}

interface FormDocumentInputProps {
  name: keyof CreateProjectFormInputData
  label: string
  placeholder?: string
  required?: boolean
  accept?: string
  maxSize?: number // in MB
  className?: string
}

export function FormDocumentInput({
  name,
  label,
  placeholder = "Upload documents",
  required = false,
  accept = ".pdf,.doc,.docx,.xls,.xlsx",
  maxSize = 10,
  className = "",
}: FormDocumentInputProps) {
  const [dragActive, setDragActive] = React.useState(false)
  const [uploadingFiles, setUploadingFiles] = React.useState<Set<string>>(new Set())
  const [uploadErrors, setUploadErrors] = React.useState<Map<string, string>>(new Map())

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const uploadFileToSupabase = async (file: File): Promise<FileReference> => {
    try {
      const uploadResult = await supabaseStorageService.uploadFile(file, {
        fileType: 'documents',
        bucket: 'buildready-files'
      })

      return {
        id: crypto.randomUUID(), // Generate proper UUID for database
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

  return (
    <FormField name={name}>
      {({ field, error }) => {
        const selectedFiles = (field.value as FileReference[]) || []
        
        const handleFileChange = async (files: FileList | null) => {
          if (!files) return

          const newFiles = Array.from(files).filter((file) => {
            // Check file type by extension
            const fileExtension = file.name.toLowerCase().split('.').pop()
            const allowedExtensions = accept.replace(/\./g, '').split(',')
            
            if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
              alert(`${file.name} is not a supported file type`)
              return false
            }
            
            // Check file size
            if (file.size > maxSize * 1024 * 1024) {
              alert(`${file.name} is larger than ${maxSize}MB`)
              return false
            }
            
            return true
          })

          // Add files to uploading state
          setUploadingFiles(prev => new Set([...prev, ...newFiles.map(f => f.name)]))

          try {
            // Upload each file to Supabase
            const uploadPromises = newFiles.map(async (file) => {
              try {
                const fileReference = await uploadFileToSupabase(file)
                return fileReference
              } catch (uploadError) {
                // Store upload error for this file
                setUploadErrors(prev => new Map(prev).set(file.name, uploadError instanceof Error ? uploadError.message : 'Upload failed'))
                return null
              } finally {
                // Remove from uploading state
                setUploadingFiles(prev => {
                  const newSet = new Set(prev)
                  newSet.delete(file.name)
                  return newSet
                })
              }
            })

            const uploadResults = await Promise.all(uploadPromises)
            const successfulUploads = uploadResults.filter((result): result is FileReference => result !== null)

            if (successfulUploads.length > 0) {
              // Update form field value with successfully uploaded files
              field.onChange([...selectedFiles, ...successfulUploads])
            }

            // Show error message if any uploads failed
            const failedUploads = uploadResults.filter(result => result === null)
            if (failedUploads.length > 0) {
              alert(`Failed to upload ${failedUploads.length} file(s). Check the error messages below.`)
            }

          } catch (error) {
            console.error('Error handling file uploads:', error)
            alert('Error uploading files. Please try again.')
          }
        }

        const handleDrop = (e: React.DragEvent) => {
          e.preventDefault()
          e.stopPropagation()
          setDragActive(false)

          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files)
          }
        }

        const removeFile = (index: number) => {
          const updatedFiles = selectedFiles.filter((_: FileReference, i: number) => i !== index)
          field.onChange(updatedFiles)
        }

        const formatFileSize = (bytes: number): string => {
          if (bytes === 0) return '0 Bytes'
          const k = 1024
          const sizes = ['Bytes', 'KB', 'MB', 'GB']
          const i = Math.floor(Math.log(bytes) / Math.log(k))
          return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
        }

        return (
          <div className={className}>
            <Label
              htmlFor={`${name}_input`}
              className="flex items-center space-x-2"
            >
              <Paperclip className="h-4 w-4" />
              <span>{label} {required && "*"}</span>
            </Label>

            {/* Drag & Drop Area */}
            <div
              className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                {placeholder}
              </p>
              <p className="text-xs text-gray-500">
                Supports PDF, DOC, XLS up to {maxSize}MB each
              </p>
              <Input
                id={`${name}_input`}
                type="file"
                multiple
                accept={accept}
                onChange={(e) => handleFileChange(e.target.files)}
                className="mt-4 bg-white"
              />
            </div>

            {/* File List */}
            {selectedFiles.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Selected Files ({selectedFiles.length})
                </p>
                <div className="space-y-2">
                  {selectedFiles.map((file: FileReference, index: number) => (
                    <div key={file.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        {/* File type icon */}
                        <div className="w-12 h-8 bg-white rounded border flex items-center justify-center flex-shrink-0">
                          <FileText className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          {/* File name as clickable link with tooltip */}
                          <div
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer truncate max-w-full"
                            style={{ 
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                            title={`Click to view: ${file.filename}`}
                            onClick={() => {
                              // Open file in new tab or download
                              window.open(file.url, '_blank')
                            }}
                          >
                            {file.filename}
                          </div>
                          {/* File size and type info */}
                          <p className="text-xs text-gray-500 truncate max-w-full">
                            {formatFileSize(file.size)} • {file.mimeType}
                          </p>
                          {/* Upload status indicator */}
                          {uploadingFiles.has(file.filename) && (
                            <div className="flex items-center space-x-1 text-xs text-blue-600">
                              <LoadingSpinner inline size="xs" text="Uploading..." />
                            </div>
                          )}
                          {/* Error message if upload failed */}
                          {uploadErrors.has(file.filename) && (
                            <p className="text-xs text-red-600">
                              {uploadErrors.get(file.filename)}
                            </p>
                          )}
                        </div>
                      </div>
                      {/* Remove button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => removeFile(index)}
                        title="Remove file"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Uploading files that haven't been added to the form yet */}
            {Array.from(uploadingFiles).length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Uploading Files
                </p>
                <div className="space-y-2">
                  {Array.from(uploadingFiles).map((filename) => (
                    <div
                      key={filename}
                      className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <LoadingSpinner inline size="sm" />
                        <span className="text-sm text-blue-700">{filename}</span>
                      </div>
                      <span className="text-xs text-blue-600">Uploading...</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>
        )
      }}
    </FormField>
  )
}
