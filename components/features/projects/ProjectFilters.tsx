'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Filter, Search, Calendar, DollarSign, MapPin } from 'lucide-react'

interface ProjectFiltersProps {
  onFiltersChange: (filters: ProjectFilters) => void
  className?: string
}

export interface ProjectFilters {
  search: string
  status: string
  budgetMin: string
  budgetMax: string
  dateFrom: string
  dateTo: string
  location: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

const defaultFilters: ProjectFilters = {
  search: '',
  status: 'all',
  budgetMin: '',
  budgetMax: '',
  dateFrom: '',
  dateTo: '',
  location: '',
  sortBy: 'created_at',
  sortOrder: 'desc'
}

export default function ProjectFilters({ onFiltersChange, className = '' }: ProjectFiltersProps) {
  const [filters, setFilters] = useState<ProjectFilters>(defaultFilters)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleFilterChange = (key: keyof ProjectFilters, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleSortChange = (sortBy: string) => {
    const newFilters = { ...filters, sortBy }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleSortOrderChange = (sortOrder: 'asc' | 'desc') => {
    const newFilters = { ...filters, sortOrder }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    setFilters(defaultFilters)
    onFiltersChange(defaultFilters)
  }

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== 'all' && value !== 'created_at' && value !== 'desc'
  )

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-lg">Filters & Search</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs">
                {Object.values(filters).filter(v => v !== '' && v !== 'all' && v !== 'created_at' && v !== 'desc').length} active
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
        <CardDescription>
          Refine your project search with advanced filters
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Basic Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search Projects</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              id="search"
              placeholder="Search by title, description, or location..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <>
            {/* Budget Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budgetMin">Min Budget</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="budgetMin"
                    type="number"
                    placeholder="0"
                    value={filters.budgetMin}
                    onChange={(e) => handleFilterChange('budgetMin', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="budgetMax">Max Budget</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="budgetMax"
                    type="number"
                    placeholder="1000000"
                    value={filters.budgetMax}
                    onChange={(e) => handleFilterChange('budgetMax', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateFrom">From Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="dateFrom"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo">To Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="dateTo"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="location"
                  placeholder="Filter by location..."
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Sorting */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sortBy">Sort By</Label>
                <Select value={filters.sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Created Date</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="budget">Budget</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Select value={filters.sortOrder} onValueChange={handleSortOrderChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Clear All
          </Button>
          
          <div className="text-sm text-muted-foreground">
            {hasActiveFilters && (
              <span>
                {Object.values(filters).filter(v => v !== '' && v !== 'all' && v !== 'created_at' && v !== 'desc').length} filters active
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
