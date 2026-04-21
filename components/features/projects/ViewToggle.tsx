'use client'

import { Button } from '@/components/ui/button'
import { Map, Grid3X3, List } from 'lucide-react'

interface ViewToggleProps {
  currentView: 'map' | 'grid' | 'list'
  onViewChange: (view: 'map' | 'grid' | 'list') => void
}

export default function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
      <Button
        variant={currentView === 'map' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('map')}
        className={`h-8 px-3 ${
          currentView === 'map' 
            ? 'bg-orange-500 hover:bg-orange-600 text-white' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-white'
        }`}
      >
        <Map className="h-4 w-4 mr-1" />
        Map
      </Button>
      <Button
        variant={currentView === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('grid')}
        className={`h-8 px-3 ${
          currentView === 'grid' 
            ? 'bg-orange-500 hover:bg-orange-600 text-white' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-white'
        }`}
      >
        <Grid3X3 className="h-4 w-4 mr-1" />
        Grid
      </Button>
      <Button
        variant={currentView === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('list')}
        className={`h-8 px-3 ${
          currentView === 'list' 
            ? 'bg-orange-500 hover:bg-orange-600 text-white' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-white'
        }`}
      >
        <List className="h-4 w-4 mr-1" />
        List
      </Button>
    </div>
  )
}


