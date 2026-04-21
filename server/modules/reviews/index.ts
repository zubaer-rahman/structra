import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../../trpc";
import { reviewSchema } from "../../database/schemas/reviews";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const reviewsRouter = router({
  // Get reviews for a specific project (public - no auth required)
  getByProjectPublic: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("reviews")
        .select(`
          id,
          rating,
          text,
          recommend_score,
          created_at,
          author_user:author(id, first_name, last_name, profile_photo),
          recipient_user:recipient(id, first_name, last_name, profile_photo)
        `)
        .eq("project", input.projectId)
        .eq("is_verified", "yes")
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch reviews: ${error.message}`);
      }

      return data || [];
    }),

  // Get homeowner reviews for a specific project (public - no auth required)
  getHomeownerReviewsByProjectPublic: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("reviews")
        .select(`
          id,
          rating,
          text,
          recommend_score,
          created_at,
          author_user:author(id, first_name, last_name, profile_photo, user_role),
          recipient_user:recipient(id, first_name, last_name, profile_photo, user_role)
        `)
        .eq("project", input.projectId)
        .eq("is_verified", "yes")
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch homeowner reviews: ${error.message}`);
      }

      // Filter to only include reviews where the author is a homeowner
      const homeownerReviews = (data || []).filter(review => 
        review.author_user && 
        (Array.isArray(review.author_user) ? review.author_user[0] : review.author_user).user_role === 'homeowner'
      );

      return homeownerReviews;
    }),

  // Get contractor reviews about a homeowner for a specific project (public - no auth required)
  getContractorReviewsAboutHomeownerByProjectPublic: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("reviews")
        .select(`
          id,
          rating,
          text,
          recommend_score,
          created_at,
          author_user:author(id, first_name, last_name, profile_photo, user_role),
          recipient_user:recipient(id, first_name, last_name, profile_photo, user_role)
        `)
        .eq("project", input.projectId)
        .eq("is_verified", "yes")
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch contractor reviews about homeowner: ${error.message}`);
      }

      // Filter to only include reviews where the author is a contractor
      const contractorReviews = (data || []).filter(review => 
        review.author_user && 
        (Array.isArray(review.author_user) ? review.author_user[0] : review.author_user).user_role === 'contractor'
      );

      return contractorReviews;
    }),

  // Get reviews for a specific project (protected - full data)
  getByProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("reviews")
        .select(`
          *,
          author_user:author(id, first_name, last_name, email, profile_photo),
          recipient_user:recipient(id, first_name, last_name, email, profile_photo)
        `)
        .eq("project", input.projectId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch reviews: ${error.message}`);
      }

      return data || [];
    }),

  // Get reviews by a specific user (for profile pages)
  getByUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("reviews")
        .select(`
          *,
          author_user:author(id, first_name, last_name, email, profile_photo),
          recipient_user:recipient(id, first_name, last_name, email, profile_photo),
          project_details:project(id, project_title, status)
        `)
        .eq("recipient", input.userId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch user reviews: ${error.message}`);
      }

      return data || [];
    }),

  // Get reviews for a specific contractor (public - no auth required)
  getByContractorPublic: publicProcedure
    .input(z.object({ contractorId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("reviews")
        .select(`
          id,
          rating,
          text,
          recommend_score,
          created_at,
          author_user:author(id, first_name, last_name, profile_photo),
          recipient_user:recipient(id, first_name, last_name, profile_photo),
          project_details:project(id, project_title, status)
        `)
        .eq("recipient", input.contractorId)
        .eq("is_verified", "yes")
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch contractor reviews: ${error.message}`);
      }

      return data || [];
    }),

  // Get reviews for a specific contractor (protected - full data)
  getByContractor: protectedProcedure
    .input(z.object({ contractorId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("reviews")
        .select(`
          *,
          author_user:author(id, first_name, last_name, email, profile_photo),
          recipient_user:recipient(id, first_name, last_name, email, profile_photo),
          project_details:project(id, project_title, status)
        `)
        .eq("recipient", input.contractorId)
        .eq("is_verified", "yes")
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch contractor reviews: ${error.message}`);
      }

      return data || [];
    }),

  // Create a new review
  create: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        recipientId: z.string(),
        rating: z.number().min(1).max(5),
        recommend_score: z.number().min(0).max(10),
        text: z.string().min(1),
        file: z.array(z.any()).optional().default([]),
        homeownerConsentForPhotos: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the user is part of the project
      const { data: project, error: projectError } = await ctx.supabase
        .from("projects")
        .select("id, creator, status")
        .eq("id", input.projectId)
        .single();

      if (projectError || !project) {
        throw new Error("Project not found");
      }

      // Check if project is completed
      if (project.status !== "Completed") {
        throw new Error("Reviews can only be submitted for completed projects");
      }

      // Get the accepted proposal to find the contractor
      const { data: acceptedProposal, error: proposalError } = await ctx.supabase
        .from("proposals")
        .select("contractor")
        .eq("project", input.projectId)
        .eq("status", "accepted")
        .single();

      if (proposalError || !acceptedProposal) {
        throw new Error("No accepted proposal found for this project");
      }

      // Verify the user is either the homeowner or contractor for this project
      const isHomeowner = project.creator === ctx.user.id;
      const isContractor = acceptedProposal.contractor === ctx.user.id;

      if (!isHomeowner && !isContractor) {
        throw new Error("You can only review projects you're involved in");
      }

      // Verify the recipient is the other party
      const expectedRecipient = isHomeowner ? acceptedProposal.contractor : project.creator;
      if (expectedRecipient !== input.recipientId) {
        throw new Error("Invalid recipient for this review");
      }

      // Check if user has already reviewed this project
      const { data: existingReview, error: checkError } = await ctx.supabase
        .from("reviews")
        .select("id")
        .eq("project", input.projectId)
        .eq("author", ctx.user.id)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw new Error(`Failed to check existing review: ${checkError.message}`);
      }

      if (existingReview) {
        throw new Error("You have already submitted a review for this project");
      }

      // Handle consent fields
      let consentGivenAt = null;
      let consentGivenBy = null;

      if (input.homeownerConsentForPhotos) {
        if (!isHomeowner) {
          throw new Error("Only homeowners can give consent for photo usage");
        }
        
        // Check if project has before and after photos
        const { data: projectWithPhotos, error: photosError } = await ctx.supabase
          .from("projects")
          .select("project_photos, after_photo")
          .eq("id", input.projectId)
          .single();

        if (photosError || !projectWithPhotos) {
          throw new Error("Project not found");
        }

        if (!projectWithPhotos.project_photos || projectWithPhotos.project_photos.length === 0 || !projectWithPhotos.after_photo) {
          throw new Error("Project must have before and after photos to give consent for photo usage");
        }

        consentGivenAt = new Date().toISOString();
        consentGivenBy = ctx.user.id;
      }

      // Create the review
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !serviceRoleKey) {
        throw new Error("Server is missing Supabase service role configuration");
      }

      const adminSupabase = createSupabaseClient(supabaseUrl, serviceRoleKey);

      const { data, error } = await adminSupabase
        .from("reviews")
        .insert({
          author: ctx.user.id,
          recipient: input.recipientId,
          project: input.projectId,
          rating: input.rating,
          recommend_score: input.recommend_score,
          text: input.text,
          flagged: "no",
          is_verified: "yes", // Since they're part of the project
          file: input.file || [],
          homeowner_consent_for_photos: input.homeownerConsentForPhotos || false,
          consent_given_at: consentGivenAt,
          consent_given_by: consentGivenBy,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create review: ${error.message}`);
      }

      return data;
    }),

  // Update a review (only by the author)
  update: protectedProcedure
    .input(
      z.object({
        reviewId: z.string(),
        rating: z.number().min(1).max(5).optional(),
        recommend_score: z.number().min(0).max(10).optional(),
        text: z.string().min(1).optional(),
        file: z.array(z.any()).optional(),
        homeownerConsentForPhotos: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { reviewId, homeownerConsentForPhotos, ...updateData } = input;

      // Verify the user is the author of the review
      const { data: review, error: checkError } = await ctx.supabase
        .from("reviews")
        .select("author, project")
        .eq("id", reviewId)
        .single();

      if (checkError || !review) {
        throw new Error("Review not found");
      }

      if (review.author !== ctx.user.id) {
        throw new Error("You can only update your own reviews");
      }

      // Handle consent fields if provided
      let consentGivenAt = null;
      let consentGivenBy = null;

      if (homeownerConsentForPhotos !== undefined) {
        // Get project details to check if user is homeowner
        const { data: project, error: projectError } = await ctx.supabase
          .from("projects")
          .select("creator, project_photos, after_photo")
          .eq("id", review.project)
          .single();

        if (projectError || !project) {
          throw new Error("Project not found");
        }

        const isHomeowner = project.creator === ctx.user.id;

        if (homeownerConsentForPhotos) {
          if (!isHomeowner) {
            throw new Error("Only homeowners can give consent for photo usage");
          }
          
          if (!project.project_photos || project.project_photos.length === 0 || !project.after_photo) {
            throw new Error("Project must have before and after photos to give consent for photo usage");
          }

          consentGivenAt = new Date().toISOString();
          consentGivenBy = ctx.user.id;
        }
      }

      // Prepare update data
      const finalUpdateData = {
        ...updateData,
        ...(homeownerConsentForPhotos !== undefined && {
          homeowner_consent_for_photos: homeownerConsentForPhotos,
          consent_given_at: consentGivenAt,
          consent_given_by: consentGivenBy,
        }),
      };

      const { data, error } = await ctx.supabase
        .from("reviews")
        .update(finalUpdateData)
        .eq("id", reviewId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update review: ${error.message}`);
      }

      return data;
    }),

  // Delete a review (only by the author)
  delete: protectedProcedure
    .input(z.object({ reviewId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify the user is the author of the review
      const { data: review, error: checkError } = await ctx.supabase
        .from("reviews")
        .select("author")
        .eq("id", input.reviewId)
        .single();

      if (checkError || !review) {
        throw new Error("Review not found");
      }

      if (review.author !== ctx.user.id) {
        throw new Error("You can only delete your own reviews");
      }

      const { error } = await ctx.supabase
        .from("reviews")
        .delete()
        .eq("id", input.reviewId);

      if (error) {
        throw new Error(`Failed to delete review: ${error.message}`);
      }

      return { success: true };
    }),

  // Flag a review for moderation
  flag: protectedProcedure
    .input(z.object({ reviewId: z.string(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("reviews")
        .update({ flagged: "yes" })
        .eq("id", input.reviewId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to flag review: ${error.message}`);
      }

      return data;
    }),
});
