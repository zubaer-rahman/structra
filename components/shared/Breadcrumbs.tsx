'use client'

import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { USER_ROLES } from '@/utils/constants'

interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
  className?: string
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const pathname = usePathname()
  const { user, userRole, loading } = useAuth()
  
  // Generate breadcrumbs from pathname if no items provided
  const breadcrumbItems = items || generateBreadcrumbsFromPath(pathname)

  if (breadcrumbItems.length === 0) return null

  // If still loading or no user, don't render breadcrumbs to avoid incorrect redirects
  if (loading || !user) return null

  // Get the user's role and determine dashboard path
  const role = userRole || user?.user_role
  if (!role) {
    return null // Don't render if we don't have a role yet
  }
  
  const dashboardPath = `/${role}/dashboard`
  

  return (
    <nav className={`flex items-center space-x-1 text-sm text-muted-foreground ${className}`} aria-label="Breadcrumb">
      {/* Home icon - redirects to role-based dashboard */}
      <Link 
        href={dashboardPath} 
        className="flex items-center hover:text-foreground transition-colors"
        aria-label={`Go to ${role} dashboard`}
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center space-x-1">
          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
          
          {item.href && index < breadcrumbItems.length - 1 ? (
            <Link
              href={item.href}
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              {item.icon && item.icon}
              <span>{item.label}</span>
            </Link>
          ) : (
            <span className="text-foreground font-medium flex items-center gap-1">
              {item.icon && item.icon}
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  )
}

// Helper function to generate breadcrumbs from pathname
function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []
  
  let currentPath = ''
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    
    // Skip certain segments that don't need breadcrumbs
    if (['dashboard', USER_ROLES.HOMEOWNER, USER_ROLES.CONTRACTOR, USER_ROLES.ADMIN].includes(segment)) {
      return
    }
    
    // Skip project IDs (UUIDs) - they're typically long alphanumeric strings
    if (segment.length > 20 && /^[a-f0-9-]+$/i.test(segment)) {
      return
    }
    
    // Format the label
    let label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    
    // Special cases for common routes
    const labelMap: Record<string, string> = {
      'projects': 'Projects',
      'create': 'Create Project',
      'edit': 'Edit Project',
      'view': 'View Project',
      'proposals': 'Proposals',
      'messages': 'Messages',
      'calendar': 'Calendar',
      'earnings': 'Earnings',
      'payments': 'Payments',
      'settings': 'Settings',
      'profile': 'Profile',
      'analytics': 'Analytics',
      'financials': 'Financials',
      'users': 'Users'
    }
    
    if (labelMap[segment]) {
      label = labelMap[segment]
    }
    
    // Don't make the last item clickable
    const href = index === segments.length - 1 ? undefined : currentPath
    
    breadcrumbs.push({ label, href })
  })
  
  return breadcrumbs
}
