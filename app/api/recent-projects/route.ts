import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get recent projects - only "Open for Proposals" status and admin approved projects
    const { data: recentProjectsData, error: recentError } = await supabase
      .from("projects")
      .select(`
        id,
        project_title,
        statement_of_work,
        budget,
        category,
        location,
        project_type,
        status,
        start_date,
        end_date,
        substantial_completion,
        project_photos,
        after_photo,
        slug,
        creator,
        created_at,
        homeowner:users!creator(
          id,
          full_name,
          profile_photo
        )
      `)
      .eq("status", "Open for Proposals")
      .eq("visibility_settings", "Public To Marketplace")
      .eq("title_awarded", true)
      .not("location", "is", null)
      .order("created_at", { ascending: false })
      .limit(12);

    if (recentError) {
      return NextResponse.json({ error: recentError.message }, { status: 500 })
    }

    if (!recentProjectsData || recentProjectsData.length === 0) {
      return NextResponse.json({ projects: [] })
    }

    // Get contractor data and reviews for each recent project
    const processedRecentProjects = await Promise.all(
      (recentProjectsData || []).map(async (project) => {
        // Get the selected proposal for this project (if any)
        const { data: proposal, error: proposalError } = await supabase
          .from("proposals")
          .select("contractor")
          .eq("project", project.id)
          .eq("is_selected", "yes")
          .single();

        let contractor = null;
        let averageRating = 0;
        let reviewCount = 0;

        if (!proposalError && proposal?.contractor) {
          // Get contractor user data
          const { data: contractorUser, error: contractorError } = await supabase
            .from("users")
            .select("id, full_name, profile_photo")
            .eq("id", proposal.contractor)
            .single();

          if (!contractorError && contractorUser) {
            contractor = {
              id: contractorUser.id,
              full_name: contractorUser.full_name,
              profile_photo: contractorUser.profile_photo,
            };

            // Get reviews for this project to calculate average rating
            const { data: reviews, error: reviewsError } = await supabase
              .from("reviews")
              .select("rating")
              .eq("project", project.id)
              .eq("is_verified", "yes");

            if (!reviewsError && reviews && reviews.length > 0) {
              const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
              averageRating = totalRating / reviews.length;
              reviewCount = reviews.length;
            }
          }
        }

        return {
          ...project,
          contractor,
          averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
          reviewCount,
        };
      })
    );

    return NextResponse.json({ projects: processedRecentProjects })
    
  } catch (error) {
    console.error('Error fetching recent projects:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
