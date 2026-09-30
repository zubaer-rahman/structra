"use client";

import { FormInput } from "@/components/shared/form-input";
import { LocationInput } from "@/components/shared/form-input/LocationInput";
import { MapPin } from "lucide-react";
import type { LocationData } from "@/components/shared/form-input";

interface ServiceLocationSectionProps {
  formData: {
    address?: LocationData;
  };
  onInputChange: (field: string, value: string | object) => void;
  missingFields?: string[];
}

export function ServiceLocationSection({ formData, onInputChange, missingFields = [] }: ServiceLocationSectionProps) {
  const isFieldInvalid = (fieldName: string) => missingFields.includes(fieldName);
  const getValidationMessage = (fieldName: string) => 
    isFieldInvalid(fieldName) ? `${fieldName.replace(/_/g, ' ')} is required` : undefined;
  const handleAddressChange = (locationData: LocationData) => {
    onInputChange("address", locationData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 flex-shrink-0">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Business Address</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Your registered business address and operating location</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <LocationInput
            value={formData.address || {
              address: "",
              latitude: 0,
              longitude: 0,
              city: null,
              province: null,
              postalCode: null,
              country: ""
            }}
            onChange={handleAddressChange}
            label="Business Address"
            placeholder="Search for your business address"
            helperText="Enter your street address, city, or postal code"
            error={isFieldInvalid("address") ? getValidationMessage("address") : undefined}
            showMap={false}
            showSelectedLocation={true}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
