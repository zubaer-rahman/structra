'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthHero, AuthFooter } from '@/components/features/auth'
import { AuthInput, InlinePasswordStrength } from '@/components/shared/form-input'
import { LoadingSpinner } from '@/components/shared'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

// Password reset confirmation schema - using same validation as registration
const resetPasswordConfirmSchema = z.object({
  password: z.string()
    .min(8, 'Add at least 8 characters')
    .max(128, 'Password is too long (max 128 characters)')
    .regex(/^(?=.*[a-z])/, 'Add a lowercase letter (a-z)')
    .regex(/^(?=.*[A-Z])/, 'Add an uppercase letter (A-Z)')
    .regex(/^(?=.*\d)/, 'Add a number (0-9)')
    .regex(/^(?=.*[@$!%*?&])/, 'Add a special character (@$!%*?&)'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match. Please try again",
  path: ["confirmPassword"],
})

type ResetPasswordConfirmFormData = z.infer<typeof resetPasswordConfirmSchema>

function ResetPasswordConfirmContent() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordConfirmFormData>({
    resolver: zodResolver(resetPasswordConfirmSchema),
    mode: 'onBlur',
  })

  useEffect(() => {
    // Handle the auth callback
    const handleAuthCallback = async () => {
      const { error } = await supabase.auth.getSession()
      if (error) {
        setError('Invalid or expired reset link. Please request a new one.')
      }
    }

    handleAuthCallback()
  }, [supabase.auth])

  const handleUpdatePassword = async (data: ResetPasswordConfirmFormData) => {
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password
      })

      if (error) throw error

      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-lg space-y-6">
          <Card className="w-full">
            <CardContent className="p-8 text-center">
              <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Password Updated Successfully!
              </h2>
              <p className="text-gray-600 mb-6">
                Your password has been updated. You will be redirected to the sign-in page in a few seconds.
              </p>
              <Link href="/login">
                <Button className="w-full h-10 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200">
                  Go to Sign In
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full max-w-lg space-y-6">
        <AuthHero
          title={
            <>
              Set Your New
              <span className="block text-orange-600">Password</span>
            </>
          }
          description="Enter a strong password to secure your Structra account."
          maxWidth="md"
        />

        <Card className="w-full">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
              Update Password
            </CardTitle>
            <CardDescription className="text-base text-gray-600">
              Choose a strong password for your account
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 pb-6">
            <form onSubmit={handleSubmit(handleUpdatePassword)} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <AuthInput
                  type="password"
                  label="New Password"
                  error={errors.password?.message}
                  showPasswordToggle={true}
                  {...register('password')}
                />
                {/* Password Strength Indicator */}
                <InlinePasswordStrength 
                  password={watch('password') || ''} 
                />
              </div>

              <AuthInput
                type="password"
                label="Confirm New Password"
                error={errors.confirmPassword?.message}
                showPasswordToggle={true}
                {...register('confirmPassword')}
              />

              <Button
                type="submit"
                className="w-full h-10 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={loading || isSubmitting}
              >
                {loading || isSubmitting ? (
                  <LoadingSpinner 
                    inline 
                    size="sm" 
                    variant="white" 
                    text="Updating..." 
                  />
                ) : (
                  'Update Password'
                )}
              </Button>
            </form>

            <div className="text-center mt-4">
              <Link
                href="/login"
                className="text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors duration-200"
              >
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>

        <AuthFooter />
      </div>
    </div>
  )
}

export default function ResetPasswordConfirmPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      }>
        <ResetPasswordConfirmContent />
      </Suspense>
    </div>
  )
}