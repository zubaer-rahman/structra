import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST() {
  try {
    console.log('🔍 Checking for expired subscriptions...')
    
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
        message: 'No expired subscriptions found',
        processed: 0
      })
    }
    
    console.log(`📊 Found ${expiredSubscriptions.length} expired subscription(s)`)
    
    const results = []
    
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
          results.push({
            subscriptionId: subscription.id,
            contractorId: subscription.contractor,
            success: false,
            error: 'Failed to update user verification status'
          })
          continue
        }
        
        console.log(`✅ Expired subscription ${subscription.id} for contractor ${subscription.contractor}`)
        results.push({
          subscriptionId: subscription.id,
          contractorId: subscription.contractor,
          success: true,
          endDate: subscription.end_date
        })
        
      } catch (error) {
        console.error(`❌ Error processing subscription ${subscription.id}:`, error)
        results.push({
          subscriptionId: subscription.id,
          contractorId: subscription.contractor,
          success: false,
          error: 'Processing error'
        })
      }
    }
    
    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length
    
    console.log(`📊 Processed ${expiredSubscriptions.length} expired subscriptions: ${successCount} success, ${failureCount} failures`)
    
    return NextResponse.json({
      message: 'Subscription expiration check completed',
      processed: expiredSubscriptions.length,
      successful: successCount,
      failed: failureCount,
      results
    })
    
  } catch (error) {
    console.error('❌ Error in subscription expiration check:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint for manual checks
export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // Get subscription statistics
    const { data: activeSubscriptions, error: activeError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('is_active', 'yes')
    
    const { data: expiredSubscriptions, error: expiredError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('is_active', 'yes')
      .lt('end_date', today)
    
    if (activeError || expiredError) {
      return NextResponse.json(
        { error: 'Failed to fetch subscription data' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      currentDate: today,
      activeSubscriptions: activeSubscriptions?.length || 0,
      expiredSubscriptions: expiredSubscriptions?.length || 0,
      expiredDetails: expiredSubscriptions?.map(sub => ({
        id: sub.id,
        contractor: sub.contractor,
        endDate: sub.end_date,
        planName: sub.plan_name
      })) || []
    })
    
  } catch (error) {
    console.error('❌ Error getting subscription status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}