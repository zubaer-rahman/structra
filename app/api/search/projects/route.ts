import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    console.log('Search API called');
    const { searchParams } = new URL(request.url);
    
    const location = searchParams.get('location');
    const projectType = searchParams.get('projectType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    console.log('Search params:', { location, projectType, page, limit });

    const supabase = await createClient();
    console.log('Supabase client created');

    let query = supabase
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
        created_at,
        project_photos,
        after_photo,
        creator,
        slug,
        homeowner:users!creator(
          id,
          full_name,
          profile_photo
        )
      `)
      .eq("status", "Open for Proposals")
      .eq("visibility_settings", "Public To Marketplace")
      .eq("title_awarded", true);

    // Apply filters
    if (location) {
      // When searching for a specific location, search across all countries
      // Use a more robust location search that includes country field
      query = query.or(`location->>city.ilike.%${location}%,location->>province.ilike.%${location}%,location->>address.ilike.%${location}%,location->>country.ilike.%${location}%`);
    } else {
      // Default to Canada when no specific location is provided (broaden match)
      // Match common variants and case-insensitive values
      query = query.or(
        "location->>country.eq.Canada,location->>country.eq.CA,location->>country.ilike.%canada%"
      );
    }

    if (projectType) {
      query = query.eq("project_type", projectType);
    }

    // Get the data
    console.log('Executing query...');
    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(50);

    console.log('Query result:', { data: data?.length, error });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch projects", details: error.message },
        { status: 500 }
      );
    }

    // If no completed projects found, try to get any public projects
    if (!data || data.length === 0) {
      console.log('No completed projects found, trying to get any public projects...');
      let fallbackQuery = supabase
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
          created_at,
          project_photos,
          after_photo,
          creator,
          homeowner:users!creator(
            id,
            full_name,
            profile_photo
          )
        `)
        .eq("status", "Open for Proposals")
        .eq("visibility_settings", "Public To Marketplace")
        .eq("title_awarded", true);

      if (location) {
        // When searching for a specific location, search across all countries
        // Use a more robust location search that includes country field
        fallbackQuery = fallbackQuery.or(`location->>city.ilike.%${location}%,location->>province.ilike.%${location}%,location->>address.ilike.%${location}%,location->>country.ilike.%${location}%`);
      } else {
        // Default to Canada when no specific location is provided (broaden match)
        fallbackQuery = fallbackQuery.or(
          "location->>country.eq.Canada,location->>country.eq.CA,location->>country.ilike.%canada%"
        );
      }

      if (projectType) {
        fallbackQuery = fallbackQuery.eq("project_type", projectType);
      }

      const { data: fallbackData, error: fallbackError } = await fallbackQuery
        .order("created_at", { ascending: false })
        .limit(50);

      if (fallbackError) {
        console.error("Fallback query error:", fallbackError);
        return NextResponse.json(
          { error: "Failed to fetch projects", details: fallbackError.message },
          { status: 500 }
        );
      }

      console.log('Fallback query result:', fallbackData?.length || 0);
      return NextResponse.json({
        projects: fallbackData || []
      });
    }

    console.log('Returning projects:', data?.length || 0);
    return NextResponse.json({
      projects: data || []
    });

  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
