'use client'

import React, { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, MapPin, Star, Shield } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { User, ContractorProfile } from '@/server/database/interfaces'
import Image from 'next/image'
import LeafletInteractiveMap, { MapItem } from '@/components/shared/LeafletInteractiveMap'

interface ContractorWithProfile extends Omit<User, 'contractor_profile'> {
  contractor_profile?: ContractorProfile
  average_rating?: number
  rating_count?: number
  slug?: string
}

interface MapViewProps {
  contractors: ContractorWithProfile[]
  selectedContractor: ContractorWithProfile | null
  mapCenter: [number, number]
  isClient: boolean
  onContractorClick: (contractor: ContractorWithProfile) => void
  formatDate: (dateString: string) => string
  onSearch: (query: string) => void
  searchQuery: string
}

const getContractorProfile = (contractor: ContractorWithProfile): ContractorProfile | null => {
  return contractor.contractor_profile || null
}

export default function GoogleMapView({
  contractors,
  selectedContractor,
  mapCenter,
  isClient,
  onContractorClick,
  onSearch,
  searchQuery,
}: MapViewProps) {
  // Convert contractors with coordinates into MapItems for the free Leaflet map
  const mapItems = useMemo<MapItem[]>(() => {
    const list: MapItem[] = []
    contractors.forEach((contractor) => {
      const profile = getContractorProfile(contractor)
      const lat = Number(profile?.address?.latitude)
      const lng = Number(profile?.address?.longitude)
      if (!lat || !lng) return

      const name = profile?.business_name || `${contractor.first_name || ''} ${contractor.last_name || ''}`.trim() || 'Contractor'
      const ratingText = contractor.average_rating
        ? `★ ${contractor.average_rating.toFixed(1)} (${contractor.rating_count || 0})`
        : undefined

      list.push({
        id: String(contractor.id || contractor.slug || ''),
        title: name,
        subtitle: profile?.address?.city
          ? `${profile.address.city}, ${profile.address.province || ''}`
          : profile?.address?.address || 'Verified Locale',
        latitude: lat,
        longitude: lng,
        badge: profile?.trade_category?.[0] || (profile?.is_admin_verified ? 'Verified Master' : undefined),
        priceOrRating: ratingText,
        linkUrl: `/contractors/${contractor.slug || contractor.id}`,
        linkText: 'View Contractor Profile',
      })
    })
    return list
  }, [contractors])

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-4 gap-0 min-h-[600px] bg-black">
      {/* Sidebar with Search and Contractor Cards */}
      <div className="lg:col-span-1 overflow-hidden order-2 lg:order-1 border-r border-white/5 flex flex-col h-[600px]">
        {/* Search header */}
        <div className="p-6 border-b border-white/5 space-y-4 flex-shrink-0 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold text-xs">
              02
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Elite Network
              </h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                Verified Master Contractors
              </p>
            </div>
          </div>

          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-orange-500 transition-colors" />
            <Input
              placeholder="Search trade or territory..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              className="pl-10 h-10 bg-white/[0.03] border-white/5 focus:border-orange-500/50 text-xs text-white placeholder:text-gray-500 rounded-xl transition-all"
            />
          </div>
        </div>

        {/* Contractor List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-black/20">
          {contractors.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Zero network profiles found
              </p>
            </div>
          ) : (
            contractors.map((contractor, index) => {
              const profile = getContractorProfile(contractor)
              if (!profile) return null

              return (
                <motion.div
                  key={contractor.id || `contractor-${index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => onContractorClick(contractor)}
                  className={cn(
                    'p-4 rounded-2xl border cursor-pointer transition-all duration-300 group relative overflow-hidden',
                    selectedContractor?.id === contractor.id
                      ? 'border-orange-500/60 bg-orange-500/10 shadow-[0_0_20px_rgba(234,88,12,0.15)]'
                      : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10'
                  )}
                >
                  <div className="relative z-10 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 flex-shrink-0">
                        <Image
                          src={contractor.profile_photo || '/assets/avatar.png'}
                          alt={`${contractor.first_name || ''} ${contractor.last_name || ''}`}
                          fill
                          className="rounded-full object-cover border border-white/10"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/assets/avatar.png'
                          }}
                        />
                        {profile.is_admin_verified && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-orange-600 rounded-full flex items-center justify-center border border-[#0A0A0A]">
                            <Shield className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-xs text-white line-clamp-1 group-hover:text-orange-500 transition-colors">
                          {profile.business_name || `${contractor.first_name || ''} ${contractor.last_name || ''}`}
                        </h3>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate">
                          {contractor.first_name} {contractor.last_name}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <MapPin className="h-3 w-3 text-orange-500 flex-shrink-0" />
                        <span className="truncate">
                          {profile.address?.city && profile.address?.province
                            ? `${profile.address.city}, ${profile.address.province}`
                            : profile.address?.address || 'Verified Locale'}
                        </span>
                      </div>

                      {contractor.average_rating && contractor.rating_count && contractor.rating_count > 0 && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                          <span className="text-white">
                            {contractor.average_rating.toFixed(1)}{' '}
                            <span className="text-gray-500">({contractor.rating_count})</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {profile.trade_category && profile.trade_category.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {profile.trade_category.slice(0, 1).map((trade, tIdx) => (
                          <Badge
                            key={tIdx}
                            variant="outline"
                            className="bg-white/5 border-white/10 text-[9px] font-black uppercase text-gray-400 px-2 py-0"
                          >
                            {trade}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </div>

      {/* Interactive Free OpenStreetMap Leaflet Map */}
      <div className="lg:col-span-3 order-1 lg:order-2 h-full min-h-[600px] relative">
        <LeafletInteractiveMap
          items={mapItems}
          center={mapCenter}
          zoom={5}
          selectedId={selectedContractor ? String(selectedContractor.id || selectedContractor.slug || '') : null}
          onItemClick={(item) => {
            const found = contractors.find(
              (c) => String(c.id) === item.id || String(c.slug) === item.id
            )
            if (found) onContractorClick(found)
          }}
          className="h-full min-h-[600px]"
        />
      </div>
    </div>
  )
}
