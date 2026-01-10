'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ResultsSummaryProps {
  startIndex: number
  endIndex: number
  totalItems: number
  itemsPerPage: number
  onItemsPerPageChange: (value: string) => void
  showItemsPerPage?: boolean
  className?: string
}

export default function ResultsSummary({
  startIndex,
  endIndex,
  totalItems,
  itemsPerPage,
  onItemsPerPageChange,
  showItemsPerPage = true,
  className = ''
}: ResultsSummaryProps) {
  return (
    <div className={`flex items-center justify-between text-sm text-muted-foreground ${className}`}>
      <span>
        Showing {startIndex + 1}-{Math.min(endIndex, totalItems)}{" "}
        of {totalItems} {totalItems === 1 ? 'item' : 'items'}
      </span>
      {showItemsPerPage && (
        <div className="flex items-center gap-2">
          <span>Items per page:</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={onItemsPerPageChange}
          >
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
