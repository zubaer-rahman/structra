import { NextRequest, NextResponse } from 'next/server'
import { createClient as createRouteClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { User } from '@supabase/supabase-js'

const requestSchema = z.object({
  userId: z.string(),
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

async function handleVerifyCancel(request: NextRequest, userId: string, sessionId?: string) {
  try {
    console.log('Verify cancel API received:', { userId, sessionId })

    const authedUser = await getAuthenticatedUser(request)
    if (!authedUser || authedUser.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
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

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, user_role')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      console.error('User not found:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.user_role !== 'contractor') {
      console.error('User is not a contractor:', user.user_role)
      return NextResponse.json(
        { error: 'Only contractors can cancel verification' },
        { status: 403 }
      )
    }

    // Find and delete pending verification transactions
    const { data: pendingTransactions, error: findError } = await supabase
      .from('transactions')
      .select('id, stripe_checkout_session_id')
      .eq('user_id', userId)
      .in('transaction_type', ['contractor_verification_fee', 'contractor_verification_subscription'])
      .eq('status', 'pending')

    if (findError) {
      console.error('Error finding pending transactions:', findError)
      return NextResponse.json(
        { error: 'Failed to find pending transactions' },
        { status: 500 }
      )
    }

    if (pendingTransactions && pendingTransactions.length > 0) {
      // Update all pending verification transactions to cancelled
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .in('transaction_type', ['contractor_verification_fee', 'contractor_verification_subscription'])
        .eq('status', 'pending')

      if (updateError) {
        console.error('Failed to cancel verification transactions:', updateError)
        return NextResponse.json(
          { error: 'Failed to cancel verification' },
          { status: 500 }
        )
      }

      console.log(`✅ Updated ${pendingTransactions.length} pending verification transactions to cancelled for user ${userId}`)
    } else {
      console.log('No pending verification transactions found for user:', userId)
    }

    return NextResponse.json({
      success: true,
      message: 'Verification cancelled successfully',
      cancelledTransactions: pendingTransactions?.length || 0
    })

  } catch (error) {
    console.error('Error in verify cancel endpoint:', error)
    
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

export async function POST(request: NextRequest) {
  console.log('Verify cancel API route called')
  try {
    const body = await request.json()
    const { userId, sessionId } = requestSchema.parse(body)
    return handleVerifyCancel(request, userId, sessionId)
  } catch (error) {
    console.error('Verify cancel POST parse error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const userId = url.searchParams.get('userId')
  const sessionId = url.searchParams.get('sessionId')
  
  if (!userId) {
    return NextResponse.json(
      { error: 'Missing userId parameter' },
      { status: 400 }
    )
  }

  // Reuse same request auth/cookie context by calling shared logic directly.
  return handleVerifyCancel(request, userId, sessionId || undefined)
}
