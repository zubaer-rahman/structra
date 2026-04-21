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
    <div className="space-y-4">
      <div className="border-b pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center">
            <MapPin className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Business Address</h3>
            <p className="text-sm text-gray-600">Your business address details</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        {/* Service Location - REMOVED: Field requires exact address, doesn't work with city/province only */}
        {/* 
        <div>
          <LocationInput
            value={typeof formData.service_location === 'string' 
              ? {
                  address: formData.service_location,
                  city: null,
                  province: null,
                  postalCode: null,
                  latitude: null,
                  longitude: null,
                  country: "",
                }
              : formData.service_location || {
                  address: "",
                  city: null,
                  province: null,
                  postalCode: null,
                  latitude: null,
                  longitude: null,
                  country: "",
                }
            }
            onChange={handleServiceLocationChange}
            label="Service Location"
            placeholder="Search for your primary service area"
            helperText="Start typing to search"
            error={isFieldInvalid("service_location") ? getValidationMessage("service_location") : undefined}
            showMap={false}
            showSelectedLocation={false}
            className="w-full"
          />
        </div>
        */}

        {/* Business Address */}
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
            helperText="Start typing to search"
            error={isFieldInvalid("address") ? getValidationMessage("address") : undefined}
            showMap={false}
            showSelectedLocation={false}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
