import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { SignatureService } from '@/server/services/signatureService'

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

// GET /api/signatures/[id] - Get signature by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const signature = await SignatureService.getSignatureById(id)
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Signature not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ signature })
  } catch (error) {
    console.error('Error fetching signature:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch signature'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

// PUT /api/signatures/[id] - Update signature
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedContext(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { user, supabase } = auth

    const { id } = await params
    const body = await request.json()

    const { data: existingSignature, error: existingError } = await supabase
      .from('signatures')
      .select('id, user_id')
      .eq('id', id)
      .single()
    if (existingError) {
      return NextResponse.json({ error: 'Signature not found' }, { status: 404 })
    }
    if (!existingSignature) {
      return NextResponse.json({ error: 'Signature not found' }, { status: 404 })
    }
    if (existingSignature.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: updatedSignature, error: updateError } = await supabase
      .from('signatures')
      .update({
        signature_data: body.signature_data,
        signature_type: body.signature_type,
        signer_name: body.signer_name,
        signer_email: body.signer_email,
        signer_role: body.signer_role,
        metadata: body.metadata ?? {},
        status: 'signed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        user:users(id, first_name, last_name, email)
      `)
      .single()
    if (updateError) throw updateError
    
    return NextResponse.json({ signature: updatedSignature })
  } catch (error) {
    console.error('Error updating signature:', error)
    const message = error instanceof Error ? error.message : 'Failed to update signature'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

// DELETE /api/signatures/[id] - Delete signature
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedContext(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { user, supabase } = auth

    const { id } = await params

    const { data: existingSignature, error: existingError } = await supabase
      .from('signatures')
      .select('id, user_id')
      .eq('id', id)
      .single()
    if (existingError) {
      return NextResponse.json({ error: 'Signature not found' }, { status: 404 })
    }
    if (!existingSignature) {
      return NextResponse.json({ error: 'Signature not found' }, { status: 404 })
    }
    if (existingSignature.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error: deleteError } = await supabase
      .from('signatures')
      .delete()
      .eq('id', id)
    if (deleteError) throw deleteError
    
    return NextResponse.json({ message: 'Signature deleted successfully' })
  } catch (error) {
    console.error('Error deleting signature:', error)
    const message = error instanceof Error ? error.message : 'Failed to delete signature'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}