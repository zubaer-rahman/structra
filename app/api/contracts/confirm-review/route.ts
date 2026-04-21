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

    // Verify the proposal belongs to the current user (contractor)
    const { data: proposal, error: fetchError } = await supabase
      .from('proposals')
      .select('id, contractor, status')
      .eq('id', proposalId)
      .eq('contractor', userId)
      .single()

    if (fetchError || !proposal) {
      return NextResponse.json({ error: 'Proposal not found or access denied' }, { status: 404 })
    }

    // Only allow confirming review for accepted proposals
    if (proposal.status !== 'accepted') {
      return NextResponse.json({ error: 'Can only confirm review for accepted proposals' }, { status: 400 })
    }

    // Update the contract_reviewed status and timestamp
    const { error: updateError } = await supabase
      .from('proposals')
      .update({ 
        contract_reviewed: true,
        contract_reviewed_at: new Date().toISOString()
      })
      .eq('id', proposalId)
      .eq('contractor', userId)

    if (updateError) {
      console.error('Error updating contract_reviewed:', updateError)
      return NextResponse.json({ error: 'Failed to update contract review status' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Contract review confirmed successfully' 
    })

  } catch (error) {
    console.error('Error in confirm-review API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

