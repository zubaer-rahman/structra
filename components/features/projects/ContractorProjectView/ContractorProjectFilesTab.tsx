'use client'

import { Project } from '@/server/database/interfaces'
import { User } from '@/server/database/interfaces/auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Download, 
  Image as ImageIcon,
  File,
  Archive
} from 'lucide-react'
import { USER_ROLES } from '@/utils/constants'
import Image from 'next/image'

interface ContractorProjectFilesTabProps {
  project: Project
  user: User
  userRole: typeof USER_ROLES[keyof typeof USER_ROLES]
}

export function ContractorProjectFilesTab({ project }: ContractorProjectFilesTabProps) {
  // Helper function to check if an image URL is valid
  const isValidImageUrl = (url: string): boolean => {
    return Boolean(url && url !== '' && !url.includes('placeholder-image.png'));
  }

  // Helper function to get a safe image URL
  const getSafeImageUrl = (url: string): string => {
    if (!isValidImageUrl(url)) {
      return '/images/placeholder-image.png';
    }
    return url;
  }

  // Helper function to get file type icon
  const getFileIcon = (filename: string, mimeType?: string) => {
    const extension = filename.split('.').pop()?.toLowerCase()
    
    if (mimeType?.startsWith('image/')) {
      return <ImageIcon className="w-4 h-4 text-blue-600" />
    }
    
    switch (extension) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-600" />
      case 'doc':
      case 'docx':
        return <FileText className="w-4 h-4 text-blue-600" />
      case 'xls':
      case 'xlsx':
        return <FileText className="w-4 h-4 text-green-600" />
      case 'zip':
      case 'rar':
      case '7z':
        return <Archive className="w-4 h-4 text-purple-600" />
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return <ImageIcon className="w-4 h-4 text-blue-600" />
      default:
        return <File className="w-4 h-4 text-gray-600" />
    }
  }

  // Helper function to format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  // Helper function to get file type badge color
  const getFileTypeBadgeColor = (filename: string, mimeType?: string) => {
    const extension = filename.split('.').pop()?.toLowerCase()
    
    if (mimeType?.startsWith('image/')) {
      return 'bg-blue-100 text-blue-800'
    }
    
    switch (extension) {
      case 'pdf':
        return 'bg-red-100 text-red-800'
      case 'doc':
      case 'docx':
        return 'bg-blue-100 text-blue-800'
      case 'xls':
      case 'xlsx':
        return 'bg-green-100 text-green-800'
      case 'zip':
      case 'rar':
      case '7z':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Project Files Section */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">Project Files & Documents</h3>
        <div className="space-y-4">
          {project.files && project.files.length > 0 ? (
            <div className="space-y-3">
              {project.files.map((file, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                  {/* File Icon */}
                  <div className="flex-shrink-0">
                    {getFileIcon(file.filename, file.mimeType)}
                  </div>
                  
                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900 truncate" title={file.filename}>
                        {file.filename}
                      </h4>
                      <Badge className={`text-xs ${getFileTypeBadgeColor(file.filename, file.mimeType)}`}>
                        {file.mimeType?.split('/')[1]?.toUpperCase() || file.filename.split('.').pop()?.toUpperCase() || 'FILE'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{formatFileSize(file.size || 0)}</span>
                      {file.uploadedAt && (
                        <span>Uploaded {new Date(file.uploadedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Download Button */}
                  <div className="flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      onClick={async () => {
                        try {
                          const response = await fetch(file.url);
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const link = document.createElement("a");
                          link.href = url;
                          link.download = file.filename;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          window.URL.revokeObjectURL(url);
                        } catch (error) {
                          console.error('Download failed:', error);
                          // Fallback to direct link
                          const link = document.createElement("a");
                          link.href = file.url;
                          link.download = file.filename;
                          link.target = "_blank";
                          link.click();
                        }
                      }}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 bg-gray-50 rounded-lg text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h4 className="text-sm font-medium text-gray-900 mb-1">No files provided</h4>
              <p className="text-xs text-gray-600">The homeowner has not uploaded any additional files for this project.</p>
            </div>
          )}
        </div>
      </div>


      {/* Project Photos Section */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">Project Photos</h3>
        <div className="space-y-4">
          {project.project_photos && project.project_photos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.project_photos.map((photo, index) => (
                <div key={index} className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Photo Preview */}
                  <div className="aspect-video bg-gray-100 relative overflow-hidden">
                    <Image
                      src={photo.url || "/images/placeholder-image.png"}
                      alt={photo.filename}
                      width={500}
                      height={300}
                      className="object-cover w-full h-full"
                      unoptimized
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/images/placeholder-image.png";
                      }}
                    />
                    {/* Download button - bottom right */}
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 px-3 bg-white/90 hover:bg-white text-gray-700 shadow-lg"
                        onClick={async () => {
                          try {
                            const response = await fetch(photo.url);
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement("a");
                            link.href = url;
                            link.download = photo.filename;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(url);
                          } catch (error) {
                            console.error('Download failed:', error);
                            // Fallback to direct link
                            const link = document.createElement("a");
                            link.href = photo.url;
                            link.download = photo.filename;
                            link.target = "_blank";
                            link.click();
                          }
                        }}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                  
                  {/* Photo Info */}
                  <div className="p-3">
                    <h4 className="text-xs font-medium text-gray-900 truncate" title={photo.filename}>
                      {photo.filename}
                    </h4>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        {formatFileSize(photo.size || 0)}
                      </span>
                      <Badge className="text-xs bg-blue-100 text-blue-800">
                        IMAGE
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 bg-gray-50 rounded-lg text-center">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h4 className="text-sm font-medium text-gray-900 mb-1">No photos provided</h4>
              <p className="text-xs text-gray-600">The homeowner has not uploaded any photos for this project.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

export default ContractorProjectFilesTab
