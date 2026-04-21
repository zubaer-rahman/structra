import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { 
      projectId, 
      userId, 
      recipientId, 
      rating, 
      recommendScore, 
      text, 
      homeownerConsentForPhotos,
      files = []
    } = await request.json()

    // Validate required fields
    if (!projectId || !userId || !recipientId || !rating || !recommendScore || !text) {
      return NextResponse.json({ 
        error: 'Missing required fields: projectId, userId, recipientId, rating, recommendScore, text' 
      }, { status: 400 })
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ 
        error: 'Rating must be between 1 and 5' 
      }, { status: 400 })
    }

    // Validate recommend score range
    if (recommendScore < 0 || recommendScore > 10) {
      return NextResponse.json({ 
        error: 'Recommend score must be between 0 and 10' 
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify the project exists and is completed
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, status, creator, after_photo, project_photos')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Only allow reviews for completed projects
    if (project.status !== 'Completed') {
      return NextResponse.json({ 
        error: 'Reviews can only be submitted for completed projects' 
      }, { status: 400 })
    }

    // Resolve proposal used for review authorization.
    // We prefer explicitly selected proposals, but fall back to accepted proposals
    // to support legacy data created before/after workflow changes.
    const { data: proposalCandidates, error: proposalError } = await supabase
      .from('proposals')
      .select('id, contractor, homeowner, status, is_selected, accepted_date, updated_at')
      .eq('project', projectId)
      .or('is_selected.eq.yes,status.eq.accepted')
      .order('accepted_date', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(10)

    const proposal =
      proposalCandidates?.find((candidate) => candidate.is_selected === 'yes') ||
      proposalCandidates?.find((candidate) => candidate.status === 'accepted') ||
      null

    if (proposalError || !proposal) {
      return NextResponse.json({ 
        error: 'No selected or accepted proposal found for this project' 
      }, { status: 404 })
    }

    // Check if user is either the homeowner or contractor
    const isHomeowner = proposal.homeowner === userId
    const isContractor = proposal.contractor === userId

    if (!isHomeowner && !isContractor) {
      return NextResponse.json({ 
        error: 'You can only review projects you are involved in' 
      }, { status: 403 })
    }

    // Determine the recipient (the other party)
    const expectedRecipient = isHomeowner ? proposal.contractor : proposal.homeowner
    if (expectedRecipient !== recipientId) {
      return NextResponse.json({ 
        error: 'Invalid recipient for this review' 
      }, { status: 400 })
    }

    // Check if user has already submitted a review for this project
    const { data: existingReview, error: existingReviewError } = await supabase
      .from('reviews')
      .select('id')
      .eq('project', projectId)
      .eq('author', userId)
      .single()

    if (existingReview && !existingReviewError) {
      return NextResponse.json({ 
        error: 'You have already submitted a review for this project' 
      }, { status: 400 })
    }

    // Validate consent fields if homeowner is giving consent
    let consentGivenAt = null
    let consentGivenBy = null

    if (homeownerConsentForPhotos) {
      if (!isHomeowner) {
        return NextResponse.json({ 
          error: 'Only homeowners can give consent for photo usage' 
        }, { status: 400 })
      }
      
      // Check if project has before and after photos
      if (!project.project_photos || project.project_photos.length === 0 || !project.after_photo) {
        return NextResponse.json({ 
          error: 'Project must have before and after photos to give consent for photo usage' 
        }, { status: 400 })
      }

      consentGivenAt = new Date().toISOString()
      consentGivenBy = userId
    }

    // Create the review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        author: userId,
        recipient: recipientId,
        project: projectId,
        rating,
        recommend_score: recommendScore,
        text,
        file: files,
        homeowner_consent_for_photos: homeownerConsentForPhotos || false,
        consent_given_at: consentGivenAt,
        consent_given_by: consentGivenBy,
        flagged: 'no',
        is_verified: 'yes' // Auto-verify since user is part of the project
      })
      .select()
      .single()

    if (reviewError) {
      console.error('Error creating review:', reviewError)
      return NextResponse.json({ 
        error: 'Failed to create review' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      review,
      message: 'Review submitted successfully' 
    })

  } catch (error) {
    console.error('Error in submit review API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
