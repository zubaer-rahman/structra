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
    const badgeStyles = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'accepted': 'bg-green-100 text-green-800 border-green-300',
      'rejected': 'bg-red-100 text-red-800 border-red-300',
      'submitted': 'bg-blue-100 text-blue-800 border-blue-300',
      'viewed': 'bg-blue-100 text-blue-800 border-blue-300',
      'under_review': 'bg-blue-100 text-blue-800 border-blue-300',
      'withdrawn': 'bg-gray-100 text-gray-800 border-gray-300',
      'expired': 'bg-gray-100 text-gray-800 border-gray-300',
      'draft': 'bg-gray-100 text-gray-800 border-gray-300',
      'no-proposal': 'bg-orange-100 text-orange-800 border-orange-300'
    }
    return badgeStyles[status as keyof typeof badgeStyles] || 'bg-gray-100 text-gray-800 border-gray-200'
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
          project:projects(*),
          homeowner_details:users!proposals_homeowner_fkey(*),
          project_details:projects(*)
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
            className="h-auto p-0 font-semibold text-left justify-start w-full text-gray-600"
          >
            Project Title
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const project = row.original
        return (
          <div className="space-y-1 min-w-[200px]">
            <div className="font-medium text-gray-900 text-sm lg:text-base truncate">
              {project.project_title || 'Unknown Project'}
            </div>
            <div className="text-xs lg:text-sm text-gray-500 line-clamp-1">
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
            className="h-auto p-0 font-semibold text-left justify-start w-full text-gray-600"
          >
            Homeowner
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const project = row.original
        return (
          <div className="font-medium text-gray-900 text-sm lg:text-base min-w-[120px] truncate">
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
            className="h-auto p-0 font-semibold text-left justify-start w-full text-gray-600"
          >
            Proposal Amount
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const project = row.original
        return (
          <div className="font-medium text-gray-900 text-sm lg:text-base min-w-[100px]">
            {project.proposal ? formatCurrency(project.proposal.total_amount || 0) : 'N/A'}
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
            className="h-auto p-0 font-semibold text-left justify-start w-full text-gray-600"
          >
            Project Budget
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const project = row.original
        return (
          <div className="font-medium text-gray-900 text-sm lg:text-base min-w-[100px]">
            {formatCurrency(project.budget || 0)}
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
            className="h-auto p-0 font-semibold text-left justify-start w-full text-gray-600"
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const project = row.original
        const status = project.proposal?.status || 'no-proposal'
        const notes = project.proposal?.rejection_reason_notes?.trim()
        return (
          <div className="flex flex-col gap-1 lg:gap-2 min-w-[140px] max-w-[280px]">
            <Badge className={`${getStatusBadgeStyle(status)} font-medium px-2 py-1 text-xs border capitalize`}>
              {status === 'no-proposal' ? 'No Proposal' : status}
            </Badge>
            {status === 'rejected' && notes && (
              <p className="text-xs text-gray-600 line-clamp-3" title={notes}>
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
            className="h-auto p-0 font-semibold text-left justify-start w-full text-gray-600"
          >
            Submitted
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const project = row.original
        const date = project.proposal?.created_at || project.created_at
        return (
          <div className="text-gray-900 text-sm lg:text-base min-w-[80px]">
            {project.proposal ? formatDate(date) : 'N/A'}
          </div>
        )
      },
    },
    {
      id: 'agreement',
      header: () => <span className="text-gray-600 font-semibold">Agreement</span>,
      cell: ({ row }) => {
        const project = row.original
        const isAccepted = project.proposal?.status === 'accepted'

        if (!project.proposal || !isAccepted) {
          return (
            <span className="text-gray-400 text-sm">-</span>
          )
        }

        return (
          <div className="flex flex-col gap-1 lg:gap-2 min-w-[140px]">
            <Button
              size="sm"
              variant="outline"
              onClick={async (e) => {
                e.stopPropagation()
                await handlePreviewPDF(project)
              }}
              className="h-7 px-2 text-xs border-green-200 text-green-700 hover:bg-green-50"
            >
              <EyeIcon className="h-3 w-3 mr-1" />
              Review Contract
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={async (e) => {
                e.stopPropagation()
                await downloadProposalPDF(project.proposal!.id)
              }}
              className="h-7 px-2 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <FileDown className="h-3 w-3 mr-1" />
              Download
            </Button>
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: () => <span className="text-gray-600 font-semibold">Actions</span>,
      cell: ({ row }) => {
        const project = row.original
        const isDraft = project.proposal?.status === 'draft'
        const hasProposal = !!project.proposal

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onViewDetails?.(project)}
                className="cursor-pointer"
              >
                <Eye className="mr-2 h-4 w-4" />
                {hasProposal ? 'View Proposal' : 'View Project'}
              </DropdownMenuItem>
              {isDraft && (
                <DropdownMenuItem
                  onClick={() => onEditProposal?.(project)}
                  className="cursor-pointer"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Proposal
                </DropdownMenuItem>
              )}
              {!hasProposal && (
                <DropdownMenuItem
                  onClick={() => onEditProposal?.(project)}
                  className="cursor-pointer"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Submit Proposal
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
    <div className="rounded-md border bg-white min-w-full">
      <Table className="min-w-[800px]">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-b border-gray-200">
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id} className="bg-gray-50 font-semibold text-gray-900 p-3 lg:p-4 whitespace-nowrap">
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
                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                onClick={() => onProposalClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-3 px-3 lg:py-4 lg:px-4">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
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