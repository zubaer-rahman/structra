import { NextRequest, NextResponse } from 'next/server'
import { createClient as createRouteClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient, type User } from '@supabase/supabase-js'
import { z } from 'zod'

const requestSchema = z.object({
  userId: z.string().optional(),
  sessionId: z.string().optional(),
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
  console.log('Project publish success API route called')
  
  try {
    const body = await request.json()
    console.log('Project publish success API received:', body)
    
    const { userId, sessionId } = requestSchema.parse(body)
    console.log('Parsed data:', { userId, sessionId })

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
      console.error('User not found:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.user_role !== 'homeowner') {
      console.error('User is not a homeowner:', user.user_role)
      return NextResponse.json(
        { error: 'Only homeowners can publish projects' },
        { status: 403 }
      )
    }

    // Find and update pending project verification fee transaction
    let transaction = null

    if (sessionId) {
      // Try to find transaction by session ID first
      const { data: sessionTransaction, error: sessionError } = await supabase
        .from('transactions')
        .select('id, status, transaction_type, metadata, amount, currency')
        .eq('stripe_checkout_session_id', sessionId)
        .eq('user_id', effectiveUserId)
        .eq('transaction_type', 'project_verification_fee')
        .single()

      if (sessionTransaction) {
        transaction = sessionTransaction
      }
    }

    // If no transaction found by session ID, look for pending project verification fee
    if (!transaction) {
      const { data: pendingTransaction, error: pendingError } = await supabase
        .from('transactions')
        .select('id, status, transaction_type, metadata, amount, currency')
        .eq('user_id', effectiveUserId)
        .eq('transaction_type', 'project_verification_fee')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (pendingTransaction) {
        transaction = pendingTransaction
      }
    }

    if (!transaction) {
      console.error('No project verification fee transaction found')
      return NextResponse.json(
        { error: 'No project verification payment found' },
        { status: 404 }
      )
    }

    // Update transaction status to succeeded if it's still pending
    if (transaction.status === 'pending') {
      const { error: updateTransactionError } = await supabase
        .from('transactions')
        .update({
          status: 'succeeded',
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.id)

      if (updateTransactionError) {
        console.error('Failed to update project verification transaction status:', updateTransactionError)
        return NextResponse.json(
          { error: 'Failed to update transaction status' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Project publish payment completed successfully',
      transactionId: transaction.id,
      status: 'succeeded'
    })

  } catch (error) {
    console.error('Error in project publish success endpoint:', error)
    
    if (error instanceof z.ZodError) {
      console.error('Validation error details:', error.issues)
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
