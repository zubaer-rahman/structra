"use client";

import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { 
  AMENITY_CATEGORIES, 
  AMENITY_LABELS, 
  CATEGORY_LABELS,
  getNotIncludedAmenities,
  type SiteAmenities 
} from "@/utils/constants/amenities";

interface SiteAmenitiesDisplayProps {
  amenities: SiteAmenities;
  className?: string;
}

export default function SiteAmenitiesDisplay({ 
  amenities, 
  className = "" 
}: SiteAmenitiesDisplayProps) {
  const notIncludedAmenities = getNotIncludedAmenities(amenities);

  const renderAmenityCategory = (category: keyof SiteAmenities, categoryKey: string) => {
    const selectedAmenities = amenities[category] || [];
    const notIncluded = notIncludedAmenities[categoryKey] || [];

    // Don't show category if no amenities are selected and none are not included
    if (selectedAmenities.length === 0 && notIncluded.length === 0) {
      return null;
    }

    return (
      <Card key={category} className="mb-4 bg-white dark:bg-[#141414] border-neutral-200 dark:border-white/10 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-neutral-900 dark:text-white">
            {CATEGORY_LABELS[categoryKey as keyof typeof CATEGORY_LABELS]}
            {selectedAmenities.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300">
                {selectedAmenities.length} available
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Available Amenities */}
          {selectedAmenities.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Available</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedAmenities.map((amenity) => {
                  const label = AMENITY_LABELS[amenity as keyof typeof AMENITY_LABELS] || amenity;
                  return (
                    <Badge key={amenity} variant="default" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20">
                      {label}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Not Included Amenities */}
          {notIncluded.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-4 w-4 text-rose-500 dark:text-rose-400" />
                <span className="text-sm font-medium text-rose-700 dark:text-rose-300">Not Included</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {notIncluded.map((amenity) => {
                  const label = AMENITY_LABELS[amenity as keyof typeof AMENITY_LABELS] || amenity;
                  return (
                    <Badge key={amenity} variant="outline" className="text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.02]">
                      {label}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Check if there are any amenities configured
  const hasAnyAmenities = Object.values(amenities).some(category => category.length > 0);
  const hasNotIncluded = Object.values(notIncludedAmenities).some(category => category.length > 0);

  if (!hasAnyAmenities && !hasNotIncluded) {
    return (
      <Card className={`bg-neutral-50 dark:bg-white/[0.02] border-neutral-200 dark:border-white/10 ${className}`}>
        <CardContent className="pt-6">
          <div className="text-center text-neutral-500 dark:text-neutral-400">
            <Info className="h-8 w-8 mx-auto mb-2 text-neutral-400 dark:text-neutral-500" />
            <p>No site amenities information available</p>
            <p className="text-sm mt-1">Contact the homeowner for details about site amenities</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">Site Amenities</h3>
        <p className="text-neutral-600 dark:text-neutral-400 text-sm">
          Available amenities and facilities at the project site
        </p>
      </div>

      {/* Important Notice for Contractors */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-amber-900 dark:text-amber-200">Important Information</h4>
            <p className="text-sm text-amber-800/80 dark:text-amber-300/80 mt-1 leading-relaxed">
              Review available amenities carefully. Items marked as &quot;Not Included&quot; 
              will need to be provided by the contractor or arranged separately.
            </p>
          </div>
        </div>
      </div>

      {/* Amenity Categories */}
      <div className="space-y-4">
        {Object.entries(AMENITY_CATEGORIES).map(([, categoryKey]) => (
          renderAmenityCategory(categoryKey as keyof SiteAmenities, categoryKey)
        ))}
      </div>

      {/* Summary */}
      <Card className="mt-6 bg-gray-50">
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-gray-700">
                <strong>{Object.values(amenities).flat().length}</strong> amenities available
              </span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-gray-700">
                <strong>{Object.values(notIncludedAmenities).flat().length}</strong> amenities not included
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
