"use client";

import { useState } from "react";
import { Project } from "@/server/database/interfaces";
import { ProposalWithJoins } from "@/server/database/interfaces/proposals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  ThumbsDown,
  FileText,
  TrendingUp,
  Eye,
  Download,
  Edit,
  User as UserIcon,
  XCircle,
} from "lucide-react";
import PDFPreviewModal from "@/components/shared/PDFPreviewModal";
import { cn } from "@/lib/utils";
import { USER_ROLES, PROJECT_STATUSES } from "@/utils/constants";
import { FileTypeIcon } from "@/components/shared/FileTypeIcon";
import { LoadingSpinner } from "@/components/shared";
import { generateProposalPDFBlob } from "@/utils/helpers/pdfPreviewGenerator";

interface ProposalsTabContentProps {
  proposals: ProposalWithJoins[];
  project: Project;
  userRole: (typeof USER_ROLES)[keyof typeof USER_ROLES];
  onAcceptProposal: (proposalId: string) => Promise<void>;
  onRejectProposal: (
    proposalId: string,
    reason?: string,
    notes?: string
  ) => Promise<void>;
  onViewProposal: (proposalId: string) => void;
  onSubmitProposal?: (proposalData: Record<string, unknown>) => Promise<void>;
  loading?: boolean;
  updatingProposal?: string | null;
}

export function ProposalsTabContent({
  proposals,  
  project,
  userRole, 
  onAcceptProposal,
  onRejectProposal,
  onViewProposal,
  onSubmitProposal,
  loading = false,
  updatingProposal = null,
}: ProposalsTabContentProps) {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "price">("date");
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<ProposalWithJoins | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [previewPDFBlob, setPreviewPDFBlob] = useState<Blob | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");

  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return "N/A";
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
      case "submitted":
        return "bg-black text-white";
      case "rejected":
        return "bg-gray-600 text-white";
      case "viewed":
        return "bg-gray-400 text-white";
      default:
        return "bg-gray-300 text-black";
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const filteredProposals = proposals.filter((proposal) => {
    // Always exclude viewed proposals regardless of filter
    if (proposal.status === "viewed") return false;
    
    if (filterStatus === "all") return true;
    return proposal.status === filterStatus;
  });

  const sortedProposals = [...filteredProposals].sort((a, b) => {
    switch (sortBy) {
      case "date":
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case "price":
        return a.total_amount - b.total_amount;
      default:
        return 0;
    }
  });

  const handleAcceptClick = (proposal: ProposalWithJoins) => {
    setSelectedProposal(proposal);
    handlePreviewPDF(proposal);
  };

  const handleRejectClick = (proposal: ProposalWithJoins) => {
    setSelectedProposal(proposal);
    setRejectReason("");
    handlePreviewPDF(proposal);
  };

  const handlePreviewPDF = async (proposal: ProposalWithJoins) => {
    try {
      const result = await generateProposalPDFBlob(proposal, true);

      if (result.success && result.blob) {
        setPreviewPDFBlob(result.blob);
        setPreviewTitle(`Proposal - ${proposal.title}`);
        setShowPDFPreview(true);
        return;
      }
    } catch (error) {
      console.error("PDF preview error:", error);
    }
  };

  const handleConfirmAccept = async () => {
    if (selectedProposal) {
      await onAcceptProposal(selectedProposal.id);
    }
    setShowAcceptDialog(false);
    setSelectedProposal(null);
  };

  const handleConfirmReject = async () => {
    if (selectedProposal) {
      const trimmedReason = rejectReason.trim();
      if (!trimmedReason) return;
      await onRejectProposal(
        selectedProposal.id,
        "other",
        trimmedReason
      );
    }
    setShowRejectDialog(false);
    setRejectReason("");
    setSelectedProposal(null);
  };



  if (loading) {
    return (
      <div className="text-center py-12 bg-white">
        <LoadingSpinner size="lg" text="Loading proposals..." />
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-black mb-2">
            No Proposals Yet
          </h3>
          <p className="text-gray-600 mb-4">
            {userRole === "homeowner"
              ? "No contractors have submitted proposals for this project yet."
              : "You haven't submitted any proposals for this project yet."}
          </p>

          {userRole === USER_ROLES.CONTRACTOR &&
            project.status === PROJECT_STATUSES.OPEN_FOR_PROPOSALS && (
              <Button
                onClick={() => onSubmitProposal && onSubmitProposal({})}
                className="bg-black hover:bg-gray-800 text-white border-0"
              >
                Submit Your First Proposal
              </Button>
            )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 bg-white">
      {/* Header with Filters and Actions */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl text-black">
                Proposals ({proposals.length})
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {userRole === "homeowner"
                  ? "Review and manage contractor proposals"
                  : "Track your submitted proposals"}
              </p>
            </div>

            {/* Filters and Sorting */}
            <div className="flex flex-wrap gap-2">
              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-black focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "date" | "price")
                }
                className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-black focus:outline-none"
              >
                <option value="date">Sort by Date</option>
                <option value="price">Sort by Price</option>
              </select>
            </div>
          </div>
        </CardHeader>


      </Card>

      {/* Proposals List */}
      <div className="space-y-4">
        {sortedProposals.map((proposal) => (
          <Card
            key={proposal.id}
            className={cn(
              "transition-all duration-200 hover:shadow-md bg-white border-gray-200",
              proposal.status === "accepted" &&
                "bg-gray-50/50",
              proposal.status === "rejected" &&
                "bg-gray-50/50",
              proposal.status === "viewed" &&
                "bg-gray-50/50"
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-black">
                      {proposal.title}
                    </h3>
                    <Badge
                      className="bg-gray-600 text-white px-2 py-1 text-xs"
                    >
                      {getStatusText(proposal.status)}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <UserIcon className="h-4 w-4 text-gray-600" />
                      <span>Contractor: {proposal.contractor_profile?.full_name || proposal.contractor}</span>
                    </div>
                    <span>•</span>
                    <span>Submitted {formatDate(proposal.created_at)}</span>
                  </div>
                </div>


              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Description */}
              <div>
                <Label className="text-sm font-medium text-gray-600">
                  Description of Work
                </Label>
                <p className="mt-1 text-black leading-relaxed">
                  {proposal.description_of_work}
                </p>
              </div>

              {/* Financial and Timeline Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <DollarSign className="h-5 w-5 text-gray-600" />
                  <div>
                    <Label className="text-xs font-medium text-gray-600">
                      Total Amount
                    </Label>
                    <p className="text-lg font-bold text-black">
                      {proposal.total_amount.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Clock className="h-5 w-5 text-gray-600" />
                  <div>
                    <Label className="text-xs font-medium text-gray-600">
                      Timeline
                    </Label>
                    <p className="text-sm font-medium text-black">
                      {formatDate(proposal.proposed_start_date)} -{" "}
                      {formatDate(proposal.proposed_end_date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <DollarSign className="h-5 w-5 text-gray-600" />
                  <div>
                    <Label className="text-xs font-medium text-gray-600">
                      Deposit
                    </Label>
                    <p className="text-sm font-medium text-black">
                      {proposal.deposit_amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              {proposal.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Additional Notes
                  </Label>
                  <p className="mt-1 text-black">{proposal.notes}</p>
                </div>
              )}

              {/* Attached Files */}
              {proposal.attached_files &&
                proposal.attached_files.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Attached Files
                    </Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {proposal.attached_files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-sm"
                        >
                          <FileTypeIcon 
                            fileType="agreement" 
                            size={16} 
                            className="text-gray-600"
                          />
                          <span className="text-black">{file.filename}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                            onClick={async () => {
                              try {
                                const response = await fetch(file.url);
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const link = document.createElement("a");
                                link.href = url;
                                link.download = file.filename;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                window.URL.revokeObjectURL(url);
                              } catch (error) {
                                console.error('Download failed:', error);
                                // Fallback to direct link
                                const link = document.createElement("a");
                                link.href = file.url;
                                link.download = file.filename;
                                link.target = "_blank";
                                link.click();
                              }
                            }}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <Separator />

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => onViewProposal(proposal.id)}
                  className="border-gray-300 text-black hover:bg-gray-100 bg-white"
                >
                  <Eye className="h-4 w-4 mr-2 text-gray-600" />
                  View Details
                </Button>

                {userRole === USER_ROLES.HOMEOWNER &&
                  (proposal.status === "submitted" ||
                    proposal.status === "viewed") && (
                    <>
                      <Button
                        onClick={() => handleAcceptClick(proposal)}
                        disabled={updatingProposal === proposal.id}
                        variant="outline"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {updatingProposal === proposal.id
                          ? "Accepting..."
                          : "Accept"}
                      </Button>

                      <Button
                        onClick={() => handleRejectClick(proposal)}
                        disabled={updatingProposal === proposal.id}
                        variant="outline"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        {updatingProposal === proposal.id
                          ? "Rejecting..."
                          : "Reject"}
                      </Button>
                    </>
                  )}



                {userRole === USER_ROLES.CONTRACTOR && (
                  <Button
                    variant="outline"
                    className="border-gray-300 text-black hover:bg-gray-100 bg-white"
                  >
                    <Edit className="h-4 w-4 mr-2 text-gray-600" />
                    Edit Proposal
                  </Button>
                )}
              </div>

              {/* Status-specific Messages */}
              {proposal.status === "accepted" && (
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">
                      This proposal has been accepted
                    </span>
                  </div>
                  {proposal.accepted_date && (
                    <p className="text-sm text-gray-600 mt-1">
                      Accepted on {formatDate(proposal.accepted_date)}
                    </p>
                  )}
                </div>
              )}

              {proposal.status === "rejected" && (
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-gray-600">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">
                      This proposal has been rejected
                    </span>
                  </div>
                  {proposal.rejected_date && (
                    <p className="text-sm text-gray-600 mt-1">
                      Rejected on {formatDate(proposal.rejected_date)}
                    </p>
                  )}
                  {proposal.rejection_reason_notes && (
                    <p className="text-sm text-gray-600 mt-1">
                      Reason: {proposal.rejection_reason_notes}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Accept Confirmation Dialog */}
      <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Proposal</DialogTitle>
            <DialogDescription>
              Are you sure you want to accept this contractor&apos;s proposal? This will automatically reject all other proposals for this project.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAcceptDialog(false)}
              disabled={updatingProposal === selectedProposal?.id}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAccept}
              disabled={updatingProposal === selectedProposal?.id}
              variant="outline"
            >
              {updatingProposal === selectedProposal?.id ? "Accepting..." : "Accept Proposal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        isOpen={showPDFPreview}
        onClose={() => {
          setShowPDFPreview(false);
          setPreviewPDFBlob(null);
          setPreviewTitle("");
        }}
        pdfBlob={previewPDFBlob}
        title={previewTitle}
        allowDownload={false}
        userRole="homeowner"
        showConfirmContract={false}
        showDecisionActions={
          selectedProposal?.status === "submitted" ||
          selectedProposal?.status === "viewed"
        }
        onAccept={() => setShowAcceptDialog(true)}
        onReject={() => {
          setRejectReason("");
          setShowRejectDialog(true);
        }}
      />

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
            disabled={updatingProposal === selectedProposal?.id}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false)
                setRejectReason("")
              }}
              disabled={updatingProposal === selectedProposal?.id}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmReject}
              disabled={updatingProposal === selectedProposal?.id || !rejectReason.trim()}
              variant="outline"
            >
              {updatingProposal === selectedProposal?.id ? "Rejecting..." : "Reject Proposal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
