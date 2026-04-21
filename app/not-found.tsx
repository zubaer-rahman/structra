'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  const { userRole } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">
            Page Not Found
          </h2>
          <p className="mt-2 text-lg text-gray-600">
            Sorry, we couldn&apos;t find the page you&apos;re looking for.
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
            <Link href={userRole ? `/${userRole}/dashboard` : '/dashboard'}>
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

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            If you believe this is an error, please contact support.
          </p>
        </div>
      </div>
    </div>
  )
}