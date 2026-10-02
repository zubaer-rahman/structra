"use client";

import { LocationInput } from "@/components/shared/form-input/LocationInput";
import { MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import type { LocationData } from "@/components/shared/form-input";
import { cn } from "@/lib/utils";

interface ServiceLocationSectionProps {
  formData: {
    address?: LocationData;
  };
  onInputChange: (field: string, value: string | object) => void;
  missingFields?: string[];
  touched?: Record<string, boolean>;
  onBlur?: (field: string) => void;
}

export function ServiceLocationSection({ 
  formData, 
  onInputChange, 
  missingFields = [],
  touched = {},
  onBlur
}: ServiceLocationSectionProps) {
  const isAddressValid = Boolean((formData.address?.address || "").trim().length > 0);
  const isAddressMissing = missingFields.includes("address") || missingFields.includes("Business Address") || missingFields.includes("service_location");
  const isAddressInvalid = (touched.address || isAddressMissing) && !isAddressValid;

  const handleAddressChange = (locationData: LocationData) => {
    onInputChange("address", locationData);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 dark:border-white/10 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 flex-shrink-0">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Business Address</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Your registered business address and operating location</p>
          </div>
        </div>

        <span className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold self-start sm:self-auto",
          isAddressValid
            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30"
            : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30"
        )}>
          {isAddressValid ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          )}
          {isAddressValid ? "1 of 1 Required Fields" : "0 of 1 Required Fields"}
        </span>
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
            onBlur={() => onBlur?.("address")}
            label="Business Address"
            required={true}
            placeholder="Search for your business address"
            helperText="Enter your street address, city, or postal code"
            error={isAddressInvalid ? "Business address is required to complete your profile" : undefined}
            showMap={false}
            showSelectedLocation={true}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
