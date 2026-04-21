import { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { config } from '@/config/env'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
})

// Create Supabase client for webhook operations
async function createSupabaseClient() {
  const { createClient } = await import('@supabase/supabase-js')
  
  // Use service role key for webhook operations to bypass RLS
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

export async function POST(req: NextRequest) {
  // console.log('🚀 Webhook endpoint hit!')
  
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  // Determine which webhook secret to use based on environment
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL
  const webhookSecret = isProduction 
    ? process.env.STRIPE_WEBHOOK_SECRET_PRODUCTION 
    : process.env.STRIPE_WEBHOOK_SECRET

  // console.log('🔄 Webhook received:', {
  //   hasSignature: !!signature,
  //   bodyLength: body.length,
  //   timestamp: new Date().toISOString(),
  //   environment: isProduction ? 'production' : 'development',
  //   webhookSecret: webhookSecret ? 'Present' : 'Missing',
  //   usingProductionSecret: isProduction
  // })

  if (!signature) {
    console.error('❌ No Stripe signature found')
    return new Response('No signature', { status: 400 })
  }

  if (!webhookSecret) {
    console.error(`❌ Webhook secret missing for ${isProduction ? 'production' : 'development'} environment`)
    return new Response('Webhook secret not configured', { status: 400 })
  }

  try {
    // console.log('🔍 Constructing Stripe event...')
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    
    // console.log(`🔄 Processing webhook event: ${event.type}`, {
    //   eventId: event.id,
    //   created: event.created,
    //   livemode: event.livemode
    // })

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'checkout.session.expired':
        await handleCheckoutSessionExpired(event.data.object as Stripe.Checkout.Session)
        break
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break
      default:
        // console.log(`⚠️ Unhandled event type: ${event.type}`)
    }

    // console.log(`✅ Webhook processed successfully: ${event.type}`)
    return new Response('Webhook processed successfully', { status: 200 })
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return new Response('Webhook error', { status: 400 })
  }
}

// Test endpoint to verify webhook is accessible
export async function GET() {
  // console.log('🧪 Webhook test endpoint hit!')
  return new Response('Webhook endpoint is working!', { status: 200 })
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const { userId, paymentType, verificationTier, projectId, isVerified, projectPrice, verificationPrice, includesVerification } = session.metadata || {}
  
  // console.log('💰 Checkout session completed:', {
  //   sessionId: session.id,
  //   mode: session.mode,
  //   amount: session.amount_total,
  //   currency: session.currency,
  //   customerId: session.customer,
  //   metadata: session.metadata,
  //   paymentStatus: session.payment_status,
  //   subscriptionId: session.subscription,
  //   paymentIntentId: session.payment_intent,
  //   lineItems: session.line_items?.data,
  //   successUrl: session.success_url,
  //   cancelUrl: session.cancel_url
  // })
  
  // console.log('🔍 Metadata analysis:', {
  //   userId,
  //   paymentType,
  //   projectId,
  //   isVerified,
  //   projectPrice,
  //   verificationPrice,
  //   includesVerification,
  //   hasUserId: !!userId,
  //   hasPaymentType: !!paymentType,
  //   hasProjectId: !!projectId,
  //   paymentTypeMatch: paymentType === 'project_access'
  // })
  
  if (!userId) {
    console.error('❌ No userId in session metadata')
    return
  }

  // Handle homeowner project creation payments
  // Note: Webhook only handles payment processing and user verification
  // Project creation is handled by the frontend form after payment success
  if (paymentType === 'homeowner_project_creation') {
    // console.log(`🏠 Processing homeowner project creation payment for user ${userId}`, {
    //   isFirstPayment: session.metadata?.isFirstPayment === 'true',
    //   amount: session.amount_total,
    //   sessionId: session.id
    // })
    
    try {
      const supabase = await createSupabaseClient()
      
      // Check if we've already processed this checkout session (idempotency check)
      const { data: existingTransaction, error: checkError } = await supabase
        .from('transactions')
        .select('id, status, metadata')
        .eq('stripe_checkout_session_id', session.id)
        .single()
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('❌ Error checking existing transaction:', checkError)
        return
      }
      
      if (existingTransaction?.status === 'succeeded') {
        console.log('⚠️ Checkout session already processed successfully, skipping duplicate processing:', session.id)
        return
      }

      if (!existingTransaction) {
        // console.log('📝 No transaction found for checkout session, creating new one:', session.id)
        
        // Create transaction record as fallback
        const { data: newTransaction, error: createError } = await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent as string,
            amount: session.amount_total,
            currency: session.currency?.toUpperCase() || 'CAD',
            status: 'succeeded',
            transaction_type: 'project_verification_fee',
            description: session.metadata?.isFirstPayment === 'true' 
              ? 'Project verification'
              : 'New project creation',
            payment_method: 'card',
            billing_cycle: 'one_time',
            metadata: {
              userId,
              paymentType: 'homeowner_project_creation',
              isFirstPayment: session.metadata?.isFirstPayment === 'true',
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single()
        
        if (createError) {
          console.error('❌ Failed to create fallback transaction:', createError)
          return
        }
        
        // console.log('✅ Created fallback transaction:', newTransaction.id)
        // Continue with the rest of the processing
      } else {
        // Update existing transaction status
        const { error: transactionError } = await supabase
          .from('transactions')
          .update({
            status: 'succeeded',
            stripe_payment_intent_id: session.payment_intent as string,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_checkout_session_id', session.id)
        
        if (transactionError) {
          console.error('❌ Failed to update transaction status:', transactionError)
          return
        }
      }
      
      // If this is the first payment, mark user as verified homeowner
      if (session.metadata?.isFirstPayment === 'true') {
        const { error: verificationError } = await supabase
          .from('users')
          .update({
            is_verified_homeowner: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)
        
        if (verificationError) {
          console.error('❌ Failed to update homeowner verification status:', verificationError)
        } else {
          // console.log('✅ Homeowner verification status updated')
        }
      }
      
      // console.log(`✅ Successfully processed homeowner project creation payment for user ${userId}`)
      // console.log(`ℹ️ Project creation will be handled by the frontend form after payment success`)
    } catch (error) {
      console.error(`❌ Failed to process homeowner project creation payment:`, error)
    }
    
    return // Exit early for homeowner payments
  }

  // Handle project access payments
  if (paymentType === 'project_access' && projectId) {
    // console.log(`🎯 Processing project access payment for user ${userId}, project ${projectId}`, {
    //   projectId,
    //   isVerified: isVerified === 'true',
    //   projectPrice: parseInt(projectPrice || '0'),
    //   verificationPrice: parseInt(verificationPrice || '0'),
    //   totalAmount: session.amount_total
    // })
    
    try {
      const supabase = await createSupabaseClient()
      
      // Find existing transaction or create new one
      const { data: transaction, error: findTransactionError } = await supabase
        .from('transactions')
        .select('*')
        .eq('stripe_checkout_session_id', session.id)
        .single()
      
      let transactionId: string
      
      if (findTransactionError || !transaction) {
        // Create new transaction record since we no longer create them upfront
        // console.log('📝 Creating new transaction record for project access payment')
        
        const { data: newTransaction, error: createError } = await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            project_id: projectId,
            amount: session.amount_total,
            currency: 'CAD',
            transaction_type: 'project_ppv',
            status: 'succeeded',
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent as string,
            description: `Project access payment for: ${session.metadata?.projectTitle || 'Unknown Project'}`,
            metadata: {
              projectId,
              projectTitle: session.metadata?.projectTitle || 'Unknown Project',
              isVerified: 'true',
              projectPrice: parseInt(projectPrice || '0'),
            },
            payment_method: 'card',
            billing_cycle: 'one_time',
          })
          .select()
          .single()
        
        if (createError || !newTransaction) {
          console.error('❌ Failed to create transaction record:', createError)
          return
        }
        
        transactionId = newTransaction.id
        // console.log('✅ Transaction record created successfully')
      } else {
        // Update existing transaction
        const { error: transactionError } = await supabase
          .from('transactions')
          .update({
            status: 'succeeded',
            stripe_payment_intent_id: session.payment_intent as string,
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.id)
        
        if (transactionError) {
          console.error('❌ Failed to update transaction status:', transactionError)
          return
        }
        
        transactionId = transaction.id
        // console.log('✅ Transaction status updated to succeeded')
      }
      
      // If user was not verified and paid verification fee, verify them first
      // Support both old metadata format (isVerified, verificationPrice) and new format (includesVerification)
      const shouldVerifyUser = (isVerified === 'false' && parseInt(verificationPrice || '0') > 0) || 
                              (includesVerification === 'true')
      
      if (shouldVerifyUser) {
        // console.log(`✅ Processing contractor verification for user ${userId}`)
        
        const { error: verificationError } = await supabase
          .from('users')
          .update({
            is_verified_contractor: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)
        
        if (verificationError) {
          console.error('❌ Failed to update verification status:', verificationError)
        } else {
          // console.log('✅ User verification status updated')
          
          // Create subscription record for verification
          const now = new Date()
          const startDate = now.toISOString().split('T')[0]
          const endDateObj = new Date(now)
          endDateObj.setFullYear(endDateObj.getFullYear() + 1)
          const endDate = endDateObj.toISOString().split('T')[0]
          
          const subscriptionData = {
            contractor: userId,
            stripe_subscription_id: `checkout_${session.id}`,
            plan_name: 'Contractor Verification',
            tier_level: 'verified',
            start_date: startDate,
            end_date: endDate,
            features_unlocked: 'Verified contractor badge, unlimited project access, priority placement',
            is_active: 'yes',
            is_auto_renew: 'no',
            amount: parseInt(verificationPrice || '0') || (includesVerification === 'true' ? config.pricing.contractorVerificationAnnual : 0)
          }
          
          const { error: subscriptionError } = await supabase
            .from('subscriptions')
            .insert(subscriptionData)
          
          if (subscriptionError) {
            console.error('❌ Failed to create subscription record:', subscriptionError)
          } else {
            // console.log('✅ Subscription record created for verification')
          }
        }
      }
      
      // Grant project access
      const expiresAt = new Date()
      expiresAt.setFullYear(expiresAt.getFullYear() + 1) // Access expires in 1 year
      
      const projectViewData = {
        contractor: userId,
        project: projectId,
        is_active: 'yes',
        access_method: 'Manual Paywall',
        can_submit_proposal: 'yes',
        expires_at: expiresAt.toISOString().split('T')[0], // DATE format, not timestamp
        payment_transaction: transactionId,
        created_at: new Date().toISOString(),
        created_by: userId, // Required field
        view_status: 'Viewed', // Required field
        viewed_at: new Date().toISOString().split('T')[0], // Required DATE field
        was_paid_view: 'yes' // Required field
      }
      
      // Check if project view already exists
      const { data: existingView } = await supabase
        .from('project_views')
        .select('id')
        .eq('contractor', userId)
        .eq('project', projectId)
        .single()
      
      if (existingView) {
        // Update existing view
        const { error: updateError } = await supabase
          .from('project_views')
          .update(projectViewData)
          .eq('id', existingView.id)
        
        if (updateError) {
          console.error('❌ Failed to update project view:', updateError)
        } else {
          // console.log('✅ Project view updated successfully')
        }
      } else {
        // Create new project view
        const { error: insertError } = await supabase
          .from('project_views')
          .insert(projectViewData)
        
        if (insertError) {
          console.error('❌ Failed to create project view:', insertError)
        } else {
          // console.log('✅ Project view created successfully')
        }
      }
      
      // console.log(`✅ Successfully processed project access payment for user ${userId}, project ${projectId}`)
    } catch (error) {
      console.error(`❌ Failed to process project access payment:`, error)
    }
    
    return // Exit early for project payments
  }

  // Handle contractor verification fee - Fallback: Success URL handles this primarily, but webhook can also process
  if (verificationTier === 'verified' || (session.amount_total === config.pricing.contractorVerificationAnnual && session.mode === 'payment')) {
    // console.log(`✅ Processing contractor verification for user ${userId}`, {
    //   verificationTier,
    //   amount: session.amount_total,
    //   mode: session.mode,
    //   sessionId: session.id
    // })
    
    try {
      const supabase = await createSupabaseClient()
      
      // Check if user is already verified (idempotency check)
      const { data: currentData, error: fetchError } = await supabase
        .from('users')
        .select('is_verified_contractor, email')
        .eq('id', userId)
        .single()
      
      if (fetchError) {
        console.error('❌ Error fetching current user status:', fetchError)
        return
      }
      
      if (currentData?.is_verified_contractor) {
        // console.log('ℹ️ User is already verified, skipping webhook processing')
        return
      }
      
      // Check if transaction already exists and is succeeded
      const { data: existingTransaction } = await supabase
        .from('transactions')
        .select('id, status')
        .eq('user_id', userId)
        .in('transaction_type', ['contractor_verification_fee', 'contractor_verification_subscription'])
        .eq('status', 'succeeded')
        .single()
      
      if (existingTransaction) {
        // console.log('ℹ️ Transaction already processed, skipping webhook processing')
        return
      }
      
      // console.log('📊 Current user status before update:', currentData)
      
      const { error } = await supabase
        .from('users')
        .update({
          is_verified_contractor: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) {
        console.error('❌ Database update failed:', error)
        throw new Error(`Failed to update verification status: ${error.message}`)
      }
      
      // Verify the update was successful
      const { data: updatedData, error: verifyError } = await supabase
        .from('users')
        .select('is_verified_contractor, email, updated_at')
        .eq('id', userId)
        .single()
      
      if (verifyError) {
        console.error('❌ Error verifying update:', verifyError)
      } else {
        // console.log('📊 User status after update:', updatedData)
      }
      
      // Create subscription record for checkout session payments
      if (session.mode === 'payment') {
        const now = new Date()
        const startDate = now.toISOString().split('T')[0]
        
        // Set end date to exactly 1 year from start date for contractor verification
        const endDateObj = new Date(now)
        endDateObj.setFullYear(endDateObj.getFullYear() + 1) // Add 1 year
        const endDate = endDateObj.toISOString().split('T')[0]
        
        const subscriptionData = {
          contractor: userId,
          stripe_subscription_id: session.subscription as string || `checkout_${session.id}`,
          plan_name: 'Contractor Verification',
          tier_level: 'verified',
          start_date: startDate,
          end_date: endDate,
          features_unlocked: 'Verified contractor badge, unlimited project access, priority placement',
          is_active: 'yes',
          is_auto_renew: session.subscription ? 'yes' : 'no', // Only auto-renew if it's a subscription
          amount: session.amount_total // Payment amount in cents
        }

        const { data: subscriptionRecord, error: subscriptionError } = await supabase
          .from('subscriptions')
          .insert(subscriptionData)
          .select()
          .single()

        if (subscriptionError) {
          console.error('❌ Failed to create subscription record from checkout:', subscriptionError)
        } else {
          // console.log('✅ Subscription record created from checkout session:', subscriptionRecord)
        }
      }
      
      // console.log(`✅ Successfully verified contractor ${userId}`)

      // Create or update transaction record (idempotent)
      // console.log('🔄 Attempting to create/update transaction record...')
      try {
        // First check if transaction already exists
        const { data: existingTransaction } = await supabase
          .from('transactions')
          .select('id, status')
          .eq('stripe_checkout_session_id', session.id)
          .single()
        
        if (existingTransaction) {
          if (existingTransaction.status === 'succeeded') {
            // console.log('ℹ️ Transaction already exists and is succeeded, skipping creation')
          } else {
            // Update existing pending transaction to succeeded
            const { error: updateError } = await supabase
              .from('transactions')
              .update({
                status: 'succeeded',
                stripe_payment_intent_id: session.payment_intent,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingTransaction.id)
            
            if (updateError) {
              console.error('❌ Failed to update existing transaction:', updateError)
            } else {
              // console.log('✅ Updated existing transaction to succeeded')
            }
          }
        } else {
          // Create new transaction record
          const validUntil = new Date()
          validUntil.setFullYear(validUntil.getFullYear() + 1)
          
          const transactionData = {
            user_id: userId,
            amount: session.amount_total || 0,
            currency: session.currency?.toUpperCase() || 'CAD',
            transaction_type: 'contractor_verification_fee',
            status: 'succeeded',
            stripe_payment_intent_id: session.payment_intent,
            stripe_checkout_session_id: session.id,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            description: 'Contractor Verification Fee',
            metadata: session.metadata,
            payment_method: 'card',
            billing_cycle: session.mode === 'subscription' ? 'annual' : 'one_time',
            valid_until: validUntil.toISOString()
          }
          
          // console.log('📊 Transaction data to insert:', transactionData)
          
          const { error: transactionError } = await supabase
            .from('transactions')
            .insert(transactionData)

          if (transactionError) {
            console.error('❌ Failed to create transaction record:', transactionError)
          } else {
            // console.log('✅ Transaction record created successfully')
          }
        }
      } catch (transactionErr) {
        console.error('⚠️ Transaction creation failed:', transactionErr)
      }

      // Create subscription record if it's a subscription
      if (session.mode === 'subscription' && session.subscription) {
        // console.log('🔄 Attempting to create subscription record...')
        try {
          const subscriptionData = {
            contractor: userId,
            stripe_subscription_id: session.subscription,
            is_active: 'yes',
            is_auto_renew: 'yes',
            plan_name: 'Contractor Verification',
            tier_level: 'verified',
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
            features_unlocked: 'Verified contractor status, portfolio showcase, expanded information capabilities'
          }
          
          // console.log('📊 Subscription data to insert:', subscriptionData)
          
          const { error: subscriptionError } = await supabase
            .from('subscriptions')
            .insert(subscriptionData)

          if (subscriptionError) {
            console.error('❌ Failed to create subscription record:', subscriptionError)
          } else {
            // console.log('✅ Subscription record created successfully')
          }
        } catch (subscriptionErr) {
          console.error('⚠️ Subscription creation failed:', subscriptionErr)
        }
      } else {
        // console.log(`ℹ️ Not creating subscription record - mode: ${session.mode}, subscription: ${session.subscription}`)
      }

    } catch (error) {
      console.error(`❌ Failed to update verification status for user ${userId}:`, error)
    }
  } else {
    // console.log('ℹ️ Payment does not qualify for verification:', {
    //       verificationTier,
    //       amount: session.amount_total,
    //       mode: session.mode,
    //       expectedAmount: config.pricing.contractorVerificationAnnual,
    //       expectedTier: 'verified'
    //     })
  }
}

async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
  // console.log(`⏰ Checkout session expired: ${session.id}`)
  
  try {
    const supabase = await createSupabaseClient()
    const { userId, paymentType } = session.metadata || {}
    
    if (!userId) {
      console.error('❌ No userId in session metadata')
      return
    }
    
    // Handle project creation payment cancellations
    if (paymentType === 'homeowner_project_creation') {
      // console.log(`🏠 Processing expired project creation session for user ${userId}`)
      
      // Update any pending project verification fee transactions to cancelled
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_checkout_session_id', session.id)
        .eq('user_id', userId)
        .eq('transaction_type', 'project_verification_fee')
        .eq('status', 'pending')
      
      if (updateError) {
        console.error('❌ Failed to cancel project creation transaction:', updateError)
      } else {
        // console.log('✅ Project creation transaction marked as cancelled')
      }
    }
    
    // Handle project access payment cancellations
    if (paymentType === 'project_access') {
      // console.log(`🎯 Processing expired project access session for user ${userId}`)
      
      // Update any pending project_ppv transactions to cancelled
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_checkout_session_id', session.id)
        .eq('user_id', userId)
        .eq('transaction_type', 'project_ppv')
        .eq('status', 'pending')
      
      if (updateError) {
        console.error('❌ Failed to cancel project access transaction:', updateError)
      } else {
        // console.log('✅ Project access transaction marked as cancelled')
      }
    }
    
    // Handle contractor verification payment cancellations
    if (paymentType === 'contractor_verification') {
      // console.log(`🔧 Processing expired contractor verification session for user ${userId}`)
      
      // Update any pending contractor verification transactions to cancelled
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_checkout_session_id', session.id)
        .eq('user_id', userId)
        .in('transaction_type', ['contractor_verification_fee', 'contractor_verification_subscription'])
        .eq('status', 'pending')
      
      if (updateError) {
        console.error('❌ Failed to cancel contractor verification transaction:', updateError)
      } else {
        // console.log('✅ Contractor verification transaction marked as cancelled')
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to process expired checkout session:', error)
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // console.log(`💰 Payment intent succeeded: ${paymentIntent.id}`, {
  //   amount: paymentIntent.amount,
  //   currency: paymentIntent.currency,
  //   status: paymentIntent.status,
  //   metadata: paymentIntent.metadata
  // })
  
  try {
    const supabase = await createSupabaseClient()
    
    // Find the transaction by payment intent ID
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .single()
    
    if (transactionError || !transaction) {
      // console.log(`ℹ️ No transaction found for payment intent ${paymentIntent.id}`)
      
      // For contractor verification payments, create transaction if it doesn't exist
      // This handles cases where checkout.session.completed didn't run or failed
      const { userId, paymentType } = paymentIntent.metadata || {}
      
      if (userId && (paymentType === 'contractor_verification' || paymentIntent.amount === config.pricing.contractorVerificationAnnual)) {
        // console.log(`🔄 Creating missing transaction for contractor verification payment intent ${paymentIntent.id}`)
        
        // Calculate valid_until date (1 year from now)
        const validUntil = new Date()
        validUntil.setFullYear(validUntil.getFullYear() + 1)
        
        const transactionData = {
          user_id: userId,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency?.toUpperCase() || 'CAD',
          transaction_type: 'contractor_verification_fee',
          status: 'succeeded',
          stripe_payment_intent_id: paymentIntent.id,
          stripe_customer_id: paymentIntent.customer,
          description: 'Contractor Verification Fee',
          metadata: paymentIntent.metadata,
          payment_method: 'card',
          billing_cycle: 'one_time',
          valid_until: validUntil.toISOString()
        }
        
        const { data: newTransaction, error: createError } = await supabase
          .from('transactions')
          .insert(transactionData)
          .select()
          .single()
        
        if (createError) {
          console.error('❌ Failed to create transaction for contractor verification:', createError)
          return
        }
        
        // console.log('✅ Created missing transaction for contractor verification:', newTransaction)
        
        // Update user verification status
        const { error: verificationError } = await supabase
          .from('users')
          .update({
            is_verified_contractor: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)
        
        if (verificationError) {
          console.error('❌ Failed to update verification status:', verificationError)
        } else {
          // console.log('✅ User verification status updated')
        }
        
        // Create subscription record
        const now = new Date()
        const startDate = now.toISOString().split('T')[0]
        const endDateObj = new Date(now)
        endDateObj.setFullYear(endDateObj.getFullYear() + 1)
        const endDate = endDateObj.toISOString().split('T')[0]
        
        const subscriptionData = {
          contractor: userId,
          stripe_subscription_id: `payment_intent_${paymentIntent.id}`,
          plan_name: 'Contractor Verification',
          tier_level: 'verified',
          start_date: startDate,
          end_date: endDate,
          features_unlocked: 'Verified contractor badge, unlimited project access, priority placement',
          is_active: 'yes',
          is_auto_renew: 'no',
          amount: paymentIntent.amount
        }
        
        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .insert(subscriptionData)
        
        if (subscriptionError) {
          console.error('❌ Failed to create subscription record:', subscriptionError)
        } else {
          // console.log('✅ Subscription record created for verification')
        }
        
        return
      }
      
      // For homeowner project creation payments, create transaction if it doesn't exist
      if (userId && paymentType === 'homeowner_project_creation') {
        // console.log(`🔄 Creating missing transaction for homeowner project creation payment intent ${paymentIntent.id}`)
        
        const transactionData = {
          user_id: userId,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency?.toUpperCase() || 'CAD',
          transaction_type: 'project_verification_fee',
          status: 'succeeded',
          stripe_payment_intent_id: paymentIntent.id,
          stripe_customer_id: paymentIntent.customer,
          description: paymentIntent.metadata?.isFirstPayment === 'true' 
            ? 'Project verification'
            : 'New project creation',
          metadata: paymentIntent.metadata,
          payment_method: 'card',
          billing_cycle: 'one_time',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        const { data: newTransaction, error: createError } = await supabase
          .from('transactions')
          .insert(transactionData)
          .select()
          .single()
        
        if (createError) {
          console.error('❌ Failed to create transaction for homeowner project creation:', createError)
          return
        }
        
        // console.log('✅ Created missing transaction for homeowner project creation:', newTransaction)
        
        // If this is the first payment, mark user as verified homeowner
        if (paymentIntent.metadata?.isFirstPayment === 'true') {
          const { error: verificationError } = await supabase
            .from('users')
            .update({
              is_verified_homeowner: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId)
          
          if (verificationError) {
            console.error('❌ Failed to update homeowner verification status:', verificationError)
          } else {
            // console.log('✅ Homeowner verification status updated')
          }
        }
        
        return
      }
      
      return
    }
    
    // console.log(`🔍 Found transaction:`, {
    //   id: transaction.id,
    //   userId: transaction.user_id,
    //   projectId: transaction.project_id,
    //   amount: transaction.amount,
    //   status: transaction.status,
    //   transactionType: transaction.transaction_type
    // })
    
    // Update transaction status to succeeded
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        status: 'succeeded',
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id)
    
    if (updateError) {
      console.error('❌ Failed to update transaction status:', updateError)
    } else {
      // console.log('✅ Transaction status updated to succeeded')
    }
    
    // Handle project access payments
    if (transaction.transaction_type === 'project_ppv' && transaction.project_id) {
      // console.log(`🎯 Processing project access for user ${transaction.user_id}, project ${transaction.project_id}`)
      
      // Grant project access
      const expiresAt = new Date()
      expiresAt.setFullYear(expiresAt.getFullYear() + 1) // Access expires in 1 year
      
      const projectViewData = {
        contractor: transaction.user_id,
        project: transaction.project_id,
        is_active: 'yes',
        access_method: 'Manual Paywall',
        can_submit_proposal: 'yes',
        expires_at: expiresAt.toISOString().split('T')[0], // DATE format
        payment_transaction: transaction.id,
        created_at: new Date().toISOString(),
        created_by: transaction.user_id,
        view_status: 'Viewed',
        viewed_at: new Date().toISOString().split('T')[0],
        was_paid_view: 'yes'
      }
      
      // Check if project view already exists
      const { data: existingView } = await supabase
        .from('project_views')
        .select('id')
        .eq('contractor', transaction.user_id)
        .eq('project', transaction.project_id)
        .single()
      
      if (existingView) {
        // Update existing view
        const { error: updateViewError } = await supabase
          .from('project_views')
          .update(projectViewData)
          .eq('id', existingView.id)
        
        if (updateViewError) {
          console.error('❌ Failed to update project view:', updateViewError)
        } else {
          // console.log('✅ Project view updated successfully')
        }
      } else {
        // Create new project view
        const { error: insertError } = await supabase
          .from('project_views')
          .insert(projectViewData)
        
        if (insertError) {
          console.error('❌ Failed to create project view:', insertError)
        } else {
          // console.log('✅ Project view created successfully')
        }
      }
      
      // console.log(`✅ Successfully processed project access payment for user ${transaction.user_id}, project ${transaction.project_id}`)
    }
    
    // Handle contractor verification payments
    if (transaction.transaction_type === 'contractor_verification_fee') {
      // console.log(`✅ Processing contractor verification for user ${transaction.user_id}`)
      
      const { error: verificationError } = await supabase
        .from('users')
        .update({
          is_verified_contractor: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', transaction.user_id)
      
      if (verificationError) {
        console.error('❌ Failed to update verification status:', verificationError)
      } else {
        // console.log('✅ User verification status updated')
        
        // Create subscription record
        const now = new Date()
        const startDate = now.toISOString().split('T')[0]
        const endDateObj = new Date(now)
        endDateObj.setFullYear(endDateObj.getFullYear() + 1)
        const endDate = endDateObj.toISOString().split('T')[0]
        
        const subscriptionData = {
          contractor: transaction.user_id,
          stripe_subscription_id: `payment_intent_${paymentIntent.id}`,
          plan_name: 'Contractor Verification',
          tier_level: 'verified',
          start_date: startDate,
          end_date: endDate,
          features_unlocked: 'Verified contractor badge, unlimited project access, priority placement',
          is_active: 'yes',
          is_auto_renew: 'no',
          amount: transaction.amount
        }
        
        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .insert(subscriptionData)
        
        if (subscriptionError) {
          console.error('❌ Failed to create subscription record:', subscriptionError)
        } else {
          // console.log('✅ Subscription record created for verification')
        }
      }
    }
    
  } catch (error) {
    console.error(`❌ Failed to process payment intent succeeded:`, error)
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  // console.log('🎉 Subscription created:', {
  //   subscriptionId: subscription.id,
  //   customerId: subscription.customer,
  //   status: subscription.status,
  //   metadata: subscription.metadata,
  //   currentPeriodStart: subscription.items.data[0]?.current_period_start,
  //   currentPeriodEnd: subscription.items.data[0]?.current_period_end
  // })
  
  const { userId, paymentType, verificationTier } = subscription.metadata || {}
  
  // Handle contractor verification for new subscriptions
  if (userId && (verificationTier === 'verified' || paymentType === 'contractor_verification')) {
    // console.log(`✅ Processing contractor verification for new subscription user ${userId}`, {
    //   verificationTier,
    //   paymentType,
    //   subscriptionId: subscription.id,
    //   status: subscription.status
    // })
    
    // Only verify if subscription is active
    if (subscription.status === 'active') {
      try {
        const supabase = await createSupabaseClient()
        
        // Check current status
        const { data: currentData, error: fetchError } = await supabase
          .from('users')
          .select('is_verified_contractor, email')
          .eq('id', userId)
          .single()
        
        if (fetchError) {
          console.error('❌ Error fetching current user status:', fetchError)
        } else {
          // console.log('📊 Current user status before subscription creation verification:', currentData)
        }
        
        // Update verification status
        const { error } = await supabase
          .from('users')
          .update({
            is_verified_contractor: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)

        if (error) {
          console.error('❌ Database update failed for new subscription:', error)
          throw new Error(`Failed to update verification status: ${error.message}`)
        }
        
        // Verify the update
        const { data: updatedData, error: verifyError } = await supabase
          .from('users')
          .select('is_verified_contractor, email, updated_at')
          .eq('id', userId)
          .single()
        
        if (verifyError) {
          console.error('❌ Error verifying new subscription update:', verifyError)
        } else {
          // console.log('📊 User status after new subscription verification:', updatedData)
        }
        
        // Create subscription record in database
        const now = new Date()
        const startDate = subscription.items.data[0]?.current_period_start 
          ? new Date(subscription.items.data[0].current_period_start * 1000).toISOString().split('T')[0]
          : now.toISOString().split('T')[0]
        
        // Set end date to exactly 1 year from start date for contractor verification
        const startDateObj = subscription.items.data[0]?.current_period_start 
          ? new Date(subscription.items.data[0].current_period_start * 1000)
          : now
        const endDateObj = new Date(startDateObj)
        endDateObj.setFullYear(endDateObj.getFullYear() + 1) // Add 1 year
        const endDate = endDateObj.toISOString().split('T')[0]
        
        const subscriptionData = {
          contractor: userId,
          stripe_subscription_id: subscription.id,
          plan_name: subscription.items.data[0]?.price?.nickname || 'Contractor Verification',
          tier_level: verificationTier === 'verified' ? 'verified' : 'premium',
          start_date: startDate,
          end_date: endDate,
          features_unlocked: 'Verified contractor badge, unlimited project access, priority placement',
          is_active: 'yes',
          is_auto_renew: subscription.cancel_at_period_end ? 'no' : 'yes',
          amount: subscription.items.data[0]?.price?.unit_amount // Payment amount in cents
        }

        const { data: subscriptionRecord, error: subscriptionError } = await supabase
          .from('subscriptions')
          .insert(subscriptionData)
          .select()
          .single()

        if (subscriptionError) {
          console.error('❌ Failed to create subscription record:', subscriptionError)
        } else {
          // console.log('✅ Subscription record created:', subscriptionRecord)
        }

        // console.log(`✅ Successfully verified contractor ${userId} via new subscription`)
      } catch (error) {
        console.error(`❌ Failed to update verification status for new subscription user ${userId}:`, error)
      }
    } else {
      // console.log(`ℹ️ Subscription not active yet, status: ${subscription.status}`)
    }
  } else {
    // console.log('ℹ️ New subscription does not qualify for verification:', {
    //   userId,
    //   verificationTier,
    //   paymentType,
    //   subscriptionId: subscription.id
    // })
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // console.log('🔄 Subscription updated:', {
  //   subscriptionId: subscription.id,
  //   customerId: subscription.customer,
  //   status: subscription.status,
  //   cancelAtPeriodEnd: subscription.cancel_at_period_end,
  //   currentPeriodEnd: subscription.items.data[0]?.current_period_end
  // })
  
  try {
    const supabase = await createSupabaseClient()
    
    // Update subscription record
    const updateData: {
      is_active: string;
      is_auto_renew: string;
      end_date: string;
      updated_at: string;
      cancelled_at?: string;
    } = {
      is_active: subscription.status === 'active' ? 'yes' : 'no',
      is_auto_renew: subscription.cancel_at_period_end ? 'no' : 'yes',
      end_date: subscription.items.data[0]?.current_period_end ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString()
    }
    
    if (subscription.canceled_at) {
      updateData.cancelled_at = new Date(subscription.canceled_at * 1000).toISOString().split('T')[0]
    }
    
    const { data, error } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('stripe_subscription_id', subscription.id)
      .select()
    
    if (error) {
      console.error('❌ Failed to update subscription record:', error)
    } else {
      // console.log('✅ Subscription record updated:', data)
    }
    
  } catch (error) {
    console.error('❌ Error updating subscription:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // console.log('🗑️ Subscription deleted:', {
  //   subscriptionId: subscription.id,
  //   customerId: subscription.customer,
  //   canceledAt: subscription.canceled_at
  // })
  
  try {
    const supabase = await createSupabaseClient()
    
    // Update subscription record to inactive
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        is_active: 'no',
        cancelled_at: new Date().toISOString().split('T')[0],
        cancellation_reason: 'Subscription deleted in Stripe',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)
      .select()
    
    if (error) {
      console.error('❌ Failed to update subscription record on deletion:', error)
    } else {
      // console.log('✅ Subscription record marked as cancelled:', data)
      
      // Also update user verification status if needed
      if (data && data.length > 0) {
        const contractorId = data[0].contractor
        const { error: userError } = await supabase
          .from('users')
          .update({
            is_verified_contractor: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', contractorId)
        
        if (userError) {
          console.error('❌ Failed to update user verification status:', userError)
        } else {
          // console.log('✅ User verification status updated after subscription cancellation')
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error handling subscription deletion:', error)
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Extract subscription ID from invoice lines if available
  const subscriptionId = invoice.lines?.data?.find(line => line.subscription)?.subscription as string | undefined
  
  // console.log('💰 Invoice payment succeeded:', {
  //   invoiceId: invoice.id,
  //   subscriptionId: subscriptionId || null,
  //   customerId: invoice.customer,
  //   amount: invoice.amount_paid,
  //   currency: invoice.currency,
  //   status: invoice.status
  // })
  
  // Get subscription details to check metadata
  if (subscriptionId) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      
      // console.log('📋 Subscription details:', {
      //   subscriptionId: subscription.id,
      //   customerId: subscription.customer,
      //   status: subscription.status,
      //   metadata: subscription.metadata
      // })
      
      const { userId, paymentType, verificationTier } = subscription.metadata || {}
      
      // Handle contractor verification for subscription payments
      if (userId && (verificationTier === 'verified' || paymentType === 'contractor_verification')) {
        // console.log(`✅ Processing subscription-based contractor verification for user ${userId}`, {
        //   verificationTier,
        //   paymentType,
        //   subscriptionId: subscription.id,
        //   invoiceId: invoice.id
        // })
        
        try {
          const supabase = await createSupabaseClient()
          
          // Check current status
          const { data: currentData, error: fetchError } = await supabase
            .from('users')
            .select('is_verified_contractor, email')
            .eq('id', userId)
            .single()
          
          if (fetchError) {
            console.error('❌ Error fetching current user status:', fetchError)
          } else {
            // console.log('📊 Current user status before subscription verification:', currentData)
          }
          
          // Update verification status
          const { error } = await supabase
            .from('users')
            .update({
              is_verified_contractor: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId)

          if (error) {
            console.error('❌ Database update failed for subscription:', error)
            throw new Error(`Failed to update verification status: ${error.message}`)
          }
          
          // Verify the update
          const { data: updatedData, error: verifyError } = await supabase
            .from('users')
            .select('is_verified_contractor, email, updated_at')
            .eq('id', userId)
            .single()
          
          if (verifyError) {
            console.error('❌ Error verifying subscription update:', verifyError)
          } else {
            // console.log('📊 User status after subscription verification:', updatedData)
          }
          
          // console.log(`✅ Successfully verified contractor ${userId} via subscription payment`)
        } catch (error) {
          console.error(`❌ Failed to update verification status for subscription user ${userId}:`, error)
        }
      } else {
        // console.log('ℹ️ Subscription payment does not qualify for verification:', {
        //   userId,
        //   verificationTier,
        //   paymentType,
        //   subscriptionId: subscription.id
        // })
      }
    } catch (error) {
      console.error('❌ Error retrieving subscription details:', error)
    }
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // console.log('❌ Invoice payment failed:', invoice.id)
  
  try {
    const supabase = await createSupabaseClient()
    
    // Update subscription status to past_due
    const subscription = (invoice as { subscription?: string }).subscription
    if (subscription) {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscription)

      if (error) {
        console.error('❌ Failed to update subscription status:', error)
      } else {
        // console.log('✅ Subscription status updated to past_due')
      }
    }
  } catch (error) {
    console.error('❌ Failed to handle invoice payment failed:', error)
  }
}
