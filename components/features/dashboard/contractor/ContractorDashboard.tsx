'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

import ContractorStats from './ContractorStats'
import RecentProposals from './RecentProposals'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingSpinner, ProfileCompletionWarning } from '@/components/shared'

interface Proposal {
  id: string
  title: string
  status: string
  subtotal_amount: number | null
  total_amount: number | null
  created_at: string
  description_of_work: string
  proposed_start_date: string | null
  proposed_end_date: string | null
  project?: {
    id: string
    project_title: string
    statement_of_work: string
    category: string
    location: string
    status: string
    budget: number | null
    creator: string
  }
}

export default function ContractorDashboard() {
  const { user } = useAuth()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)

  // Function to capitalize first letter of each word
  const capitalizeWords = (str: string) => {
    return str.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
  }

  const fetchData = useCallback(async () => {
    try {
      const supabase = createClient()
      const currentUser = user || (await supabase.auth.getUser()).data.user
      
      if (!currentUser) {
        setLoading(false)
        return
      }
      

      // Fetch contractor's proposals
      try {
        const { data: proposalsData, error: proposalsError } = await supabase
          .from('proposals')
          .select(`
            id,
            title,
            status,
            subtotal_amount,
            total_amount,
            created_at,
            description_of_work,
            proposed_start_date,
            proposed_end_date,
            project:projects (
              id,
              project_title,
              statement_of_work,
              category,
              location,
              status,
              budget,
              creator
            )
          `)
          .eq('contractor', currentUser.id)
          .eq('is_deleted', 'no')
          .order('created_at', { ascending: false })
        
        if (proposalsError) {
          console.warn('Proposals table query failed:', proposalsError)
          setProposals([])
        } else {
          // Transform the data to match our Proposal interface
          const transformedProposals = (proposalsData || []).map(proposal => ({
            ...proposal,
            project: Array.isArray(proposal.project) ? proposal.project[0] : proposal.project
          }))
          setProposals(transformedProposals as Proposal[])
        }
      } catch (proposalsError) {
        console.warn('Proposals table might not exist yet:', proposalsError)
        setProposals([])
      }
      
    } catch (error) {
      // Only log errors if we have a user (avoid logging auth-related errors)
      if (user) {
        console.error('Error fetching contractor dashboard data:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
      }
      // Don't set error state - render dashboard with empty data instead
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="min-h-screen bg-white relative">
        <div className="relative flex items-center justify-center min-h-screen">
          <LoadingSpinner 
            text="Loading Your Dashboard"
            subtitle="Preparing your contractor overview..."
            size="lg"
            variant="default"
            className="text-center"
          />
        </div>
      </div>
    )
  }

  // Calculate contractor statistics
  const submittedProposals = proposals.filter(p => ['submitted', 'viewed'].includes(p.status)).length
  const acceptedProposals = proposals.filter(p => p.status === 'accepted').length
  const winRate = proposals.length > 0 ? Math.round((acceptedProposals / proposals.length) * 100) : 0
  
  // Calculate earnings from accepted proposals
  const totalEarnings = proposals
    .filter(p => p.status === 'accepted')
    .reduce((sum, p) => sum + (p.total_amount || p.subtotal_amount || 0), 0)

  const stats = {
    activeProposals: submittedProposals,
    acceptedProposals,
    totalEarnings,
    winRate
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-6">
        {/* Dashboard Content */}
        <div className="space-y-6">
          {/* Profile Completion Warning */}
          <ProfileCompletionWarning />

          {/* Greeting */}
          <div className="mb-4">
            <h1 className="text-sm font-medium text-gray-800">
              Hello, {user?.user_metadata?.full_name ? capitalizeWords(user.user_metadata.full_name) : user?.email?.split('@')[0] ? capitalizeWords(user.email.split('@')[0]) : 'There'}
            </h1>
            <p className="text-xs text-gray-600 mt-1">Welcome to your contractor dashboard</p>
          </div>

          {/* Contractor Statistics */}
          <ContractorStats stats={stats} />

          {/* Recent Proposals */}
          <RecentProposals proposals={proposals} />
        </div>
      </div>
    </div>
  )
}