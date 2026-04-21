"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, XCircle, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import LoadingSpinner from "@/components/shared/loading-spinner";

import { 
  AMENITY_CATEGORIES, 
  ALL_AMENITIES, 
  AMENITY_LABELS, 
  CATEGORY_LABELS,
  getNotIncludedAmenities,
  validateSanitationAmenities,
  type SiteAmenities 
} from "@/utils/constants/amenities";

interface SiteAmenitiesTabProps {
  project: {
    id: string;
    site_amenities?: SiteAmenities;
  };
  onUpdateAmenities: (amenities: SiteAmenities) => Promise<void>;
  loading?: boolean;
  saving?: boolean;
}

export default function SiteAmenitiesTab({ 
  project, 
  onUpdateAmenities, 
  loading = false,
  saving = false
}: SiteAmenitiesTabProps) {
  const [amenities, setAmenities] = useState<SiteAmenities>(project.site_amenities || {
    power: [],
    sanitation: [],
    water: [],
    parking: [],
    comfort: [],
    safety: [],
    security: [],
    logistics: []
  });
  
  const [hasChanges, setHasChanges] = useState(false);

  // Check for changes
  useEffect(() => {
    const original = JSON.stringify(project.site_amenities || {});
    const current = JSON.stringify(amenities);
    setHasChanges(original !== current);
  }, [amenities, project.site_amenities]);

  const handleAmenityToggle = (category: keyof SiteAmenities, amenity: string) => {
    setAmenities(prev => {
      const currentAmenities = prev[category] || [];
      const isSelected = currentAmenities.includes(amenity);
      
      const newAmenities = isSelected
        ? currentAmenities.filter(a => a !== amenity)
        : [...currentAmenities, amenity];
      
      return {
        ...prev,
        [category]: newAmenities
      };
    });
  };

  const handleSave = async () => {
    if (!validateSanitationAmenities(amenities)) {
      toast.error("Please ensure sanitation amenities are properly configured.");
      return;
    }

    try {
      await onUpdateAmenities(amenities);
      setHasChanges(false);
      toast.success("Site amenities updated successfully!");
    } catch (error) {
      console.error("Error updating amenities:", error);
      toast.error("Failed to update site amenities. Please try again.");
    }
  };

  const notIncludedAmenities = getNotIncludedAmenities(amenities);

  const renderAmenityCategory = (category: keyof SiteAmenities, categoryKey: string) => {
    const categoryAmenities = ALL_AMENITIES[categoryKey] || [];
    const selectedAmenities = amenities[category] || [];
    const notIncluded = notIncludedAmenities[categoryKey] || [];

    return (
      <Card key={category} className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {CATEGORY_LABELS[categoryKey as keyof typeof CATEGORY_LABELS]}
            {selectedAmenities.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedAmenities.length} selected
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Select the amenities available at your project site
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryAmenities.map((amenity) => {
              const isSelected = selectedAmenities.includes(amenity);
              const label = AMENITY_LABELS[amenity as keyof typeof AMENITY_LABELS] || amenity;
              
              return (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${category}-${amenity}`}
                    checked={isSelected}
                    onCheckedChange={() => handleAmenityToggle(category, amenity)}
                    disabled={loading || saving}
                  />
                  <label
                    htmlFor={`${category}-${amenity}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {label}
                  </label>
                </div>
              );
            })}
          </div>
          
          {/* Show not included amenities for default categories */}
          {notIncluded.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-700">&quot;Not Included&quot;</span>
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading site amenities..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Site Amenities</h2>
          <p className="text-gray-600 mt-1">
            Configure what amenities are available at your project site. This helps contractors understand what to expect.
          </p>
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-blue-900">Important for Contractors</h3>
            <p className="text-sm text-blue-700 mt-1">
              Contractors will see what amenities are available and what&apos;s not included. 
              Make sure to accurately represent your site&apos;s amenities, especially sanitation facilities.
            </p>
          </div>
        </div>
      </div>

      {/* Amenity Categories */}
      <div className="space-y-6">
        {Object.entries(AMENITY_CATEGORIES).map(([, categoryKey]) => (
          renderAmenityCategory(categoryKey as keyof SiteAmenities, categoryKey)
        ))}
      </div>

      {/* Save Button (if there are changes) */}
      {hasChanges && (
        <div className="sticky bottom-0 bg-white border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              You have unsaved changes
            </div>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              size="lg"
              className="flex items-center gap-2"
            >
              {!saving && <Save className="h-4 w-4" />}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
