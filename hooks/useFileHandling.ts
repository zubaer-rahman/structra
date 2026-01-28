"use client";

import { useState, useCallback, useEffect } from "react";
import { UseFormSetValue, Path } from "react-hook-form";
import {
  supabaseStorageService,
  SupabaseUploadResult,
} from "@/server/services/SupabaseStorageService";

// Interface for files stored in form data
export interface FormFileData {
  id: string;
  filename: string;
  url: string;
  size?: number;
  mimeType?: string;
  uploadedAt?: Date;
}

// File upload status types
export type UploadStatus = "idle" | "uploading" | "success" | "error";

export interface FileUploadState {
  file: File;
  status: UploadStatus;
  progress: number;
  result?: SupabaseUploadResult;
  error?: string;
}

export interface FileHandlingOptions {
  onFileChange?: (files: File[], type: string) => void;
  onFileRemove?: (index: number, type: string) => void;
  onUploadProgress?: (progress: number) => void;
  maxFileSize?: number;
  allowedTypes?: string[];
  uploadFolder?: string;
  autoUpload?: boolean;
}

export function useFileHandling<T extends Record<string, unknown>>(
  setValue: UseFormSetValue<T>,
  options: FileHandlingOptions = {}
) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadStates, setUploadStates] = useState<{
    photos: FileUploadState[];
    documents: FileUploadState[];
  }>({
    photos: [],
    documents: [],
  });
  const [isUploading, setIsUploading] = useState(false);

  // Track successfully uploaded files separately - used to maintain form state
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [uploadedFiles, setUploadedFiles] = useState<{
    photos: FormFileData[];
    documents: FormFileData[];
  }>({
    photos: [],
    documents: [],
  });

  // Get current files from upload states
  const selectedPhotos = uploadStates.photos.map((state) => state.file);
  const selectedFiles = uploadStates.documents.map((state) => state.file);

  // Validate file before processing
  const validateFile = useCallback(
    (file: File): { isValid: boolean; error?: string } => {
      const validation = supabaseStorageService.validateFile(file);

      if (!validation.isValid) {
        return validation;
      }

      // Additional business logic validation
      if (options.maxFileSize && file.size > options.maxFileSize) {
        return {
          isValid: false,
          error: `File size exceeds ${(
            options.maxFileSize /
            1024 /
            1024
          ).toFixed(1)}MB limit`,
        };
      }

      if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
        return { isValid: false, error: "File type not allowed" };
      }

      return { isValid: true };
    },
    [options.maxFileSize, options.allowedTypes]
  );

  // Upload file to Supabase storage
  const uploadFile = useCallback(
    async (
      file: File,
      type: "photos" | "documents"
    ): Promise<SupabaseUploadResult> => {
      console.log("Starting file upload for:", file.name, "type:", type);

      // Check if Supabase is configured
      const isConfigured = supabaseStorageService.isServiceConfigured();
      console.log("Supabase configured:", isConfigured);

      if (!isConfigured) {
        console.warn("Supabase not configured, attempting upload anyway...");
        // Don't return mock result, try the real upload
      }

      const uploadOptions = {
        fileType: (type === "photos" ? "photos" : "documents") as "photos" | "documents", // Auto-organize by file type
        bucket: "structra-files", // Single bucket for all files
      };

      try {
        const result = await supabaseStorageService.uploadFile(
          file,
          uploadOptions
        );
        return result;
      } catch (error) {
        throw new Error(
          `Failed to upload ${file.name}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
    []
  );

  // Handle file upload
  const handleUpload = useCallback(
    async (type: "photos" | "documents") => {
      console.log("handleUpload called for type:", type);
      console.log("Current upload states:", uploadStates[type]);
      const filesToUpload = uploadStates[type].filter(
        (state) => state.status === "idle"
      );
      console.log("Files to upload:", filesToUpload.length);
      console.log(
        "Files to upload details:",
        filesToUpload.map((f) => ({ name: f.file.name, status: f.status }))
      );

      if (filesToUpload.length === 0) {
        console.log("No files to upload, returning early");
        return;
      }

      console.log("Setting isUploading to true");
      setIsUploading(true);

      // Add a safety timeout to prevent infinite waiting
      const uploadTimeout = setTimeout(() => {
        console.warn("Upload timeout reached, resetting upload state");
        setIsUploading(false);
      }, 30000); // 30 second timeout

      try {
        for (let i = 0; i < filesToUpload.length; i++) {
          const uploadState = filesToUpload[i];
          const fileIndex = uploadStates[type].findIndex(
            (state) => state.file === uploadState.file
          );

          // Update status to uploading
          setUploadStates((prev) => ({
            ...prev,
            [type]: prev[type].map((state, index) =>
              index === fileIndex
                ? { ...state, status: "uploading", progress: 0 }
                : state
            ),
          }));

          // Simulate progress (Supabase doesn't provide progress events for direct uploads)
          const progressInterval = setInterval(() => {
            setUploadStates((prev) => ({
              ...prev,
              [type]: prev[type].map((state, index) =>
                index === fileIndex
                  ? {
                      ...state,
                      progress: Math.min(
                        state.progress + Math.random() * 30,
                        90
                      ),
                    }
                  : state
              ),
            }));
          }, 200);

          try {
            console.log("Starting upload for file:", uploadState.file.name);
            console.log("File details:", {
              name: uploadState.file.name,
              size: uploadState.file.size,
              type: uploadState.file.type,
            });
            const result = await uploadFile(uploadState.file, type);
            console.log("Upload successful, result:", result);

            clearInterval(progressInterval);

            // Update status to success
            setUploadStates((prev) => ({
              ...prev,
              [type]: prev[type].map((state, index) =>
                index === fileIndex
                  ? { ...state, status: "success", progress: 100, result }
                  : state
              ),
            }));

            // Update form value with the uploaded file
            // Generate a UUID for the id field since validation expects it
            const uploadedFile = {
              id: crypto.randomUUID(), // Generate UUID for form validation
              filename: uploadState.file.name,
              url: result.url,
              size: uploadState.file.size,
              mimeType: uploadState.file.type,
              uploadedAt: new Date(),
            };

            console.log("Setting form value for uploaded file:", uploadedFile);

            if (type === "photos") {
              // Update our local tracking state
              setUploadedFiles((prev) => {
                const newPhotos = [...prev.photos, uploadedFile];
                console.log("Setting project_photos form value to:", newPhotos);
                // Set the form value with the complete array
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setValue("project_photos" as Path<T>, newPhotos as any);
                return { ...prev, photos: newPhotos };
              });
            } else {
              // Update our local tracking state
              setUploadedFiles((prev) => {
                const newDocs = [...prev.documents, uploadedFile];
                console.log("Setting files form value to:", newDocs);
                // Set the form value with the complete array
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setValue("files" as Path<T>, newDocs as any);
                return { ...prev, documents: newDocs };
              });
            }

            // Log the current upload states after setting form value
            console.log(
              "Updated upload states for",
              type,
              ":",
              uploadStates[type]
            );
          } catch (error) {
            console.error(
              "Upload failed for file:",
              uploadState.file.name,
              "Error:",
              error
            );
            clearInterval(progressInterval);

            // Update status to error
            setUploadStates((prev) => ({
              ...prev,
              [type]: prev[type].map((state, index) =>
                index === fileIndex
                  ? {
                      ...state,
                      status: "error",
                      progress: 0,
                      error:
                        error instanceof Error
                          ? error.message
                          : "Upload failed",
                    }
                  : state
              ),
            }));
          }
        }
      } finally {
        console.log("Setting isUploading to false");
        clearTimeout(uploadTimeout);
        setIsUploading(false);
      }
    },
    [uploadStates, uploadFile, setValue]
  );

  // Auto-upload effect - monitors for idle files and uploads them automatically
  useEffect(() => {
    if (!options.autoUpload) return;

    const checkAndUploadIdleFiles = () => {
      const idlePhotos = uploadStates.photos.filter(
        (state) => state.status === "idle"
      );
      const idleDocs = uploadStates.documents.filter(
        (state) => state.status === "idle"
      );

      if (idlePhotos.length > 0 && !isUploading) {
        console.log(
          `Auto-upload effect: Found ${idlePhotos.length} idle photos, starting upload...`
        );
        handleUpload("photos");
      }

      if (idleDocs.length > 0 && !isUploading) {
        console.log(
          `Auto-upload effect: Found ${idleDocs.length} idle documents, starting upload...`
        );
        handleUpload("documents");
      }
    };

    // Check immediately
    checkAndUploadIdleFiles();

    // Also check after a short delay to catch any files added during state updates
    const timeoutId = setTimeout(checkAndUploadIdleFiles, 200);

    return () => clearTimeout(timeoutId);
  }, [uploadStates, isUploading, options.autoUpload, handleUpload]);

  // Handle file selection
  const handleFileChange = useCallback(
    (files: FileList | null, type: "photos" | "documents") => {
      if (!files) return;

      const newFiles = Array.from(files);
      const validFiles: File[] = [];
      const invalidFiles: { file: File; error: string }[] = [];

      // Validate each file
      newFiles.forEach((file) => {
        const validation = validateFile(file);
        if (validation.isValid) {
          validFiles.push(file);
        } else {
          invalidFiles.push({
            file,
            error: validation.error || "Invalid file",
          });
        }
      });

      // Show errors for invalid files
      if (invalidFiles.length > 0) {
        console.warn("Invalid files:", invalidFiles);
        // You could add toast notifications here
      }

      // Add valid files to upload states
      const newUploadStates = validFiles.map((file) => ({
        file,
        status: "idle" as UploadStatus,
        progress: 0,
      }));

      setUploadStates((prev) => {
        const newState = {
          ...prev,
          [type]: [...prev[type], ...newUploadStates],
        };
        return newState;
      });

      // Auto-upload if enabled - trigger after state is updated
      if (options.autoUpload && validFiles.length > 0) {
        console.log("Auto-upload check:", {
          autoUpload: options.autoUpload,
          validFilesCount: validFiles.length,
        });
        console.log("Triggering auto-upload for type:", type);
        console.log("New upload states to be added:", newUploadStates);

        // Use a more reliable approach - wait for state to be fully updated
        setTimeout(() => {
          console.log("Executing auto-upload for type:", type);
          console.log(
            "Current upload states at execution time:",
            uploadStates[type]
          );
          console.log(
            "Total files in upload states:",
            uploadStates[type].length
          );
          console.log(
            "Files with idle status:",
            uploadStates[type].filter((s) => s.status === "idle").length
          );

          // Check if we have idle files and trigger upload
          const idleFiles = uploadStates[type].filter(
            (s) => s.status === "idle"
          );
          if (idleFiles.length > 0) {
            console.log(
              `Found ${idleFiles.length} idle files, starting upload...`
            );
            handleUpload(type);
          } else {
            console.log("No idle files found, upload may have already started");
          }
        }, 150); // Increased timeout to ensure state is fully updated
      } else {
        console.log("Auto-upload not triggered:", {
          autoUpload: options.autoUpload,
          validFilesCount: validFiles.length,
        });
      }

      // Call custom callback
      options.onFileChange?.(validFiles, type);
    },
    [validateFile, handleUpload, uploadStates, options]
  );

  // Reset upload state (emergency function)
  const resetUploadState = useCallback(() => {
    console.log("Resetting upload state");
    setIsUploading(false);
    setUploadStates({
      photos: [],
      documents: [],
    });
    setUploadedFiles({
      photos: [],
      documents: [],
    });
  }, []);

  // Force upload for idle files (emergency function)
  const forceUploadIdleFiles = useCallback(() => {
    console.log("Force uploading idle files...");
    const idlePhotos = uploadStates.photos.filter(
      (state) => state.status === "idle"
    );
    const idleDocs = uploadStates.documents.filter(
      (state) => state.status === "idle"
    );

    if (idlePhotos.length > 0) {
      console.log("Found idle photos:", idlePhotos.length);
      handleUpload("photos");
    }

    if (idleDocs.length > 0) {
      console.log("Found idle documents:", idleDocs.length);
      handleUpload("documents");
    }
  }, [uploadStates, handleUpload]);

  // Remove file
  const removeFile = useCallback(
    (index: number, type: "photos" | "documents") => {
      setUploadStates((prev) => ({
        ...prev,
        [type]: prev[type].filter((_, i) => i !== index),
      }));

      // Update our local tracking state and form value
      if (type === "photos") {
        setUploadedFiles((prev) => {
          const newPhotos = prev.photos.filter((_, i) => i !== index);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setValue("project_photos" as Path<T>, newPhotos as any);
          return { ...prev, photos: newPhotos };
        });
      } else {
        setUploadedFiles((prev) => {
          const newDocs = prev.documents.filter((_, i) => i !== index);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setValue("files" as Path<T>, newDocs as any);
          return { ...prev, documents: newDocs };
        });
      }

      // Call custom callback
      options.onFileRemove?.(index, type);
    },
    [setValue, options]
  );

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, type: "photos" | "documents") => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileChange(e.dataTransfer.files, type);
      }
    },
    [handleFileChange]
  );

  // Retry failed uploads
  const retryUpload = useCallback(
    (index: number, type: "photos" | "documents") => {
      setUploadStates((prev) => ({
        ...prev,
        [type]: prev[type].map((state, i) =>
          i === index
            ? { ...state, status: "idle", progress: 0, error: undefined }
            : state
        ),
      }));

      // Trigger upload for this specific file
      setTimeout(() => handleUpload(type), 100);
    },
    [handleUpload]
  );

  return {
    dragActive,
    selectedPhotos,
    selectedFiles,
    uploadStates,
    isUploading,
    handleFileChange,
    removeFile,
    handleDrag,
    handleDrop,
    handleUpload,
    retryUpload,
    validateFile,
    resetUploadState,
    forceUploadIdleFiles,
  };
}
