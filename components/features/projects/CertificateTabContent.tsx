'use client'

import { useState, useEffect } from 'react'
import { Project } from '@/server/database/interfaces'
import { User } from '@/server/database/interfaces/auth'
import { USER_ROLES } from '@/utils/constants'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, FileText, Award, Calendar, User as UserIcon, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase'

interface CertificateTabContentProps {
  project: Project
  user: User
  userRole: typeof USER_ROLES[keyof typeof USER_ROLES]
}

export function CertificateTabContent({ project, user, userRole }: CertificateTabContentProps) {
  const certificate = project.project_certificate
  const [downloading, setDownloading] = useState(false)
  const [isAwardedContractor, setIsAwardedContractor] = useState(false)
  const [contractReviewsCompleted, setContractReviewsCompleted] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)

  // Check certificate access based on user role and project status
  useEffect(() => {
    const checkCertificateAccess = async () => {
      if (!user) {
        setCheckingAccess(false)
        return
      }

      try {
        const supabase = createClient()
        
        if (userRole === USER_ROLES.CONTRACTOR) {
          // Check if there's a selected/accepted proposal for this project by this contractor
          const { data: proposal, error } = await supabase
            .from('proposals')
            .select('id, is_selected, status, contract_reviewed, homeowner_contract_reviewed')
            .eq('project', project.id)
            .eq('contractor', user.id)
            .eq('is_selected', 'yes')
            .eq('status', 'accepted')
            .limit(1)
            .single()

          if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            console.error('Error checking awarded contractor:', error)
          }

          setIsAwardedContractor(!!proposal)
          
          // Check if both contract reviews are completed for winning contractor
          if (proposal) {
            setContractReviewsCompleted(proposal.contract_reviewed && proposal.homeowner_contract_reviewed)
          }
        }
      } catch (error) {
        console.error('Error checking certificate access:', error)
      } finally {
        setCheckingAccess(false)
      }
    }

    checkCertificateAccess()
  }, [user, userRole, project.id])

  const handleDownloadCertificate = async () => {
    // Check access before allowing download
    if (userRole === USER_ROLES.CONTRACTOR && (!isAwardedContractor || !contractReviewsCompleted)) {
      return // Should not reach here due to UI restrictions, but safety check
    }

    if (certificate?.url) {
      setDownloading(true)
      try {
        // Fetch the file
        const response = await fetch(certificate.url)
        const blob = await response.blob()
        
        // Create a temporary URL for the blob
        const blobUrl = window.URL.createObjectURL(blob)
        
        // Create a temporary anchor element and trigger download
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = certificate.filename || 'project-certificate'
        document.body.appendChild(link)
        link.click()
        
        // Clean up
        document.body.removeChild(link)
        window.URL.revokeObjectURL(blobUrl)
      } catch (error) {
        console.error('Error downloading certificate:', error)
        // Fallback to opening in new tab if download fails
        window.open(certificate.url, '_blank')
      } finally {
        setDownloading(false)
      }
    }
  }

  // Show loading state while checking access
  if (checkingAccess) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Loader2 className="h-16 w-16 text-gray-300 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Checking Access...</h3>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // For contractors who are not the awarded contractor - show blurred preview
  if (userRole === USER_ROLES.CONTRACTOR && !isAwardedContractor && certificate) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="relative">
                <div className="bg-gray-200 rounded-lg p-8 mb-4 opacity-50 blur-sm">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Certificate Preview</h3>
                  <p className="text-gray-500">PDF Document Available</p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Badge variant="secondary" className="bg-white/90 text-gray-700">
                    Preview Only
                  </Badge>
                </div>
              </div>
              <p className="text-gray-500 text-sm">
                Only the awarded contractor can view and download the full certificate.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // For awarded contractors who haven't completed contract reviews
  if (userRole === USER_ROLES.CONTRACTOR && isAwardedContractor && !contractReviewsCompleted && certificate) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="relative">
                <div className="bg-gray-200 rounded-lg p-8 mb-4 opacity-50 blur-sm">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Certificate Preview</h3>
                  <p className="text-gray-500">PDF Document Available</p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Badge variant="secondary" className="bg-white/90 text-gray-700">
                    Contract Reviews Pending
                  </Badge>
                </div>
              </div>
              <p className="text-gray-500 text-sm">
                Both homeowner and contractor need to review the contract to have access to the certificate of title.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!certificate) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Certificate Available</h3>
              <p className="text-gray-500 mb-4">
                A certificate of title will become available once the project has been verified and published.
              </p>
              {project.title_awarded && (
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  Title Awarded
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Full certificate access - Homeowners or Awarded contractors with completed reviews
  const hasFullAccess = userRole === USER_ROLES.HOMEOWNER || 
    (userRole === USER_ROLES.CONTRACTOR && isAwardedContractor && contractReviewsCompleted)

  if (!hasFullAccess) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
              <p className="text-gray-500 mb-4">
                Certificate access is restricted based on your role and project status.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Certificate Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                <Award className="h-3 w-3 mr-1" />
                Certificate Available
              </Badge>
              {project.title_awarded && (
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  Title Awarded
                </Badge>
              )}
            </div>
          </div>

          {/* Certificate Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Certificate Details</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">File:</span>
                    <span className="font-medium">{certificate.filename}</span>
                  </div>
                  {certificate.size && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Size:</span>
                      <span className="font-medium">
                        {(certificate.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  )}
                  {certificate.mimeType && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">{certificate.mimeType}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Project Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Parcel Identifier:</span>
                    <span className="font-medium font-mono">{project.pid}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <UserIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Project Owner:</span>
                    <span className="font-medium">{user.full_name}</span>
                  </div>
                  {project.substantial_completion && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Completed:</span>
                      <span className="font-medium">
                        {format(new Date(project.substantial_completion), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Download Button */}
          <div className="pt-4 border-t">
            <Button
              onClick={handleDownloadCertificate}
              disabled={downloading}
              className="w-full sm:w-auto"
              variant="default"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {downloading ? 'Downloading...' : 'Download Certificate'}
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
