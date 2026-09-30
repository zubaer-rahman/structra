"use client";

import { FormInput } from "@/components/shared/form-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Lock } from "lucide-react";
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
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 flex-shrink-0">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Personal Information</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Your account details and contact name</p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <FormInput
              label="First Name"
              value={formData.first_name}
              onChange={(e) => onInputChange("first_name", e.target.value)}
              placeholder="Enter your first name"
              containerClassName="space-y-1.5"
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
              containerClassName="space-y-1.5"
              isInvalid={isFieldMissing('last_name')}
              validationMessage={getValidationMessage('last_name', 'Last Name')}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="email" className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Mail className="h-3 w-3 text-gray-400" />
              <span>Email Address</span>
            </Label>
            <span className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
              <Lock className="h-3 w-3" /> Read-only
            </span>
          </div>
          <Input 
            id="email" 
            type="email" 
            value={user?.email || ""} 
            disabled 
            className="h-10 text-sm bg-gray-50/80 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
}
