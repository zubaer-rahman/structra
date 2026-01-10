'use client'

import { ReactNode } from 'react'

interface AuthHeroProps {
  title: ReactNode
  description: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

export function AuthHero({ title, description, maxWidth = 'md' }: AuthHeroProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  }

  return (
    <div className={`text-center ${maxWidthClasses[maxWidth]} mx-auto`}>
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
        {title}
      </h1>
      <p className="text-lg text-gray-600 leading-relaxed">
        {description}
      </p>
    </div>
  )
}
