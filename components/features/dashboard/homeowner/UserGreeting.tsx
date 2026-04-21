'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Home } from 'lucide-react'
import RandomAvatar from '@/components/ui/random-avatar'

interface UserGreetingProps {
  userEmail?: string
}

export default function UserGreeting({ userEmail }: UserGreetingProps) {
  const { user } = useAuth()
  
  // Use full_name if available, otherwise fall back to email-based firstName
  const displayName = user?.full_name || (userEmail ? userEmail.split('@')[0] : 'Homeowner')
  
  const currentHour = new Date().getHours()
  const getGreeting = () => {
    if (currentHour < 12) return 'Good morning'
    if (currentHour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const getGreetingEmoji = () => {
    if (currentHour < 12) return '🌅'
    if (currentHour < 18) return '☀️'
    return '🌙'
  }

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    })
  }
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
        {/* Main Greeting Section */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 lg:gap-8">
          <div className="space-y-4 lg:space-y-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <RandomAvatar 
                  name={displayName}
                  size={80}
                  className="transform hover:scale-105 transition-all duration-300"
                />
              </div>
              <div className="space-y-2 lg:space-y-3 text-center sm:text-left mt-4">
                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3">
                  <span className="text-3xl sm:text-4xl lg:text-5xl">{getGreetingEmoji()}</span>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 leading-tight">
                    {getGreeting()}, {displayName}!
                  </h1>
                </div>
              </div>
            </div>
          </div>

          {/* Clean Quick Stats */}
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <Card className="bg-gray-50 border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-3 sm:p-4">
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <Badge className="bg-orange-500 text-white border-0 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold">
                      <Home className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      Homeowner
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-900 rounded-lg sm:rounded-xl flex items-center justify-center">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs sm:text-sm font-medium">Today</p>
                      <p className="text-gray-900 font-semibold text-xs sm:text-sm leading-tight">
                        {getCurrentDate()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
