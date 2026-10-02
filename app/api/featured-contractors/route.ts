import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = createAdminClient()

    // 1. First fetch contractors marked as featured
    let { data: contractorsData, error } = await supabase
      .from("contractor_profiles")
      .select(`
        id,
        user_id,
        business_name,
        logo,
        bio,
        trade_category,
        service_location,
        work_guarantee,
        work_guarantee_statement,
        address,
        slug,
        is_featured_contractor,
        created_at,
        users!user_id (
          id,
          full_name,
          first_name,
          last_name,
          email,
          phone_number,
          profile_photo,
          user_role,
          is_verified_contractor,
          is_active,
          created_at
        )
      `)
      .eq("is_featured_contractor", true)
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) {
      console.error("Error fetching featured contractors:", error)
    }

    // 2. Fallback: If no featured contractors found or fewer than 3, fetch active verified contractors
    if (!contractorsData || contractorsData.length === 0) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("contractor_profiles")
        .select(`
          id,
          user_id,
          business_name,
          logo,
          bio,
          trade_category,
          service_location,
          work_guarantee,
          work_guarantee_statement,
          address,
          slug,
          is_featured_contractor,
          created_at,
          users!user_id (
            id,
            full_name,
            first_name,
            last_name,
            email,
            phone_number,
            profile_photo,
            user_role,
            is_verified_contractor,
            is_active,
            created_at
          )
        `)
        .order("created_at", { ascending: false })
        .limit(12);

      if (!fallbackError && fallbackData) {
        contractorsData = fallbackData;
      }
    }

    if (!contractorsData || contractorsData.length === 0) {
      return NextResponse.json({ contractors: [] })
    }

    // 3. Process contractor ratings and structure
    const transformedContractors = await Promise.all(
      contractorsData.map(async (contractor) => {
        const userObj = Array.isArray(contractor.users) ? contractor.users[0] : contractor.users;

        // Fetch reviews to calculate average rating
        const { data: reviews, error: reviewsError } = await supabase
          .from("reviews")
          .select("rating")
          .eq("recipient", contractor.user_id)
          .eq("is_verified", "yes");

        let averageRating = 0;
        let ratingCount = 0;

        if (!reviewsError && reviews && reviews.length > 0) {
          const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
          averageRating = Math.round((totalRating / reviews.length) * 10) / 10;
          ratingCount = reviews.length;
        }

        return {
          id: userObj?.id || contractor.user_id,
          full_name: userObj?.full_name || contractor.business_name || 'Master Builder',
          first_name: userObj?.first_name || '',
          last_name: userObj?.last_name || '',
          email: userObj?.email || '',
          phone_number: userObj?.phone_number || '',
          profile_photo: userObj?.profile_photo || contractor.logo || '',
          user_role: 'contractor' as const,
          is_verified_contractor: userObj?.is_verified_contractor ?? true,
          is_active: userObj?.is_active ?? true,
          created_at: contractor.created_at,
          contractor_profile: contractor,
          slug: contractor.slug,
          average_rating: averageRating,
          rating_count: ratingCount,
        };
      })
    );

    return NextResponse.json({ contractors: transformedContractors })
  } catch (error) {
    console.error('Error in GET /api/featured-contractors:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
