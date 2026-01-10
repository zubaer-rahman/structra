import { z } from "zod";
import { baseSchema, commonEnums, validationPatterns } from "./base";
import { AGREEMENT_STATUSES } from "@/utils/constants/agreements";

export const agreementSchema = z.object({
  ...baseSchema,

  scope_of_work: validationPatterns.nonEmptyString,
  contract_notes: validationPatterns.optionalString,

  proposal: validationPatterns.uuid,
  contractor: validationPatterns.uuid,
  homeowner: validationPatterns.uuid,

  subtotal_amount: validationPatterns.amount,
  tax_total: validationPatterns.amount,
  total_amount: validationPatterns.amount,
  deposit_amount: validationPatterns.amount,
  deposit_due_on: validationPatterns.date,

  abandonment_penalty: validationPatterns.amount,
  delay_penalty: validationPatterns.amount,

  scheduled_start_date: validationPatterns.date,
  scheduled_completion_date: validationPatterns.date,

  status: commonEnums.agreementStatus.default(AGREEMENT_STATUSES.DRAFT),

  permit_responsibility_user: validationPatterns.uuid.optional(),

  custom_document_required: validationPatterns.yesNo.default("no"),
  attached_files: z.array(validationPatterns.fileReference).default([]),

  created_by: validationPatterns.uuid,
});

export type Agreement = z.infer<typeof agreementSchema>;
