import { NextRequest, NextResponse } from 'next/server'
import { createClient as createRouteClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient, type User } from '@supabase/supabase-js'
import { z } from 'zod'

const requestSchema = z.object({
  userId: z.string(),
  projectId: z.string(),
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

async function handleProjectPaymentSuccess(
  request: NextRequest,
  userId: string,
  projectId: string,
  sessionId?: string
) {
  try {
    console.log('Project payment success API received:', { userId, projectId, sessionId })
    const authedUser = await getAuthenticatedUser(request)
    if (!authedUser || authedUser.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
        { error: 'Only contractors can purchase project access' },
        { status: 403 }
      )
    }

    // Verify project exists
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, project_title, status')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      console.error('Project not found:', projectError)
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    let transaction = null

    if (sessionId) {
      const { data: sessionTransaction, error: sessionError } = await supabase
        .from('transactions')
        .select('id, status, valid_until, stripe_checkout_session_id, transaction_type, metadata, amount, currency')
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .eq('stripe_checkout_session_id', sessionId)
        .eq('transaction_type', 'project_ppv')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (sessionError && sessionError.code !== 'PGRST116') {
        console.error('Failed to fetch project transaction by session ID:', sessionError)
      }

      if (sessionTransaction) {
        if (sessionTransaction.status === 'cancelled') {
          return NextResponse.json(
            { error: 'Project payment was cancelled' },
            { status: 400 }
          )
        }

        if (sessionTransaction.status === 'pending') {
          const { error: updateError } = await supabase
            .from('transactions')
            .update({
              status: 'succeeded',
              updated_at: new Date().toISOString(),
            })
            .eq('id', sessionTransaction.id)
          if (updateError) {
            console.error('Failed to update project transaction status:', updateError)
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

    if (!transaction) {
      const { data: pendingTransaction } = await supabase
        .from('transactions')
        .select('id, status, valid_until, stripe_checkout_session_id, transaction_type, metadata, amount, currency')
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .eq('transaction_type', 'project_ppv')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (pendingTransaction) {
      console.log('Found pending project payment transaction, updating to succeeded:', pendingTransaction.id)
      
      // Update transaction status to succeeded
      const { error: updateTransactionError } = await supabase
        .from('transactions')
        .update({
          status: 'succeeded',
          updated_at: new Date().toISOString()
        })
        .eq('id', pendingTransaction.id)

      if (updateTransactionError) {
        console.error('Failed to update project transaction status:', updateTransactionError)
        return NextResponse.json(
          { error: 'Failed to update transaction status' },
          { status: 500 }
        )
      }

        transaction = { ...pendingTransaction, status: 'succeeded' }
      }
    }

    if (!transaction) {
      const { data: succeededTransaction, error: succeededError } = await supabase
        .from('transactions')
        .select('id, status, valid_until, stripe_checkout_session_id, transaction_type, metadata')
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .eq('transaction_type', 'project_ppv')
        .eq('status', 'succeeded')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (succeededError || !succeededTransaction) {
        console.error('No project payment transaction found:', succeededError)
        return NextResponse.json(
          { error: 'No project payment found' },
          { status: 400 }
        )
      }

      transaction = succeededTransaction
    }

    // Verify the transaction has a valid_until date
    if (!transaction.valid_until) {
      console.error('Transaction missing valid_until date:', transaction.id)
      return NextResponse.json(
        { error: 'Project payment transaction is missing validity period' },
        { status: 400 }
      )
    }

    // Check if project access is still valid
    const validUntil = new Date(transaction.valid_until)
    const now = new Date()
    
    if (now > validUntil) {
      console.error('Project access has expired:', validUntil)
      return NextResponse.json(
        { error: 'Project access has expired' },
        { status: 400 }
      )
    }

    // Create or update project view record
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now

    const projectViewData = {
      contractor: userId,
      project: projectId,
      is_active: 'yes',
      expires_at: expiresAt.toISOString().split('T')[0], // Convert to date format (YYYY-MM-DD)
      access_method: 'Manual Paywall', // Use valid enum value
      can_submit_proposal: 'yes',
      created_by: userId, // Required field
      view_status: 'Viewed', // Required field
      viewed_at: now.toISOString().split('T')[0], // Required field, convert to date format (YYYY-MM-DD)
      was_paid_view: 'yes', // Required field
      payment_transaction: transaction.id // Link to transaction
    }

    // Check if project view already exists
    const { data: existingView, error: existingViewError } = await supabase
      .from('project_views')
      .select('id')
      .eq('contractor', userId)
      .eq('project', projectId)
      .single()
    
    console.log('Existing view check:', { existingView, existingViewError })
    
    if (existingView) {
      // Update existing view
      console.log('Updating existing project view:', existingView.id)
      const { error: updateViewError } = await supabase
        .from('project_views')
        .update(projectViewData)
        .eq('id', existingView.id)
      
      if (updateViewError) {
        console.error('Failed to update project view:', updateViewError)
        return NextResponse.json(
          { error: 'Failed to update project access' },
          { status: 500 }
        )
      }
      console.log('Successfully updated project view')
    } else {
      // Create new project view
      console.log('Creating new project view with data:', projectViewData)
      const { error: insertError } = await supabase
        .from('project_views')
        .insert(projectViewData)
      
      if (insertError) {
        console.error('Failed to create project view:', insertError)
        return NextResponse.json(
          { error: 'Failed to create project access' },
          { status: 500 }
        )
      }
      console.log('Successfully created project view')
    }

    console.log(`✅ Successfully processed project payment for user ${userId}, project ${projectId}`)
    
    return NextResponse.json({
      success: true,
      message: 'Project payment completed successfully',
      projectId: projectId,
      validUntil: transaction.valid_until
    })

  } catch (error) {
    console.error('Error in project payment success endpoint:', error)
    
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
  console.log('Project payment success API route called')
  try {
    const body = await request.json()
    const { userId, projectId, sessionId } = requestSchema.parse(body)
    return handleProjectPaymentSuccess(request, userId, projectId, sessionId)
  } catch (error) {
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
  const projectId = url.searchParams.get('projectId')
  const sessionId = url.searchParams.get('sessionId')
  
  if (!userId || !projectId) {
    return NextResponse.json(
      { error: 'Missing userId or projectId parameter' },
      { status: 400 }
    )
  }
  
  return handleProjectPaymentSuccess(request, userId, projectId, sessionId || undefined)
}
