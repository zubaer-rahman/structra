import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get featured projects (admin selected) - only admin approved projects
    const { data: featuredProjectsData, error: featuredError } = await supabase
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
        is_featured_project,
        slug,
        creator,
        created_at,
        homeowner:users!creator(
          id,
          full_name,
          profile_photo
        )
      `)
      .eq("is_featured_project", true)
      .eq("status", "Completed")
      .eq("title_awarded", true)
      .not("location", "is", null)
      .order("substantial_completion", { ascending: false })
      .limit(12);

    if (featuredError) {
      return NextResponse.json({ error: featuredError.message }, { status: 500 })
    }

    if (!featuredProjectsData || featuredProjectsData.length === 0) {
      return NextResponse.json({ projects: [] })
    }

    // Get contractor data for each featured project
    const processedFeaturedProjects = await Promise.all(
      (featuredProjectsData || []).map(async (project) => {
        // Get the selected proposal for this project
        const { data: proposal, error: proposalError } = await supabase
          .from("proposals")
          .select("contractor")
          .eq("project", project.id)
          .eq("is_selected", "yes")
          .single();

        if (proposalError || !proposal?.contractor) {
          return {
            ...project,
            contractor: null,
            feature_type: 'featured_project' as const
          };
        }

        // Get contractor user data
        const { data: contractorUser, error: contractorError } = await supabase
          .from("users")
          .select("id, full_name, profile_photo")
          .eq("id", proposal.contractor)
          .single();

        // Get contractor profile data
        const { data: contractorProfile, error: profileError } = await supabase
          .from("contractor_profiles")
          .select(`
            id,
            business_name,
            logo,
            featured_contractor_expiry,
            bio,
            trade_category,
            service_location,
            work_guarantee,
            work_guarantee_statement,
            portfolio,
            address
          `)
          .eq("user_id", proposal.contractor)
          .single();

        if (contractorError || !contractorUser) {
          return {
            ...project,
            contractor: null,
            feature_type: 'featured_project' as const
          };
        }

        return {
          ...project,
          contractor: {
            id: contractorUser.id,
            full_name: contractorUser.full_name,
            profile_photo: contractorUser.profile_photo,
            contractor_profile: contractorProfile
          },
          feature_type: 'featured_project' as const
        };
      })
    );

    // Ensure contractor data is properly structured
    const finalProjects = processedFeaturedProjects.map(project => ({
      ...project,
      contractor: project.contractor ? {
        id: project.contractor.id,
        full_name: project.contractor.full_name || 'Unknown Contractor',
        profile_photo: project.contractor.profile_photo,
        contractor_profile: project.contractor.contractor_profile
      } : null,
      slug: project.slug
    }));

    return NextResponse.json({ projects: finalProjects })
    
  } catch (error) {
    console.error('Error fetching featured projects:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
