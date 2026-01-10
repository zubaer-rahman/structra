import { NextRequest, NextResponse } from 'next/server'
import { createClient as createRouteClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient, type User } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import { env, config } from '@/config/env'
import { z } from 'zod'
import { PROJECT_STATUSES } from '@/utils/constants/projects'

// Validation schema for project payment request
const projectPaymentSchema = z.object({
  projectId: z.string().uuid(),
  userId: z.string().uuid(),
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
    const { projectId } = projectPaymentSchema.parse(body)

    const authedUser = await getAuthenticatedUser(request)
    if (!authedUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = authedUser.id

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
      .select('id, full_name, email, user_role')
      .eq('id', userId)
      .eq('user_role', 'contractor')
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found or not a contractor' },
        { status: 404 }
      )
    }

    // Verify project exists and is open for proposals
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, project_title, status')
      .eq('id', projectId)
      .eq('status', PROJECT_STATUSES.OPEN_FOR_PROPOSALS)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found or not open for proposals' },
        { status: 404 }
      )
    }

    // Check if user already has access to this project
    const { data: existingView } = await supabase
      .from('project_views')
      .select('id, is_active, expires_at')
      .eq('contractor', userId)
      .eq('project', projectId)
      .eq('is_active', 'yes')
      .single()

    if (existingView && (!existingView.expires_at || new Date(existingView.expires_at) > new Date())) {
      return NextResponse.json(
        { error: 'You already have access to this project' },
        { status: 400 }
      )
    }

    // Check if user is verified contractor
    const { data: userData } = await supabase
      .from('users')
      .select('is_verified_contractor')
      .eq('id', userId)
      .single()

    const isVerified = userData?.is_verified_contractor || false
    
    // Only allow verified contractors to purchase project access
    if (!isVerified) {
      return NextResponse.json(
        { error: 'You must be a verified contractor to purchase project access. Please complete verification on your profile page first.' },
        { status: 403 }
      )
    }
    
    // Only charge project access fee for verified contractors
    const projectPrice = config.pricing.projectAccessFee // Already in cents
    const totalAmount = projectPrice

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'cad',
            product_data: {
              name: `Project Access: ${project.project_title}`,
              description: 'One-time payment for project proposal submission access',
            },
            unit_amount: projectPrice,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${env.NEXT_PUBLIC_APP_URL}/contractor/projects/view/${projectId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.NEXT_PUBLIC_APP_URL}/contractor/projects/view/${projectId}?payment=cancelled`,
      customer_email: user.email,
      metadata: {
        userId,
        projectId,
        paymentType: 'project_access',
        isVerified: 'true', // Only verified contractors can reach this point
        projectPrice: projectPrice.toString(),
      },
    })

    // Create pending transaction record for tracking
    // Calculate valid_until date (30 days from now for project access)
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + 30)
    
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        project_id: projectId,
        amount: totalAmount,
        currency: 'CAD',
        transaction_type: 'project_ppv',
        status: 'pending',
        stripe_checkout_session_id: session.id,
        stripe_customer_id: session.customer,
        description: `Project Access: ${project.project_title}`,
        metadata: {
          userId,
          projectId,
          paymentType: 'project_access',
          isVerified: 'true',
          projectPrice: projectPrice.toString(),
        },
        payment_method: 'card',
        billing_cycle: 'one_time',
        valid_until: validUntil.toISOString(),
      })

    if (transactionError) {
      console.error('Failed to create pending project transaction:', transactionError)
      // Don't fail the request, success URL will handle it
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      amount: totalAmount,
      currency: 'CAD',
      isVerified: true,
      breakdown: {
        projectAccess: projectPrice,
        verification: 0,
      },
    })
  } catch (error) {
    console.error('Error creating project payment session:', error)
    
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

// GET endpoint to check project access status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const userId = searchParams.get('userId')

    if (!projectId || !userId) {
      return NextResponse.json(
        { error: 'Missing projectId or userId' },
        { status: 400 }
      )
    }

    const supabase = await createRouteClient()

    // Check if user has access to this project
    const { data: projectView, error: viewError } = await supabase
      .from('project_views')
      .select('id, is_active, expires_at, access_method, can_submit_proposal')
      .eq('contractor', userId)
      .eq('project', projectId)
      .eq('is_active', 'yes')
      .single()

    if (viewError && viewError.code !== 'PGRST116') {
      return NextResponse.json(
        { error: 'Failed to check project access' },
        { status: 500 }
      )
    }

    const hasAccess = projectView && 
      (!projectView.expires_at || new Date(projectView.expires_at) > new Date())

    // Check verification status
    const { data: verificationStatus } = await supabase
      .from('subscriptions')
      .select('id, is_active, end_date')
      .eq('contractor', userId)
      .eq('is_active', 'yes')
      .gte('end_date', new Date().toISOString().split('T')[0])
      .single()

    const isVerified = !!verificationStatus

    return NextResponse.json({
      hasAccess: !!hasAccess,
      canSubmitProposal: hasAccess ? projectView.can_submit_proposal === 'yes' : false,
      isVerified,
      accessMethod: projectView?.access_method || null,
      expiresAt: projectView?.expires_at || null,
    })
  } catch (error) {
    console.error('Error checking project access:', error)
    return NextResponse.json(
      { error: 'Failed to check project access' },
      { status: 500 }
    )
  }
}