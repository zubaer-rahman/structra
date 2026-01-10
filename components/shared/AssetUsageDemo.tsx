'use client'

import { RoleBasedAvatar } from './RoleBasedAvatar'
import { VerificationBadge } from './VerificationBadge'
import { FileTypeIcon } from './FileTypeIcon'
import { DashboardIcon } from './DashboardIcon'
import { FileActionDropdown } from './ActionDropdown'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

/**
 * Demo component showcasing the new asset usage throughout the application
 * This component demonstrates how the assets from public/assets/ are now integrated
 */
export function AssetUsageDemo() {
  return (
    <div className="space-y-8 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Asset Integration Demo
        </h1>
        <p className="text-gray-600">
          Showcasing how the assets from public/assets/ are now integrated throughout the application
        </p>
      </div>

      {/* Role-Based Avatars */}
      <Card>
        <CardHeader>
          <CardTitle>Role-Based Avatars</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <RoleBasedAvatar
                role="contractor"
                isVerified={true}
                size={64}
                name="John Contractor"
                showVerificationBadge={true}
              />
              <p className="text-sm text-gray-600 mt-2">Verified Contractor</p>
            </div>
            <div className="text-center">
              <RoleBasedAvatar
                role="homeowner"
                isVerified={false}
                size={64}
                name="Jane Homeowner"
                showVerificationBadge={true}
              />
              <p className="text-sm text-gray-600 mt-2">Unverified Homeowner</p>
            </div>
            <div className="text-center">
              <RoleBasedAvatar
                role="admin"
                isVerified={true}
                size={64}
                name="Admin User"
                showVerificationBadge={true}
              />
              <p className="text-sm text-gray-600 mt-2">Admin (Fallback Avatar)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Badges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <VerificationBadge 
                isVerified={true} 
                useCustomIcon={true}
                size="lg"
              />
              <p className="text-sm text-gray-600 mt-2">Custom Verified Badge</p>
            </div>
            <div className="text-center">
              <VerificationBadge 
                isVerified={true} 
                useCustomIcon={false}
                size="lg"
              />
              <p className="text-sm text-gray-600 mt-2">Default Verified Badge</p>
            </div>
            <div className="text-center">
              <VerificationBadge 
                isVerified={false} 
                size="lg"
              />
              <p className="text-sm text-gray-600 mt-2">Unverified Badge</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Icons */}
      <Card>
        <CardHeader>
          <CardTitle>Dashboard Icons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Icon Variants</h4>
              <div className="flex items-center gap-4">
                <DashboardIcon iconType="dashboard" size={32} />
                <DashboardIcon iconType="projects" size={32} />
                <DashboardIcon iconType="proposals" size={32} />
                <DashboardIcon iconType="profile" size={32} />
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Button Variants</h4>
              <div className="flex items-center gap-4">
                <DashboardIcon 
                  iconType="dashboard" 
                  variant="button" 
                />
                <DashboardIcon 
                  iconType="projects" 
                  variant="button" 
                />
                <DashboardIcon 
                  iconType="proposals" 
                  variant="button" 
                />
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Navigation Variants</h4>
              <div className="flex items-center gap-4">
                <DashboardIcon iconType="dashboard" variant="nav" />
                <DashboardIcon iconType="projects" variant="nav" />
                <DashboardIcon iconType="proposals" variant="nav" />
                <DashboardIcon iconType="profile" variant="nav" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Type Icons */}
      <Card>
        <CardHeader>
          <CardTitle>File Type Icons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Icon Variants</h4>
              <div className="flex items-center gap-4">
                <FileTypeIcon fileType="agreement" size={24} />
                <FileTypeIcon fileType="proposal" size={24} />
                <FileTypeIcon fileType="contract" size={24} />
                <FileTypeIcon fileType="document" size={24} />
                <FileTypeIcon fileType="generic" size={24} />
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Button Variants</h4>
              <div className="flex items-center gap-4">
                <FileTypeIcon 
                  fileType="agreement" 
                  variant="button" 
                  showDownloadIcon={true}
                />
                <FileTypeIcon 
                  fileType="proposal" 
                  variant="button" 
                  showDownloadIcon={true}
                />
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Badge Variants</h4>
              <div className="flex items-center gap-4">
                <FileTypeIcon fileType="agreement" variant="badge" />
                <FileTypeIcon fileType="proposal" variant="badge" />
                <FileTypeIcon fileType="contract" variant="badge" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Dropdowns */}
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Action Dropdowns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <FileActionDropdown
                fileType="agreement"
                onDownload={() => console.log('Download agreement')}
                onView={() => console.log('View agreement')}
                onEdit={() => console.log('Edit agreement')}
              />
              <p className="text-sm text-gray-600 mt-2">Agreement Actions</p>
            </div>
            <div className="text-center">
              <FileActionDropdown
                fileType="proposal"
                onDownload={() => console.log('Download proposal')}
                onView={() => console.log('View proposal')}
                onDelete={() => console.log('Delete proposal')}
              />
              <p className="text-sm text-gray-600 mt-2">Proposal Actions</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900">In Dashboard Navigation:</h4>
              <p className="text-gray-600">
                dashboard.png, projects.png, proposals.png, and profile.png for sidebar navigation
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">In User Menus:</h4>
              <p className="text-gray-600">
                Role-based avatars automatically show contractor.png or homeowner.png based on user role
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">In Verification Badges:</h4>
              <p className="text-gray-600">
                Use verified.png for verified users with useCustomIcon prop
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">In File Downloads:</h4>
              <p className="text-gray-600">
                agreement.png for contracts, proposal.png for proposals, png.png for generic files
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">In Action Dropdowns:</h4>
              <p className="text-gray-600">
                File type icons automatically appear based on the fileType prop
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AssetUsageDemo
