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

async function handleVerifySuccess(request: NextRequest, userId: string, sessionId?: string) {
  try {
    console.log('Verify success API received:', { userId, sessionId })

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

    // Verify user exists and is a contractor
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, user_role, is_verified_contractor')
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
        { error: 'Only contractors can be verified' },
        { status: 403 }
      )
    }

    // Check if user already verified
    if (user.is_verified_contractor) {
      console.log('User is already verified')
      return NextResponse.json({
        success: true,
        message: 'User is already verified',
        isVerified: true
      })
    }

    let transaction = null

    // 1) If Stripe session id is available, resolve using that exact transaction first.
    if (sessionId) {
      const { data: sessionTransaction, error: sessionTxError } = await supabase
        .from('transactions')
        .select('id, status, valid_until, stripe_checkout_session_id, transaction_type, metadata, amount, currency')
        .eq('user_id', userId)
        .eq('stripe_checkout_session_id', sessionId)
        .in('transaction_type', ['contractor_verification_fee', 'contractor_verification_subscription', 'project_ppv'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (sessionTxError && sessionTxError.code !== 'PGRST116') {
        console.error('Failed to fetch transaction by session id:', sessionTxError)
      }

      if (sessionTransaction) {
        if (sessionTransaction.status === 'cancelled') {
          return NextResponse.json(
            { error: 'Verification payment was cancelled' },
            { status: 400 }
          )
        }

        if (sessionTransaction.status === 'pending') {
          const { error: promotePendingError } = await supabase
            .from('transactions')
            .update({
              status: 'succeeded',
              updated_at: new Date().toISOString(),
            })
            .eq('id', sessionTransaction.id)

          if (promotePendingError) {
            console.error('Failed to promote pending transaction to succeeded:', promotePendingError)
            return NextResponse.json(
              { error: 'Failed to update transaction status' },
              { status: 500 }
            )
          }

          transaction = { ...sessionTransaction, status: 'succeeded' }
        } else if (sessionTransaction.status === 'succeeded') {
          transaction = sessionTransaction
        }
      }
    }

    // 2) Fallback: latest pending verification transaction for this user.
    if (!transaction) {
      const { data: pendingTransaction, error: pendingError } = await supabase
        .from('transactions')
        .select('id, status, valid_until, stripe_checkout_session_id, transaction_type, metadata, amount, currency')
        .eq('user_id', userId)
        .in('transaction_type', ['contractor_verification_fee', 'contractor_verification_subscription'])
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (pendingError && pendingError.code !== 'PGRST116') {
        console.error('Failed to fetch pending verification transaction:', pendingError)
      }

      if (pendingTransaction) {
      console.log('Found pending transaction, updating to succeeded:', pendingTransaction.id)
      
      // Update transaction status to succeeded
      const { error: updateTransactionError } = await supabase
        .from('transactions')
        .update({
          status: 'succeeded',
          updated_at: new Date().toISOString()
        })
        .eq('id', pendingTransaction.id)

      if (updateTransactionError) {
        console.error('Failed to update transaction status:', updateTransactionError)
        return NextResponse.json(
          { error: 'Failed to update transaction status' },
          { status: 500 }
        )
      }

      // Set valid_until date if not already set
      if (!pendingTransaction.valid_until) {
        const validUntil = new Date()
        validUntil.setFullYear(validUntil.getFullYear() + 1)
        
        const { error: validUntilError } = await supabase
          .from('transactions')
          .update({
            valid_until: validUntil.toISOString()
          })
          .eq('id', pendingTransaction.id)

        if (validUntilError) {
          console.error('Failed to set valid_until date:', validUntilError)
        }
      }

        transaction = { ...pendingTransaction, status: 'succeeded' }
      }
    }

    // 3) Final fallback: latest succeeded transaction.
    if (!transaction) {
      const { data: succeededTransaction, error: succeededError } = await supabase
        .from('transactions')
        .select('id, status, valid_until, stripe_checkout_session_id, transaction_type, metadata')
        .eq('user_id', userId)
        .in('transaction_type', ['contractor_verification_fee', 'contractor_verification_subscription', 'project_ppv'])
        .eq('status', 'succeeded')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (succeededError || !succeededTransaction) {
        console.error('No verification transaction found:', succeededError)
        return NextResponse.json(
          { error: 'No verification payment found' },
          { status: 400 }
        )
      }

      transaction = succeededTransaction
    }

    // For project_ppv transactions, check if verification was included
    if (transaction.transaction_type === 'project_ppv') {
      const metadata = transaction.metadata as { isVerified?: string | boolean; verificationPrice?: string | number } | null
      const isVerified = metadata?.isVerified === 'false' || metadata?.isVerified === false
      const verificationPrice = metadata?.verificationPrice
      
      // Only proceed if this project payment included verification (unverified contractor)
      if (isVerified || !verificationPrice || verificationPrice === '0' || verificationPrice === 0) {
        console.error('Project payment did not include verification:', { isVerified, verificationPrice })
        return NextResponse.json(
          { error: 'This project payment did not include contractor verification' },
          { status: 400 }
        )
      }
    }

    // Verify the transaction has a valid_until date
    if (!transaction.valid_until) {
      console.error('Transaction missing valid_until date:', transaction.id)
      return NextResponse.json(
        { error: 'Verification transaction is missing validity period' },
        { status: 400 }
      )
    }

    // Check if verification is still valid
    const validUntil = new Date(transaction.valid_until)
    const now = new Date()
    
    if (now > validUntil) {
      console.error('Verification has expired:', validUntil)
      return NextResponse.json(
        { error: 'Verification has expired' },
        { status: 400 }
      )
    }

    // Update user verification status
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_verified_contractor: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Failed to update verification status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update verification status' },
        { status: 500 }
      )
    }

    console.log(`✅ Successfully verified contractor ${userId} via success URL`)
    
    return NextResponse.json({
      success: true,
      message: 'Contractor verification completed successfully',
      isVerified: true,
      validUntil: transaction.valid_until
    })

  } catch (error) {
    console.error('Error in verify success endpoint:', error)
    
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
  console.log('Verify success API route called')
  try {
    const body = await request.json()
    const { userId, sessionId } = requestSchema.parse(body)
    return handleVerifySuccess(request, userId, sessionId)
  } catch (error) {
    console.error('Verify success POST parse error:', error)
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
  return handleVerifySuccess(request, userId, sessionId || undefined)
}