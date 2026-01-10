import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get reviews for the project with author and recipient details
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
        author_user:users!author(
          id,
          full_name,
          profile_photo
        ),
        recipient_user:users!recipient(
          id,
          full_name,
          profile_photo
        )
      `)
      .eq('project', projectId)
      .eq('flagged', 'no') // Only show non-flagged reviews
      .order('created_at', { ascending: false })

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError)
      return NextResponse.json({ 
        error: 'Failed to fetch reviews' 
      }, { status: 500 })
    }

    // Get project details to include before/after photos if consent is given
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, project_title, project_photos, after_photo')
      .eq('id', projectId)
      .single()

    if (projectError) {
      console.error('Error fetching project:', projectError)
      return NextResponse.json({ 
        error: 'Failed to fetch project details' 
      }, { status: 500 })
    }

    // Process reviews to include photos only if consent is given
    const processedReviews = reviews?.map(review => {
      const reviewData = {
        ...review,
        // Only include before/after photos if homeowner gave consent
        projectPhotos: review.homeowner_consent_for_photos ? {
          before: project.project_photos && project.project_photos.length > 0 ? project.project_photos[0] : null,
          after: project.after_photo
        } : null
      }
      
      // Remove consent fields from public response for privacy
      delete reviewData.homeowner_consent_for_photos
      delete reviewData.consent_given_at
      delete reviewData.consent_given_by
      
      return reviewData
    }) || []

    return NextResponse.json({ 
      reviews: processedReviews,
      project: {
        id: project.id,
        project_title: project.project_title
      }
    })

  } catch (error) {
    console.error('Error in get project reviews API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
