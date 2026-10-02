"use client";

import React from "react";
import { MapPin, Shield, Star, Wrench, ExternalLink } from "lucide-react";
import { User, ContractorProfile } from "@/server/database/interfaces";
import Image from "next/image";
import Link from "next/link";

interface ContractorWithProfile extends Omit<User, 'contractor_profile'> {
  contractor_profile?: ContractorProfile;
  average_rating?: number;
  rating_count?: number;
  slug?: string;
}

interface ContractorCardProps {
  contractor: ContractorWithProfile;
  selectedContractor: ContractorWithProfile | null;
  formatDate: (dateString: string) => string;
}

export default function ContractorCard({ contractor, selectedContractor, formatDate }: ContractorCardProps) {
  const isSelected = selectedContractor?.id === contractor.id;
  const profile = contractor.contractor_profile;
  const name = profile?.business_name || `${contractor.first_name || ""} ${contractor.last_name || ""}`.trim() || "Contractor";
  const location = profile?.address?.city && profile?.address?.province
    ? `${profile.address.city}, ${profile.address.province}`
    : profile?.service_location || null;
  const trades: string[] = Array.isArray(profile?.trade_category)
    ? profile.trade_category
    : profile?.trade_category ? [profile.trade_category] : [];
  const href = `/contractors/${contractor.slug || contractor.id}`;

  return (
    <Link href={href} className="block group focus:outline-none" tabIndex={0}>
      <div className={`relative p-5 rounded-2xl border transition-all duration-300 bg-white dark:bg-white/[0.02] ${
        isSelected
          ? "border-orange-500/50 shadow-[0_0_0_1px_rgba(234,88,12,0.3),0_8px_24px_rgba(234,88,12,0.12)]"
          : "border-gray-200/80 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 hover:shadow-md dark:hover:shadow-none"
      }`}>

        {/* Verified badge */}
        {profile?.is_admin_verified && (
          <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Shield className="w-2.5 h-2.5 text-emerald-500" />
            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Verified</span>
          </div>
        )}

        {/* Avatar + Name */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative w-12 h-12 shrink-0">
            <Image
              src={contractor.profile_photo || "/assets/avatar.png"}
              alt={name}
              fill
              className="rounded-xl object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = "/assets/avatar.png"; }}
            />
          </div>
          <div className="flex-1 min-w-0 pr-16">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate group-hover:text-orange-500 transition-colors">
              {name}
            </h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate mt-0.5">
              {contractor.first_name} {contractor.last_name}
            </p>
          </div>
        </div>

        {/* Trade tags */}
        {trades.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {trades.slice(0, 2).map((t, i) => (
              <span key={i} className="px-2 py-0.5 rounded-md bg-orange-500/8 dark:bg-orange-500/10 border border-orange-500/15 text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                {t}
              </span>
            ))}
            {trades.length > 2 && (
              <span className="px-2 py-0.5 text-[10px] font-bold text-gray-400 dark:text-gray-500">+{trades.length - 2}</span>
            )}
          </div>
        )}

        {/* Meta row */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            {location && (
              <span className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                <MapPin className="w-3 h-3 text-orange-500" />
                <span className="truncate max-w-[90px]">{location}</span>
              </span>
            )}
            {contractor.average_rating && contractor.rating_count && contractor.rating_count > 0 ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-gray-900 dark:text-white">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                {contractor.average_rating.toFixed(1)}
              </span>
            ) : null}
          </div>
          <span className="flex items-center gap-0.5 text-[10px] font-bold text-orange-500 group-hover:gap-1.5 transition-all">
            Profile <ExternalLink className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
