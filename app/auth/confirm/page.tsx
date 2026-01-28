"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { USER_ROLES } from "@/utils/constants";
import toast from "react-hot-toast";

export default function EmailConfirmationPage() {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        const hash = window.location.hash;
        
        if (!hash || !hash.includes('access_token')) {
          setError("Invalid confirmation link");
          setIsProcessing(false);
          return;
        }

        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');

        if (type !== 'signup' || !accessToken || !refreshToken) {
          setError("Invalid confirmation tokens");
          setIsProcessing(false);
          return;
        }

        const supabase = createClient();

        // Set the session
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError || !data.user) {
          console.error('Session error:', sessionError);
          setError("Failed to confirm email. Please try again.");
          setIsProcessing(false);
          return;
        }

        // Get user's role from users table
        let userRole = USER_ROLES.HOMEOWNER; // default fallback
        try {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('user_role')
            .eq('id', data.user.id)
            .single();

          if (!userError && userData?.user_role) {
            userRole = userData.user_role;
          }
        } catch (roleError) {
          console.error('Failed to fetch user role:', roleError);
          // Use default role if we can't fetch it
        }

        // Update user's email verification status
        try {
          const { error: updateError } = await supabase
            .from('users')
            .update({ is_verified_email: true })
            .eq('id', data.user.id);

          if (updateError) {
            console.error('Error updating email verification status:', updateError);
          }
        } catch (updateError) {
          console.error('Error updating email verification status:', updateError);
        }

        // Clear the hash from URL to prevent re-processing
        window.history.replaceState({}, document.title, window.location.pathname);

        // Show success message
        toast.success(
          `Welcome to Structra! Your ${userRole} account has been successfully verified.`,
          {
            duration: 4000,
            position: 'top-center',
          }
        );

        // Redirect to appropriate dashboard
        router.push(`/${userRole}/dashboard`);

      } catch (error) {
        console.error('Failed to handle email confirmation:', error);
        setError("An error occurred while confirming your email. Please try again or contact support.");
        setIsProcessing(false);
      }
    };

    handleEmailConfirmation();
  }, [router]);

  if (isProcessing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white p-4">
        <div className="w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Confirming Your Email...
          </h2>
          <p className="text-gray-600">
            Please wait while we verify your account.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white p-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Confirmation Failed
          </h2>
          <p className="text-gray-600 mb-4">
            {error}
          </p>
          <button
            onClick={() => router.push('/login')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return null;
}
