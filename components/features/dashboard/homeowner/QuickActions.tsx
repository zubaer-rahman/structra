'use client'

import { Plus, Briefcase, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useHomeownerProfileStatus } from '@/hooks/useHomeownerProfileStatus'

interface QuickActionsProps {
  proposalsCount: number
}

export default function QuickActions({ proposalsCount }: QuickActionsProps) {
  const { canPostProject, isProfileComplete, isGovernmentIdVerified, loading } = useHomeownerProfileStatus();

  const PostProjectCard = () => {
    const cardContent = (
      <div className="relative overflow-hidden rounded-lg bg-white border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-300">
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-orange-50 transition-colors">
              <Plus className="h-6 w-6 text-gray-600 group-hover:text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Create New Project</h3>
          </div>
          <p className="text-gray-600 text-sm mb-6 leading-relaxed">
            Post your project details and get proposals from qualified contractors. Start your home improvement journey today!
          </p>
          <Button 
            className={`border-0 transition-all duration-200 font-semibold ${
              canPostProject 
                ? 'bg-gray-900 hover:bg-black text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!canPostProject}
          >
            {loading ? 'Loading...' : 'Post Project'}
          </Button>
          {!canPostProject && !loading && (
            <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>
                {!isProfileComplete 
                  ? 'Complete your profile to post projects'
                  : !isGovernmentIdVerified 
                    ? 'Wait for your ID to be verified'
                    : 'Unable to post projects'
                }
              </span>
            </div>
          )}
        </div>
      </div>
    );

    if (canPostProject) {
      return (
        <Link href="/homeowner/projects/create" className="flex-1 group">
          {cardContent}
        </Link>
      );
    }

    return (
      <div className="flex-1 group cursor-not-allowed">
        {cardContent}
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <PostProjectCard />

      <Link href="/homeowner/proposals" className="flex-1 group">
        <div className="relative overflow-hidden rounded-lg bg-white border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:border-orange-300">
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <Briefcase className="h-6 w-6 text-gray-600 group-hover:text-gray-700" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Review Proposals</h3>
              </div>
              {proposalsCount > 0 && (
                <div className="bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded-full">
                  {proposalsCount} pending
                </div>
              )}
            </div>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              Check proposals from contractors for your projects. Compare bids and choose the perfect match!
            </p>
            <Button className="bg-gray-900 hover:bg-black text-white border-0 transition-all duration-200 font-semibold">
              View Proposals
            </Button>
          </div>
        </div>
      </Link>
    </div>
  )
}
