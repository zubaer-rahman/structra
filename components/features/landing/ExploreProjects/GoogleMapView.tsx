'use client'

import React, { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { MapPin, DollarSign, Search } from 'lucide-react'
import { Project } from '@/server/database/interfaces'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import LeafletInteractiveMap, { MapItem } from '@/components/shared/LeafletInteractiveMap'

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
  // Convert projects with coordinates to MapItems for the free Leaflet map
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

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-4 gap-0 min-h-[600px] bg-black">
      {/* Sidebar with Search and Project List */}
      <div className="lg:col-span-1 overflow-hidden order-2 lg:order-1 border-r border-white/5 flex flex-col h-[600px]">
        {/* Search header */}
        <div className="p-6 border-b border-white/5 space-y-4 flex-shrink-0 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold text-xs">
              01
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Sector Pipeline
              </h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                Active Construction Ventures
              </p>
            </div>
          </div>

          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-orange-500 transition-colors" />
            <Input
              placeholder="Filter by territory..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              className="pl-10 h-10 bg-white/[0.03] border-white/5 focus:border-orange-500/50 text-xs text-white placeholder:text-gray-500 rounded-xl transition-all"
            />
          </div>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-black/20">
          {projects.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Zero pipeline deployments
              </p>
            </div>
          ) : (
            projects.map((project, index) => (
              <motion.div
                key={project.id || `project-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                onClick={() => onProjectClick(project)}
                className={cn(
                  'p-4 rounded-2xl border cursor-pointer transition-all duration-300 group relative overflow-hidden',
                  selectedProject?.id === project.id
                    ? 'border-orange-500/60 bg-orange-500/10 shadow-[0_0_20px_rgba(234,88,12,0.15)]'
                    : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10'
                )}
              >
                <div className="relative z-10 space-y-2">
                  <h3 className="font-bold text-xs text-white line-clamp-1 group-hover:text-orange-500 transition-colors">
                    {project.project_title}
                  </h3>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <MapPin className="h-3 w-3 text-orange-500 flex-shrink-0" />
                      <span className="truncate">
                        {project.location?.city && project.location?.province
                          ? `${project.location.city}, ${project.location.province}`
                          : project.location?.address || 'Verified Locale'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <DollarSign className="h-3 w-3 text-orange-500 flex-shrink-0" />
                      <span className="text-white">{formatBudget(project.budget)}</span>
                    </div>
                  </div>

                  {project.category && project.category.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {project.category.slice(0, 1).map((cat, catIdx) => (
                        <Badge
                          key={catIdx}
                          variant="outline"
                          className="bg-white/5 border-white/10 text-[9px] font-black uppercase text-gray-400 px-2 py-0"
                        >
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Interactive Free OpenStreetMap Leaflet Display */}
      <div className="lg:col-span-3 order-1 lg:order-2 h-full min-h-[600px] relative">
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
