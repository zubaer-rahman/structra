'use client'

interface StatusOverviewProps {
  stats: {
    open: number
    bidding: number
    awarded: number
    completed: number
    cancelled: number
  }
}

export default function StatusOverview({ stats }: StatusOverviewProps) {
  const statusItems = [
    { label: 'Open', count: stats.open, color: 'bg-gray-500' },
    { label: 'Bidding', count: stats.bidding, color: 'bg-orange-500' },
    { label: 'Awarded', count: stats.awarded, color: 'bg-orange-500' },
    { label: 'Completed', count: stats.completed, color: 'bg-gray-900' },
    { label: 'Cancelled', count: stats.cancelled, color: 'bg-gray-500' }
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Project Status Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statusItems.map((item, index) => (
          <div key={index} className="text-center p-4 border rounded-lg">
            <div className={`w-3 h-3 ${item.color} rounded-full mx-auto mb-2`}></div>
            <div className="font-semibold text-lg">{item.count}</div>
            <div className="text-sm text-muted-foreground">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
