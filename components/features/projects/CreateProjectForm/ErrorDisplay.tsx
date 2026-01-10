import * as React from "react"

interface ErrorDisplayProps {
  error: string
}

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  if (!error) return null

  return (
    <div className="bg-white rounded-lg border border-red-200 p-4">
      <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
        {error}
      </div>
    </div>
  )
}
