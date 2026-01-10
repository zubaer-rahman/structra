'use client'

import { useState, useCallback } from 'react'
import { loadStripe, Stripe } from '@stripe/stripe-js'
import { trpc } from '@/utils/trpc'

let stripePromise: Promise<Stripe | null>
const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}

export interface UseStripeCheckoutOptions {
  amount: number
  description: string
  successUrl?: string
  cancelUrl?: string
  metadata?: Record<string, string>
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export interface UseStripeSubscriptionOptions {
  priceId?: string
  successUrl?: string
  cancelUrl?: string
  metadata?: Record<string, string>
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function useStripe() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Use tRPC mutations
  const createCheckoutSessionMutation = trpc.transactions.createCheckoutSession.useMutation()
  const createSubscriptionSessionMutation = trpc.transactions.createSubscriptionSession.useMutation()
  const createPaymentIntentMutation = trpc.transactions.createPaymentIntent.useMutation()

  const createCheckoutSession = useCallback(async (options: UseStripeCheckoutOptions) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await createCheckoutSessionMutation.mutateAsync({
        amount: options.amount,
        currency: 'cad',
        description: options.description,
        successUrl: options.successUrl,
        cancelUrl: options.cancelUrl,
        metadata: options.metadata,
      })
      
      if (result.sessionId) {
        const stripe = await getStripe()
        if (stripe) {
          const { error } = await stripe.redirectToCheckout({
            sessionId: result.sessionId,
          })
          
          if (error) {
            throw error
          }
          
          options.onSuccess?.()
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create checkout session')
      setError(error.message)
      options.onError?.(error)
    } finally {
      setIsLoading(false)
    }
  }, [createCheckoutSessionMutation])

  const createSubscriptionSession = useCallback(async (options: UseStripeSubscriptionOptions) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await createSubscriptionSessionMutation.mutateAsync({
        priceId: options.priceId,
        successUrl: options.successUrl,
        cancelUrl: options.cancelUrl,
        metadata: options.metadata,
      })
      
      if (result.sessionId) {
        const stripe = await getStripe()
        if (stripe) {
          const { error } = await stripe.redirectToCheckout({
            sessionId: result.sessionId,
          })
          
          if (error) {
            throw error
          }
          
          options.onSuccess?.()
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create subscription session')
      setError(error.message)
      options.onError?.(error)
    } finally {
      setIsLoading(false)
    }
  }, [createSubscriptionSessionMutation])

  const createPaymentIntent = useCallback(async (options: UseStripeCheckoutOptions) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await createPaymentIntentMutation.mutateAsync({
        amount: options.amount,
        currency: 'cad',
        metadata: {
          description: options.description,
        },
      })
      
      options.onSuccess?.()
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create payment intent')
      setError(error.message)
      options.onError?.(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [createPaymentIntentMutation])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isLoading,
    error,
    createCheckoutSession,
    createSubscriptionSession,
    createPaymentIntent,
    clearError,
  }
}

export function useTransactionStatus() {
  const [status, setStatus] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const checkTransactionStatus = useCallback(async (sessionId: string) => {
    setIsLoading(true)
    try {
      // Implementation for checking transaction status
      setStatus('Transaction status checked')
    } catch (error) {
      setStatus('Error checking transaction status')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { status, isLoading, checkTransactionStatus }
}
