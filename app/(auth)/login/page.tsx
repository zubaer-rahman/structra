"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthFooter, AuthHero, LoginForm } from "@/components/features/auth";
import { useAuth } from "@/contexts/AuthContext";
import { USER_ROLES } from "@/utils/constants";
import LoadingSpinner from "@/components/shared/loading-spinner";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmingEmail, setIsConfirmingEmail] = useState(false);
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasShownToastRef = useRef(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signIn, userRole, loading: authLoading } = useAuth();

  useEffect(() => {
    // Check for confirmation error from URL parameters
    const confirmationError = searchParams.get('error');
    if (confirmationError === 'confirmation_failed') {
      setError("Email confirmation failed. Please try signing up again or contact support.");
    }
    
    // Check if we have a pending confirmation from sessionStorage (page refresh case)
    const tempUserRole = sessionStorage.getItem('tempUserRole');
    if (tempUserRole && !user) {
      setEmailConfirmed(true);
    }
    
    // Handle email confirmation tokens in URL hash (when Supabase redirects here)
    const handleEmailConfirmation = async () => {
      const hash = window.location.hash;
             if (hash && hash.includes('access_token')) {
         setIsConfirmingEmail(true);
         setError(null);
         hasShownToastRef.current = false; // Reset toast flag for new confirmation
        
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');
        
        if (type === 'signup' && accessToken && refreshToken) {
          try {
            // Use the main Supabase client from the app context
            const { createClient } = await import('~/lib/supabase');
            const supabase = createClient();
            
            // Set the session
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (!error && data.user) {
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
              
              // Update user's is_verified_email field to true in the database
              try {
                const { error: updateError } = await supabase
                  .from('users')
                  .update({ is_verified_email: true })
                  .eq('id', data.user.id);
                
                if (updateError) {
                  console.error('Failed to update email verification status:', updateError);
                  // Don't fail the whole process for this, just log it
                } else {
                  console.log('Successfully updated is_verified_email to true for user:', data.user.id);
                }
              } catch (updateError) {
                console.error('Error updating email verification status:', updateError);
              }
              
              // Clear the hash from URL to prevent re-processing
              window.location.hash = '';
              
              // Show success state briefly before redirect
              setEmailConfirmed(true);
              setIsConfirmingEmail(false);
              
              // Show success toast only once
              if (!hasShownToastRef.current) {
                const tempUserRole = userRole || USER_ROLES.HOMEOWNER;
                toast.success(
                  `Welcome to Structra! Your ${tempUserRole} account has been successfully verified.`,
                  {
                    duration: 4000,
                    position: 'top-center',
                  }
                );
                hasShownToastRef.current = true;
              }
              
              // Store the role temporarily for the success message
              sessionStorage.setItem('tempUserRole', userRole);
              
              // Instead of manually redirecting, let the AuthContext handle it
              // The onAuthStateChange listener should detect the new session
              // and the useEffect in this component will redirect to dashboard
              return;
            } else {
              setError("Failed to confirm email. Please try signing up again or contact support.");
              setIsConfirmingEmail(false);
            }
          } catch (error) {
            console.error('Failed to handle email confirmation:', error);
            setError("An error occurred while confirming your email. Please try again or contact support.");
          } finally {
            setIsConfirmingEmail(false);
          }
        } else {
          // No valid tokens found, stop loading
          setIsConfirmingEmail(false);
        }
      }
    };
    
    handleEmailConfirmation();
    
    // Cleanup function to reset toast flag
    return () => {
      hasShownToastRef.current = false;
    };
  }, [searchParams, router, user]);

  // Auto-clear success state after 3 seconds as fallback
  useEffect(() => {
    if (emailConfirmed) {
      const timeout = setTimeout(() => {
        setEmailConfirmed(false);
        // Clean up sessionStorage
        sessionStorage.removeItem('tempUserRole');
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [emailConfirmed]);

     // Clean up sessionStorage when user is authenticated and redirected
   // Only redirect after a delay to ensure session is stable
   useEffect(() => {
     if (user && userRole) {
       sessionStorage.removeItem('tempUserRole');
       
       // Add a longer delay to ensure session is fully established and stable
       const redirectTimer = setTimeout(() => {
         const roleDashboard = `/${userRole}/dashboard`;
         router.push(roleDashboard);
       }, 1000); // 1 second delay to ensure session stability
       
       return () => clearTimeout(redirectTimer);
     }
   }, [user, userRole, router]);

  // Show loading state while auth context is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center">
            <LoadingSpinner 
              text="Initializing..."
              subtitle="Please wait while we set up your session"
              size="lg"
              className="py-12"
            />
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while confirming email
  if (isConfirmingEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center">
            <LoadingSpinner 
              text="Confirming your email..."
              subtitle="Please wait while we set up your account"
              size="lg"
              className="py-12"
            />
          </div>
        </div>
      </div>
    );
  }

  // Show success state briefly after email confirmation
  if (emailConfirmed) {
    // Don't render anything special - the toast will handle the success message
    // Just show the loading spinner for redirect
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center">
            <LoadingSpinner 
              text="Redirecting to dashboard..."
              subtitle="Setting up your account"
              size="lg"
              className="py-12"
            />
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while user is authenticated and waiting for redirect
  if (user && userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center">
            <LoadingSpinner 
              text="Redirecting to dashboard..."
              subtitle="Please wait while we redirect you"
              size="lg"
              className="py-12"
            />
          </div>
        </div>
      </div>
    );
  }

  const handleSignIn = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Attempting sign-in with:", email);
      const {
        user: signedInUser,
        userRole: signInUserRole,
        error,
      } = await signIn(email, password);


      if (error) {
        if (error.includes("Invalid login credentials")) {
          setError(
            "Invalid email or password. Please check your credentials and try again."
          );
        } else if (error.includes("Email not confirmed")) {
          setError(
            "Please check your email and confirm your account before signing in."
          );
        } else if (error.includes("Too many requests")) {
          setError(
            "Too many failed attempts. Please wait a moment before trying again."
          );
        } else {
          setError(error);
        }
             } else if (signedInUser) {
         
         // Don't redirect here - let the useEffect handle the redirect
         // after the session is fully established and stable
         // The AuthContext will update the user and userRole states,
         // which will trigger the redirect useEffect
       }
    } catch (error) {
      console.error("Sign-in error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (data: { email: string; password: string }) => {
    await handleSignIn(data.email, data.password);
  };

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full max-w-lg space-y-6">
        <AuthHero
          title={
            <>
              Welcome Back to
              <span className="block text-orange-600">Structra</span>
            </>
          }
          description="Sign in to access your projects, manage contracts, and continue building your home improvement journey."
          maxWidth="md"
        />

        <LoginForm
          onSubmit={handleLogin}
          isLoading={isLoading}
          error={error || undefined}
        />

        <AuthFooter />
      </div>
    </div>
  );
}
