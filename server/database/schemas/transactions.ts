import { z } from "zod";
import { baseSchema, validationPatterns } from "./base";

export const transactionSchema = z.object({
  ...baseSchema,

  user_id: validationPatterns.uuid,
  project_id: validationPatterns.uuid.optional(),
  subscription_id: validationPatterns.uuid.optional(),

  amount: z.number().positive(),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/, "Must be 3-letter ISO currency code (e.g., USD, CAD)"),

  transaction_type: z.enum([
    "contractor_verification_fee", // $400/year subscription
    "project_verification_fee", // $29.99 per project
    "project_ppv", // $9.99 per unlocked project
    "subscription_renewal", // Annual renewal
    "other",
  ]),

  status: z.enum([
    "pending",
    "processing",
    "succeeded",
    "failed",
    "cancelled",
    "refunded",
  ]),

  stripe_payment_intent_id: validationPatterns.optionalString,
  stripe_checkout_session_id: validationPatterns.optionalString,
  stripe_customer_id: validationPatterns.optionalString,
  stripe_subscription_id: validationPatterns.optionalString,

  description: validationPatterns.nonEmptyString,
  metadata: z.record(z.string(), z.unknown()).optional(),

  error_message: validationPatterns.optionalString,
  refunded_at: validationPatterns.optionalDate,
  refund_amount: z.number().positive().optional(),

  payment_method: z
    .enum(["card", "bank_transfer", "digital_wallet", "other"])
    .optional(),
  billing_cycle: z.enum(["one_time", "annual", "monthly"]).optional(),
  
  // Validity tracking for verification payments
  valid_until: validationPatterns.optionalDate, // For contractor verification validity (1 year from payment)
});

export type Transaction = z.infer<typeof transactionSchema>;
