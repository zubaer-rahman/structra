import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contractorId: string }> }
) {
  try {
    const { contractorId } = await params

    if (!contractorId) {
      return NextResponse.json({ error: 'Contractor ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get reviews where contractor is the recipient
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select(`
        id,
        author,
        recipient,
        rating,
        recommend_score,
        text,
        file,
        homeowner_consent_for_photos,
        consent_given_at,
        consent_given_by,
        flagged,
        is_verified,
        created_at,
        updated_at,
        project:projects(
          id,
          project_title,
          project_photos,
          after_photo
        ),
        author_user:users!author(
          id,
          full_name,
          profile_photo
        )
      `)
      .eq('recipient', contractorId)
      .eq('flagged', 'no') // Only show non-flagged reviews
      .order('created_at', { ascending: false })

    if (reviewsError) {
      console.error('Error fetching contractor reviews:', reviewsError)
      return NextResponse.json({ 
        error: 'Failed to fetch contractor reviews' 
      }, { status: 500 })
    }

    // Process reviews to include before/after photos only if consent is given
    const processedReviews = reviews?.map(review => {
      // Handle case where project might be an array (due to Supabase relationship)
      const project = Array.isArray(review.project) ? review.project[0] : review.project;
      
      const reviewData = {
        id: review.id,
        author: review.author,
        rating: review.rating,
        recommend_score: review.recommend_score,
        text: review.text,
        file: review.file,
        created_at: review.created_at,
        updated_at: review.updated_at,
        author_user: review.author_user,
        project: {
          id: project?.id,
          project_title: project?.project_title,
          // Only include before/after photos if homeowner gave consent
          photos: review.homeowner_consent_for_photos ? {
            before: project?.project_photos && project.project_photos.length > 0 
              ? project.project_photos[0] 
              : null,
            after: project?.after_photo
          } : null
        }
      }
      
      return reviewData
    }) || []

    // Calculate average rating and total count
    const totalReviews = processedReviews.length
    const averageRating = totalReviews > 0 
      ? processedReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0

    const averageRecommendScore = totalReviews > 0
      ? processedReviews.reduce((sum, review) => sum + review.recommend_score, 0) / totalReviews
      : 0

    return NextResponse.json({ 
      reviews: processedReviews,
      stats: {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        averageRecommendScore: Math.round(averageRecommendScore * 10) / 10
      }
    })

  } catch (error) {
    console.error('Error in get contractor reviews API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
