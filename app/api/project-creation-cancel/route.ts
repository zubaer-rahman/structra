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
  console.log('Project creation cancel API called')
  try {
    const body = await request.json()
    console.log('Cancel API received:', body)
    const { userId, sessionId } = requestSchema.parse(body)

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
      .select('id, user_role')
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
        { error: 'Only homeowners can cancel project creation payments' },
        { status: 403 }
      )
    }

    // Find and update pending project verification fee transactions
    let query = supabase
      .from('transactions')
      .select('id, stripe_checkout_session_id, status')
      .eq('user_id', effectiveUserId)
      .eq('transaction_type', 'project_verification_fee')
      .eq('status', 'pending')

    // If sessionId is provided, filter by that specific session
    if (sessionId) {
      query = query.eq('stripe_checkout_session_id', sessionId)
    }

    const { data: pendingTransactions, error: findError } = await query

    if (findError) {
      console.error('Failed to find pending transactions:', findError)
      return NextResponse.json(
        { error: 'Failed to find pending transactions' },
        { status: 500 }
      )
    }

    if (pendingTransactions && pendingTransactions.length > 0) {
      // Update all pending project verification fee transactions to cancelled
      let updateQuery = supabase
        .from('transactions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', effectiveUserId)
        .eq('transaction_type', 'project_verification_fee')
        .eq('status', 'pending')

      // If sessionId is provided, filter by that specific session
      if (sessionId) {
        updateQuery = updateQuery.eq('stripe_checkout_session_id', sessionId)
      }

      const { error: updateError } = await updateQuery

      if (updateError) {
        console.error('Failed to cancel project creation transactions:', updateError)
        return NextResponse.json(
          { error: 'Failed to cancel project creation payment' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Project creation payment cancelled successfully',
        cancelledTransactions: pendingTransactions.length
      })
    } else {
      return NextResponse.json({
        success: true,
        message: 'No pending project creation transactions found',
        cancelledTransactions: 0
      })
    }

  } catch (error) {
    console.error('Error in project creation cancel endpoint:', error)
    
    if (error instanceof z.ZodError) {
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
