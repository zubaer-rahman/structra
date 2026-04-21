export * from "./base";

export * from "./users";

export * from "./contractor_profiles";

export * from "./projects";

export * from "./proposals";

export * from "./communication";

export * from "./project_views";

import { userSchema } from "./users";
import { contractorProfileSchema } from "./contractor_profiles";
import { projectSchema } from "./projects";
import { proposalSchema } from "./proposals";
import { messageSchema } from "./communication";
import { projectViewSchema } from "./project_views";
import { reviewSchema } from "./reviews";
import { subscriptionSchema } from "./subscriptions";
import { transactionSchema } from "./transactions";

export const schemaRegistry = {
  users: userSchema,
  contractor_profiles: contractorProfileSchema,
  projects: projectSchema,
  proposals: proposalSchema,
  reviews: reviewSchema,
  messages: messageSchema,
  project_views: projectViewSchema,
  subscriptions: subscriptionSchema,
  transactions: transactionSchema,
} as const;

export const schemaMetadata = {
  users: {
    tableName: "users",
    description:
      "User profiles and authentication data with verification status",
    indexes: ["email", "user_role", "is_verified_email", "is_active"],
  },
  contractor_profiles: {
    tableName: "contractor_profiles",
    description:
      "Main business profile for contractors with company information, compliance data, and service areas",
    indexes: [
      "user_id",
      "business_name",
      "is_insurance_verified",
      "trade_category",
    ],
  },
  projects: {
    tableName: "projects",
    description: "Homeowner project requests",
    indexes: ["homeowner_id", "status", "category", "location"],
  },
  proposals: {
    tableName: "proposals",
    description: "Contractor project proposals",
    indexes: ["project_id", "contractor_id", "status"],
  },
  reviews: {
    tableName: "reviews",
    description: "Reviews exchanged between homeowners and contractors for completed projects with ratings, recommendations, and verification status",
    indexes: ["author", "recipient", "project", "rating", "flagged", "is_verified"],
  },
  messages: {
    tableName: "messages",
    description: "User communication messages",
    indexes: ["sender_id", "receiver_id", "project_id"],
  },
  project_views: {
    tableName: "project_views",
    description: "Tracks contractor access to project details for visibility control and monetization",
    indexes: ["contractor_id", "project_id", "view_status", "access_method", "is_active"],
  },
  subscriptions: {
    tableName: "subscriptions",
    description: "Represents a contractor's active or past paid access to platform features such as unlimited project views, verified badge, proposal access, or premium placement",
    indexes: ["contractor", "is_active", "tier_level", "start_date", "end_date"],
  },
  transactions: {
    tableName: "transactions",
    description: "Financial transactions for all platform monetization including contractor verification ($400/year), project verification ($29.99), and project PPV ($9.99) with comprehensive Stripe integration",
    indexes: ["user_id", "transaction_type", "status", "amount", "created_at", "stripe_payment_intent_id"],
  },

} as const;

export type {
  User,
  UserUpdate,
  UserCreate,
  UserLogin,
  UserRegistration,
  UserVerification,
  PasswordReset,
  PasswordResetConfirm,
} from "./users";

export type {
  ContractorProfile,
  ContractorProfileCreate,
  ContractorProfileUpdate,
  ContractorVerification,
  ContractorSearch,
  ContractorAvailability,
} from "./contractor_profiles";

export type {
  Project,
  ProjectType,
  ProjectStatus,
  VisibilitySettings,
  TradeCategory,
} from "./projects";

export type {
  Proposal,
  ProposalCreate,
  ProposalUpdate,
  ProposalStatusUpdate,
  ProposalResubmission,
  ProposalSearch,
  ProposalComparison,
  ProposalFeedback,
  ProposalRevisionRequest,
} from "./proposals";

export type {
  Message,
  MessageCreate,
  MessageUpdate,
  MessageThread,
  MessageSearch,
  Notification,
  NotificationCreate,
  NotificationUpdate,
  ChatRoom,
} from "./communication";

export type {
  ProjectView,
} from "./project_views";

export type {
  Review,
} from "./reviews";

export type {
  Subscription,
} from "./subscriptions";

export type {
  Transaction,
} from "./transactions";
