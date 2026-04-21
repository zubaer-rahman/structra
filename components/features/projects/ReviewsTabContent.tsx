"use client";

import { useState } from "react";
import Image from "next/image";
import { Project } from "@/server/database/interfaces";
import { User } from "@/server/database/interfaces/auth";
import { USER_ROLES, PROPOSAL_STATUSES } from "@/utils/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, MessageSquare, Camera, Edit, Save, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/utils/trpc";

interface Review {
  id: string;
  author: string;
  recipient: string;
  project: string;
  rating: number;
  recommend_score: number;
  text: string;
  flagged: "yes" | "no";
  is_verified: "yes" | "no";
  file: unknown[];
  homeowner_consent_for_photos?: boolean;
  consent_given_at?: string;
  consent_given_by?: string;
  created_at: string;
  updated_at: string;
  author_user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    profile_photo?: string;
  };
  recipient_user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    profile_photo?: string;
  };
}

interface ReviewsTabContentProps {
  project: Project;
  user: User;
  userRole: (typeof USER_ROLES)[keyof typeof USER_ROLES];
}

export default function ReviewsTabContent({
  project,
  user,
  userRole,
}: ReviewsTabContentProps) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [newReview, setNewReview] = useState({
    rating: 5,
    recommend_score: 10,
    text: "",
    homeownerConsentForPhotos: false,
  });

  // Fetch reviews using tRPC
  const { data: reviews = [], isLoading: loading, refetch: fetchReviews } = trpc.reviews.getByProject.useQuery({
    projectId: project.id,
  });

  // Create review mutation
  const createReviewMutation = trpc.reviews.create.useMutation({
    onSuccess: () => {
      toast.success("🎉 Review submitted successfully! Thank you for your feedback.");
      setNewReview({ rating: 5, recommend_score: 10, text: "", homeownerConsentForPhotos: false });
      setShowReviewForm(false);
      fetchReviews();
    },
    onError: (error) => {
      console.error("Error submitting review:", error);
      toast.error(error.message || "Failed to submit review");
    },
  });

  // Update review mutation
  const updateReviewMutation = trpc.reviews.update.useMutation({
    onSuccess: () => {
      toast.success("Review updated successfully!");
      setEditingReviewId(null);
      setNewReview({ rating: 5, recommend_score: 10, text: "", homeownerConsentForPhotos: false });
      fetchReviews();
    },
    onError: (error) => {
      console.error("Error updating review:", error);
      toast.error(error.message || "Failed to update review");
    },
  });

  // Get accepted proposal to find contractor ID
  const { data: proposals } = trpc.proposals.getByProject.useQuery({
    projectId: project.id,
  });

  // Find the accepted proposal
  const acceptedProposal = proposals?.find(proposal => proposal.status === PROPOSAL_STATUSES.ACCEPTED);

  // Determine who the user should review
  const getReviewTarget = (): string | null => {
    if (userRole === USER_ROLES.HOMEOWNER) {
      // Homeowner reviews the contractor
      // Handle both cases: contractor as string ID or contractor as object
      if (typeof acceptedProposal?.contractor === 'string') {
        return acceptedProposal.contractor;
      } else if (acceptedProposal?.contractor && typeof acceptedProposal.contractor === 'object') {
        return acceptedProposal.contractor.id || null;
      }
      return null;
    } else if (userRole === USER_ROLES.CONTRACTOR) {
      // Contractor reviews the homeowner
      return project.creator || null;
    }
    return null;
  };

  const reviewTarget = getReviewTarget();

  const handleSubmitReview = async () => {
    if (!reviewTarget || !newReview.text.trim()) {
      toast.error("Please provide review text");
      return;
    }

    // Validate recipientId is a valid string
    if (typeof reviewTarget !== 'string' || reviewTarget.trim() === '') {
      toast.error("Unable to determine who to review. Please try again later.");
      return;
    }

    createReviewMutation.mutate({
      projectId: project.id,
      recipientId: reviewTarget,
      rating: newReview.rating,
      recommend_score: newReview.recommend_score,
      text: newReview.text.trim(),
      file: [],
      homeownerConsentForPhotos: userRole === USER_ROLES.HOMEOWNER ? newReview.homeownerConsentForPhotos : false,
    });
  };

  const handleEditReview = (review: Review) => {
    setEditingReviewId(review.id);
    setNewReview({
      rating: review.rating,
      recommend_score: review.recommend_score,
      text: review.text,
      homeownerConsentForPhotos: review.homeowner_consent_for_photos || false,
    });
  };

  const handleUpdateReview = async () => {
    if (!editingReviewId || !newReview.text.trim()) {
      toast.error("Please provide review text");
      return;
    }

    updateReviewMutation.mutate({
      reviewId: editingReviewId,
      rating: newReview.rating,
      recommend_score: newReview.recommend_score,
      text: newReview.text.trim(),
      homeownerConsentForPhotos: userRole === USER_ROLES.HOMEOWNER ? newReview.homeownerConsentForPhotos : undefined,
    });
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setNewReview({ rating: 5, recommend_score: 10, text: "", homeownerConsentForPhotos: false });
  };

  const hasUserReviewed = reviews.some(review => review.author === user.id);

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onRatingChange?.(star)}
            disabled={!interactive}
            className={`${
              interactive ? "cursor-pointer hover:scale-110" : "cursor-default"
            } transition-transform`}
          >
            <Star
              className={`w-5 h-5 ${
                star <= rating
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const renderRecommendScore = (score: number) => {
    const getScoreColor = (score: number) => {
      if (score >= 9) return "text-green-600 bg-green-100";
      if (score >= 7) return "text-yellow-600 bg-yellow-100";
      if (score >= 5) return "text-orange-600 bg-orange-100";
      return "text-red-600 bg-red-100";
    };

    return (
      <Badge className={`${getScoreColor(score)} border-0`}>
        {score}/10
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Project Reviews</h2>
          <p className="text-gray-600 mt-1">
            Reviews and feedback exchanged between project participants
          </p>
          <div className="mt-2 text-sm text-gray-500">
            <span className="font-medium">Project:</span> {project.project_title} • 
            <span className="font-medium ml-1">Status:</span> {project.status}
          </div>
        </div>
        
        {/* Add Review Button - only show if user hasn't reviewed yet and project is completed and we have a valid review target */}
        {!hasUserReviewed && project.status === "Completed" && reviewTarget && (
          <Button
            onClick={() => setShowReviewForm(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Write Review
          </Button>
        )}
        
        {/* Show message when no valid review target */}
        {!hasUserReviewed && project.status === "Completed" && !reviewTarget && (
          <div className="text-sm text-gray-500 italic">
            Unable to determine review target. Please ensure the project has an accepted proposal.
          </div>
        )}
      </div>

      {/* Review Form Modal */}
      {(showReviewForm || editingReviewId) && (
        <Card className="border-2 border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingReviewId ? "Edit Review" : "Write a Review"}
            </CardTitle>
            <div className="text-sm text-gray-600 mt-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  {user?.full_name || user?.email}
                </span>
                <span>reviewing</span>
                <span className="font-medium text-gray-900">
                  {reviewTarget ? 
                    (userRole === USER_ROLES.HOMEOWNER ? 
                      acceptedProposal?.contractor_profile?.full_name || 'Contractor' : 
                      project.homeowner?.full_name || 'Homeowner'
                    ) : 
                    'Unknown'
                  }
                </span>
                <Badge variant="outline" className="text-xs">
                  {userRole === USER_ROLES.HOMEOWNER ? 'Homeowner' : 'Contractor'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="rating" className="text-sm font-medium">
                Overall Rating
              </Label>
              <div className="mt-2">
                {renderStars(newReview.rating, true, (rating) =>
                  setNewReview(prev => ({ ...prev, rating }))
                )}
                <span className="ml-2 text-sm text-gray-600">
                  {newReview.rating} out of 5 stars
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="recommend_score" className="text-sm font-medium">
                Would you recommend this {userRole === USER_ROLES.HOMEOWNER ? "contractor" : "homeowner"} to others? (0-10)
              </Label>
              <div className="mt-2">
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={newReview.recommend_score}
                  onChange={(e) =>
                    setNewReview(prev => ({
                      ...prev,
                      recommend_score: parseInt(e.target.value)
                    }))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Not at all likely</span>
                  <span className="font-medium">{newReview.recommend_score}/10</span>
                  <span>Extremely likely</span>
                </div>
              </div>
            </div>

            {/* Photo Consent Section - Only for Homeowners */}
            {userRole === USER_ROLES.HOMEOWNER && project.project_photos && project.project_photos.length > 0 && project.after_photo && (
              <div className="space-y-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Photo Usage Consent
                </h3>
                
                <div className="space-y-2">
                  <p className="text-sm text-blue-800">
                    Do you consent to include the before/after pictures of the Area of Work in the review and on the contractor's profile?
                  </p>
                  
                  <div className="space-y-1">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="consent"
                        value="yes"
                        checked={newReview.homeownerConsentForPhotos === true}
                        onChange={() => setNewReview(prev => ({ ...prev, homeownerConsentForPhotos: true }))}
                        className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                        disabled={createReviewMutation.isPending}
                      />
                      <span className="text-sm text-blue-800 font-medium">Yes</span>
                    </label>
                    
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="consent"
                        value="no"
                        checked={newReview.homeownerConsentForPhotos === false}
                        onChange={() => setNewReview(prev => ({ ...prev, homeownerConsentForPhotos: false }))}
                        className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                        disabled={createReviewMutation.isPending}
                      />
                      <span className="text-sm text-blue-800 font-medium">No</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="text" className="text-sm font-medium">
                Your Review
              </Label>
              <Textarea
                id="text"
                placeholder={`Share your experience working with this ${userRole === USER_ROLES.HOMEOWNER ? "contractor" : "homeowner"}...`}
                value={newReview.text}
                onChange={(e) =>
                  setNewReview(prev => ({ ...prev, text: e.target.value }))
                }
                className="mt-2"
                rows={4}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={editingReviewId ? handleUpdateReview : handleSubmitReview}
                disabled={(createReviewMutation.isPending || updateReviewMutation.isPending) || !newReview.text.trim()}
                className="bg-orange-500 hover:bg-orange-600 text-white"
                type="button"
              >
                {editingReviewId ? (
                  updateReviewMutation.isPending ? "Updating..." : "Update Review"
                ) : (
                  createReviewMutation.isPending ? "Submitting..." : "Submit Review"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={editingReviewId ? handleCancelEdit : () => setShowReviewForm(false)}
                disabled={createReviewMutation.isPending || updateReviewMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      {reviews.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <MessageSquare className="w-4 h-4" />
            <span className="font-medium">
              {reviews.length} review{reviews.length !== 1 ? 's' : ''} from project participants
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Reviews are exchanged between homeowners and contractors after project completion
          </p>
        </div>
      )}
      
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
            <p className="text-gray-600">
              {project.status === "Completed" 
                ? "Be the first to review this project!"
                : "Reviews will be available once the project is completed."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="border border-gray-200">
              {editingReviewId === review.id ? (
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading edit form...</p>
                  </div>
                </CardContent>
              ) : (
                <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      {review.author_user?.profile_photo ? (
                        <Image
                          src={review.author_user.profile_photo}
                          alt={`${review.author_user.first_name} ${review.author_user.last_name}`}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to initials if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `<div class="w-full h-full bg-orange-100 rounded-full flex items-center justify-center"><span class="text-orange-600 font-medium text-sm">${review.author_user?.first_name?.[0] || "U"}</span></div>`;
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-orange-600 font-medium text-sm">
                            {review.author_user?.first_name?.[0] || "U"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">
                          {review.author_user?.first_name} {review.author_user?.last_name}
                        </h4>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {/* Review Relationship Indicator */}
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-gray-900">
                            {review.author_user?.first_name} {review.author_user?.last_name}
                          </span>
                          <span className="text-gray-500">reviewed</span>
                          <span className="font-medium text-gray-900">
                            {review.recipient_user?.first_name} {review.recipient_user?.last_name}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {review.author_user?.first_name === project.creator ? 'Homeowner' : 'Contractor'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {review.is_verified === "yes" && (
                      <Badge variant="secondary" className="text-green-600 bg-green-100">
                        Verified
                      </Badge>
                    )}
                    {review.homeowner_consent_for_photos && (
                      <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">
                        <Camera className="h-3 w-3 mr-1" />
                        Photo Consent
                      </Badge>
                    )}
                    {review.flagged === "yes" && (
                      <Badge variant="destructive">Flagged</Badge>
                    )}
                    {review.author === user.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditReview(review)}
                        className="h-6 px-2 text-xs"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Rating Section */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">Overall Rating:</span>
                          {renderStars(review.rating)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">Recommendation:</span>
                          {renderRecommendScore(review.recommend_score)}
                        </div>
                      </div>
                      <div className="text-xs text-gray-600">
                        {review.recommend_score >= 9 ? 'Highly Recommended' : 
                         review.recommend_score >= 7 ? 'Recommended' : 
                         review.recommend_score >= 5 ? 'Neutral' : 'Not Recommended'}
                      </div>
                    </div>
                  </div>


                  {/* Review Text */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Review:</h5>
                    <p className="text-gray-700 leading-relaxed bg-white border rounded-lg p-3">
                      {review.text}
                    </p>
                  </div>
                </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
