import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';
import { validateHomeownerProfileForVerification } from '@/utils/validation/homeownerProfile';

interface HomeownerProfileStatus {
  isProfileComplete: boolean;
  isGovernmentIdVerified: boolean;
  canPostProject: boolean;
  missingFields: string[];
  loading: boolean;
}

export function useHomeownerProfileStatus(): HomeownerProfileStatus {
  const { user, userRole } = useAuth();
  const [status, setStatus] = useState<HomeownerProfileStatus>({
    isProfileComplete: false,
    isGovernmentIdVerified: false,
    canPostProject: false,
    missingFields: [],
    loading: true,
  });

  useEffect(() => {
    const checkProfileStatus = async () => {
      if (!user || userRole !== 'homeowner') {
        setStatus({
          isProfileComplete: false,
          isGovernmentIdVerified: false,
          canPostProject: false,
          missingFields: [],
          loading: false,
        });
        return;
      }

      try {
        const supabase = createClient();
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        // Validate profile completeness
        const validation = validateHomeownerProfileForVerification({
          first_name: userProfile?.first_name,
          last_name: userProfile?.last_name,
          phone_number: userProfile?.phone_number,
          address: userProfile?.address,
          government_id: userProfile?.government_id,
          government_id_verified: userProfile?.government_id_verified,
        });

        const isGovernmentIdVerified = userProfile?.government_id_verified || false;
        const isProfileComplete = validation.isComplete;
        const canPostProject = isProfileComplete && isGovernmentIdVerified;

        setStatus({
          isProfileComplete,
          isGovernmentIdVerified,
          canPostProject,
          missingFields: validation.missingFields,
          loading: false,
        });
      } catch (error) {
        console.error('Error checking homeowner profile status:', error);
        setStatus({
          isProfileComplete: false,
          isGovernmentIdVerified: false,
          canPostProject: false,
          missingFields: [],
          loading: false,
        });
      }
    };

    checkProfileStatus();
  }, [user, userRole]);

  return status;
}
