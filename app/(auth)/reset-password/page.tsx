'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { ResetPasswordForm } from '@/components/features/auth/reset-password-form'

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  const supabase = createClient()

  const handleResetPassword = async (data: { email: string }) => {
    setIsLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/confirm`,
      })

      if (error) throw error

      setSuccessMessage('Check your email for the password reset link!')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred while sending the reset link')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center -mt-16">
      <ResetPasswordForm
        onSubmit={handleResetPassword}
        isLoading={isLoading}
        error={error}
        successMessage={successMessage}
      />
    </div>
  )
}