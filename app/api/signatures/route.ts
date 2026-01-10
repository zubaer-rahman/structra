import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient, type SupabaseClient, type User } from '@supabase/supabase-js'

async function getAuthenticatedContext(
  request: NextRequest
): Promise<{ user: User; supabase: SupabaseClient<any, any, any> } | null> {
  const supabase = await createServerClient()
  const {
    data: { user: cookieUser },
  } = await supabase.auth.getUser()

  if (cookieUser) return { user: cookieUser, supabase }

  const authHeader = request.headers.get('authorization')
  const bearer = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : null

  if (!bearer) return null

  const { data, error } = await supabase.auth.getUser(bearer)
  if (error) return null
  if (!data.user) return null

  const authedSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${bearer}`,
        },
      },
    }
  )

  return { user: data.user, supabase: authedSupabase }
}

// GET /api/signatures - Get signatures
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { user, supabase } = auth

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const documentId = searchParams.get('document_id')
    const documentType = searchParams.get('document_type')

    if (userId) {
      if (userId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      let query = supabase
        .from('signatures')
        .select(`
          *,
          user:users(id, first_name, last_name, email)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (documentType) {
        query = query.eq('document_type', documentType)
      }

      const { data: filteredSignatures, error } = await query
      if (error) throw error

      return NextResponse.json({ signatures: filteredSignatures })
    } else if (documentId) {
      let query = supabase
        .from('signatures')
        .select(`
          *,
          user:users(id, first_name, last_name, email)
        `)
        .eq('document_id', documentId)
        .order('created_at', { ascending: false })

      if (documentType) {
        query = query.eq('document_type', documentType)
      }

      const { data: signatures, error } = await query
      if (error) throw error

      return NextResponse.json({ signatures })
    } else {
      return NextResponse.json(
        { error: 'Either user_id or document_id is required' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error fetching signatures:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch signatures'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

// POST /api/signatures - Create signature
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { user, supabase } = auth

    const body = await request.json()
    const { signature_data, signature_type, signer_name, signer_email, signer_role, document_type, document_id } = body

    // Validate required fields
    if (!signature_data || !signer_name) {
      return NextResponse.json(
        { error: 'Missing required fields: signature_data, signer_name' },
        { status: 400 }
      )
    }

    // Get client IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const { data: signature, error: insertError } = await supabase
      .from('signatures')
      .insert({
        signature_data,
        signature_type: signature_type || 'handwritten',
        signer_name,
        signer_email,
        signer_role: signer_role || 'contractor',
        document_type: document_type || 'profile',
        document_id: document_id || null,
        metadata: {},
        user_id: user.id,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select(`
        *,
        user:users(id, first_name, last_name, email)
      `)
      .single()
    if (insertError) throw insertError

    // Mark as signed immediately for profile signatures
    if ((document_type || 'profile') === 'profile') {
      const { error: updateError } = await supabase
        .from('signatures')
        .update({
          status: 'signed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', signature.id)
      if (updateError) throw updateError
    }

    return NextResponse.json({ signature }, { status: 201 })
  } catch (error) {
    console.error('Error creating signature:', error)
    const message = error instanceof Error ? error.message : 'Failed to create signature'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
