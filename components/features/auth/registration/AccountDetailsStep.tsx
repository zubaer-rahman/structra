'use client'

import { UseFormReturn } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ArrowLeft, CheckCircle, Check, X, Loader2 } from 'lucide-react'
import { AuthInput, InlinePasswordStrength } from '@/components/shared/form-input'
import { LoadingSpinner } from '@/components/shared'
import { RegistrationFormData } from '@/utils/validation'
import { TermsDialog } from '@/components/shared/modals/TermsDialog'
import { useEmailValidation } from '@/hooks'

interface AccountDetailsStepProps {
  form: UseFormReturn<RegistrationFormData>
  onBack: () => void
  isLoading: boolean
}

export function AccountDetailsStep({ form, onBack, isLoading }: AccountDetailsStepProps) {
  const email = form.watch('email') || ''
  const emailValidation = useEmailValidation(email, { debounceMs: 500 })

  return (
    <div className="space-y-5">
      {/* Name Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AuthInput
          type="name"
          label="First Name"
          placeholder="John"
          error={form.formState.errors.first_name?.message}
          {...form.register('first_name')}
        />
        <AuthInput
          type="name"
          label="Last Name"
          placeholder="Doe"
          error={form.formState.errors.last_name?.message}
          {...form.register('last_name')}
        />
      </div>

      {/* Email Field with Real-time Validation */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
          Email Address
        </Label>
        <div className="relative">
          <input
            type="email"
            id="email"
            {...form.register('email')}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors ${
              form.formState.errors.email || emailValidation.shouldShowError
                ? 'border-red-300 bg-red-50'
                : emailValidation.isEmailAvailable
                ? 'border-green-300 bg-green-50'
                : 'border-gray-300 bg-white'
            }`}
            placeholder="Enter your email address"
          />
          
          {/* Email validation status icon */}
          {email && email.length > 2 && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {emailValidation.isChecking ? (
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              ) : emailValidation.isEmailAvailable ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : emailValidation.exists ? (
                <X className="h-4 w-4 text-red-500" />
              ) : null}
            </div>
          )}
        </div>
        
        {/* Email validation messages */}
        {emailValidation.shouldShowError && (
          <p className="text-red-600 text-xs flex items-center gap-1">
            <X className="h-3 w-3" />
            {emailValidation.error}
          </p>
        )}
        
        {emailValidation.isEmailAvailable && (
          <p className="text-green-600 text-xs flex items-center gap-1">
            <Check className="h-3 w-3" />
            Email is available
          </p>
        )}
        
        {!emailValidation.shouldShowError && !emailValidation.isEmailAvailable && email && email.length > 2 && (
          <p className="text-gray-500 text-xs">
            Verification email will be sent here
          </p>
        )}
        
        {/* Show form validation error if present */}
        {form.formState.errors.email && (
          <p className="text-red-600 text-xs">{form.formState.errors.email.message}</p>
        )}
      </div>

      {/* Password Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <AuthInput
            type="password"
            error={form.formState.errors.password?.message}
            showPasswordToggle={true}
            {...form.register('password')}
          />
          {/* Password Strength Indicator */}
          <InlinePasswordStrength 
            password={form.watch('password') || ''} 
          />
        </div>

        <AuthInput
          type="password"
          label="Confirm Password"
          placeholder="Confirm your password"
          error={form.formState.errors.confirmPassword?.message}
          showPasswordToggle={true}
          {...form.register('confirmPassword')}
        />
      </div>

      {/* Terms Agreement */}
      <div className="flex items-start space-x-3 space-y-0">
        <input
          type="checkbox"
          id="user_agreed_to_terms"
          {...form.register('user_agreed_to_terms')}
          className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
        />
        <div className="space-y-1 leading-none">
          <Label htmlFor="user_agreed_to_terms" className="text-sm font-normal text-gray-700">
            I agree to{' '}
            <TermsDialog>
              <button type="button" className="text-orange-600 hover:text-orange-700 font-medium underline">
                Terms of Service
              </button>
            </TermsDialog>
          </Label>
          {form.formState.errors.user_agreed_to_terms && (
            <p className="text-red-600 text-xs">{form.formState.errors.user_agreed_to_terms.message}</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onBack}
          className="flex-1 h-10 text-sm border-gray-200 text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button 
          type="submit" 
          className="flex-1 h-10 text-sm font-semibold bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          disabled={isLoading || form.formState.isSubmitting || emailValidation.isChecking || (!!email && !emailValidation.isEmailAvailable)}
        >
          {isLoading || form.formState.isSubmitting ? (
            <LoadingSpinner 
              inline 
              size="xs" 
              variant="white" 
              text="Creating..." 
            />
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Create Account
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
