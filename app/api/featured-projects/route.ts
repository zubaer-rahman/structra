import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = createAdminClient()
    
    // 1. Get featured projects (admin selected)
    let { data: projectsData, error: projectsError } = await supabase
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
        title_awarded,
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
      .order("created_at", { ascending: false })
      .limit(12);

    if (projectsError) {
      console.error("Error fetching featured projects:", projectsError)
    }

    // 2. Fallback: If no featured projects exist, fetch active public projects
    if (!projectsData || projectsData.length === 0) {
      const { data: fallbackProjects, error: fallbackError } = await supabase
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
          title_awarded,
          slug,
          creator,
          created_at,
          homeowner:users!creator(
            id,
            full_name,
            profile_photo
          )
        `)
        .neq("status", "Draft")
        .order("created_at", { ascending: false })
        .limit(12);

      if (!fallbackError && fallbackProjects) {
        projectsData = fallbackProjects;
      }
    }

    if (!projectsData || projectsData.length === 0) {
      return NextResponse.json({ projects: [] })
    }

    // 3. Process contractor data for each project
    const processedProjects = await Promise.all(
      projectsData.map(async (project) => {
        // Parse location if stored as JSON string
        let parsedLocation = project.location;
        if (typeof project.location === 'string') {
          try {
            parsedLocation = JSON.parse(project.location);
          } catch {
            parsedLocation = null;
          }
        }

        // Get proposal for this project to associate contractor
        const { data: proposal } = await supabase
          .from("proposals")
          .select("contractor_id, contractor, status")
          .or(`project_id.eq.${project.id},project.eq.${project.id}`)
          .in("status", ["accepted", "submitted"])
          .order("status", { ascending: true }) // 'accepted' precedes 'submitted'
          .limit(1)
          .maybeSingle();

        const contractorUserId = proposal?.contractor_id || proposal?.contractor;

        if (!contractorUserId) {
          return {
            ...project,
            location: parsedLocation,
            contractor: null,
            feature_type: 'featured_project' as const
          };
        }

        // Fetch contractor user and profile
        const { data: contractorUser } = await supabase
          .from("users")
          .select("id, full_name, profile_photo")
          .eq("id", contractorUserId)
          .maybeSingle();

        const { data: contractorProfile } = await supabase
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
          .eq("user_id", contractorUserId)
          .maybeSingle();

        return {
          ...project,
          location: parsedLocation,
          contractor: contractorUser ? {
            id: contractorUser.id,
            full_name: contractorUser.full_name || contractorProfile?.business_name || 'Contractor',
            profile_photo: contractorUser.profile_photo || contractorProfile?.logo || '',
            contractor_profile: contractorProfile || undefined
          } : null,
          feature_type: 'featured_project' as const
        };
      })
    );

    return NextResponse.json({ projects: processedProjects })
  } catch (error) {
    console.error('Error fetching featured projects:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
