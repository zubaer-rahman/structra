'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { MapPin, DollarSign, Calendar, Building2, Search, Lock, CheckCircle } from 'lucide-react'
import { BaseProject } from '@/server/services/ProjectService'
import { clientConfig } from '@/config/client-env'
import { toast } from 'sonner'
import { ProjectPaymentModal } from '@/components/shared/modals/ProjectPaymentModal'
import { VerificationRedirectModal } from '@/components/shared/modals/VerificationRedirectModal'
import { ProfileCompletionModal } from '@/components/shared/modals/ProfileCompletionModal'
import { trpc } from '@/utils/trpc'
import { validateContractorProfileForVerification } from '@/utils/validation'
import type { MapItem } from '@/components/shared/LeafletInteractiveMap'

// Lazy-load Leaflet map (SSR-unsafe)
const LeafletInteractiveMap = dynamic(
  () => import('@/components/shared/LeafletInteractiveMap'),
  { ssr: false, loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-[#0A0A0A] rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading map…</p>
      </div>
    </div>
  )}
)

interface ContractorProjectMapViewProps {
  projects: BaseProject[]
  onViewDetails: (project: BaseProject) => void
  formatCurrency: (amount: number) => string
  formatDate: (date: Date | string) => string
  user?: any
}

export default function ContractorProjectMapView({
  projects,
  onViewDetails,
  formatCurrency,
  formatDate,
  user,
}: ContractorProjectMapViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [selectedProject, setSelectedProject] = useState<BaseProject | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [showProfileCompletionModal, setShowProfileCompletionModal] = useState(false)
  const [paymentProject, setPaymentProject] = useState<BaseProject | null>(null)

  const { data: userProfile, isLoading: userProfileLoading } = trpc.users.getProfile.useQuery(undefined, { enabled: !!user?.id })
  const { data: contractorProfile, isLoading: contractorProfileLoading } = trpc.users.getContractorProfile.useQuery(undefined, { enabled: !!user?.id })
  const { data: verificationStatus, isLoading: verificationLoading } = trpc.users.checkVerificationStatus.useQuery(undefined, { enabled: !!user?.id })

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const filteredProjects = useMemo(() => {
    const hasCoords = (p: BaseProject) => p.location?.latitude && p.location?.longitude
    if (!debouncedSearchQuery.trim()) return projects.filter(hasCoords)
    const q = debouncedSearchQuery.toLowerCase()
    return projects.filter(p =>
      hasCoords(p) && (
        p.location?.city?.toLowerCase().includes(q) ||
        p.location?.province?.toLowerCase().includes(q) ||
        p.location?.address?.toLowerCase().includes(q) ||
        p.project_title?.toLowerCase().includes(q)
      )
    )
  }, [projects, debouncedSearchQuery])

  const mapCenter = useMemo((): [number, number] => {
    const valid = filteredProjects.filter(p => p.location?.latitude && p.location?.longitude)
    if (valid.length === 0) return [43.6532, -79.3832]
    const avgLat = valid.reduce((s, p) => s + Number(p.location!.latitude), 0) / valid.length
    const avgLng = valid.reduce((s, p) => s + Number(p.location!.longitude), 0) / valid.length
    return [avgLat, avgLng]
  }, [filteredProjects])

  const mapItems = useMemo((): MapItem[] =>
    filteredProjects
      .filter(p => p.location?.latitude && p.location?.longitude)
      .map(p => ({
        id: p.id,
        title: p.project_title || 'Untitled Project',
        subtitle: p.location?.city && p.location?.province
          ? `${p.location.city}, ${p.location.province}`
          : undefined,
        latitude: Number(p.location!.latitude),
        longitude: Number(p.location!.longitude),
        badge: p.category?.[0],
        priceOrRating: formatCurrency(p.budget || 0),
      })),
  [filteredProjects, formatCurrency])

  const handleProjectClick = useCallback(async (project: BaseProject) => {
    if (!user || !project.id) {
      toast.error('Please log in to access this project')
      return
    }
    if (userProfileLoading || contractorProfileLoading || verificationLoading) return

    const profileValidation = validateContractorProfileForVerification(userProfile, contractorProfile)
    if (!profileValidation.isComplete) {
      setShowProfileCompletionModal(true)
      return
    }
    if (!verificationStatus?.isVerified) {
      toast.error('You need to be a verified contractor to view project details')
      setShowVerificationModal(true)
      return
    }
    if (!project.hasAccess) {
      setPaymentProject(project)
      setShowPaymentModal(true)
      return
    }
    onViewDetails(project)
  }, [user, userProfile, contractorProfile, verificationStatus, userProfileLoading, contractorProfileLoading, verificationLoading, onViewDetails])

  const handleMapItemClick = useCallback((item: MapItem) => {
    const project = filteredProjects.find(p => p.id === item.id)
    if (project) {
      setSelectedProject(project)
      handleProjectClick(project)
    }
  }, [filteredProjects, handleProjectClick])

  const projectAccessFee = clientConfig.pricing.getProjectAccessFeeInDollars()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[640px]">
      {/* Project List Sidebar */}
      <div className="lg:col-span-1 order-2 lg:order-1 flex flex-col">
        <Card className="h-full flex flex-col border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03]">
          <div className="p-4 border-b border-gray-200 dark:border-white/10 shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                Available Projects
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 font-normal">
                  ({filteredProjects.length})
                </span>
              </h3>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                type="text"
                placeholder="Search projects…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>
          </div>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">
              {filteredProjects.length === 0 ? (
                <div className="p-6 text-center">
                  <MapPin className="h-10 w-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {debouncedSearchQuery.trim()
                      ? `No projects found for "${debouncedSearchQuery}"`
                      : 'No projects with location data found.'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-2 p-3">
                  {filteredProjects.map((project) => {
                    const hasAccess = project.hasAccess || false
                    const isSelected = selectedProject?.id === project.id
                    return (
                      <div
                        key={project.id}
                        onClick={() => { setSelectedProject(project); handleProjectClick(project) }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10'
                            : 'border-gray-200 dark:border-white/10 hover:border-orange-300 dark:hover:border-orange-500/30 hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <h4 className="font-medium text-sm line-clamp-2 text-gray-900 dark:text-white">
                            {project.project_title}
                          </h4>

                          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                              {hasAccess
                                ? project.location?.address && project.location?.city
                                  ? `${project.location.address}, ${project.location.city}`
                                  : project.location?.city && project.location?.province
                                  ? `${project.location.city}, ${project.location.province}`
                                  : 'Location available'
                                : project.location?.city && project.location?.province
                                  ? `${project.location.city}, ${project.location.province}`
                                  : 'Location available'
                              }
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400">
                            <DollarSign className="h-3 w-3 shrink-0" />
                            <span>{formatCurrency(project.budget || 0)}</span>
                          </div>

                          {project.category && project.category.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {project.category.slice(0, 2).map((cat, i) => (
                                <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 border-0">
                                  {cat}
                                </Badge>
                              ))}
                              {project.category.length > 2 && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400">
                                  +{project.category.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}

                          {project.start_date && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                              <Calendar className="h-3 w-3 shrink-0" />
                              <span>Starts {formatDate(project.start_date)}</span>
                            </div>
                          )}

                          {!hasAccess ? (
                            <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-lg">
                              <Lock className="h-3 w-3 shrink-0" />
                              <span>Access: ${projectAccessFee.toFixed(2)}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded-lg">
                              <CheckCircle className="h-3 w-3 shrink-0" />
                              <span>You have access</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaflet Map */}
      <div className="lg:col-span-2 order-1 lg:order-2">
        <Card className="h-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden">
          <CardContent className="p-0 h-full">
            <LeafletInteractiveMap
              items={mapItems}
              center={mapCenter}
              zoom={filteredProjects.length === 1 ? 14 : 8}
              selectedId={selectedProject?.id ?? null}
              onItemClick={handleMapItemClick}
              className="h-full"
            />
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {showPaymentModal && paymentProject && user && (
        <ProjectPaymentModal
          isOpen={showPaymentModal}
          onClose={() => { setShowPaymentModal(false); setPaymentProject(null) }}
          project={paymentProject}
          userId={user.id}
          isVerified={verificationStatus?.isVerified || false}
        />
      )}
      <ProfileCompletionModal
        isOpen={showProfileCompletionModal}
        onClose={() => setShowProfileCompletionModal(false)}
        userProfile={userProfile}
        contractorProfile={contractorProfile}
      />
      <VerificationRedirectModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        user={user ? { id: user.id, email: user.email } : undefined}
      />
    </div>
  )
}
