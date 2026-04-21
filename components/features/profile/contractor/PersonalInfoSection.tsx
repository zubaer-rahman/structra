"use client";

import { FormInput } from "@/components/shared/form-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail } from "lucide-react";
import { ExtendedUser } from "@/contexts/AuthContext";

interface PersonalInfoSectionProps {
  formData: {
    first_name: string;
    last_name: string;
  };
  user: ExtendedUser;
  onInputChange: (field: string, value: string) => void;
  missingFields?: string[];
}

export function PersonalInfoSection({ formData, user, onInputChange, missingFields = [] }: PersonalInfoSectionProps) {
  const isFieldMissing = (fieldName: string) => missingFields.includes(fieldName);
  const getValidationMessage = (fieldName: string, displayName: string) => 
    isFieldMissing(fieldName) ? `${displayName} is required for profile completion` : undefined;
  return (
    <div className="space-y-4">
      <div className="border-b pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            <p className="text-sm text-gray-600">Your account details and contact information</p>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FormInput
              label="First Name"
              value={formData.first_name}
              onChange={(e) => onInputChange("first_name", e.target.value)}
              placeholder="Enter your first name"
              containerClassName="space-y-2"
              isInvalid={isFieldMissing('first_name')}
              validationMessage={getValidationMessage('first_name', 'First Name')}
            />
          </div>

          <div>
            <FormInput
              label="Last Name"
              value={formData.last_name}
              onChange={(e) => onInputChange("last_name", e.target.value)}
              placeholder="Enter your last name"
              containerClassName="space-y-2"
              isInvalid={isFieldMissing('last_name')}
              validationMessage={getValidationMessage('last_name', 'Last Name')}
            />
          </div>
        </div>


        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center">
            <Mail className="h-4 w-4 mr-2 text-gray-500" />
            Email Address
          </Label>
          <Input 
            id="email" 
            type="email" 
            value={user?.email || ""} 
            disabled 
            className="bg-gray-50 border-gray-200 text-gray-600"
          />
        </div>


      </div>
    </div>
  );
}
