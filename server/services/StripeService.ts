import Stripe from 'stripe'
import { env } from '@/config/env'

export class StripeService {
  private stripe: Stripe

  constructor() {
    this.stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-07-30.basil', // Latest API version
      typescript: true,
    })
  }

  /**
   * Create a customer in Stripe
   */
  async createCustomer(email: string, name?: string, metadata?: Record<string, string>) {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata,
      })
      return customer
    } catch (error) {
      console.error('Failed to create Stripe customer:', error)
      throw new Error('Failed to create customer')
    }
  }

  /**
   * Create a checkout session for one-time payments
   */
  async createCheckoutSession(params: {
    customerId: string
    amount: number
    currency: string
    description: string
    successUrl: string
    cancelUrl: string
    metadata?: Record<string, string>
  }) {
    try {
      const session = await this.stripe.checkout.sessions.create({
        customer: params.customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: params.currency,
              product_data: {
                name: params.description,
              },
              unit_amount: params.amount, // Amount in cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: params.metadata,
      })
      return session
    } catch (error) {
      console.error('Failed to create checkout session:', error)
      throw new Error('Failed to create checkout session')
    }
  }

  /**
   * Create a subscription checkout session
   */
  async createSubscriptionSession(params: {
    customerId: string
    priceId: string
    successUrl: string
    cancelUrl: string
    metadata?: Record<string, string>
  }) {
    try {
      const session = await this.stripe.checkout.sessions.create({
        customer: params.customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: params.priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: params.metadata,
      })
      return session
    } catch (error) {
      console.error('Failed to create subscription session:', error)
      if (error instanceof Error) {
        throw new Error(`Failed to create subscription session: ${error.message}`)
      }
      throw new Error('Failed to create subscription session')
    }
  }

  /**
   * Create a payment intent for more control
   */
  async createPaymentIntent(params: {
    amount: number
    currency: string
    customerId: string
    metadata?: Record<string, string>
  }) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: params.amount,
        currency: params.currency,
        customer: params.customerId,
        metadata: params.metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      })
      return paymentIntent
    } catch (error) {
      console.error('Failed to create payment intent:', error)
      throw new Error('Failed to create payment intent')
    }
  }

  /**
   * Retrieve a customer
   */
  async getCustomer(customerId: string) {
    try {
      return await this.stripe.customers.retrieve(customerId)
    } catch (error) {
      console.error('Failed to retrieve customer:', error)
      throw new Error('Failed to retrieve customer')
    }
  }

  /**
   * Retrieve a payment intent
   */
  async getPaymentIntent(paymentIntentId: string) {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId)
    } catch (error) {
      console.error('Failed to retrieve payment intent:', error)
      throw new Error('Failed to retrieve payment intent')
    }
  }

  /**
   * Retrieve a checkout session
   */
  async getCheckoutSession(sessionId: string) {
    try {
      return await this.stripe.checkout.sessions.retrieve(sessionId)
    } catch (error) {
      console.error('Failed to retrieve checkout session:', error)
      throw new Error('Failed to retrieve checkout session')
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string) {
    try {
      return await this.stripe.subscriptions.cancel(subscriptionId)
    } catch (error) {
      console.error('Failed to cancel subscription:', error)
      throw new Error('Failed to cancel subscription')
    }
  }

  /**
   * Update subscription metadata
   */
  async updateSubscriptionMetadata(subscriptionId: string, metadata: Record<string, string>) {
    try {
      return await this.stripe.subscriptions.update(subscriptionId, { metadata })
    } catch (error) {
      console.error('Failed to update subscription metadata:', error)
      throw new Error('Failed to update subscription metadata')
    }
  }
}

// Export singleton instance
export const stripeService = new StripeService()
