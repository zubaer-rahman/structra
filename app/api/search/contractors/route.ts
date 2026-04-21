import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    console.log('Contractor Search API called');
    const { searchParams } = new URL(request.url);
    
    const location = searchParams.get('location');
    const limit = parseInt(searchParams.get('limit') || '12');

    console.log('Search params:', { location, limit });

    const supabase = await createClient();
    console.log('Supabase client created');

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
      .eq("users.user_role", "contractor")
      .eq("users.is_active", true)
      .eq("users.is_verified_contractor", true)
      .eq("is_admin_verified", true);

    // Apply filters
    if (location) {
      // When searching for a specific location, search across all countries
      // Use a more robust location search that includes country field
      query = query.or(`address->>city.ilike.%${location}%,address->>province.ilike.%${location}%,address->>address.ilike.%${location}%,address->>country.ilike.%${location}%,business_name.ilike.%${location}%`);
    } else {
      // Default to Canada when no specific location is provided
      query = query.eq("address->>country", "Canada");
    }

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
        // Get reviews for this contractor to calculate average rating
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
          ...contractor.users, // User data as main object
          created_at: contractor.created_at, // Use contractor profile's created_at for joined date
          contractor_profile: contractor, // Profile data nested
          slug: contractor.slug, // Add slug to the main object for easy access
          average_rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
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
