import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isValidSlug } from '@/utils/helpers/slugUtils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const isUuid = uuidRegex.test(slug)

    // Validate slug or UUID format
    if (!isUuid && !isValidSlug(slug)) {
      return NextResponse.json(
        { error: 'Invalid slug format' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // 1. First attempt: fetch by slug
    let contractorData = null
    const { data: bySlugData } = await supabase
      .from('contractor_profiles')
      .select(`
        *,
        user:users!user_id (
          id,
          full_name,
          first_name,
          last_name,
          email,
          phone_number,
          address,
          profile_photo,
          user_role,
          is_verified_contractor,
          created_at
        )
      `)
      .eq('slug', slug)
      .maybeSingle()

    if (bySlugData) {
      contractorData = bySlugData
    } else if (isUuid) {
      // 2. Second attempt: fallback by user_id
      const { data: byUserData } = await supabase
        .from('contractor_profiles')
        .select(`
          *,
          user:users!user_id (
            id,
            full_name,
            first_name,
            last_name,
            email,
            phone_number,
            address,
            profile_photo,
            user_role,
            is_verified_contractor,
            created_at
          )
        `)
        .eq('user_id', slug)
        .maybeSingle()

      if (byUserData) {
        contractorData = byUserData
      } else {
        // 3. Third attempt: fallback by profile id
        const { data: byProfileIdData } = await supabase
          .from('contractor_profiles')
          .select(`
            *,
            user:users!user_id (
              id,
              full_name,
              first_name,
              last_name,
              email,
              phone_number,
              address,
              profile_photo,
              user_role,
              is_verified_contractor,
              created_at
            )
          `)
          .eq('id', slug)
          .maybeSingle()

        if (byProfileIdData) {
          contractorData = byProfileIdData
        }
      }
    }

    if (!contractorData) {
      console.error('Contractor not found for slug/id:', slug)
      return NextResponse.json(
        { error: 'Contractor not found' },
        { status: 404 }
      )
    }

    // Fetch reviews for this contractor
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        text,
        created_at,
        author:users!reviews_author_fkey (
          full_name,
          profile_photo
        )
      `)
      .eq('recipient', contractorData.user_id)
      .eq('is_verified', 'yes')
      .order('created_at', { ascending: false })
      .limit(10)

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError)
    }

    // Transform the reviews data to match our interface
    const transformedReviews = (reviewsData || []).map(review => ({
      ...review,
      author: Array.isArray(review.author) ? review.author[0] : review.author
    }))

    return NextResponse.json({ 
      contractor: contractorData,
      reviews: transformedReviews
    })
  } catch (error) {
    console.error('Error in contractors by-slug API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
