'use client'

// Client-safe configuration that doesn't expose server-side environment variables
// This file should only contain values that are safe to expose to the client

// Default pricing values (in cents) - fallback values if env vars are not set
const DEFAULT_PRICING = {
  CONTRACTOR_VERIFICATION_ANNUAL_PRICE: 40000, // $400.00
  PROJECT_CREATION_FEE: 2999, // $29.99
  PROJECT_ACCESS_FEE: 999, // $9.99
} as const

// Get pricing from environment variables or use defaults
const getPricingFromEnv = () => {
  // These environment variables should be set in .env.local with NEXT_PUBLIC_ prefix
  const contractorPrice = process.env.NEXT_PUBLIC_CONTRACTOR_VERIFICATION_ANNUAL_PRICE
  const creationFee = process.env.NEXT_PUBLIC_PROJECT_CREATION_FEE
  const accessFee = process.env.NEXT_PUBLIC_PROJECT_ACCESS_FEE
  
  return {
    CONTRACTOR_VERIFICATION_ANNUAL_PRICE: contractorPrice ? parseInt(contractorPrice, 10) : DEFAULT_PRICING.CONTRACTOR_VERIFICATION_ANNUAL_PRICE,
    PROJECT_CREATION_FEE: creationFee ? parseInt(creationFee, 10) : DEFAULT_PRICING.PROJECT_CREATION_FEE,
    PROJECT_ACCESS_FEE: accessFee ? parseInt(accessFee, 10) : DEFAULT_PRICING.PROJECT_ACCESS_FEE,
  }
}

const PRICING = getPricingFromEnv()

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