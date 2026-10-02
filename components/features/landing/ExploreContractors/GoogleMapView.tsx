'use client'

import React, { useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Search, MapPin, Star, Shield, Map } from 'lucide-react'
import { cn } from '@/lib/utils'
import { User, ContractorProfile } from '@/server/database/interfaces'
import Image from 'next/image'
import Link from 'next/link'
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

export default function GoogleMapView({
  contractors,
  selectedContractor,
  mapCenter,
  isClient,
  onContractorClick,
  onSearch,
  searchQuery,
}: MapViewProps) {
  const mapItems = useMemo<MapItem[]>(() => {
    const list: MapItem[] = []
    contractors.forEach((contractor) => {
      const profile = contractor.contractor_profile
      const lat = Number(profile?.address?.latitude)
      const lng = Number(profile?.address?.longitude)
      if (!lat || !lng) return

      const name = profile?.business_name || `${contractor.first_name || ''} ${contractor.last_name || ''}`.trim() || 'Contractor'
      list.push({
        id: String(contractor.id || contractor.slug || ''),
        title: name,
        subtitle: profile?.address?.city
          ? `${profile.address.city}, ${profile.address.province || ''}`
          : profile?.service_location || 'Verified Locale',
        latitude: lat,
        longitude: lng,
        badge: Array.isArray(profile?.trade_category) ? profile.trade_category[0] : profile?.trade_category,
        priceOrRating: contractor.average_rating
          ? `★ ${contractor.average_rating.toFixed(1)} (${contractor.rating_count || 0} reviews)`
          : 'Verified Professional',
        linkUrl: `/contractors/${contractor.slug || contractor.id}`,
        linkText: 'View Profile →',
      })
    })
    return list
  }, [contractors])

  const hasMapData = mapItems.length > 0

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-4 gap-0 min-h-[600px] bg-white dark:bg-[#0A0A0A]">
      {/* ── Sidebar ── */}
      <div className="lg:col-span-1 order-2 lg:order-1 border-r border-gray-200 dark:border-white/5 flex flex-col h-[600px]">

        {/* Sidebar header */}
        <div className="p-5 border-b border-gray-200 dark:border-white/5 space-y-3 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-orange-600 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">Network</p>
              <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                {contractors.length} Verified
              </p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder="Search trade or city..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              className="pl-9 h-9 bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/5 text-xs rounded-xl"
            />
          </div>
        </div>

        {/* Contractor list */}
        <div className="flex-1 overflow-y-auto space-y-1.5 p-3">
          {contractors.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                No contractors found
              </p>
            </div>
          ) : (
            contractors.map((contractor, index) => {
              const profile = contractor.contractor_profile
              if (!profile) return null
              const name = profile.business_name || `${contractor.first_name || ''} ${contractor.last_name || ''}`.trim()
              const location = profile.address?.city
                ? `${profile.address.city}, ${profile.address.province || ''}`
                : profile.service_location || null
              const isSelected = selectedContractor?.id === contractor.id

              return (
                <div
                  key={contractor.id || `contractor-${index}`}
                  onClick={() => onContractorClick(contractor)}
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
                        src={contractor.profile_photo || '/assets/avatar.png'}
                        alt={name}
                        fill
                        className="rounded-lg object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/assets/avatar.png' }}
                      />
                      {profile.is_admin_verified && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border border-white dark:border-[#0A0A0A] flex items-center justify-center">
                          <Shield className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-xs font-bold truncate transition-colors',
                        isSelected ? 'text-orange-500' : 'text-gray-900 dark:text-white group-hover:text-orange-500'
                      )}>
                        {name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {location && (
                          <span className="flex items-center gap-1 text-[10px] text-gray-400 truncate">
                            <MapPin className="w-2.5 h-2.5 text-orange-400 shrink-0" />
                            {location}
                          </span>
                        )}
                        {contractor.average_rating && contractor.rating_count && contractor.rating_count > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-gray-600 dark:text-gray-300 shrink-0">
                            <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                            {contractor.average_rating.toFixed(1)}
                          </span>
                        )}
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
