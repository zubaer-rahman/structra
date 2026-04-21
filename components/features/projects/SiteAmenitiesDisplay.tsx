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
      <Card key={category} className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {CATEGORY_LABELS[categoryKey as keyof typeof CATEGORY_LABELS]}
            {selectedAmenities.length > 0 && (
              <Badge variant="secondary" className="ml-2">
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
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Available</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedAmenities.map((amenity) => {
                  const label = AMENITY_LABELS[amenity as keyof typeof AMENITY_LABELS] || amenity;
                  return (
                    <Badge key={amenity} variant="default" className="bg-green-100 text-green-800 border-green-200">
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
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-700">Not Included</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {notIncluded.map((amenity) => {
                  const label = AMENITY_LABELS[amenity as keyof typeof AMENITY_LABELS] || amenity;
                  return (
                    <Badge key={amenity} variant="outline" className="text-red-600 border-red-200">
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
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <Info className="h-8 w-8 mx-auto mb-2 text-gray-400" />
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
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Site Amenities</h3>
        <p className="text-gray-600 text-sm">
          Available amenities and facilities at the project site
        </p>
      </div>

      {/* Important Notice for Contractors */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-amber-900">Important Information</h4>
            <p className="text-sm text-amber-700 mt-1">
              Review the available amenities carefully. Items marked as &quot;Not Included&quot; 
              will need to be provided by you or arranged separately. Pay special attention 
              to sanitation facilities as they are critical for contractor operations.
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
