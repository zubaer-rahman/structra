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

interface CompanyLogoUploadProps {
  value?: FileReference | null;
  onChange: (file: FileReference | null) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  accept?: string;
  maxSize?: number;
  className?: string;
  error?: string;
  disabled?: boolean;
}

export function CompanyLogoUpload({
  value,
  onChange,
  label = "Company Logo",
  placeholder = "Upload your company logo",
  required = false,
  accept = "image/*",
  maxSize = 5,
  className = "",
  error,
  disabled = false,
}: CompanyLogoUploadProps) {
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
        bucket: 'buildready-files'
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
      throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0]; // Only take the first file since this is single logo upload

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

  const removeLogo = () => {
    onChange(null);
    setUploadError(null);
  };

  return (
    <div className={className}>
      <Label htmlFor="company-logo-upload" className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <div className="mt-2">
        {value ? (
          <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex-shrink-0">
              <img
                src={value.url}
                alt={value.filename}
                className="h-16 w-16 object-cover rounded-lg border border-gray-200"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {value.filename}
              </p>
              <p className="text-xs text-gray-500">
                {value.size ? `${(value.size / 1024).toFixed(1)} KB` : 'Size unknown'}
              </p>
              {value.uploadedAt && (
                <p className="text-xs text-gray-500">
                  Uploaded {new Date(value.uploadedAt).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span className="text-xs font-medium">Uploaded</span>
              </div>
              {!disabled && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={removeLogo}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              dragActive
                ? "border-blue-400 bg-blue-50"
                : error
                ? "border-red-300 bg-red-50"
                : "border-gray-300"
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !disabled && document.getElementById('company-logo-upload')?.click()}
          >
            <input
              id="company-logo-upload"
              type="file"
              accept={accept}
              onChange={(e) => handleFileChange(e.target.files)}
              className="hidden"
              disabled={disabled}
            />
            
            {uploading ? (
              <div className="flex flex-col items-center">
                <LoadingSpinner size="sm" />
                <p className="mt-2 text-sm text-gray-600">Uploading logo...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Camera className="h-8 w-8 text-gray-400" />
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-blue-600 hover:text-blue-500">
                      Click to upload
                    </span>{" "}
                    or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{placeholder}</p>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  PNG, JPG, GIF up to {maxSize}MB
                </p>
              </div>
            )}
          </div>
        )}
        
        {uploadError && (
          <p className="mt-2 text-sm text-red-600">{uploadError}</p>
        )}
        
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
}
