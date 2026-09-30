'use client'

import { Clock, CheckCircle, Target, DollarSign } from 'lucide-react'

interface ContractorStatsProps {
  stats: {
    activeProposals: number
    acceptedProposals: number
    totalEarnings: number
    winRate: number
  }
}

export default function ContractorStats({ stats }: ContractorStatsProps) {
  const statItems = [
    {
      title: 'Submitted Proposals',
      value: stats.activeProposals.toLocaleString(),
      icon: Clock,
      description: 'Awaiting review',
      subtitle: 'Proposals submitted'
    },
    {
      title: 'Accepted Proposals',
      value: stats.acceptedProposals.toLocaleString(),
      icon: CheckCircle,
      description: 'Projects won',
      subtitle: 'Successfully awarded'
    },
    {
      title: 'Win Rate',
      value: `${stats.winRate}%`,
      icon: Target,
      description: 'Success rate',
      subtitle: 'Proposals accepted'
    },
    {
      title: 'Total Earnings',
      value: `$${stats.totalEarnings.toLocaleString()}`,
      icon: DollarSign,
      description: 'From accepted projects',
      subtitle: 'Lifetime earnings'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item, index) => (
        <div key={index} className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/10 rounded-lg p-5 hover:shadow-lg transition-all duration-200 shadow-md shadow-orange-100/50 dark:shadow-none">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{item.title}</h3>
            <div className="flex items-center space-x-1">
              <item.icon className="h-7 w-7 text-orange-500" />
            </div>
          </div>
          
          <div className="mb-3">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {item.value}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <item.icon className="h-3 w-3 text-orange-400" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{item.description}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{item.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
