'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Home, Briefcase, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { USER_ROLES } from '@/utils/constants'

interface RoleSelectorProps {
  onRoleSelect?: (role: string) => void
}

export default function RoleSelector({ onRoleSelect }: RoleSelectorProps) {
  const router = useRouter()

  const handleRoleSelection = (role: string) => {
    if (onRoleSelect) {
      onRoleSelect(role)
    } else {
      // Default navigation behavior
      router.push(`/${role}/dashboard`)
    }
  }

  const roles = [
    {
      id: USER_ROLES.HOMEOWNER,
      title: 'Homeowner',
      description: 'Post projects and manage home improvements',
      icon: Home,
      color: 'bg-gray-900',
      hoverColor: 'hover:bg-black',
      features: [
        'Post new projects',
        'Review contractor proposals',
        'Track project progress',
        'Manage payments'
      ]
    },
    {
      id: USER_ROLES.CONTRACTOR,
      title: 'Contractor',
      description: 'Find projects and submit proposals',
      icon: Briefcase,
      color: 'bg-gray-900',
      hoverColor: 'hover:bg-black',
      features: [
        'Browse available projects',
        'Submit competitive proposals',
        'Manage your business',
        'Build your reputation'
      ]
    },
    {
      id: USER_ROLES.ADMIN,
      title: 'Administrator',
      description: 'Manage platform and oversee operations',
      icon: Shield,
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600',
      features: [
        'User management',
        'Platform oversight',
        'System monitoring',
        'Content moderation'
      ]
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Choose Your Role</h1>
        <p className="text-muted-foreground text-lg">
          Select the appropriate dashboard based on your role in the system
        </p>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {roles.map((role) => {
          const Icon = role.icon
          return (
            <Card 
              key={role.id} 
              className="hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-gray-300"
              onClick={() => handleRoleSelection(role.id)}
            >
              <CardHeader className="text-center pb-4">
                <div className={`mx-auto p-4 rounded-full ${role.color} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-8 w-8" />
                </div>
                <CardTitle className="text-2xl">{role.title}</CardTitle>
                <CardDescription className="text-base">
                  {role.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700">Key Features:</h4>
                  <ul className="space-y-1">
                    {role.features.map((feature, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center">
                        <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mr-2"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button 
                  className={`w-full ${role.color} ${role.hoverColor} text-white transition-colors duration-300`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRoleSelection(role.id)
                  }}
                >
                  Enter as {role.title}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Additional Info */}
      <div className="text-center text-sm text-gray-500 max-w-2xl mx-auto">
        <p>
          Your role determines the features and functionality available to you. 
          You can always switch roles later from your account settings.
        </p>
      </div>
    </div>
  )
}