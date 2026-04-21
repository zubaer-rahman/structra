'use client'

import { useMemo } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { ArrowUpDown, Calendar, MapPin, DollarSign, Clock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import { BaseProject } from '@/server/services/ProjectService'
import { getProjectStatusConfig } from '@/utils/helpers'
import { ProjectPaymentModal } from '@/components/shared/modals/ProjectPaymentModal'
import { VerificationRedirectModal } from '@/components/shared/modals/VerificationRedirectModal'
import { ProfileCompletionModal } from '@/components/shared/modals/ProfileCompletionModal'
import { useAuth } from '@/contexts/AuthContext'
import { trpc } from '@/utils/trpc'
import { validateContractorProfileForVerification } from '@/utils/validation'
import { toast } from 'sonner'

interface ContractorProjectTableProps {
  projects: BaseProject[]
  onProjectClick?: (project: BaseProject) => void
}

const columnHelper = createColumnHelper<BaseProject>()

export default function ContractorProjectTable({ 
  projects, 
  onProjectClick
}: ContractorProjectTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [showProfileCompletionModal, setShowProfileCompletionModal] = useState(false)
  const [paymentProject, setPaymentProject] = useState<BaseProject | null>(null)
  const { user } = useAuth()

  // Fetch user profile data
  const { data: userProfile, isLoading: userProfileLoading } = trpc.users.getProfile.useQuery(undefined, {
    enabled: !!user?.id,
  })
  
  // Fetch contractor profile data
  const { data: contractorProfile, isLoading: contractorProfileLoading } = trpc.users.getContractorProfile.useQuery(undefined, {
    enabled: !!user?.id,
  })
  
  // Get verification status
  const { data: verificationStatus, isLoading: verificationLoading } = trpc.users.checkVerificationStatus.useQuery(undefined, {
    enabled: !!user?.id,
  })

  // Handle payment modal close
  const handlePaymentModalClose = () => {
    setShowPaymentModal(false)
    setPaymentProject(null)
  }

  // Handle payment success
  const handlePaymentSuccess = () => {
    setShowPaymentModal(false)
    setPaymentProject(null)
    // Refresh the page to get updated project data
    window.location.reload()
    toast.success('Payment successful! You now have access to this project.')
  }

  // Handle row click - run all verification checks like card view
  const handleRowClick = async (project: BaseProject) => {
    if (!user) {
      toast.error('Please log in to view project details')
      return
    }
    
    // Wait for all data to load before performing validations
    if (userProfileLoading || contractorProfileLoading || verificationLoading) {
      return // Don't proceed if data is still loading
    }
    
    // Check profile completeness
    const profileValidation = validateContractorProfileForVerification(userProfile, contractorProfile)
    if (!profileValidation.isComplete) {
      setShowProfileCompletionModal(true)
      return
    }
    
    // Check verification status
    if (!verificationStatus?.isVerified) {
      toast.error('You need to be a verified contractor to view project details')
      setShowVerificationModal(true)
      return
    }
    
    // Check project view access (payment)
    if (!project.hasAccess) {
      // Show payment modal for verified users
      setPaymentProject(project)
      setShowPaymentModal(true)
      return
    }
    
    // All checks passed, proceed with viewing details
    onProjectClick?.(project)
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor('project_title', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-semibold hover:bg-transparent"
          >
            Project Title
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="font-medium truncate" title={row.original.project_title}>
              {row.original.project_title}
            </div>
            <div className="text-sm text-muted-foreground line-clamp-1 max-w-[180px]" title={row.original.statement_of_work}>
              {row.original.statement_of_work}
            </div>
          </div>
        ),
        size: 200,
      }),
      columnHelper.accessor('location', {
        header: 'Location',
        cell: ({ row }) => {
          const location = row.original.location;
          const hasAccess = row.original.hasAccess;
          
          // Show only city and province until purchased
          if (hasAccess) {
            // Show full address if contractor has purchased access
            if (location && location.address && location.city) {
              return (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm truncate" title={`${location.address}, ${location.city}`}>
                    {location.address}, {location.city}
                  </span>
                </div>
              );
            }
            
            // Check if location exists but might have empty strings
            if (location && (location.address || location.city || location.province)) {
              const displayParts = [
                location.address,
                location.city,
                location.province
              ].filter(Boolean);
              
              if (displayParts.length > 0) {
                return (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm truncate" title={displayParts.join(', ')}>
                      {displayParts.join(', ')}
                    </span>
                  </div>
                );
              }
            }
          } else {
            // Show only city and province for privacy
            if (location && (location.city || location.province)) {
              const displayParts = [
                location.city,
                location.province
              ].filter(Boolean);
              
              if (displayParts.length > 0) {
                return (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm truncate" title={displayParts.join(', ')}>
                      {displayParts.join(', ')}
                    </span>
                  </div>
                );
              }
            }
          }
          
          // No valid location data
          return (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-muted-foreground">
                Not specified
              </span>
            </div>
          );
        },
        size: 160,
      }),
      columnHelper.accessor('category', {
        header: 'Category',
        cell: ({ row }) => {
          const categories = row.original.category;
          if (!categories || categories.length === 0) {
            return <span className="text-sm text-muted-foreground">No category</span>;
          }
          
          return (
            <div className="text-sm text-muted-foreground">
              {categories.slice(0, 2).join(', ')}
              {categories.length > 2 && ` +${categories.length - 2} more`}
            </div>
          );
        },
        size: 120,
      }),
      columnHelper.accessor('budget', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-semibold hover:bg-transparent"
          >
            Budget
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {row.original.budget ? 
                new Intl.NumberFormat('en-CA', {
                  style: 'currency',
                  currency: 'CAD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(row.original.budget) : 
                'Not specified'
              }
            </span>
          </div>
        ),
        size: 100,
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status
          const config = getProjectStatusConfig(status)
          
          return (
            <Badge variant={config.variant} className={`${config.color} px-2 py-1 text-xs font-medium text-center min-w-[100px] flex items-center justify-center`}>
              {config.label}
            </Badge>
          )
        },
        size: 100,
      }),
      columnHelper.accessor('expiry_date', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-semibold hover:bg-transparent"
          >
            Expires
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const expiryDate = row.original.expiry_date;
          if (!expiryDate) {
            return <span className="text-sm text-muted-foreground">No expiry</span>;
          }
          
          const date = new Date(expiryDate);
          const now = new Date();
          const isExpired = date < now;
          
          return (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className={`text-sm ${isExpired ? 'text-red-600' : ''}`}>
                {date.toLocaleDateString()}
              </span>
            </div>
          );
        },
        size: 100,
      }),
      columnHelper.accessor('created_at', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-semibold hover:bg-transparent"
          >
            Posted
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {new Date(row.original.created_at).toLocaleDateString()}
            </span>
          </div>
        ),
        size: 100,
      }),
      columnHelper.accessor('hasAccess', {
        header: 'Access',
        cell: ({ row }) => {
          const hasAccess = row.original.hasAccess;
          
          if (hasAccess) {
            return (
              <Badge 
                variant="default" 
                className="bg-green-600 text-white px-2 py-1 text-xs font-medium flex items-center gap-1 w-fit"
              >
                <CheckCircle className="h-3 w-3" />
                Purchased
              </Badge>
            );
          }
          
          return (
            <Badge 
              variant="outline" 
              className="border-orange-300 text-orange-700 px-2 py-1 text-xs font-medium w-fit"
            >
              Not Purchased
            </Badge>
          );
        },
        size: 120,
      }),

    ],
    []
  )

  const table = useReactTable({
    data: projects,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="rounded-md border overflow-hidden">
      <div className="max-w-full">
        <Table className="w-full table-fixed">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead 
                  key={header.id} 
                  style={{ width: header.getSize() }}
                  className="whitespace-nowrap"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() => handleRowClick(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell 
                    key={cell.id} 
                    style={{ width: cell.column.getSize() }}
                    className="max-w-0"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No projects available.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>
      
      {/* Payment Modal */}
      {showPaymentModal && paymentProject && user && (
        <ProjectPaymentModal
          isOpen={showPaymentModal}
          onClose={handlePaymentModalClose}
          project={paymentProject}
          userId={user.id}
          isVerified={verificationStatus?.isVerified || false}
        />
      )}
      
      {/* Profile Completion Modal */}
      <ProfileCompletionModal 
        isOpen={showProfileCompletionModal}
        onClose={() => setShowProfileCompletionModal(false)}
        userProfile={userProfile}
        contractorProfile={contractorProfile}
      />
      
      {/* Verification Redirect Modal */}
      <VerificationRedirectModal 
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        user={user ? { id: user.id, email: user.email } : undefined}
      />
    </div>
  )
}