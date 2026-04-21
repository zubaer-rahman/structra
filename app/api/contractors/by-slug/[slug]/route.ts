import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isValidSlug } from '@/utils/helpers/slugUtils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Validate slug format
    if (!isValidSlug(slug)) {
      return NextResponse.json(
        { error: 'Invalid slug format' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch contractor profile with user data by slug
    const { data: contractorData, error: contractorError } = await supabase
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
      .single()

    if (contractorError) {
      console.error('Error fetching contractor by slug:', contractorError)
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
