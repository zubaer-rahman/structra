'use client'

import React, { useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Search, MapPin, DollarSign, Map, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Project } from '@/server/database/interfaces'
import Image from 'next/image'
import Link from 'next/link'
import LeafletInteractiveMap, { MapItem } from '@/components/shared/LeafletInteractiveMap'
import { normalizeFileReferences } from "@/utils/helpers"

interface MapViewProps {
  projects: Project[]
  selectedProject: Project | null
  mapCenter: [number, number]
  isClient: boolean
  onProjectClick: (project: Project) => void
  formatBudget: (budget: number) => string
  formatDate: (dateString: string) => string
  onSearch: (query: string) => void
  searchQuery: string
  obfuscate?: boolean
}

export default function GoogleMapView({
  projects,
  selectedProject,
  mapCenter,
  isClient,
  onProjectClick,
  formatBudget,
  onSearch,
  searchQuery,
}: MapViewProps) {
  const mapItems = useMemo<MapItem[]>(() => {
    return projects
      .filter((project) => project.location?.latitude && project.location?.longitude)
      .map((project) => ({
        id: String(project.id || project.slug || ''),
        title: project.project_title || 'Untitled Project',
        subtitle: project.location?.city
          ? `${project.location.city}, ${project.location.province || ''}`
          : project.location?.address || 'Verified Locale',
        latitude: Number(project.location.latitude),
        longitude: Number(project.location.longitude),
        badge: project.category?.[0] || undefined,
        priceOrRating: formatBudget(project.budget),
        linkUrl: `/recent-project-preview/${project.slug || project.id}`,
        linkText: 'View Project Details',
      }))
  }, [projects, formatBudget])

  const hasMapData = mapItems.length > 0

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-4 gap-0 min-h-[600px] bg-white dark:bg-[#0A0A0A]">
      {/* ── Sidebar ── */}
      <div className="lg:col-span-1 order-2 lg:order-1 border-r border-gray-200 dark:border-white/5 flex flex-col h-[600px]">

        {/* Sidebar header */}
        <div className="p-5 border-b border-gray-200 dark:border-white/5 space-y-3 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-orange-600 flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">Pipeline</p>
              <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                {projects.length} Active
              </p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder="Search territory..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              className="pl-9 h-9 bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/5 text-xs rounded-xl"
            />
          </div>
        </div>

        {/* Project list */}
        <div className="flex-1 overflow-y-auto space-y-1.5 p-3">
          {projects.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                No active projects
              </p>
            </div>
          ) : (
            projects.map((project, index) => {
              const location = project.location?.city
                ? `${project.location.city}, ${project.location.province || ''}`
                : project.location?.address || null
              const isSelected = selectedProject?.id === project.id
              const imageUrl = normalizeFileReferences(project.project_photos)?.[0]?.url || "/images/placeholder-image.png"

              return (
                <div
                  key={project.id || `project-${index}`}
                  onClick={() => onProjectClick(project)}
                  className={cn(
                    'p-3.5 rounded-xl border cursor-pointer transition-all duration-200 group',
                    isSelected
                      ? 'border-orange-500/40 bg-orange-500/8 dark:bg-orange-500/10'
                      : 'border-transparent hover:border-gray-200 dark:hover:border-white/5 hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-9 h-9 shrink-0">
                      <Image
                        src={imageUrl}
                        alt={project.project_title || 'Project'}
                        fill
                        className="rounded-lg object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder-image.png' }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-xs font-bold truncate transition-colors',
                        isSelected ? 'text-orange-500' : 'text-gray-900 dark:text-white group-hover:text-orange-500'
                      )}>
                        {project.project_title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {location && (
                          <span className="flex items-center gap-1 text-[10px] text-gray-400 truncate">
                            <MapPin className="w-2.5 h-2.5 text-orange-400 shrink-0" />
                            {location}
                          </span>
                        )}
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-gray-600 dark:text-gray-300 shrink-0">
                          <DollarSign className="w-2.5 h-2.5 text-orange-400" />
                          {formatBudget(project.budget)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── Map Panel ── */}
      <div className="lg:col-span-3 order-1 lg:order-2 relative min-h-[400px] lg:min-h-[600px]">
        <LeafletInteractiveMap
          items={mapItems}
          center={mapCenter}
          zoom={5}
          selectedId={selectedProject ? String(selectedProject.id || selectedProject.slug || '') : null}
          onItemClick={(item) => {
            const found = projects.find(
              (p) => String(p.id) === item.id || String(p.slug) === item.id
            )
            if (found) onProjectClick(found)
          }}
          className="h-full min-h-[600px]"
        />
      </div>
    </div>
  )
}
