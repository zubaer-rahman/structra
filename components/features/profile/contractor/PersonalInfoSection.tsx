"use client";

import { FormInput } from "@/components/shared/form-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { ExtendedUser } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface PersonalInfoSectionProps {
  formData: {
    first_name: string;
    last_name: string;
  };
  user: ExtendedUser;
  onInputChange: (field: string, value: string) => void;
  missingFields?: string[];
  touched?: Record<string, boolean>;
  onBlur?: (field: string) => void;
}

export function PersonalInfoSection({ 
  formData, 
  user, 
  onInputChange, 
  missingFields = [],
  touched = {},
  onBlur
}: PersonalInfoSectionProps) {
  const isFirstNameValid = (formData.first_name || "").trim().length > 0;
  const isLastNameValid = (formData.last_name || "").trim().length > 0;

  const completedCount = (isFirstNameValid ? 1 : 0) + (isLastNameValid ? 1 : 0);
  const totalRequired = 2;

  const isFirstNameMissing = missingFields.includes("first_name") || missingFields.includes("First Name");
  const isLastNameMissing = missingFields.includes("last_name") || missingFields.includes("Last Name");

  const isFirstNameInvalid = (touched.first_name || isFirstNameMissing) && !isFirstNameValid;
  const isLastNameInvalid = (touched.last_name || isLastNameMissing) && !isLastNameValid;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 dark:border-white/10 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 flex-shrink-0">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Personal Information</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Your account details and contact name</p>
          </div>
        </div>

        <span className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold self-start sm:self-auto",
          completedCount === totalRequired
            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30"
            : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30"
        )}>
          {completedCount === totalRequired ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          )}
          {completedCount} of {totalRequired} Required Fields
        </span>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <FormInput
              label="First Name"
              value={formData.first_name}
              onChange={(e) => onInputChange("first_name", e.target.value)}
              onBlur={() => onBlur?.("first_name")}
              placeholder="Enter your first name"
              required={true}
              containerClassName="space-y-1.5"
              isInvalid={isFirstNameInvalid}
              validationMessage="First name cannot be empty"
            />
          </div>

          <div>
            <FormInput
              label="Last Name"
              value={formData.last_name}
              onChange={(e) => onInputChange("last_name", e.target.value)}
              onBlur={() => onBlur?.("last_name")}
              placeholder="Enter your last name"
              required={true}
              containerClassName="space-y-1.5"
              isInvalid={isLastNameInvalid}
              validationMessage="Last name cannot be empty"
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
