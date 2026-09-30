'use client'

import { Button } from '@/components/ui/button'
import { Map, Grid3X3, List } from 'lucide-react'

interface ViewToggleProps {
  currentView: 'map' | 'grid' | 'list'
  onViewChange: (view: 'map' | 'grid' | 'list') => void
}

export default function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  const inactive = 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/10'
  const active = 'bg-orange-500 hover:bg-orange-600 text-white'

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-white/10 rounded-lg border border-gray-200 dark:border-white/10">
      <Button
        variant={currentView === 'map' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('map')}
        className={`h-8 px-3 ${currentView === 'map' ? active : inactive}`}
      >
        <Map className="h-4 w-4 mr-1" />
        Map
      </Button>
      <Button
        variant={currentView === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('grid')}
        className={`h-8 px-3 ${currentView === 'grid' ? active : inactive}`}
      >
        <Grid3X3 className="h-4 w-4 mr-1" />
        Grid
      </Button>
      <Button
        variant={currentView === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('list')}
        className={`h-8 px-3 ${currentView === 'list' ? active : inactive}`}
      >
        <List className="h-4 w-4 mr-1" />
        List
      </Button>
    </div>
  )
}
