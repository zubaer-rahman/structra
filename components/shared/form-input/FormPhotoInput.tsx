"use client";

import * as React from "react";
import { Camera, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CreateProjectFormInputData } from "@/utils/validation/projects";
import { supabaseStorageService } from "@/server/services/SupabaseStorageService";
import { useFormContext } from "react-hook-form";
import { LoadingSpinner } from "@/components/shared";

// Define the file type based on the validation schema
type FileReference = {
  id: string;
  filename: string;
  url: string;
  size?: number;
  mimeType?: string;
  uploadedAt?: Date;
};

interface FormPhotoInputProps {
  name: keyof CreateProjectFormInputData;
  label: string;
  placeholder?: string;
  required?: boolean;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  error?: string;
}

export function FormPhotoInput({
  name,
  label,
  placeholder = "Upload photos",
  required = false,
  accept = "image/*",
  maxSize = 5,
  className = "",
  error,
}: FormPhotoInputProps) {
  const [dragActive, setDragActive] = React.useState(false);
  const [uploadingFiles, setUploadingFiles] = React.useState<Set<string>>(new Set());
  const [uploadErrors, setUploadErrors] = React.useState<Map<string, string>>(new Map());

  // Get form context for field value and onChange
  const { watch, setValue, trigger } = useFormContext<CreateProjectFormInputData>();
  const selectedPhotos = (watch(name) as FileReference[]) || [];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const uploadFileToSupabase = async (file: File): Promise<FileReference> => {
    try {
      const uploadResult = await supabaseStorageService.uploadFile(file, {
        fileType: 'photos',
        bucket: 'buildready-files'
      });

      return {
        id: crypto.randomUUID(), // Generate proper UUID for database
        filename: file.name,
        url: uploadResult.url,
        size: uploadResult.size,
        mimeType: uploadResult.mimeType,
        uploadedAt: new Date(uploadResult.uploadedAt),
      };
    } catch (error) {
      console.error('Upload failed for file:', file.name, error);
      throw new Error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleFileChange = async (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).filter((file) => {
      // Check file type
      if (!file.type.startsWith("image/")) {
        alert(`${file.name} is not an image file`);
        return false;
      }

      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        alert(`${file.name} is larger than ${maxSize}MB`);
        return false;
      }

      return true;
    });

    // Add files to uploading state
    setUploadingFiles(prev => new Set([...prev, ...newFiles.map(f => f.name)]));

    try {
      // Upload each file to Supabase
      const uploadPromises = newFiles.map(async (file) => {
        try {
          const fileReference = await uploadFileToSupabase(file);
          return fileReference;
        } catch (uploadError) {
          // Store upload error for this file
          setUploadErrors(prev => new Map(prev).set(file.name, uploadError instanceof Error ? uploadError.message : 'Upload failed'));
          return null;
        } finally {
          // Remove from uploading state
          setUploadingFiles(prev => {
            const newSet = new Set(prev);
            newSet.delete(file.name);
            return newSet;
          });
        }
      });

      const uploadResults = await Promise.all(uploadPromises);
      const successfulUploads = uploadResults.filter((result): result is FileReference => result !== null);

      if (successfulUploads.length > 0) {
        // Update form field value with successfully uploaded files
        const newPhotos = [...selectedPhotos, ...successfulUploads];
        
        // Update form value and trigger validation
        setValue(name, newPhotos, { 
          shouldValidate: true, 
          shouldDirty: true,
          shouldTouch: true 
        });
        
      }

      // Show error message if any uploads failed
      const failedUploads = uploadResults.filter(result => result === null);
      if (failedUploads.length > 0) {
        alert(`Failed to upload ${failedUploads.length} file(s). Check the error messages below.`);
      }

    } catch (error) {
      console.error('Error handling file uploads:', error);
      alert('Error uploading files. Please try again.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files);
    }
  };

  const removePhoto = (index: number) => {
    const updatedPhotos = selectedPhotos.filter(
      (_: FileReference, i: number) => i !== index
    );
    setValue(name, updatedPhotos, { 
      shouldValidate: true, 
      shouldDirty: true,
      shouldTouch: true 
    });
    
    // Manually trigger validation for this field
    trigger(name);
  };

  return (
    <div className={className}>
      <Label
        htmlFor={`${name}_input`}
        className="flex items-center space-x-2"
      >
        <Camera className="h-4 w-4" />
        <span>
          {label} {required && "*"}
        </span>
      </Label>

      {/* Drag & Drop Area */}
      <div
        className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          error
            ? "border-red-500 bg-red-50"
            : dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-sm text-gray-600 mb-2">{placeholder}</p>
        <p className="text-xs text-gray-500">
          Supports JPG, PNG, GIF up to {maxSize}MB each
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

      {/* Photo Previews */}
      {selectedPhotos.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Selected Photos ({selectedPhotos.length})
          </p>
          <div className="space-y-2">
            {selectedPhotos.map((photo: FileReference, index: number) => (
              <div
                key={photo.id || index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {/* Tiny rectangular image preview */}
                  <div className="w-12 h-8 bg-white rounded border overflow-hidden flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    {/* Image name as clickable link with tooltip */}
                    <div
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer truncate max-w-full"
                      style={{ 
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                      title={`Click to view: ${photo.filename}`}
                      onClick={() => {
                        // Open image in new tab or modal
                        window.open(photo.url, "_blank");
                      }}
                    >
                      {photo.filename}
                    </div>
                    {/* File size and type info */}
                    <p className="text-xs text-gray-500 truncate max-w-full">
                      {photo.size ? `${(photo.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'} •{" "}
                      {photo.mimeType}
                    </p>
                    {/* Upload status indicator */}
                    {uploadingFiles.has(photo.filename) && (
                      <div className="flex items-center space-x-1 text-xs text-blue-600">
                        <LoadingSpinner inline size="xs" text="Uploading..." />
                      </div>
                    )}
                    {/* Error message if upload failed */}
                    {uploadErrors.has(photo.filename) && (
                      <p className="text-xs text-red-600">
                        {uploadErrors.get(photo.filename)}
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
                  onClick={() => removePhoto(index)}
                  title="Remove photo"
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

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
