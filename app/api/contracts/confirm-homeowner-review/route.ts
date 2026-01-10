import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { proposalId, userId } = await request.json()

    if (!proposalId) {
      return NextResponse.json({ error: 'Proposal ID is required' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify the proposal belongs to the current user (homeowner)
    const { data: proposal, error: fetchError } = await supabase
      .from('proposals')
      .select('id, homeowner, status')
      .eq('id', proposalId)
      .eq('homeowner', userId)
      .single()

    if (fetchError || !proposal) {
      return NextResponse.json({ error: 'Proposal not found or access denied' }, { status: 404 })
    }

    // Only allow confirming review for accepted proposals
    if (proposal.status !== 'accepted') {
      return NextResponse.json({ error: 'Can only confirm review for accepted proposals' }, { status: 400 })
    }

    // Update the homeowner_contract_reviewed status and timestamp
    const { error: updateError } = await supabase
      .from('proposals')
      .update({ 
        homeowner_contract_reviewed: true,
        homeowner_contract_reviewed_at: new Date().toISOString()
      })
      .eq('id', proposalId)
      .eq('homeowner', userId)

    if (updateError) {
      console.error('Error updating homeowner_contract_reviewed:', updateError)
      return NextResponse.json({ error: 'Failed to update homeowner contract review status' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Homeowner contract review confirmed successfully' 
    })

  } catch (error) {
    console.error('Error in confirm-homeowner-review API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
