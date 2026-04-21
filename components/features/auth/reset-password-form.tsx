'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthInput } from '@/components/shared/form-input'
import { LoadingSpinner } from '@/components/shared'
import { resetPasswordSchema, type ResetPasswordFormData } from '@/utils/validation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface ResetPasswordFormProps {
  onSubmit: (data: { email: string }) => Promise<void>
  isLoading?: boolean
  error?: string
  successMessage?: string
}

export function ResetPasswordForm({
  onSubmit,
  isLoading = false,
  error,
  successMessage,
}: ResetPasswordFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onBlur',
  })

  const onSubmitForm = async (data: ResetPasswordFormData) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Reset password error:', error)
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <Card className="w-full">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
            Reset Password
          </CardTitle>
          <CardDescription className="text-base text-gray-600">
            Enter your email to receive reset instructions
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-6">
          <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {successMessage}
              </div>
            )}

            <AuthInput
              type="email"
              error={errors.email?.message}
              {...register('email')}
            />

            <Button
              type="submit"
              className="w-full h-10 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={isLoading || isSubmitting}
            >
              {isLoading || isSubmitting ? (
                <LoadingSpinner 
                  inline 
                  size="sm" 
                  variant="white" 
                  text="Sending..." 
                />
              ) : (
                'Send Reset Link'
              )}
            </Button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sign In
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
