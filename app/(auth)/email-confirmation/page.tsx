"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { CheckCircle, Mail, ArrowRight } from "lucide-react";

export default function EmailConfirmationPage() {
  const [email, setEmail] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get email and role from URL parameters
    const emailParam = searchParams.get('email');
    const roleParam = searchParams.get('role');
    
    if (emailParam) {
      setEmail(emailParam);
    }
    
    if (roleParam) {
      setUserRole(roleParam);
    }
  }, [searchParams]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          
          {/* Success Message */}
          <h2 className="text-xl font-semibold text-gray-800 mb-3">
            Registration Successful!
          </h2>
          
          <div className="space-y-3 mb-4">
            <p className="text-sm text-gray-600">
              Thank you for joining BuildReady! We&apos;ve sent a confirmation email to:
            </p>
            
            {email && (
              <div className="bg-gray-50 rounded p-2 border">
                <div className="flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-800">{email}</span>
                </div>
              </div>
            )}
            
            <p className="text-xs text-gray-600">
              Please check your email and click the confirmation link to activate your {userRole || 'account'}.
            </p>
          </div>

          {/* Additional Info */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-3">
              Didn&apos;t receive the email? Check your spam folder or contact support.
            </p>
            
            {/* Login Link */}
            <div className="flex justify-center">
              <Link 
                href="/login" 
                className="inline-flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
              >
                Go to Login
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
