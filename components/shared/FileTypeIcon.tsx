'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import { FileText, Download } from 'lucide-react'

interface FileTypeIconProps {
  fileType: 'agreement' | 'proposal' | 'contract' | 'document' | 'generic'
  size?: number
  className?: string
  showDownloadIcon?: boolean
  variant?: 'icon' | 'button' | 'badge'
}

export function FileTypeIcon({
  fileType,
  size = 16,
  className,
  showDownloadIcon = false,
  variant = 'icon'
}: FileTypeIconProps) {
  const getFileImage = () => {
    switch (fileType) {
      case 'agreement':
      case 'contract':
        return '/assets/agreement.png'
      case 'proposal':
        return '/assets/proposal.png'
      case 'document':
        return '/assets/png.png'
      default:
        return '/assets/png.png'
    }
  }

  const getFileLabel = () => {
    switch (fileType) {
      case 'agreement':
        return 'Agreement'
      case 'contract':
        return 'Contract'
      case 'proposal':
        return 'Proposal'
      case 'document':
        return 'Document'
      default:
        return 'File'
    }
  }

  if (variant === 'button') {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer",
        className
      )}>
        <Image
          src={getFileImage()}
          alt={getFileLabel()}
          width={size}
          height={size}
          className="object-contain"
        />
        <span className="text-sm font-medium text-gray-700">
          {getFileLabel()}
        </span>
        {showDownloadIcon && (
          <Download className="h-4 w-4 text-gray-500" />
        )}
      </div>
    )
  }

  if (variant === 'badge') {
    return (
      <div className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium",
        className
      )}>
        <Image
          src={getFileImage()}
          alt={getFileLabel()}
          width={12}
          height={12}
          className="object-contain"
        />
        {getFileLabel()}
      </div>
    )
  }

  // Default icon variant
  return (
    <div className={cn("relative", className)}>
      <Image
        src={getFileImage()}
        alt={getFileLabel()}
        width={size}
        height={size}
        className="object-contain"
      />
      {showDownloadIcon && (
        <div className="absolute -bottom-1 -right-1">
          <div className="w-3 h-3 bg-white rounded-full border border-gray-300 flex items-center justify-center">
            <Download className="h-2 w-2 text-gray-600" />
          </div>
        </div>
      )}
    </div>
  )
}

export default FileTypeIcon
