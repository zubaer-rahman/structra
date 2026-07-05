'use client'

// Client-safe configuration that doesn't expose server-side environment variables
// This file should only contain values that are safe to expose to the client

// Default pricing values (in cents) - fallback values if env vars are not set
const DEFAULT_PRICING = {
  CONTRACTOR_VERIFICATION_ANNUAL_PRICE: 40000, // $400.00
  PROJECT_CREATION_FEE: 2999, // $29.99
  PROJECT_ACCESS_FEE: 999, // $9.99
} as const

// Client-safe pricing configuration (matches server defaults in config/env.ts)
const PRICING = DEFAULT_PRICING

// Client-safe pricing configuration
export const clientConfig = {
  pricing: {
    // Pricing values in cents
    contractorVerificationAnnual: PRICING.CONTRACTOR_VERIFICATION_ANNUAL_PRICE,
    projectCreationFee: PRICING.PROJECT_CREATION_FEE,
    projectAccessFee: PRICING.PROJECT_ACCESS_FEE,
    
    // Helper functions to convert to dollars
    getContractorVerificationAnnualInDollars: () => PRICING.CONTRACTOR_VERIFICATION_ANNUAL_PRICE / 100,
    getProjectCreationFeeInDollars: () => PRICING.PROJECT_CREATION_FEE / 100,
    getProjectAccessFeeInDollars: () => PRICING.PROJECT_ACCESS_FEE / 100,
  },
} as const

// Type exports
export type ClientConfig = typeof clientConfig
export type ClientPricingConfig = ClientConfig['pricing']