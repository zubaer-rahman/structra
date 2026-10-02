import * as React from "react";
import { Camera, Upload, X, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabaseStorageService } from "@/server/services/SupabaseStorageService";
import { LoadingSpinner } from "@/components/shared";
import { cn } from "@/lib/utils";

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
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <Label htmlFor="company-logo-upload" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {label}
            {required && <span className="text-red-500 font-bold ml-1">*</span>}
          </Label>
          {error && (
            <span className="text-xs font-medium text-red-500">Required</span>
          )}
        </div>
      )}
      
      <div>
        {value ? (
          <div className="flex items-center space-x-4 p-4 border border-gray-200 dark:border-white/10 rounded-xl bg-gray-50/70 dark:bg-white/[0.03]">
            <div className="flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value.url}
                alt={value.filename}
                className="h-16 w-16 object-cover rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {value.filename}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {value.size ? `${(value.size / 1024).toFixed(1)} KB` : 'Size unknown'}
              </p>
              {value.uploadedAt && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Uploaded {new Date(value.uploadedAt).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 px-2.5 py-1 rounded-full text-xs font-medium">
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                <span>Uploaded</span>
              </div>
              {!disabled && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={removeLogo}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 border-gray-200 dark:border-white/10 h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "relative border-2 border-dashed rounded-xl p-6 text-center transition-colors focus:outline-none",
              dragActive
                ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/20"
                : error
                ? "border-red-500 bg-red-50/20 dark:bg-red-950/20"
                : "border-gray-200 dark:border-white/10 hover:border-orange-400/60 dark:hover:border-orange-500/40 bg-gray-50/50 dark:bg-white/[0.02]",
              disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            )}
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
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Uploading logo...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Camera className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                <div className="mt-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold text-orange-600 dark:text-orange-400 hover:underline">
                      Click to upload
                    </span>{" "}
                    or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{placeholder}</p>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  PNG, JPG, GIF up to {maxSize}MB
                </p>
              </div>
            )}
          </div>
        )}
        
        {uploadError && (
          <p className="mt-2 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{uploadError}</span>
          </p>
        )}
        
        {error && (
          <p className="mt-2 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{error}</span>
          </p>
        )}
      </div>
    </div>
  );
}
