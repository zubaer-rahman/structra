'use client'

import React from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MoreHorizontal, ArrowUpDown, Eye, Edit, FileDown, EyeIcon } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { generateEnhancedProposalPDF } from '@/utils/helpers/enhancedPdfGenerator'
import { generateProposalPDFBlob } from '@/utils/helpers/pdfPreviewGenerator'
import { downloadProposalPDF } from '@/utils/helpers/downloadProposalPDF'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase'
import SignatureRequiredDialog from '@/components/modals/SignatureRequiredDialog'
import PDFPreviewModal from '@/components/shared/PDFPreviewModal'
import { ProposalWithJoins } from '@/server/database/interfaces/proposals'
import { ProjectWithProposal } from '@/types/project'
import { PROPOSAL_STATUSES } from '@/utils/constants'

interface ContractorProposalTableProps {
  proposals: ProjectWithProposal[]
  onProposalClick?: (project: ProjectWithProposal) => void
  onViewDetails?: (project: ProjectWithProposal) => void
  onEditProposal?: (project: ProjectWithProposal) => void
}

export function ContractorProposalTable({
  proposals,
  onProposalClick,
  onViewDetails,
  onEditProposal,
}: ContractorProposalTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [showSignatureDialog, setShowSignatureDialog] = useState(false)
  const [missingSignatures, setMissingSignatures] = useState<string[]>([])
  const [showPDFPreview, setShowPDFPreview] = useState(false)
  const [previewPDFBlob, setPreviewPDFBlob] = useState<Blob | null>(null)
  const [previewTitle, setPreviewTitle] = useState('')
  const [currentProposalId, setCurrentProposalId] = useState<string | null>(null)
  const [contractReviewed, setContractReviewed] = useState(false)
  const [currentProposal, setCurrentProposal] = useState<any>(null)

  const getStatusBadgeStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
      case 'rejected':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
      case 'viewed':
      case 'under_review':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30'
      case 'withdrawn':
      case 'expired':
      case 'draft':
        return 'bg-muted text-muted-foreground border-border'
      case 'no-proposal':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
      case 'pending':
      case 'submitted':
      default:
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handlePreviewPDF = async (project: ProjectWithProposal) => {
    if (!project.proposal) return

    try {
      // Fetch the complete proposal data with joins before generating PDF
      const supabase = createClient()
      const { data, error } = await supabase
        .from('proposals')
        .select(`
          *,
          project:projects!proposals_project_fkey(*),
          homeowner_details:users!proposals_homeowner_fkey(*),
          project_details:projects!proposals_project_fkey(*)
        `)
        .eq('id', project.proposal.id)
        .single()
      
      if (error) {
        throw new Error(`Error fetching proposal data: ${error.message}`)
      }
      
      if (!data) {
        throw new Error('Proposal data not found')
      }
      
      // Fetch contractor profile separately
      const { data: contractorProfile, error: contractorError } = await supabase
        .from('contractor_profiles')
        .select('business_name, address, work_guarantee, work_guarantee_statement, insurance_builders_risk, insurance_general_liability')
        .eq('user_id', data.contractor)
        .single()
      
      // Fetch contractor user data for full_name and other user fields
      const { data: contractorUser, error: contractorUserError } = await supabase
        .from('users')
        .select('phone_number, full_name')
        .eq('id', data.contractor)
        .single()
      
      if (contractorUserError) {
        console.error('Error fetching contractor user data:', contractorUserError)
      }
      
      // Attach contractor profile and user data to the proposal data
      const proposalWithContractor = {
        ...data,
        contractor_profile: {
          ...contractorProfile,
          ...contractorUser
        }
      }
      
      // Convert to ProposalWithJoins type and generate PDF blob (skip signature validation for preview)
      const fullProposal = proposalWithContractor as unknown as ProposalWithJoins
      const result = await generateProposalPDFBlob(fullProposal, true) // true = skip signature validation
      
      if (result.success && result.blob) {
        setPreviewPDFBlob(result.blob)
        setPreviewTitle(`Agreement - ${project.project_title}`)
        setCurrentProposalId(project.proposal.id)
        setCurrentProposal(fullProposal) // Store the full proposal data
        setContractReviewed(project.proposal.contract_reviewed || false)
        setShowPDFPreview(true)
      } else {
        toast.error(result.error || 'Failed to generate PDF preview')
      }
    } catch (error) {
      console.error('PDF preview error:', error)
      toast.error('Failed to generate PDF preview')
    }
  }

  const columns: ColumnDef<ProjectWithProposal>[] = [
    {
      accessorKey: 'project_title',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-semibold text-left justify-start w-full text-muted-foreground hover:text-foreground text-xs uppercase tracking-wider"
          >
            Project Title
            <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const project = row.original
        return (
          <div className="space-y-0.5 min-w-[200px]">
            <div className="font-medium text-foreground text-sm group-hover:underline truncate">
              {project.project_title || 'Unknown Project'}
            </div>
            <div className="text-xs text-muted-foreground line-clamp-1">
              {project.proposal?.title || 'No Proposal'}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'homeowner.full_name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-semibold text-left justify-start w-full text-muted-foreground hover:text-foreground text-xs uppercase tracking-wider"
          >
            Homeowner
            <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const project = row.original
        return (
          <div className="font-medium text-foreground text-sm min-w-[120px] truncate">
            {project.homeowner?.full_name || 'Unknown'}
          </div>
        )
      },
    },
    {
      accessorKey: 'proposal.total_amount',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-semibold text-left justify-start w-full text-muted-foreground hover:text-foreground text-xs uppercase tracking-wider"
          >
            Proposal Amount
            <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const project = row.original
        return (
          <div className="font-semibold text-foreground font-mono text-sm min-w-[100px]">
            {project.proposal ? formatCurrency(project.proposal.total_amount || 0) : '—'}
          </div>
        )
      },
    },
    {
      accessorKey: 'budget',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-semibold text-left justify-start w-full text-muted-foreground hover:text-foreground text-xs uppercase tracking-wider"
          >
            Project Budget
            <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const project = row.original
        return (
          <div className="text-muted-foreground font-mono text-sm min-w-[100px]">
            {project.budget ? formatCurrency(project.budget) : '—'}
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-semibold text-left justify-start w-full text-muted-foreground hover:text-foreground text-xs uppercase tracking-wider"
          >
            Status
            <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const project = row.original
        const status = project.proposal?.status || 'no-proposal'
        const notes = project.proposal?.rejection_reason_notes?.trim()
        return (
          <div className="flex flex-col gap-1 min-w-[140px] max-w-[280px]">
            <div>
              <Badge variant="outline" className={`${getStatusBadgeStyle(status)} font-medium px-2.5 py-0.5 text-xs border capitalize`}>
                {status === 'no-proposal' ? 'No Proposal' : status}
              </Badge>
            </div>
            {status === 'rejected' && notes && (
              <p className="text-xs text-rose-700 dark:text-rose-400 bg-rose-500/5 border border-rose-500/20 p-1.5 rounded line-clamp-2" title={notes}>
                {notes}
              </p>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'proposal.created_at',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-semibold text-left justify-start w-full text-muted-foreground hover:text-foreground text-xs uppercase tracking-wider"
          >
            Submitted
            <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const project = row.original
        const date = project.proposal?.created_at || project.created_at
        return (
          <div className="text-foreground text-xs min-w-[80px]">
            {project.proposal ? formatDate(date) : '—'}
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right text-muted-foreground font-semibold text-xs uppercase tracking-wider pr-2">Actions</div>,
      cell: ({ row }) => {
        const project = row.original
        const isDraft = project.proposal?.status === 'draft'
        const isAccepted = project.proposal?.status === 'accepted'
        const hasProposal = !!project.proposal

        return (
          <div className="flex items-center justify-end gap-1.5 min-w-[140px]" onClick={(e) => e.stopPropagation()}>
            {isAccepted ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async (e) => {
                    e.stopPropagation()
                    await handlePreviewPDF(project)
                  }}
                  className="h-7 px-2.5 text-xs border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 font-medium"
                  title="View Contract Agreement"
                >
                  <EyeIcon className="h-3.5 w-3.5 mr-1" />
                  Contract
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async (e) => {
                    e.stopPropagation()
                    await downloadProposalPDF(project.proposal!.id)
                  }}
                  className="h-7 px-2 text-xs border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent"
                  title="Download Agreement PDF"
                >
                  <FileDown className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : isDraft ? (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  onEditProposal?.(project)
                }}
                className="h-7 px-2.5 text-xs border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <Edit className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
            ) : !hasProposal ? (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  onEditProposal?.(project)
                }}
                className="h-7 px-2.5 text-xs border-primary/30 text-primary hover:bg-primary/10 font-medium"
              >
                <Edit className="h-3.5 w-3.5 mr-1" />
                Submit
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  onViewDetails?.(project)
                }}
                className="h-7 px-2.5 text-xs border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <Eye className="h-3.5 w-3.5 mr-1" />
                Details
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => onViewDetails?.(project)}
                  className="cursor-pointer text-xs"
                >
                  <Eye className="mr-2 h-3.5 w-3.5" />
                  {hasProposal ? 'View Proposal Details' : 'View Project'}
                </DropdownMenuItem>

                {isAccepted && (
                  <>
                    <DropdownMenuItem
                      onClick={async () => await handlePreviewPDF(project)}
                      className="cursor-pointer text-xs"
                    >
                      <EyeIcon className="mr-2 h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      View Contract Agreement
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={async () => await downloadProposalPDF(project.proposal!.id)}
                      className="cursor-pointer text-xs"
                    >
                      <FileDown className="mr-2 h-3.5 w-3.5" />
                      Download Agreement PDF
                    </DropdownMenuItem>
                  </>
                )}

                {isDraft && (
                  <DropdownMenuItem
                    onClick={() => onEditProposal?.(project)}
                    className="cursor-pointer text-xs"
                  >
                    <Edit className="mr-2 h-3.5 w-3.5" />
                    Edit Proposal
                  </DropdownMenuItem>
                )}

                {!hasProposal && (
                  <DropdownMenuItem
                    onClick={() => onEditProposal?.(project)}
                    className="cursor-pointer text-xs"
                  >
                    <Edit className="mr-2 h-3.5 w-3.5" />
                    Submit Proposal
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: proposals,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  })

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden min-w-full">
      <Table className="min-w-[800px]">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-b border-border/60 bg-muted/30 hover:bg-muted/30">
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id} className="p-3 text-muted-foreground font-medium whitespace-nowrap">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                className="border-b border-border/30 hover:bg-muted/30 cursor-pointer transition-colors group"
                onClick={() => onProposalClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-3 px-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground text-sm">
                No proposals found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Signature Required Dialog */}
      <SignatureRequiredDialog
        isOpen={showSignatureDialog}
        onClose={() => setShowSignatureDialog(false)}
        missingSignatures={missingSignatures}
        onSignatureAdded={() => {
          setShowSignatureDialog(false)
          // Optionally retry PDF generation
          toast.success('Signature added! You can now try downloading the PDF again.')
        }}
      />

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        isOpen={showPDFPreview}
        onClose={() => {
          setShowPDFPreview(false)
          setPreviewPDFBlob(null)
          setPreviewTitle('')
          setCurrentProposalId(null)
          setCurrentProposal(null)
          setContractReviewed(false)
        }}
        pdfBlob={previewPDFBlob}
        title={previewTitle}
        allowDownload={false}
        showConfirmContract={false}
        proposalId={currentProposalId || undefined}
        contractReviewed={contractReviewed}
        homeownerContractReviewed={currentProposal?.homeowner_contract_reviewed || false}
        userRole="contractor"
        onContractConfirmed={() => {
          setContractReviewed(true)
          // Refresh the table data to show the download button
          window.location.reload()
        }}
      />
    </div>
  )
}

export default ContractorProposalTable