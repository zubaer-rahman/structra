import { NextRequest, NextResponse } from 'next/server'
import { createClient as createRouteClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import { config } from '@/config/env'
import { z } from 'zod'
import type { User } from '@supabase/supabase-js'

const requestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  paymentType: z.enum(['subscription', 'one_time']).default('one_time'),
  priceId: z.string().nullable().optional(), // For subscription payments
  successUrl: z.string().optional(),
  cancelUrl: z.string().optional(),
})

export async function GET() {
  return NextResponse.json({ message: 'Contractor verification API is working' })
}

async function getAuthenticatedUser(request: NextRequest): Promise<User | null> {
  const routeClient = await createRouteClient()
  const {
    data: { user: cookieUser },
  } = await routeClient.auth.getUser()
  if (cookieUser) return cookieUser

  const authHeader = request.headers.get('authorization')
  const bearer = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : null
  if (!bearer) return null

  const { data, error } = await routeClient.auth.getUser(bearer)
  if (error || !data.user) return null
  return data.user
}

export async function POST(request: NextRequest) {
  console.log('Contractor verification API route called')
  
  try {
    let body
    try {
      body = await request.json()
      console.log('Contractor verification API received:', body)
    } catch (jsonError) {
      console.error('Failed to parse JSON:', jsonError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    
    const { userId, paymentType, priceId, successUrl, cancelUrl } = requestSchema.parse(body)
    console.log('Parsed data:', { userId, paymentType, priceId, successUrl, cancelUrl })

    const authedUser = await getAuthenticatedUser(request)
    if (!authedUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    // Always trust authenticated identity over client-supplied id.
    const effectiveUserId = authedUser.id

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server is missing Supabase service role configuration' },
        { status: 500 }
      )
    }
    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey)

    // Verify user exists and is a contractor
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, user_role, is_verified_contractor')
      .eq('id', effectiveUserId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.user_role !== 'contractor') {
      return NextResponse.json(
        { error: 'Only contractors can purchase verification' },
        { status: 403 }
      )
    }

    // Check if user is already verified
    if (user.is_verified_contractor) {
      return NextResponse.json(
        { error: 'User is already verified' },
        { status: 400 }
      )
    }

    let session
    let transactionType: string
    let description: string
    let amount: number
    let billingCycle: string

    if (paymentType === 'subscription' && priceId) {
      // Create subscription checkout session
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl || `${request.nextUrl.origin}/contractor/profile?verification=success`,
        cancel_url: cancelUrl || `${request.nextUrl.origin}/contractor/profile?verification=cancelled`,
        metadata: {
          userId: effectiveUserId,
          paymentType: 'contractor_verification_subscription',
          verificationTier: 'verified',
        },
        customer_email: user.email,
      })

      transactionType = 'contractor_verification_subscription'
      description = 'Contractor Verification - Annual Subscription'
      amount = config.pricing.contractorVerificationAnnual
      billingCycle = 'yearly'
    } else {
      // Create one-time payment checkout session
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'cad',
              product_data: {
                name: 'Contractor Verification',
                description: 'One-time contractor verification fee',
              },
              unit_amount: config.pricing.contractorVerificationAnnual, // Already in cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl || `${request.nextUrl.origin}/contractor/profile?verification=success`,
        cancel_url: cancelUrl || `${request.nextUrl.origin}/contractor/profile?verification=cancelled`,
        metadata: {
          userId: effectiveUserId,
          paymentType: 'contractor_verification',
          verificationTier: 'verified',
        },
        customer_email: user.email,
      })

      transactionType = 'contractor_verification_fee'
      description = 'Contractor Verification - One-time Fee'
      amount = config.pricing.contractorVerificationAnnual
      billingCycle = 'one_time'
    }

    // Create pending transaction record for tracking
    // Calculate valid_until date (1 year from now)
    const validUntil = new Date()
    validUntil.setFullYear(validUntil.getFullYear() + 1)
    
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: effectiveUserId,
        amount: amount,
        currency: 'CAD',
        transaction_type: transactionType,
        status: 'pending',
        stripe_checkout_session_id: session.id,
        stripe_customer_id: session.customer,
        description: description,
        metadata: {
          userId: effectiveUserId,
          paymentType: 'contractor_verification',
          verificationTier: 'verified',
        },
        payment_method: 'card',
        billing_cycle: billingCycle,
        valid_until: validUntil.toISOString(),
      })

    if (transactionError) {
      console.error('Failed to create pending transaction:', transactionError)
      // Don't fail the request, success URL will handle it
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      amount: amount,
      currency: 'CAD',
      paymentType,
      transactionType,
    })
  } catch (error) {
    console.error('Error creating contractor verification payment session:', error)
    
    if (error instanceof z.ZodError) {
      console.error('Validation error details:', error.issues)
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create payment session' },
      { status: 500 }
    )
  }
}