import * as React from "react"

interface ErrorDisplayProps {
  error: string
}

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  if (!error) return null

  return (
    <div className="bg-white dark:bg-[#141414] rounded-lg border border-red-200 dark:border-red-900/40 p-4">
      <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-md text-red-700 dark:text-red-400 text-sm">
        {error}
      </div>
    </div>
  )
}
