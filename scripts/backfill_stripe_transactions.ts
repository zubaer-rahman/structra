import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import fs from 'fs'
import path from 'path'

// Read .env file
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env')
  if (!fs.existsSync(envPath)) return process.env

  const lines = fs.readFileSync(envPath, 'utf8').split('\n')
  const env: Record<string, string> = {}
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim()
      const val = trimmed.slice(idx + 1).trim()
      env[key] = val
    }
  }
  return { ...process.env, ...env }
}

async function runBackfill() {
  const env = loadEnv()
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY
  const stripeSecretKey = env.STRIPE_SECRET_KEY

  if (!supabaseUrl || !serviceRoleKey || !stripeSecretKey) {
    console.error('Missing configuration: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or STRIPE_SECRET_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const stripe = new Stripe(stripeSecretKey)

  console.log('--- Step 1: Checking if public.transactions table exists in Supabase ---')
  const { data: testData, error: testError } = await supabase.from('transactions').select('id').limit(1)

  if (testError && testError.code === 'PGRST205') {
    console.error('\n❌ The table "public.transactions" does not exist in Supabase!')
    console.error('Please run the following migration in your Supabase SQL Editor first:')
    console.error('📁 File: scripts/create_transactions_table.sql')
    console.error('🔗 URL: https://supabase.com/dashboard/project/dwmwrlwgyftxoenqxmhh/sql\n')
    process.exit(1)
  }

  console.log('✅ Table "public.transactions" exists!')

  console.log('\n--- Step 2: Fetching existing users from Supabase ---')
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, user_role, is_verified_contractor, is_verified_homeowner')

  if (usersError || !users) {
    console.error('Failed to fetch users:', usersError)
    process.exit(1)
  }
  console.log(`Found ${users.length} users in database.`)
  const userById = new Map(users.map(u => [u.id, u]))
  const userByEmail = new Map(users.map(u => [u.email?.toLowerCase(), u]))

  console.log('\n--- Step 3: Fetching completed Checkout Sessions from Stripe ---')
  const sessions = await stripe.checkout.sessions.list({ limit: 100 })
  const paidSessions = sessions.data.filter(s => s.payment_status === 'paid')
  console.log(`Found ${paidSessions.length} paid checkout sessions in Stripe.`)

  let insertedCount = 0
  let skippedCount = 0

  for (const session of paidSessions) {
    const sessionEmail = (session.customer_email || session.customer_details?.email || '').toLowerCase()
    const metaUserId = session.metadata?.userId

    // Match user
    let user = metaUserId ? userById.get(metaUserId) : undefined
    if (!user && sessionEmail) {
      user = userByEmail.get(sessionEmail)
    }

    if (!user) {
      console.log(`⏩ Skipping session ${session.id} ($${(session.amount_total || 0) / 100}) - User not found in database (${sessionEmail || metaUserId || 'no email'})`)
      skippedCount++
      continue
    }

    // Determine transaction type
    let transactionType = 'other'
    const metaType = session.metadata?.paymentType
    if (metaType === 'contractor_verification_subscription' || session.mode === 'subscription') {
      transactionType = 'contractor_verification_subscription'
    } else if (metaType === 'contractor_verification') {
      transactionType = 'contractor_verification_fee'
    } else if (metaType === 'homeowner_project_creation') {
      transactionType = 'project_verification_fee'
    } else if (metaType === 'project_access') {
      transactionType = 'project_ppv'
    } else if (user.user_role === 'contractor') {
      transactionType = 'contractor_verification_subscription'
    } else if (user.user_role === 'homeowner') {
      transactionType = 'project_verification_fee'
    }

    // Determine valid_until
    let validUntil: Date | null = null
    const sessionDate = new Date(session.created * 1000)
    if (transactionType.includes('contractor')) {
      validUntil = new Date(sessionDate.getTime() + 365 * 24 * 60 * 60 * 1000) // 1 year
    } else if (transactionType === 'project_ppv') {
      validUntil = new Date(sessionDate.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
    }

    const description =
      session.metadata?.description ||
      (transactionType.includes('contractor')
        ? 'Contractor Annual Verification Subscription'
        : transactionType === 'project_verification_fee'
        ? 'Homeowner Project Verification Fee'
        : 'Project Payment')

    const transactionData = {
      user_id: user.id,
      amount: session.amount_total || 0,
      currency: (session.currency || 'CAD').toUpperCase(),
      transaction_type: transactionType,
      status: 'succeeded',
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
      stripe_customer_id: typeof session.customer === 'string' ? session.customer : null,
      stripe_subscription_id: typeof session.subscription === 'string' ? session.subscription : null,
      description,
      metadata: session.metadata || {},
      valid_until: validUntil ? validUntil.toISOString() : null,
      created_at: sessionDate.toISOString(),
      updated_at: new Date().toISOString(),
      payment_method: 'card',
      billing_cycle: session.mode === 'subscription' ? 'annual' : 'one_time',
    }

    const { error: upsertError } = await supabase
      .from('transactions')
      .upsert(transactionData, { onConflict: 'stripe_checkout_session_id' })

    if (upsertError) {
      console.error(`❌ Failed to upsert transaction for session ${session.id}:`, upsertError)
    } else {
      console.log(`✅ Upserted transaction ${session.id}: $${(session.amount_total || 0) / 100} ${session.currency?.toUpperCase()} for ${user.email} (${transactionType})`)
      insertedCount++

      // Ensure user verification status in DB
      if (transactionType.includes('contractor') && !user.is_verified_contractor) {
        await supabase.from('users').update({ is_verified_contractor: true }).eq('id', user.id)
        console.log(`   ✨ Updated user ${user.email} to is_verified_contractor = true`)
      }
      if (transactionType === 'project_verification_fee' && !user.is_verified_homeowner) {
        await supabase.from('users').update({ is_verified_homeowner: true }).eq('id', user.id)
        console.log(`   ✨ Updated user ${user.email} to is_verified_homeowner = true`)
      }
    }
  }

  console.log(`\n🎉 Backfill finished! Upserted: ${insertedCount}, Skipped: ${skippedCount}`)
}

runBackfill().catch(err => {
  console.error('Unexpected backfill error:', err)
  process.exit(1)
})
