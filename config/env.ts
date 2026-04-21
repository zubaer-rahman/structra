import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    STRIPE_SECRET_KEY: z.string().min(1, 'Stripe secret key is required'),
    STRIPE_WEBHOOK_SECRET: z.string().min(1, 'Stripe webhook secret is required'),
    STRIPE_WEBHOOK_SECRET_PRODUCTION: z.string().optional(),
    STRIPE_VERIFICATION_PRICE_ID: z.string().optional(),
    
    // Pricing Configuration (in cents)
    CONTRACTOR_VERIFICATION_ANNUAL_PRICE: z.string().default('40000').transform(val => parseInt(val, 10)),
    PROJECT_CREATION_FEE: z.string().default('2999').transform(val => parseInt(val, 10)),
    PROJECT_ACCESS_FEE: z.string().default('999').transform(val => parseInt(val, 10)),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1, 'Stripe publishable key is required'),
    NEXT_PUBLIC_STRIPE_VERIFICATION_PRICE_ID: z.string().optional(),
    NEXT_PUBLIC_ENABLE_ANALYTICS: z.string().default('false').transform(val => val === 'true'),
    NEXT_PUBLIC_ENABLE_MAPS: z.string().default('true').transform(val => val === 'true'),
    NEXT_PUBLIC_ENABLE_DEBUG: z.string().default('false').transform(val => val === 'true'),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_WEBHOOK_SECRET_PRODUCTION: process.env.STRIPE_WEBHOOK_SECRET_PRODUCTION,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_STRIPE_VERIFICATION_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_VERIFICATION_PRICE_ID,
    NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
    NEXT_PUBLIC_ENABLE_MAPS: process.env.NEXT_PUBLIC_ENABLE_MAPS,
    NEXT_PUBLIC_ENABLE_DEBUG: process.env.NEXT_PUBLIC_ENABLE_DEBUG,
    STRIPE_VERIFICATION_PRICE_ID: process.env.STRIPE_VERIFICATION_PRICE_ID,
    
    // Pricing Configuration
    CONTRACTOR_VERIFICATION_ANNUAL_PRICE: process.env.CONTRACTOR_VERIFICATION_ANNUAL_PRICE,
    PROJECT_CREATION_FEE: process.env.PROJECT_CREATION_FEE,
    PROJECT_ACCESS_FEE: process.env.PROJECT_ACCESS_FEE,
     
  },
  /**
   * Run `build` or `dev` with SKIP_ENV_VALIDATION to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
})

// Configuration object with computed values for easy access
export const config = {
  // Environment
  isDev: env.NODE_ENV === 'development',
  isProd: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  
  // Database
  database: {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    pool: {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000,
    },
    ssl: env.NODE_ENV === 'production',
  },
  
  // App
  app: {
    url: env.NEXT_PUBLIC_APP_URL,
    name: 'BuildReady',
    version: '1.0.0',
    description: 'Where Build-Ready Projects Meet Ready Builders',
  },
  
  // Stripe
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    publishableKey: env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    webhookSecretProduction: env.STRIPE_WEBHOOK_SECRET_PRODUCTION,
    verificationPriceId: env.STRIPE_VERIFICATION_PRICE_ID,
  },

  // Pricing Configuration (all amounts in cents)
  pricing: {
    contractorVerificationAnnual: env.CONTRACTOR_VERIFICATION_ANNUAL_PRICE,
    projectCreationFee: env.PROJECT_CREATION_FEE,
    projectAccessFee: env.PROJECT_ACCESS_FEE,
    
    // Helper functions to convert to dollars
    getContractorVerificationAnnualInDollars: () => env.CONTRACTOR_VERIFICATION_ANNUAL_PRICE / 100,
    getProjectCreationFeeInDollars: () => env.PROJECT_CREATION_FEE / 100,
    getProjectAccessFeeInDollars: () => env.PROJECT_ACCESS_FEE / 100,
  },
  
  // Features
  features: {
    analytics: env.NEXT_PUBLIC_ENABLE_ANALYTICS,
    maps: env.NEXT_PUBLIC_ENABLE_MAPS,
    debug: env.NEXT_PUBLIC_ENABLE_DEBUG,
  },
  
  // Security
  security: {
    enableDebug: env.NEXT_PUBLIC_ENABLE_DEBUG,
    cors: {
      origin: env.NEXT_PUBLIC_APP_URL,
      credentials: true,
    },
  },
  
  // API
  api: {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    },
    timeout: 30000, // 30 seconds
  },
} as const

// Type exports for use in other parts of the app
export type Config = typeof config
export type DatabaseConfig = Config['database']
export type AppConfig = Config['app']
export type FeaturesConfig = Config['features']

// Configuration validation helper
export function validateConfig(): void {
  try {
    // The env object is already validated by createEnv
    console.log('✅ Configuration validated successfully')
  } catch (error) {
    console.error('❌ Configuration validation failed:', error)
    process.exit(1)
  }
}

// Environment-specific configuration getters
export const getConfig = () => config
export const getDatabaseConfig = () => config.database
export const getAppConfig = () => config.app
export const getFeaturesConfig = () => config.features

// Feature flags
export const isFeatureEnabled = (feature: keyof FeaturesConfig): boolean => {
  return config.features[feature]
}

// Development helpers
export const devOnly = <T>(value: T): T | undefined => {
  return config.isDev ? value : undefined
}

export const prodOnly = <T>(value: T): T | undefined => {
  return config.isProd ? value : undefined
}