import { NextRequest, NextResponse } from 'next/server'
import { createClient as createRouteClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient, type User } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import { config } from '@/config/env'
import { z } from 'zod'

const requestSchema = z.object({
  userId: z.string().uuid().optional(),
  isFirstPayment: z.boolean(),
  successUrl: z.string().optional(), // Allow custom success URL
  cancelUrl: z.string().optional(),  // Allow custom cancel URL
})

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
  try {
    const body = await request.json()
    const { userId, isFirstPayment, successUrl, cancelUrl } = requestSchema.parse(body)

    const authedUser = await getAuthenticatedUser(request)
    if (!authedUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const effectiveUserId = authedUser.id

    if (userId && userId !== effectiveUserId) {
      return NextResponse.json({ error: 'Unauthorized user mismatch' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server is missing Supabase service role configuration' },
        { status: 500 }
      )
    }
    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey)

    // Verify user exists and is a homeowner
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, user_role, is_verified_homeowner')
      .eq('id', effectiveUserId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.user_role !== 'homeowner') {
      return NextResponse.json(
        { error: 'Only homeowners can create projects' },
        { status: 403 }
      )
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'cad',
            product_data: {
              name: 'Project Creation',
              description: isFirstPayment 
                ? 'Project verification'
                : 'New project creation',
            },
            unit_amount: config.pricing.projectCreationFee, // Already in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl || `${request.nextUrl.origin}/homeowner/projects/create?payment=success&userId=${effectiveUserId}&sessionId={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${request.nextUrl.origin}/homeowner/projects/create?payment=cancelled&userId=${effectiveUserId}&sessionId={CHECKOUT_SESSION_ID}`,
      metadata: {
        userId: effectiveUserId,
        paymentType: 'homeowner_project_creation',
        isFirstPayment: isFirstPayment.toString(),
      },
      customer_email: user.email,
    })

    // Create transaction record
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: effectiveUserId,
        stripe_checkout_session_id: session.id,
        amount: config.pricing.projectCreationFee,
        currency: 'CAD',
        status: 'pending',
        transaction_type: 'project_verification_fee',
        description: isFirstPayment 
          ? 'Project verification'
          : 'New project creation',
        payment_method: 'card',
        billing_cycle: 'one_time',
      })

    if (transactionError) {
      console.error('Failed to create transaction record:', transactionError)
      // Continue anyway, webhook will handle transaction creation
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      amount: config.pricing.projectCreationFee,
      currency: 'CAD',
      isFirstPayment,
    })
  } catch (error) {
    console.error('Error creating homeowner project payment session:', error)
    
    if (error instanceof z.ZodError) {
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