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
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ArrowUpDown, Eye, CheckCircle, XCircle, Calendar, Clock, FileDown, EyeIcon } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { PROJECT_STATUSES, PROPOSAL_STATUSES } from '@/utils/constants'
import { generateProposalPDFBlob } from '@/utils/helpers/pdfPreviewGenerator'
import { downloadProposalPDF } from '@/utils/helpers/downloadProposalPDF'
import { ProposalWithJoins } from '@/server/database/interfaces/proposals'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase'
import PDFPreviewModal from '@/components/shared/PDFPreviewModal'
import { Textarea } from '@/components/ui/textarea'

interface HomeownerProposalTableProps {
  proposals: ProposalWithJoins[]
}

export function HomeownerProposalTable({
  proposals,
}: HomeownerProposalTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [selectedProposal, setSelectedProposal] = useState<ProposalWithJoins | null>(null)
  const [showPDFPreview, setShowPDFPreview] = useState(false)
  const [previewPDFBlob, setPreviewPDFBlob] = useState<Blob | null>(null)
  const [previewTitle, setPreviewTitle] = useState('')
  const [currentProposalId, setCurrentProposalId] = useState<string | null>(null)
  const [contractReviewed, setContractReviewed] = useState(false)
  const [homeownerContractReviewed, setHomeownerContractReviewed] = useState(false)
  const [showAcceptDialog, setShowAcceptDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const router = useRouter()

  const handleRowClick = (proposalId: string) => {
    router.push(`/homeowner/proposals/${proposalId}`)
  }

  const handleAcceptClick = (e: React.MouseEvent, proposal: ProposalWithJoins) => {
    e.stopPropagation()
    handlePreviewPDF(proposal)
  }

  const handleRejectClick = (e: React.MouseEvent, proposal: ProposalWithJoins) => {
    e.stopPropagation()
    handlePreviewPDF(proposal)
  }

  const handleConfirmAccept = async () => {
    if (!selectedProposal) return

    try {
      setActionLoading(true)
      const supabase = createClient()
      const now = new Date().toISOString()

      await supabase
        .from('proposals')
        .update({
          status: PROPOSAL_STATUSES.VIEWED,
          viewed_date: now,
          last_updated: now,
        })
        .eq('id', selectedProposal.id)
        .eq('status', PROPOSAL_STATUSES.SUBMITTED)

      const { error: acceptError } = await supabase
        .from('proposals')
        .update({
          status: PROPOSAL_STATUSES.ACCEPTED,
          is_selected: 'yes',
          accepted_date: now,
          contract_reviewed: true,
          homeowner_contract_reviewed: true,
          contract_reviewed_at: now,
          homeowner_contract_reviewed_at: now,
          last_updated: now,
        })
        .eq('id', selectedProposal.id)

      if (acceptError) throw acceptError

      // Ensure only the accepted proposal remains selected.
      const { error: clearSelectionError } = await supabase
        .from('proposals')
        .update({
          is_selected: 'no',
          last_updated: now,
        })
        .eq('project', selectedProposal.project)
        .eq('homeowner', selectedProposal.homeowner)
        .neq('id', selectedProposal.id)

      if (clearSelectionError) throw clearSelectionError

      const { error: rejectOthersError } = await supabase
        .from('proposals')
        .update({
          status: PROPOSAL_STATUSES.REJECTED,
          rejected_date: now,
          rejection_reason: 'other',
          rejection_reason_notes: 'Another proposal was selected by the homeowner',
          is_selected: 'no',
          last_updated: now,
        })
        .eq('project', selectedProposal.project)
        .neq('id', selectedProposal.id)
        .in('status', [PROPOSAL_STATUSES.SUBMITTED, PROPOSAL_STATUSES.VIEWED])

      if (rejectOthersError) throw rejectOthersError

      const { error: projectError } = await supabase
        .from('projects')
        .update({ status: PROJECT_STATUSES.PROPOSAL_SELECTED })
        .eq('id', selectedProposal.project)

      if (projectError) throw projectError

      toast.success('Proposal accepted successfully!')
      setShowAcceptDialog(false)
      setShowPDFPreview(false)
      window.location.reload()
    } catch (error) {
      console.error('Error accepting proposal:', error)
      toast.error('Failed to accept proposal. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirmReject = async () => {
    if (!selectedProposal) return

    const trimmedReason = rejectReason.trim()
    if (!trimmedReason) {
      toast.error('Please provide a rejection reason.')
      return
    }

    try {
      setActionLoading(true)
      const supabase = createClient()
      const now = new Date().toISOString()

      const { error } = await supabase
        .from('proposals')
        .update({
          status: PROPOSAL_STATUSES.REJECTED,
          rejected_date: now,
          rejection_reason: 'other',
          rejection_reason_notes: trimmedReason,
          is_selected: 'no',
          last_updated: now,
        })
        .eq('id', selectedProposal.id)

      if (error) throw error

      toast.success('Proposal rejected successfully!')
      setShowRejectDialog(false)
      setShowPDFPreview(false)
      setRejectReason('')
      window.location.reload()
    } catch (error) {
      console.error('Error rejecting proposal:', error)
      toast.error('Failed to reject proposal. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  const handlePreviewPDF = async (proposal: ProposalWithJoins) => {
    try {
      // Generate PDF blob (skip signature validation for preview)
      const result = await generateProposalPDFBlob(proposal, true) // true = skip signature validation
      
      if (result.success && result.blob) {
        setPreviewPDFBlob(result.blob)
        setPreviewTitle(`Proposal - ${proposal.title}`)
        setCurrentProposalId(proposal.id)
        setSelectedProposal(proposal) // Set the selected proposal for status checking
        setContractReviewed(proposal.contract_reviewed || false)
        setHomeownerContractReviewed(proposal.homeowner_contract_reviewed || false)
        setShowPDFPreview(true)
      } else {
        toast.error(result.error || 'Failed to generate PDF preview')
      }
    } catch (error) {
      console.error('PDF preview error:', error)
      toast.error('Failed to generate PDF preview')
    }
  }

  const getStatusBadgeStyle = (status: string) => {
    const badgeStyles = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'submitted': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'viewed': 'bg-blue-100 text-blue-800 border-blue-300',
      'accepted': 'bg-green-100 text-green-800 border-green-300',
      'rejected': 'bg-red-100 text-red-800 border-red-300',
      'withdrawn': 'bg-gray-100 text-gray-800 border-gray-300',
      'expired': 'bg-gray-100 text-gray-800 border-gray-300',
      'draft': 'bg-gray-100 text-gray-800 border-gray-300'
    }
    return badgeStyles[status as keyof typeof badgeStyles] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getDisplayStatus = (status: string) => {
    return status === 'submitted' ? 'pending' : status
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return `${diffDays} days`
  }

  const columns: ColumnDef<ProposalWithJoins>[] = [
    {
      accessorKey: 'project_details.project_title',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-semibold text-left justify-start w-full text-gray-600"
          >
            Project
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const proposal = row.original
        return (
          <div className="space-y-1">
            <div className="font-medium text-gray-900">
              {proposal.project_details?.project_title || 'Unknown Project'}
            </div>
            <div className="text-sm text-gray-500 line-clamp-1">
              {proposal.title}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'contractor_profile.full_name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-semibold text-left justify-start w-full text-gray-600"
          >
            Contractor
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const proposal = row.original
        return (
          <div className="font-medium text-gray-900">
            {proposal.contractor_profile?.full_name
              ? proposal.contractor_profile.full_name
                  .split(" ")
                  .map(
                    (word) =>
                      word.charAt(0).toUpperCase() +
                      word.slice(1).toLowerCase()
                  )
                  .join(" ")
              : "Unknown"}
          </div>
        )
      },
    },
    {
      accessorKey: 'total_amount',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-semibold text-left justify-start w-full text-gray-600"
          >
            Amount
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const proposal = row.original
        return (
          <div className="space-y-1">
            <div className="font-medium text-gray-900">
              {formatCurrency(proposal.total_amount || 0)}
            </div>
            <div className="text-sm text-gray-500">
              Deposit: {formatCurrency(proposal.deposit_amount || 0)}
            </div>
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
        const proposal = row.original
        const status = row.getValue('status') as string
        const displayStatus = getDisplayStatus(status)
        return (
          <div className="flex flex-col gap-2">
            <Badge 
              variant="outline" 
              className={`capitalize border ${getStatusBadgeStyle(status)}`}
            >
              {displayStatus}
            </Badge>
          </div>
        )
      },
    },
    {
      accessorKey: 'proposed_start_date',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-semibold text-left justify-start w-full text-gray-600"
          >
            Timeline
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const proposal = row.original
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Calendar className="h-3 w-3 text-gray-400" />
              <span>
                {proposal.proposed_start_date && proposal.proposed_end_date
                  ? `${formatDate(proposal.proposed_start_date)} - ${formatDate(proposal.proposed_end_date)}`
                  : "Dates TBD"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Clock className="h-3 w-3 text-gray-400" />
              <span>
                {proposal.proposed_start_date && proposal.proposed_end_date
                  ? calculateDuration(proposal.proposed_start_date, proposal.proposed_end_date)
                  : "Duration TBD"}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: () => <span className="text-gray-600 font-semibold">Actions</span>,
      cell: ({ row }) => {
        const proposal = row.original
        const canTakeAction = proposal.status === PROPOSAL_STATUSES.SUBMITTED || proposal.status === PROPOSAL_STATUSES.VIEWED
        const isAccepted = proposal.status === PROPOSAL_STATUSES.ACCEPTED
        const isRejected = proposal.status === PROPOSAL_STATUSES.REJECTED

        if (canTakeAction) {
          return (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  handlePreviewPDF(proposal)
                }}
                className="h-8 px-3 text-xs border-green-200 text-green-700 hover:bg-green-50"
              >
                <EyeIcon className="h-3 w-3 mr-1" />
                Review Contract
              </Button>
              <Button
                size="sm"
                onClick={(e) => handleAcceptClick(e, proposal)}
                variant="outline"
                className="h-8 px-3 text-xs"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                onClick={(e) => handleRejectClick(e, proposal)}
                variant="outline"
                className="h-8 px-3 text-xs"
              >
                <XCircle className="h-3 w-3 mr-1" />
                Reject
              </Button>
            </div>
          )
        }

        if (isAccepted || isRejected) {
          return (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  handlePreviewPDF(proposal)
                }}
                className="h-8 px-3 text-xs border-green-200 text-green-700 hover:bg-green-50"
              >
                <EyeIcon className="h-3 w-3 mr-1" />
                Review Contract
              </Button>
              
              {isAccepted && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async (e) => {
                    e.stopPropagation()
                    await downloadProposalPDF(proposal.id)
                  }}
                  className="h-8 px-3 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <FileDown className="h-3 w-3 mr-1" />
                  Download PDF
                </Button>
              )}
            </div>
          )
        }

        return (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/homeowner/proposals/${proposal.id}`)
            }}
            className="h-8 px-3 text-xs border-orange-200 text-orange-700 hover:bg-orange-50"
          >
            <Eye className="h-3 w-3 mr-1" />
            View Details
          </Button>
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
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-b border-gray-200">
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id} className="bg-gray-50 font-semibold text-gray-900 p-4">
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
                onClick={() => handleRowClick(row.original.id)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-4 px-4">
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

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        isOpen={showPDFPreview}
        onClose={() => {
          setShowPDFPreview(false)
          setPreviewPDFBlob(null)
          setPreviewTitle('')
          setCurrentProposalId(null)
          setContractReviewed(false)
          setHomeownerContractReviewed(false)
        }}
        pdfBlob={previewPDFBlob}
        title={previewTitle}
        allowDownload={false}
        showConfirmContract={false}
        proposalId={currentProposalId || undefined}
        contractReviewed={contractReviewed}
        homeownerContractReviewed={homeownerContractReviewed}
        userRole="homeowner"
        showDecisionActions={
          selectedProposal?.status === PROPOSAL_STATUSES.SUBMITTED ||
          selectedProposal?.status === PROPOSAL_STATUSES.VIEWED
        }
        onAccept={() => {
          if (!selectedProposal) return
          setShowAcceptDialog(true)
        }}
        onReject={() => {
          if (!selectedProposal) return
          setRejectReason('')
          setShowRejectDialog(true)
        }}
        onContractConfirmed={() => {
          setHomeownerContractReviewed(true)
          // Refresh the table data to show the download button
          window.location.reload()
        }}
      />

      {/* Accept Confirmation Dialog */}
      <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Proposal</DialogTitle>
            <DialogDescription>
              Are you sure you want to accept this proposal? This will reject other active proposals for this project.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAcceptDialog(false)
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAccept}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {actionLoading ? 'Accepting...' : 'Accept Proposal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Proposal</DialogTitle>
            <DialogDescription>
              Provide a reason so the contractor can revise and resubmit.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Tell the contractor what needs to be fixed..."
            rows={4}
            disabled={actionLoading}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false)
                setRejectReason('')
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmReject}
              disabled={actionLoading || !rejectReason.trim()}
              variant="outline"
            >
              {actionLoading ? 'Rejecting...' : 'Reject Proposal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default HomeownerProposalTable