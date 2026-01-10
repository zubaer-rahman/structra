import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if this is a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Try to find contractor profile by user_id first
    const { data: contractorByUserId, error: userError } = await supabase
      .from('contractor_profiles')
      .select('slug')
      .eq('user_id', id)
      .single()

    if (contractorByUserId?.slug) {
      return NextResponse.redirect(
        new URL(`/profile/${contractorByUserId.slug}`, request.url),
        301 // Permanent redirect
      )
    }

    // If not found by user_id, try to find by contractor profile id
    const { data: contractorById, error: profileError } = await supabase
      .from('contractor_profiles')
      .select('slug')
      .eq('id', id)
      .single()

    if (contractorById?.slug) {
      return NextResponse.redirect(
        new URL(`/profile/${contractorById.slug}`, request.url),
        301 // Permanent redirect
      )
    }

    // If no contractor profile found, return 404
    return NextResponse.json(
      { error: 'Contractor profile not found' },
      { status: 404 }
    )

  } catch (error) {
    console.error('Error in profile redirect API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}