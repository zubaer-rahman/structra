"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";
import { validateContractorProfileForVerification } from "@/utils/validation/contractorProfile";
import { validateHomeownerProfileForVerification } from "@/utils/validation/homeownerProfile";
import { AlertTriangle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ProfileCompletionWarningProps {
  className?: string;
}

export function ProfileCompletionWarning({ className = "" }: ProfileCompletionWarningProps) {
  const { user, userRole } = useAuth();
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (!user || !userRole) {
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        
        // Fetch complete user profile data
        const { data: userProfile } = await supabase
          .from("users")
          .select("first_name, last_name, phone_number, address, government_id, government_id_verified")
          .eq("id", user.id)
          .single();
        
        if (userRole === "contractor") {
          // Fetch contractor profile data
          const { data: contractorProfile } = await supabase
            .from("contractor_profiles")
            .select("*")
            .eq("user_id", user.id)
            .single();

          // Validate contractor profile
          const validation = validateContractorProfileForVerification(
            {
              first_name: userProfile?.first_name,
              last_name: userProfile?.last_name,
              phone_number: userProfile?.phone_number,
              address: userProfile?.address,
            },
            contractorProfile
          );

          setIsProfileIncomplete(!validation.isComplete);
          setMissingFields(validation.missingFieldsDisplay);
        } else if (userRole === "homeowner") {
          // Validate homeowner profile
          const validation = validateHomeownerProfileForVerification({
            first_name: userProfile?.first_name,
            last_name: userProfile?.last_name,
            phone_number: userProfile?.phone_number,
            address: userProfile?.address,
            government_id: userProfile?.government_id,
            government_id_verified: userProfile?.government_id_verified,
          });

          setIsProfileIncomplete(!validation.isComplete);
          // Convert missing fields to display format for homeowners
          const missingFieldsDisplay = validation.missingFieldsBySection.personal
            .concat(validation.missingFieldsBySection.contact)
            .concat(validation.missingFieldsBySection.location)
            .concat(validation.missingFieldsBySection.verification);
          setMissingFields(missingFieldsDisplay);
        }
      } catch (error) {
        console.error("Error checking profile completion:", error);
        // Don't show warning if we can't check
        setIsProfileIncomplete(false);
      } finally {
        setLoading(false);
      }
    };

    checkProfileCompletion();
  }, [user, userRole]);

  if (loading || !isProfileIncomplete) {
    return null;
  }

  const handleGoToProfile = () => {
    window.location.href = `/${userRole}/profile`;
  };

  const getMissingFieldsText = () => {
    if (missingFields.length === 0) return "";
    
    if (missingFields.length === 1) {
      return `Missing: ${missingFields[0]}`;
    } else if (missingFields.length === 2) {
      return `Missing: ${missingFields[0]} and ${missingFields[1]}`;
    } else if (missingFields.length <= 4) {
      const lastField = missingFields[missingFields.length - 1];
      const otherFields = missingFields.slice(0, -1).join(", ");
      return `Missing: ${otherFields}, and ${lastField}`;
    } else {
      return `Missing: ${missingFields.slice(0, 3).join(", ")}, and ${missingFields.length - 3} more`;
    }
  };

  return (
    <Card className={`border-orange-200 bg-orange-50 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-orange-800 font-medium">
              Complete your profile to get the most out of Structra
            </p>
            <p className="text-xs text-orange-700 mt-1">
              Add missing information to improve your experience and visibility
            </p>
            {missingFields.length > 0 && (
              <p className="text-xs text-orange-600 mt-1 font-medium">
                {getMissingFieldsText()}
              </p>
            )}
          </div>
          <div className="flex-shrink-0">
            <Button
              onClick={handleGoToProfile}
              size="sm"
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              <User className="h-4 w-4 mr-1" />
              Complete Profile
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
