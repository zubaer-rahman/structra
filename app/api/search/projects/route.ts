import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const location = searchParams.get('location');
    const projectType = searchParams.get('projectType');

    const supabase = await createClient();

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
      .eq("visibility_settings", "Public To Marketplace");

    // Only apply location filter when user actively searches for a location
    if (location && location.trim() !== '' && location.toLowerCase() !== 'canada') {
      query = query.or(
        `location->>city.ilike.%${location}%,location->>province.ilike.%${location}%,location->>address.ilike.%${location}%,location->>country.ilike.%${location}%`
      );
    }
    // No location filter when browsing all — show all public open projects regardless of country

    if (projectType) {
      query = query.eq("project_type", projectType);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Search API database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch projects", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ projects: data || [] });

  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
