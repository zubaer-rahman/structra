'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  FileText, 
  DollarSign, 
  BarChart3, 
  Shield, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  UserCheck,
  FileCheck,
  Wrench
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const router = useRouter()

  const stats = [
    {
      title: 'Total Users',
      value: '1,234',
      change: '+12%',
      changeType: 'positive' as const,
      icon: Users,
      description: 'Active platform users'
    },
    {
      title: 'Pending Verifications',
      value: '23',
      change: '+5',
      changeType: 'neutral' as const,
      icon: Clock,
      description: 'Awaiting review'
    },
    {
      title: 'Active Projects',
      value: '456',
      change: '+8%',
      changeType: 'positive' as const,
      icon: FileText,
      description: 'Currently in progress'
    },
    {
      title: 'Revenue',
      value: '$12,345',
      change: '+15%',
      changeType: 'positive' as const,
      icon: DollarSign,
      description: 'This month'
    }
  ]

  const quickActions = [
    {
      title: 'Identity Verification',
      description: 'Review user identity documents',
      icon: UserCheck,
      href: '/admin/identity-verification',
      color: 'bg-blue-500',
      count: 12
    },
    {
      title: 'Project Verification',
      description: 'Verify project authenticity',
      icon: FileCheck,
      href: '/admin/project-verification',
      color: 'bg-green-500',
      count: 8
    },
    {
      title: 'Contractor Verification',
      description: 'Approve contractor applications',
      icon: Wrench,
      href: '/admin/contractor-verification',
      color: 'bg-orange-500',
      count: 15
    }
  ]

  const recentActivity = [
    {
      id: 1,
      type: 'verification',
      message: 'New contractor verification request from John Smith',
      time: '2 minutes ago',
      status: 'pending'
    },
    {
      id: 2,
      type: 'project',
      message: 'Project "Kitchen Renovation" marked as completed',
      time: '15 minutes ago',
      status: 'completed'
    },
    {
      id: 3,
      type: 'user',
      message: 'New user registration: Sarah Johnson',
      time: '1 hour ago',
      status: 'new'
    },
    {
      id: 4,
      type: 'verification',
      message: 'Identity verification approved for Mike Wilson',
      time: '2 hours ago',
      status: 'approved'
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50">Pending</Badge>
      case 'completed':
        return <Badge className="bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-400 border-green-200 dark:border-green-900/50">Completed</Badge>
      case 'new':
        return <Badge className="bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-900/50">New</Badge>
      case 'approved':
        return <Badge className="bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-400 border-green-200 dark:border-green-900/50">Approved</Badge>
      default:
        return <Badge className="bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-zinc-700">{status}</Badge>
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'verification':
        return <Shield className="h-4 w-4 text-blue-500" />
      case 'project':
        return <FileText className="h-4 w-4 text-green-500" />
      case 'user':
        return <Users className="h-4 w-4 text-purple-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and monitor platform operations</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-400 border-green-200 dark:border-green-900/50">
            <CheckCircle className="h-3 w-3 mr-1" />
            System Online
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{stat.description}</p>
                  </div>
                  <div className="p-3 bg-gray-100 dark:bg-zinc-800 rounded-full">
                    <Icon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600 dark:text-green-400' : 
                    stat.changeType === 'neutral' ? 'text-gray-600 dark:text-gray-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">from last month</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Manage platform verifications and approvals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
                  onClick={() => router.push(action.href)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${action.color} text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{action.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{action.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{action.count}</Badge>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest platform activities and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 border dark:border-zinc-800 rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100">{activity.message}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                      {getStatusBadge(activity.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" className="w-full">
                View All Activity
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
