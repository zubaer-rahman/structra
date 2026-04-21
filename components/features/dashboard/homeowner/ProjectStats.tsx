'use client'

import { Building2, CheckCircle, Target, Clock } from 'lucide-react'

interface ProjectStatsProps {
  stats: {
    total: number
    open: number
    accepted: number
    completed: number
  }
}

export default function ProjectStats({ stats }: ProjectStatsProps) {
  const statItems = [
    {
      title: 'Total Projects',
      value: stats.total.toLocaleString(),
      icon: Building2,
      description: 'Growing this month',
      subtitle: 'All active projects'
    },
    {
      title: 'Open Bids',
      value: stats.open.toLocaleString(),
      icon: Clock,
      description: 'Bidding needs attention',
      subtitle: 'Active proposals'
    },
    {
      title: 'Accepted Proposals',
      value: stats.accepted.toLocaleString(),
      icon: CheckCircle,
      description: 'Proposals you have accepted',
      subtitle: 'Ready to start work'
    },
    {
      title: 'Completed Projects',
      value: stats.completed.toLocaleString(),
      icon: Target,
      description: 'Successfully finished',
      subtitle: 'Projects completed'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((item, index) => (
        <div key={index} className="bg-white border border-gray-100 rounded-lg p-6 hover:shadow-lg transition-all duration-200 shadow-md shadow-orange-100/50">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">{item.title}</h3>
            <div className="flex items-center space-x-1">
              <item.icon className="h-7 w-7 text-orange-500" />
            </div>
          </div>
          
          <div className="mb-4">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {item.value}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <item.icon className="h-3 w-3 text-orange-400" />
              <span className="text-xs font-medium text-gray-700">{item.description}</span>
            </div>
            <p className="text-xs text-gray-500">{item.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
