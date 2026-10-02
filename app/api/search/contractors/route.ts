import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    console.log('Contractor Search API called');
    const { searchParams } = new URL(request.url);
    
    const location = searchParams.get('location');
    const limit = parseInt(searchParams.get('limit') || '12');

    console.log('Search params:', { location, limit });

    const supabase = createAdminClient();
    console.log('Supabase client created');

    // Note: Supabase PostgREST does NOT support .eq() on joined-table columns
    // (e.g. "users.is_active") — those filters are silently ignored.
    // We only filter on contractor_profiles columns and use is_admin_verified as the gate.
    let query = supabase
      .from("contractor_profiles")
      .select(`
        *,
        users!user_id (
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
          is_active,
          created_at
        )
      `)
      .eq("is_admin_verified", true);

    // Location filter — applied when the user types a search term
    if (location) {
      query = query.or(
        `address->city.ilike.%${location}%,` +
        `address->province.ilike.%${location}%,` +
        `address->address.ilike.%${location}%,` +
        `address->country.ilike.%${location}%,` +
        `business_name.ilike.%${location}%,` +
        `service_location.ilike.%${location}%`
      );
    }
    // No country restriction on default load — show all verified contractors

    // Get the data
    console.log('Executing query...');
    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(limit);

    console.log('Query result:', { data: data?.length, error });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch contractors", details: error.message },
        { status: 500 }
      );
    }

    // Transform data and calculate ratings for each contractor
    const transformedData = await Promise.all(
      (data || []).map(async (contractor) => {
        const { data: reviews, error: reviewsError } = await supabase
          .from("reviews")
          .select("rating")
          .eq("recipient", contractor.user_id)
          .eq("is_verified", "yes");

        let averageRating = 0;
        let ratingCount = 0;

        if (!reviewsError && reviews && reviews.length > 0) {
          const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
          averageRating = totalRating / reviews.length;
          ratingCount = reviews.length;
        }

        return {
          ...contractor.users,
          created_at: contractor.created_at,
          contractor_profile: contractor,
          slug: contractor.slug,
          average_rating: Math.round(averageRating * 10) / 10,
          rating_count: ratingCount,
        };
      })
    );

    console.log('Returning contractors:', transformedData?.length || 0);
    return NextResponse.json({
      contractors: transformedData || []
    });

  } catch (error) {
    console.error("Contractor Search API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
