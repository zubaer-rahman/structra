"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Shield,
  Star
} from "lucide-react";
import { User, ContractorProfile } from "@/server/database/interfaces";
import Image from "next/image";

// Helper function to safely access contractor profile
const getContractorProfile = (contractor: ContractorWithProfile): ContractorProfile | null => {
  return contractor.contractor_profile || null;
};

// Helper function to render star rating
const renderStars = (rating: number) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  
  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <Star key={i} className="h-3 w-3 text-yellow-400 fill-yellow-400" />
    );
  }
  
  if (hasHalfStar) {
    stars.push(
      <Star key="half" className="h-3 w-3 text-yellow-400 fill-yellow-400 opacity-50" />
    );
  }
  
  const emptyStars = 5 - Math.ceil(rating);
  for (let i = 0; i < emptyStars; i++) {
    stars.push(
      <Star key={`empty-${i}`} className="h-3 w-3 text-gray-300" />
    );
  }
  
  return stars;
};

interface ContractorWithProfile extends Omit<User, 'contractor_profile'> {
  contractor_profile?: ContractorProfile; // This will be the actual profile object from our query
  average_rating?: number;
  rating_count?: number;
  slug?: string; // SEO-friendly URL slug from contractor profile
}

interface ContractorCardProps {
  contractor: ContractorWithProfile;
  selectedContractor: ContractorWithProfile | null;
  formatDate: (dateString: string) => string;
}

export default function ContractorCard({
  contractor,
  selectedContractor,
  formatDate
}: ContractorCardProps) {
  const isSelected = selectedContractor?.id === contractor.id;
  const profile = getContractorProfile(contractor);

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-sm border ${
        isSelected 
          ? 'border-gray-400 bg-gray-50' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {/* Profile Picture */}
          <div className="relative flex-shrink-0">
            <Image
              src={contractor.profile_photo || "/assets/avatar.png"}
              alt={contractor.full_name || "Contractor profile picture"}
              width={48}
              height={48}
              className="rounded-full object-cover"
              onError={(e) => {
                console.log("Image error for contractor:", contractor.full_name, "src:", contractor.profile_photo);
                const target = e.target as HTMLImageElement;
                target.src = "/assets/avatar.png";
              }}
              onLoad={() => {
                console.log("Image loaded successfully for contractor:", contractor.full_name, "src:", contractor.profile_photo);
              }}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-base text-gray-900 mb-1 line-clamp-1">
              {profile?.business_name || contractor.full_name}
            </h3>
            <p className="text-sm text-gray-500 line-clamp-1">
              {contractor.full_name}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Rating */}
        {contractor.average_rating && contractor.average_rating > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {renderStars(contractor.average_rating)}
            </div>
            <span className="text-xs text-gray-600">
              {contractor.average_rating.toFixed(1)} ({contractor.rating_count} review{contractor.rating_count !== 1 ? 's' : ''})
            </span>
          </div>
        )}

        {/* Trade Categories */}
        {profile?.trade_category && profile.trade_category.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {profile.trade_category.slice(0, 3).map((trade, index) => (
              <span 
                key={`${contractor.id}-card-trade-${index}-${trade}`}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
              >
                {trade}
              </span>
            ))}
            {profile.trade_category.length > 3 && (
              <span className="px-2 py-1 text-xs text-gray-500">
                +{profile.trade_category.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Location - HIDDEN FROM LANDING PAGE */}
        {/* {(profile?.address?.address || contractor.address) && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin className="h-3 w-3" />
            <span className="truncate text-xs">
              {profile?.address?.address || contractor.address}
            </span>
          </div>
        )} */}

        {/* Footer */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
            <span>Joined {formatDate(contractor.created_at)}</span>
            <span className="text-gray-500">Contractor</span>
          </div>
          <Button 
            size="sm" 
            className="w-full"
            onClick={() => {
              if (contractor.slug) {
                window.open(`/profile/${contractor.slug}`, '_blank')
              } else {
                // Fallback to user_id if no slug available
                console.warn('No slug available for contractor:', contractor.full_name, 'using user_id as fallback')
                window.open(`/profile/${contractor.id}`, '_blank')
              }
            }}
          >
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
