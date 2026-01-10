import { NextRequest, NextResponse } from 'next/server'
import { createClient as createRouteClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient, type User } from '@supabase/supabase-js'

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

export async function GET(request: NextRequest) {
  try {
    const authedUser = await getAuthenticatedUser(request)
    if (!authedUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const proposalId = new URL(request.url).searchParams.get('proposalId')
    if (!proposalId) {
      return NextResponse.json({ error: 'proposalId is required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server is missing Supabase service role configuration' },
        { status: 500 }
      )
    }

    const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey)

    const { data: proposal, error: proposalError } = await adminClient
      .from('proposals')
      .select('id, homeowner, contractor')
      .eq('id', proposalId)
      .single()

    if (proposalError || !proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    const isParticipant =
      proposal.homeowner === authedUser.id || proposal.contractor === authedUser.id
    if (!isParticipant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [homeownerResult, contractorResult] = await Promise.all([
      adminClient
        .from('signatures')
        .select('*, user:users(id, first_name, last_name, email)')
        .eq('user_id', proposal.homeowner)
        .eq('document_type', 'profile')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      adminClient
        .from('signatures')
        .select('*, user:users(id, first_name, last_name, email)')
        .eq('user_id', proposal.contractor)
        .eq('document_type', 'profile')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    return NextResponse.json({
      homeownerSignature: homeownerResult.data || null,
      contractorSignature: contractorResult.data || null,
    })
  } catch (error) {
    console.error('Error fetching contract signatures:', error)
    return NextResponse.json({ error: 'Failed to fetch signatures' }, { status: 500 })
  }
}

