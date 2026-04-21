import { z } from 'zod'
import { router, protectedProcedure, publicProcedure } from '../../trpc'
import { stripeService } from '@/server/services/StripeService'
import { env } from '@/config/env'

export const transactionsRouter = router({
  // Test endpoint
  test: publicProcedure.query(() => {
    return { message: 'Transactions router is working!' }
  }),

  // Debug endpoint to check environment and service status
  debug: publicProcedure
    .query(async () => {
      try {
        // Check if environment variables are loaded
        const envStatus = {
          hasStripeKey: !!env.STRIPE_SECRET_KEY,
          hasWebhookSecret: !!env.STRIPE_WEBHOOK_SECRET,
          hasAppUrl: !!env.NEXT_PUBLIC_APP_URL,
          stripeKeyLength: env.STRIPE_SECRET_KEY?.length || 0,
          webhookSecretLength: env.STRIPE_WEBHOOK_SECRET?.length || 0,
        }

        // Check if Stripe service can be initialized
        let stripeServiceStatus = 'unknown'
        try {
          const Stripe = await import('stripe')
          const testStripe = new Stripe.default(env.STRIPE_SECRET_KEY, {
            apiVersion: '2025-07-30.basil',
            typescript: true,
          })
          stripeServiceStatus = 'can_initialize'
        } catch (error) {
          stripeServiceStatus = `error: ${error instanceof Error ? error.message : 'unknown'}`
        }

        return {
          envStatus,
          stripeServiceStatus,
          timestamp: new Date().toISOString(),
        }
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'unknown error',
          timestamp: new Date().toISOString(),
        }
      }
    }),

  // Public test checkout session (no authentication required)
  testCheckout: publicProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        currency: z.string().length(3).default('cad'),
        description: z.string(),
        email: z.string().email(),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Create a test customer
        const customer = await stripeService.createCustomer(
          input.email,
          input.name,
          { testMode: 'true', timestamp: new Date().toISOString() }
        )
        const customerId = customer.id

        const session = await stripeService.createCheckoutSession({
          customerId,
          amount: input.amount,
          currency: input.currency,
          description: input.description,
          successUrl: `${env.NEXT_PUBLIC_APP_URL}/stripe-test?payment=success`,
          cancelUrl: `${env.NEXT_PUBLIC_APP_URL}/stripe-test?payment=cancelled`,
          metadata: {
            testMode: 'true',
            timestamp: new Date().toISOString(),
          },
        })

        return { sessionId: session.id, url: session.url }
      } catch (error) {
        console.error('Test checkout error:', error)
        throw new Error(`Failed to create test checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }),

  // Create Stripe customer
  createCustomer: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().optional(),
        metadata: z.record(z.string(), z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const customer = await stripeService.createCustomer(
          input.email,
          input.name,
          input.metadata
        )
        
        // Update user with Stripe customer ID
        // You might want to store this in your users table
        return { customerId: customer.id, success: true }
      } catch (error) {
        throw new Error('Failed to create customer')
      }
    }),

  // Create checkout session for one-time payment (e.g., verification fee)
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        currency: z.string().length(3).default('cad'),
        description: z.string(),
        metadata: z.record(z.string(), z.string()).optional(),
        successUrl: z.string().url().optional(),
        cancelUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Validate URLs if provided
        if (input.successUrl && !input.successUrl.startsWith('http')) {
          throw new Error(`Invalid successUrl: ${input.successUrl}. Must be a full URL starting with http`)
        }
        if (input.cancelUrl && !input.cancelUrl.startsWith('http')) {
          throw new Error(`Invalid cancelUrl: ${input.cancelUrl}. Must be a full URL starting with http`)
        }

        // Get or create Stripe customer
        const customer = await stripeService.createCustomer(
          ctx.user.email!,
          ctx.user.user_metadata?.full_name || undefined,
          { userId: ctx.user.id }
        )
        const customerId = customer.id

        // Use custom URLs if provided, otherwise use defaults
        const successUrl = input.successUrl || `${env.NEXT_PUBLIC_APP_URL}/contractor/dashboard?payment=success`
        const cancelUrl = input.cancelUrl || `${env.NEXT_PUBLIC_APP_URL}/contractor/dashboard?payment=cancelled`

        const finalMetadata = {
          userId: ctx.user.id,
          basePaymentType: 'checkout',
          ...input.metadata,
        } as Record<string, string>

        const session = await stripeService.createCheckoutSession({
          customerId,
          amount: input.amount,
          currency: input.currency,
          description: input.description,
          successUrl,
          cancelUrl,
          metadata: finalMetadata,
        })

        return { sessionId: session.id, url: session.url }
      } catch (error) {
        throw new Error('Failed to create checkout session')
      }
    }),

  // Create subscription checkout session
  createSubscriptionSession: protectedProcedure
    .input(
      z.object({
        priceId: z.string().optional(),
        metadata: z.record(z.string(), z.string()).optional(),
        successUrl: z.string().url().optional(),
        cancelUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Validate URLs if provided
        if (input.successUrl && !input.successUrl.startsWith('http')) {
          throw new Error(`Invalid successUrl: ${input.successUrl}. Must be a full URL starting with http`)
        }
        if (input.cancelUrl && !input.cancelUrl.startsWith('http')) {
          throw new Error(`Invalid cancelUrl: ${input.cancelUrl}. Must be a full URL starting with http`)
        }

        // Get or create Stripe customer
        const customer = await stripeService.createCustomer(
          ctx.user.email!,
          ctx.user.user_metadata?.full_name || undefined,
          { userId: ctx.user.id }
        )
        const customerId = customer.id

        // Use custom URLs if provided, otherwise use defaults
        const successUrl = input.successUrl || `${env.NEXT_PUBLIC_APP_URL}/contractor/dashboard?subscription=success`
        const cancelUrl = input.cancelUrl || `${env.NEXT_PUBLIC_APP_URL}/contractor/dashboard?payment=cancelled`

        // Use provided priceId or fallback to environment variable
        const priceId = input.priceId || env.STRIPE_VERIFICATION_PRICE_ID
        if (!priceId) {
          throw new Error('No price ID provided and STRIPE_VERIFICATION_PRICE_ID not configured')
        }

        const finalSubscriptionMetadata = {
          userId: ctx.user.id,
          basePaymentType: 'subscription',
          ...input.metadata,
        } as Record<string, string>

        const session = await stripeService.createSubscriptionSession({
          customerId,
          priceId,
          successUrl,
          cancelUrl,
          metadata: finalSubscriptionMetadata,
        })

        return { sessionId: session.id, url: session.url }
      } catch (error) {
        console.error('Failed to create subscription session:', error)
        throw new Error(`Failed to create subscription session: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }),

  // Get payment intent for client-side payment
  createPaymentIntent: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        currency: z.string().length(3).default('cad'),
        metadata: z.record(z.string(), z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Get or create Stripe customer
        const customer = await stripeService.createCustomer(
          ctx.user.email!,
          ctx.user.user_metadata?.full_name || undefined,
          { userId: ctx.user.id }
        )
        const customerId = customer.id

        const paymentIntent = await stripeService.createPaymentIntent({
          amount: input.amount,
          currency: input.currency,
          customerId,
          metadata: {
            userId: ctx.user.id,
            ...input.metadata,
          },
        })

        return {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        }
      } catch (error) {
        throw new Error('Failed to create payment intent')
      }
    }),

  // Get checkout session status
  getCheckoutSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      try {
        const session = await stripeService.getCheckoutSession(input.sessionId)
        return session
      } catch (error) {
        throw new Error('Failed to retrieve checkout session')
      }
    }),

  // Get payment intent status
  getPaymentIntent: protectedProcedure
    .input(z.object({ paymentIntentId: z.string() }))
    .query(async ({ input }) => {
      try {
        const paymentIntent = await stripeService.getPaymentIntent(input.paymentIntentId)
        return paymentIntent
      } catch (error) {
        throw new Error('Failed to retrieve payment intent')
      }
    }),

  // Cancel subscription
  cancelSubscription: protectedProcedure
    .input(z.object({ subscriptionId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const subscription = await stripeService.cancelSubscription(input.subscriptionId)
        return { success: true, subscription }
      } catch (error) {
        throw new Error('Failed to cancel subscription')
      }
    }),
})
