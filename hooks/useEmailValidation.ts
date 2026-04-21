'use client'

import { useState, useEffect, useCallback } from 'react'
import { trpc } from '@/utils/trpc'

interface EmailValidationState {
  isValid: boolean
  isChecking: boolean
  error: string | null
  exists: boolean | null
}

interface UseEmailValidationOptions {
  debounceMs?: number
  minLength?: number
}

export function useEmailValidation(
  email: string,
  options: UseEmailValidationOptions = {}
) {
  const { debounceMs = 500, minLength = 3 } = options
  
  const [state, setState] = useState<EmailValidationState>({
    isValid: false,
    isChecking: false,
    error: null,
    exists: null,
  })

  // Email format validation
  const isValidEmailFormat = useCallback((email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }, [])

  // TRPC query for checking email existence
  const { refetch: checkEmailExists } = trpc.auth.checkEmailExists.useQuery(
    { email: email.trim() },
    {
      enabled: false, // We'll trigger this manually
      retry: false,
      refetchOnWindowFocus: false,
    }
  )

  // Debounced email validation
  useEffect(() => {
    const trimmedEmail = email.trim()
    
    // Reset state if email is empty or too short
    if (!trimmedEmail || trimmedEmail.length < minLength) {
      setState({
        isValid: false,
        isChecking: false,
        error: null,
        exists: null,
      })
      return
    }

    // Check email format first
    if (!isValidEmailFormat(trimmedEmail)) {
      setState({
        isValid: false,
        isChecking: false,
        error: 'Please enter a valid email address',
        exists: null,
      })
      return
    }

    // Set checking state
    setState(prev => ({
      ...prev,
      isChecking: true,
      error: null,
    }))

    // Debounce the API call
    const timeoutId = setTimeout(async () => {
      try {
        const result = await checkEmailExists()
        
        if (result.data) {
          setState({
            isValid: !result.data.exists,
            isChecking: false,
            error: result.data.exists ? 'An account with this email already exists' : null,
            exists: result.data.exists,
          })
        } else {
          setState({
            isValid: false,
            isChecking: false,
            error: 'Failed to check email availability',
            exists: null,
          })
        }
      } catch (error) {
        console.error('Email validation error:', error)
        setState({
          isValid: false,
          isChecking: false,
          error: 'Failed to check email availability',
          exists: null,
        })
      }
    }, debounceMs)

    return () => clearTimeout(timeoutId)
  }, [email, debounceMs, minLength, isValidEmailFormat, checkEmailExists])

  return {
    ...state,
    // Helper methods
    isEmailAvailable: state.isValid && !state.exists,
    shouldShowError: state.error && !state.isChecking,
  }
}
