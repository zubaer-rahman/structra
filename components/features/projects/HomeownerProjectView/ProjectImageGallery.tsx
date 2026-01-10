"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";

interface ProjectPhoto {
  id: string;
  url: string;
  filename: string;
  size?: number;
  mimeType?: string;
  uploadedAt?: Date;
}

interface ProjectImageGalleryProps {
  projectPhotos?: ProjectPhoto[];
  projectType?: string;
}

export default function ProjectImageGallery({
  projectPhotos,
  projectType,
}: ProjectImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  
  // Single placeholder image for all project types
  const placeholderImage = '/images/placeholder-image.png';

  // Helper function to check if an image is a placeholder
  const isPlaceholderImage = (url: string): boolean => {
    return url === placeholderImage || url.includes('placeholder-image.png');
  };

  // Helper function to check if an image is a blob URL
  const isBlobUrl = (url: string): boolean => {
    return url.startsWith('blob:');
  };

  // Helper function to get a safe image URL (fallback to placeholder if blob or invalid)
  const getSafeImageUrl = (url: string): string => {
    if (isBlobUrl(url) || !url || url === '') {
      return placeholderImage;
    }
    return url;
  };

  // Get available images or use placeholders
  const getProjectImages = (): ProjectPhoto[] => {
    if (projectPhotos && projectPhotos.length > 0) {
      // Filter out any blob URLs and replace them with placeholders
      const cleanPhotos = projectPhotos.map(photo => ({
        ...photo,
        url: getSafeImageUrl(photo.url)
      }));
      
      // Filter out any photos that are now placeholders (failed images)
      const validPhotos = cleanPhotos.filter(photo => !isPlaceholderImage(photo.url));
      
      // If we have valid photos, return them
      if (validPhotos.length > 0) {
        return validPhotos;
      }
      
      // If all photos were invalid, return the same number of placeholders as original
      const placeholderCount = projectPhotos.length;
      return Array.from({ length: placeholderCount }, (_, index) => ({
        id: `placeholder-${index + 1}`,
        url: placeholderImage,
        filename: `${projectType || 'Project'} - Image ${index + 1}`,
        size: 0,
        mimeType: 'image/png',
        uploadedAt: new Date()
      }));
    }
    
    // No photos provided, return 3 default placeholders
    return [
      {
        id: 'placeholder-1',
        url: placeholderImage,
        filename: `${projectType || 'Project'} - Main View`,
        size: 0,
        mimeType: 'image/png',
        uploadedAt: new Date()
      },
      {
        id: 'placeholder-2',
        url: placeholderImage,
        filename: `${projectType || 'Project'} - Detail View`,
        size: 0,
        mimeType: 'image/png',
        uploadedAt: new Date()
      },
      {
        id: 'placeholder-3',
        url: placeholderImage,
        filename: `${projectType || 'Project'} - Overview`,
        size: 0,
        mimeType: 'image/png',
        uploadedAt: new Date()
      }
    ];
  };

  const projectImages = getProjectImages();
  const hasImages = projectImages.length > 0; // Check if we have any images at all
  const isUsingPlaceholders = !projectPhotos || projectPhotos.length === 0;

  // Ensure currentImageIndex is always valid
  useEffect(() => {
    if (currentImageIndex >= projectImages.length && projectImages.length > 0) {
      setCurrentImageIndex(0);
    }
  }, [projectImages.length, currentImageIndex]);


  const nextImage = () => {
    if (projectImages.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % projectImages.length);
    }
  };

  const previousImage = () => {
    if (projectImages.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + projectImages.length) % projectImages.length);
    }
  };

  const goToImage = (index: number) => {
    if (index >= 0 && index < projectImages.length) {
      setCurrentImageIndex(index);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Main Project Image */}
      <div className="relative group">
        <Image
          src={projectImages[currentImageIndex].url}
          alt={projectImages[currentImageIndex].filename}
          width={800}
          height={600}
          className="w-full h-48 sm:h-64 object-cover rounded-lg transition-all duration-300"
          priority={currentImageIndex === 0}
          unoptimized
          onError={(e) => {
            const imageUrl = projectImages[currentImageIndex].url;
            console.error('Image failed to load:', imageUrl);
            
            // Track this image as failed
            setFailedImages(prev => new Set([...prev, imageUrl]));
            
            // Only fallback if it's not already a placeholder image
            if (!isPlaceholderImage(imageUrl)) {
              const target = e.target as HTMLImageElement;
              target.src = placeholderImage;
              target.onerror = null; // Prevent infinite loop
            }
          }}
        />
        
        {/* Removed fallback debug image that might be causing z-index issues */}
        
        {/* Navigation Arrows */}
        {hasImages && (
          <>
            <button
              onClick={previousImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 p-1.5 sm:p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 p-1.5 sm:p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              aria-label="Next image"
            >
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {hasImages && (
          <div className="absolute top-2 right-2 bg-gray-600/70 text-white px-2 py-1 rounded text-xs">
            {currentImageIndex + 1} / {projectImages.length}
          </div>
        )}


        {/* Placeholder Indicator */}
        {isUsingPlaceholders && (
          <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded text-xs">
            Sample Images
          </div>
        )}

        {/* Fallback Indicator - shows when uploaded image failed and fell back to placeholder */}
        {!isUsingPlaceholders && isPlaceholderImage(projectImages[currentImageIndex].url) && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs">
            {failedImages.has(projectImages[currentImageIndex].url) ? 'Image Failed' : 'Image Unavailable'}
          </div>
        )}

        {/* Blob URL Warning - shows when original image was a blob URL */}
        {!isUsingPlaceholders && failedImages.size > 0 && (
          <div className="absolute bottom-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
            {failedImages.size} Image{failedImages.size > 1 ? 's' : ''} Failed
          </div>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {hasImages && (
        <div className="flex items-center gap-2">
          <button 
            onClick={previousImage}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
          </button>
          
          <div className="flex gap-1 sm:gap-2 flex-1 justify-center">
            {projectImages.map((photo, index) => (
              <div key={photo.id || index} className="relative group">
                <button
                  onClick={() => goToImage(index)}
                  className={`w-12 h-12 sm:w-16 sm:h-16 rounded border-2 overflow-hidden transition-all duration-200 ${
                    index === currentImageIndex 
                      ? 'border-orange-500 ring-2 ring-orange-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Image
                    src={photo.url}
                    alt={photo.filename}
                    width={64}
                    height={64}
                    unoptimized
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Thumbnail failed to load:', photo.url);
                      
                      // Track this image as failed
                      setFailedImages(prev => new Set([...prev, photo.url]));
                      
                      // Only fallback if it's not already a placeholder image
                      if (!isPlaceholderImage(photo.url)) {
                        const target = e.target as HTMLImageElement;
                        target.src = placeholderImage;
                        target.onerror = null; // Prevent infinite loop
                      }
                    }}
                  />
                </button>
                
              </div>
            ))}
          </div>

          <button 
            onClick={nextImage}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            aria-label="Next image"
          >
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
          </button>
        </div>
      )}

      {/* Image Info */}
      {isUsingPlaceholders && (
        <div className="text-left">
          <p className="text-xs text-orange-600">
            Showing sample images for {projectType || 'project'} type
          </p>
        </div>
      )}

      {/* Error Info - shows when images have failed to load */}
      {!isUsingPlaceholders && failedImages.size > 0 && (
        <div className="text-left">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs text-red-700 font-medium mb-1">
              ⚠️ {failedImages.size} Image{failedImages.size > 1 ? 's' : ''} Failed to Load
            </p>
            <p className="text-xs text-red-600">
              Some project images could not be displayed. This may be due to:
            </p>
            <ul className="text-xs text-red-600 mt-1 ml-4 list-disc">
              <li>Images were uploaded with temporary URLs</li>
              <li>Network connectivity issues</li>
              <li>Images have been moved or deleted</li>
            </ul>
            <p className="text-xs text-red-600 mt-2">
              Showing placeholder images instead. Contact support if this persists.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
