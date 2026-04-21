import * as React from "react";
import { Camera, Upload, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabaseStorageService } from "@/server/services/SupabaseStorageService";
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

interface AfterPhotoUploadProps {
  value?: FileReference | null;
  onChange: (photo: FileReference | null) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  error?: string;
  disabled?: boolean;
}

export function AfterPhotoUpload({
  value,
  onChange,
  label = "After Completion Photo",
  placeholder = "Upload a photo showing the completed work",
  required = true,
  accept = "image/*",
  maxSize = 5,
  className = "",
  error,
  disabled = false,
}: AfterPhotoUploadProps) {
  const [dragActive, setDragActive] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

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
        bucket: 'structra-files'
      });

      return {
        id: crypto.randomUUID(),
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
    if (!files || files.length === 0) return;

    const file = files[0]; // Only take the first file since this is single photo upload

    // Check file type
    if (!file.type.startsWith("image/")) {
      setUploadError(`${file.name} is not an image file`);
      return;
    }

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setUploadError(`${file.name} is larger than ${maxSize}MB`);
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const fileReference = await uploadFileToSupabase(file);
      onChange(fileReference);
    } catch (uploadError) {
      setUploadError(uploadError instanceof Error ? uploadError.message : 'Upload failed');
    } finally {
      setUploading(false);
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

  const removePhoto = () => {
    onChange(null);
    setUploadError(null);
  };

  return (
    <div className={className}>
      <Label
        htmlFor="after_photo_input"
        className="flex items-center space-x-2"
      >
        <Camera className="h-4 w-4" />
        <span>
          {label} {required && "*"}
        </span>
      </Label>

      {/* Upload Area - Only show if no photo is uploaded */}
      {!value && (
        <div
          className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            error || uploadError
              ? "border-gray-500 bg-gray-50"
              : dragActive
              ? "border-gray-500 bg-gray-50"
              : "border-gray-300 hover:border-gray-400"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 mb-2">{placeholder}</p>
          <p className="text-xs text-gray-500 mb-4">
            Supports JPG, PNG, GIF up to {maxSize}MB
          </p>
          <Input
            id="after_photo_input"
            type="file"
            accept={accept}
            onChange={(e) => handleFileChange(e.target.files)}
            className="mt-4 bg-white"
            disabled={disabled || uploading}
          />
        </div>
      )}

      {/* Photo Preview - Show when photo is uploaded */}
      {value && (
        <div className="mt-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <div className="w-16 h-12 bg-white rounded border overflow-hidden flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={value.url}
                  alt="After completion photo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0" style={{ maxWidth: '300px' }}>
                <div
                  className="text-sm font-medium hover:underline cursor-pointer"
                  style={{ 
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%',
                    display: 'block'
                  }}
                  title={`Click to view: ${value.filename}`}
                  onClick={() => {
                    window.open(value.url, "_blank");
                  }}
                >
                  {value.filename}
                </div>
                <p 
                  className="text-xs text-gray-500"
                  style={{ 
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%',
                    display: 'block'
                  }}
                >
                  {value.size ? `${(value.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'} • {value.mimeType}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="hover:bg-gray-50"
              onClick={removePhoto}
              title="Remove photo"
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Uploading State */}
      {uploading && (
        <div className="mt-4">
          <div className="flex items-center justify-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <LoadingSpinner inline size="sm" />
            <span className="ml-2 text-sm">Uploading photo...</span>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {(error || uploadError) && (
        <p className="mt-2 text-sm">{error || uploadError}</p>
      )}

      {/* Help Text */}
      <p className="mt-2 text-xs text-gray-500">
        This photo represents the completed work and will be used for the before/after comparison.
      </p>
    </div>
  );
}
