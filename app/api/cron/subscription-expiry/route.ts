import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const cronSecret = process.env.CRON_SECRET || 'default-secret'

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const providedSecret = authHeader?.replace('Bearer ', '')
    
    if (providedSecret !== cronSecret) {
      console.log('❌ Unauthorized cron request')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.log('🕐 Running scheduled subscription expiry check...')
    
    // Get current date
    const today = new Date().toISOString().split('T')[0]
    
    // Find active subscriptions that have expired
    const { data: expiredSubscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('is_active', 'yes')
      .lt('end_date', today)
    
    if (fetchError) {
      console.error('❌ Error fetching expired subscriptions:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch expired subscriptions' },
        { status: 500 }
      )
    }
    
    if (!expiredSubscriptions || expiredSubscriptions.length === 0) {
      console.log('✅ No expired subscriptions found')
      return NextResponse.json({
        success: true,
        message: 'No expired subscriptions found',
        processed: 0,
        timestamp: new Date().toISOString()
      })
    }
    
    console.log(`📊 Found ${expiredSubscriptions.length} expired subscription(s) to process`)
    
    const results = []
    let successCount = 0
    let failureCount = 0
    
    for (const subscription of expiredSubscriptions) {
      try {
        // Update subscription to inactive
        const { error: updateSubError } = await supabase
          .from('subscriptions')
          .update({
            is_active: 'no',
            cancelled_at: today,
            cancellation_reason: 'Subscription expired after 1 year',
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id)
        
        if (updateSubError) {
          console.error(`❌ Failed to update subscription ${subscription.id}:`, updateSubError)
          failureCount++
          results.push({
            subscriptionId: subscription.id,
            contractorId: subscription.contractor,
            success: false,
            error: 'Failed to update subscription'
          })
          continue
        }
        
        // Update contractor verification status to false
        const { error: updateUserError } = await supabase
          .from('users')
          .update({
            is_verified_contractor: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.contractor)
        
        if (updateUserError) {
          console.error(`❌ Failed to update user ${subscription.contractor}:`, updateUserError)
          failureCount++
          results.push({
            subscriptionId: subscription.id,
            contractorId: subscription.contractor,
            success: false,
            error: 'Failed to update user verification status'
          })
          continue
        }
        
        successCount++
        console.log(`✅ Successfully expired subscription ${subscription.id} for contractor ${subscription.contractor}`)
        results.push({
          subscriptionId: subscription.id,
          contractorId: subscription.contractor,
          success: true,
          endDate: subscription.end_date,
          planName: subscription.plan_name
        })
        
      } catch (error) {
        console.error(`❌ Error processing subscription ${subscription.id}:`, error)
        failureCount++
        results.push({
          subscriptionId: subscription.id,
          contractorId: subscription.contractor,
          success: false,
          error: 'Processing error'
        })
      }
    }
    
    const summary = {
      success: true,
      message: 'Subscription expiry check completed',
      timestamp: new Date().toISOString(),
      processed: expiredSubscriptions.length,
      successful: successCount,
      failed: failureCount,
      results
    }
    
    console.log(`📊 Cron job completed: ${successCount} success, ${failureCount} failures`)
    
    return NextResponse.json(summary)
    
  } catch (error) {
    console.error('❌ Error in subscription expiry cron job:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// GET endpoint for health check
export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // Get subscription statistics
    const { data: activeSubscriptions, error: activeError } = await supabase
      .from('subscriptions')
      .select('id, contractor, end_date, plan_name')
      .eq('is_active', 'yes')
    
    if (activeError) {
      return NextResponse.json(
        { error: 'Failed to fetch subscription data' },
        { status: 500 }
      )
    }
    
    const expiredCount = activeSubscriptions?.filter(sub => sub.end_date < today).length || 0
    const activeCount = (activeSubscriptions?.length || 0) - expiredCount
    
    return NextResponse.json({
      status: 'healthy',
      currentDate: today,
      activeSubscriptions: activeCount,
      expiredSubscriptions: expiredCount,
      totalSubscriptions: activeSubscriptions?.length || 0,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error in cron health check:', error)
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}