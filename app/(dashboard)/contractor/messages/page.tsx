'use client'

import Link from 'next/link'
import { MessageSquare, ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ContractorMessagesPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <MessageSquare className="mx-auto h-24 w-24 text-gray-300" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Messages
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Communicate with clients and team members
          </p>
          <p className="mt-1 text-sm text-gray-500">
            This feature is coming soon!
          </p>
        </div>

        <div className="mt-8 flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 sm:justify-center">
          <Button
            asChild
            className="flex items-center justify-center px-4 py-2"
          >
            <Link href="/contractor/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="flex items-center justify-center px-4 py-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  )
}