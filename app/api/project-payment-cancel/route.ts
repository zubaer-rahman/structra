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

async function handleProjectPaymentCancel(
  request: NextRequest,
  userId: string,
  projectId: string,
  sessionId?: string
) {
  try {
    console.log('Project payment cancel API received:', { userId, projectId, sessionId })
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
        { error: 'Only contractors can cancel project payments' },
        { status: 403 }
      )
    }

    // Find and delete pending project payment transactions
    let query = supabase
      .from('transactions')
      .select('id, stripe_checkout_session_id, project_id')
      .eq('user_id', userId)
      .eq('transaction_type', 'project_ppv')
      .eq('status', 'pending')

    // If projectId is 'all', don't filter by project_id
    if (projectId !== 'all') {
      query = query.eq('project_id', projectId)
    }

    const { data: pendingTransactions, error: findError } = await query

    if (findError) {
      console.error('Error finding pending project transactions:', findError)
      return NextResponse.json(
        { error: 'Failed to find pending transactions' },
        { status: 500 }
      )
    }

    if (pendingTransactions && pendingTransactions.length > 0) {
      // Update all pending project payment transactions to cancelled
      let updateQuery = supabase
        .from('transactions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('transaction_type', 'project_ppv')
        .eq('status', 'pending')

      // If projectId is 'all', don't filter by project_id
      if (projectId !== 'all') {
        updateQuery = updateQuery.eq('project_id', projectId)
      }

      const { error: updateError } = await updateQuery

      if (updateError) {
        console.error('Failed to cancel project transactions:', updateError)
        return NextResponse.json(
          { error: 'Failed to cancel project payment' },
          { status: 500 }
        )
      }

      console.log(`✅ Updated ${pendingTransactions.length} pending project payment transactions to cancelled for user ${userId}, project ${projectId}`)
    } else {
      console.log('No pending project payment transactions found for user:', userId, 'project:', projectId)
    }

    // Rollback project access by deleting any associated project_views records
    let projectViewsQuery = supabase
      .from('project_views')
      .select('id, payment_transaction, project')
      .eq('contractor', userId)
      .eq('is_active', 'yes')

    // If projectId is 'all', don't filter by project
    if (projectId !== 'all') {
      projectViewsQuery = projectViewsQuery.eq('project', projectId)
    }

    const { data: projectViews, error: projectViewsError } = await projectViewsQuery

    if (projectViewsError) {
      console.error('Error finding project views for rollback:', projectViewsError)
      return NextResponse.json(
        { error: 'Failed to find project views for rollback' },
        { status: 500 }
      )
    }

    if (projectViews && projectViews.length > 0) {
      // Delete project views that were created from the cancelled payment
      let deleteViewsQuery = supabase
        .from('project_views')
        .delete()
        .eq('contractor', userId)
        .eq('is_active', 'yes')

      // If projectId is 'all', don't filter by project
      if (projectId !== 'all') {
        deleteViewsQuery = deleteViewsQuery.eq('project', projectId)
      }

      const { error: deleteViewsError } = await deleteViewsQuery

      if (deleteViewsError) {
        console.error('Failed to delete project views during rollback:', deleteViewsError)
        return NextResponse.json(
          { error: 'Failed to rollback project access' },
          { status: 500 }
        )
      }

      console.log(`✅ Rolled back ${projectViews.length} project view records for user ${userId}, project ${projectId}`)
    } else {
      console.log('No active project views found for rollback for user:', userId, 'project:', projectId)
    }

    return NextResponse.json({
      success: true,
      message: 'Project payment cancelled successfully',
      cancelledTransactions: pendingTransactions?.length || 0,
      rolledBackProjectViews: projectViews?.length || 0
    })

  } catch (error) {
    console.error('Error in project payment cancel endpoint:', error)
    
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
  console.log('Project payment cancel API route called')
  try {
    const body = await request.json()
    const { userId, projectId, sessionId } = requestSchema.parse(body)
    return handleProjectPaymentCancel(request, userId, projectId, sessionId)
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
  
  return handleProjectPaymentCancel(request, userId, projectId, sessionId || undefined)
}
