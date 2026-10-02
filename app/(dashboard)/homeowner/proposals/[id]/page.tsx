"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Breadcrumbs, LoadingSpinner } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { PROPOSAL_STATUSES } from "@/utils/constants/proposals";
import { PROJECT_STATUSES } from "@/utils/constants/projects";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Building2,
  FileText,
  AlertCircle,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  XCircle,
  Download,
  Calendar,
  MapPin,
  ArrowLeft,
  Eye,
  Mail,
  Phone,
  FileDown,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";
import { USER_ROLES } from "@/utils/constants";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase";
import { getProposalStatusConfig, formatLocation } from "@/utils/helpers";
import ProjectImageGallery from "@/components/features/projects/HomeownerProjectView/ProjectImageGallery";
import PDFPreviewModal from "@/components/shared/PDFPreviewModal";
import { generateProposalPDFBlob } from "@/utils/helpers/pdfPreviewGenerator";
import { ProposalWithJoins } from "@/server/database/interfaces/proposals";
import { RandomAvatar } from "@/components/ui/random-avatar";

interface Location {
  lat?: number;
  lng?: number;
  city?: string;
  province?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  postalCode?: string;
}

interface Address {
  street?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
}

interface HomeownerProposalData {
  id: string;
  title: string;
  description_of_work: string;
  subtotal_amount: number | null;
  tax_included: "yes" | "no";
  total_amount: number | null;
  deposit_amount: number | null;
  deposit_due_on: string | null;
  delay_penalty: number | null;
  abandonment_penalty: number | null;
  proposed_start_date: string | null;
  proposed_end_date: string | null;
  expiry_date: string | null;
  status: string;
  is_selected: "yes" | "no";
  submitted_date: string | null;
  accepted_date: string | null;
  rejected_date: string | null;
  withdrawn_date: string | null;
  viewed_date: string | null;
  last_updated: string;
  rejected_by: string | null;
  rejection_reason: string | null;
  rejection_reason_notes: string | null;
  clause_preview_html: string | null;
  attached_files: Array<{
    id: string;
    filename: string;
    url: string;
    size?: number;
    mimeType?: string;
    uploadedAt?: string;
  }>;
  notes: string | null;
  visibility_settings: string;
  project: string;
  contractor: string;
  homeowner: string;
  project_details?: {
    id: string;
    project_title: string;
    statement_of_work: string;
    category: string[] | string;
    location?: Location;
    status: string;
    budget: number | null;
    start_date: string | null;
    end_date: string | null;
    permit_required: boolean;
    creator: string;
    project_type?: string;
    visibility_settings?: string;
    expiry_date?: string | null;
    decision_date?: string | null;
    certificate_of_title?: string | null;
    project_photos?: Array<{
      id: string;
      filename: string;
      url: string;
      size?: number;
      mimeType?: string;
      uploadedAt?: string;
    }>;
    files?: Array<{
      id: string;
      filename: string;
      url: string;
      size?: number;
      mimeType?: string;
      uploadedAt?: string;
    }>;
    substantial_completion?: string | null;
    is_verified_project?: boolean;
    delay_penalty?: number;
    abandonment_penalty?: number;
  };
  contractor_details?: {
    id: string;
    full_name: string;
    email: string;
    phone_number?: string;
    business_name?: string;
    bio?: string;
    service_location?: string;
    trade_category?: string[];
    legal_entity_type?: string;
    gst_hst_number?: string;
    wcb_number?: string;
    insurance_general_liability?: number;
    insurance_builders_risk?: number;
    insurance_expiry?: string;
    insurance_upload?: string;
    is_insurance_verified?: boolean;
    licenses?: string[];
    portfolio?: string[];
    logo?: string;
    work_guarantee?: number;
    work_guarantee_statement?: string;
    address?: Address;
  };
}

export default function HomeownerProposalViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userRole } = useAuth();
  const [proposal, setProposal] = useState<HomeownerProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decisionMade, setDecisionMade] = useState(false);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [previewPDFBlob, setPreviewPDFBlob] = useState<Blob | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");

  const resolvedParams = use(params);
  const proposalId = resolvedParams.id;

  useEffect(() => {
    if (!user) return;

    const fetchProposal = async () => {
      try {
        setLoading(true);
        const supabase = createClient();

        const { data, error: fetchError } = await supabase
          .from("proposals")
          .select(
            `
            *,
            project:projects!proposals_project_fkey (
              id,
              project_title,
              statement_of_work,
              category,
              location,
              pid,
              status,
              budget,
              start_date,
              end_date,
              permit_required,
              creator,
              project_type,
              visibility_settings,
              expiry_date,
              decision_date,
              certificate_of_title,
              project_photos,
              files,
              substantial_completion,
              is_verified_project,
              delay_penalty,
              abandonment_penalty
            )
          `
          )
          .eq("id", proposalId)
          .eq("homeowner", user.id)
          .eq("is_deleted", "no")
          .single();

        if (fetchError) {
          console.error("Error fetching proposal:", fetchError.message || fetchError);
          setError(fetchError.message);
          return;
        }

        let contractor_details = null;
        if (data.contractor) {
          const { data: contractorData, error: contractorError } =
            await supabase
              .from("users")
              .select("id, full_name, email, phone_number, address")
              .eq("id", data.contractor)
              .single();

          const { data: profileData } =
            await supabase
              .from("contractor_profiles")
              .select(
                "business_name, bio, service_location, trade_category, legal_entity_type, gst_hst_number, wcb_number, insurance_general_liability, insurance_builders_risk, insurance_expiry, insurance_upload, is_insurance_verified, licenses, portfolio, logo, work_guarantee, work_guarantee_statement"
              )
              .eq("user_id", data.contractor)
              .single();

          if (!contractorError && contractorData) {
            contractor_details = {
              ...contractorData,
              ...profileData,
            };
          }
        }

        const transformedData: HomeownerProposalData = {
          ...data,
          project: data.project?.id || data.project,
          project_details: {
            ...data.project,
            location: {
              ...data.project?.location,
              ...(data.project?.location_geom?.coordinates && {
                lat: data.project.location_geom.coordinates[1],
                lng: data.project.location_geom.coordinates[0],
              }),
            },
          },
          contractor_details: contractor_details || undefined,
        };

        setProposal(transformedData);
      } catch (err) {
        setError("Failed to fetch proposal details");
        console.error("Error fetching proposal:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProposal();
  }, [user, proposalId]);

  useEffect(() => {
    if (!proposal) return;

    const intent = searchParams.get("intent");
    const canTakeAction = !proposal.accepted_date && !proposal.rejected_date;

    if (!canTakeAction || !intent) return;

    if (intent === "accept") {
      setShowAcceptDialog(true);
    }

    if (intent === "reject") {
      setShowRejectDialog(true);
    }
  }, [proposal, searchParams]);

  const handleAcceptProposal = async () => {
    if (!proposal || !user) return;

    setActionLoading(true);
    setShowAcceptDialog(false);

    try {
      const supabase = createClient();

      await supabase
        .from("proposals")
        .update({
          status: PROPOSAL_STATUSES.VIEWED,
          viewed_date: new Date().toISOString(),
          last_updated: new Date().toISOString(),
          last_modified_by: user.id,
        })
        .eq("id", proposal.id)
        .eq("status", PROPOSAL_STATUSES.SUBMITTED);

      const { error: acceptError } = await supabase
        .from("proposals")
        .update({
          status: PROPOSAL_STATUSES.ACCEPTED,
          is_selected: "yes",
          accepted_date: new Date().toISOString(),
          last_updated: new Date().toISOString(),
          last_modified_by: user.id,
        })
        .eq("id", proposal.id)
        .eq("homeowner", user.id);

      if (acceptError) throw acceptError;

      const { error: clearSelectionError } = await supabase
        .from("proposals")
        .update({
          is_selected: "no",
          last_updated: new Date().toISOString(),
          last_modified_by: user.id,
        })
        .eq("project", proposal.project)
        .eq("homeowner", user.id)
        .neq("id", proposal.id);

      if (clearSelectionError) throw clearSelectionError;

      const { error: rejectError } = await supabase
        .from("proposals")
        .update({
          status: PROPOSAL_STATUSES.REJECTED,
          rejected_date: new Date().toISOString(),
          notes: "Another proposal was selected by the homeowner",
          last_updated: new Date().toISOString(),
          last_modified_by: user.id,
        })
        .eq("project", proposal.project)
        .neq("id", proposal.id)
        .in("status", [PROPOSAL_STATUSES.SUBMITTED, "pending", PROPOSAL_STATUSES.VIEWED]);

      if (rejectError) throw rejectError;

      const { error: projectError } = await supabase
        .from("projects")
        .update({ status: PROJECT_STATUSES.PROPOSAL_SELECTED })
        .eq("id", proposal.project);

      if (projectError) throw projectError;

      toast.success("Proposal accepted successfully!");
      setDecisionMade(true);
      setTimeout(
        () => router.push(`/homeowner/projects/view/${proposal.project}`),
        2000
      );
    } catch (error) {
      console.error("Error accepting proposal:", error instanceof Error ? error.message : error);
      toast.error("Failed to accept proposal. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectProposal = async () => {
    if (!proposal || !user) return;

    const trimmedReason = rejectReason.trim();
    if (!trimmedReason) {
      toast.error("Please provide a reason for rejection.");
      return;
    }

    setActionLoading(true);
    setShowRejectDialog(false);

    try {
      const supabase = createClient();

      const { error: rejectError } = await supabase
        .from("proposals")
        .update({
          status: PROPOSAL_STATUSES.REJECTED,
          rejected_date: new Date().toISOString(),
          notes: trimmedReason,
          last_updated: new Date().toISOString(),
          last_modified_by: user.id,
        })
        .eq("id", proposal.id)
        .eq("homeowner", user.id);

      if (rejectError) throw rejectError;

      toast.success("Proposal rejected successfully!");
      setDecisionMade(true);
      setRejectReason("");
      setTimeout(() => router.push("/homeowner/proposals"), 2000);
    } catch (error) {
      console.error("Error rejecting proposal:", error);
      toast.error("Failed to reject proposal. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDecisionPDF = async () => {
    if (!proposal) return;

    try {
      const supabase = createClient();
      const { data: pdfData, error: pdfError } = await supabase
        .from("proposals")
        .select(`
          *,
          project_details:projects!proposals_project_fkey (
            id,
            project_title,
            location,
            pid
          ),
          contractor_profile:users!proposals_contractor_fkey (
            id,
            full_name,
            email,
            phone_number,
            address
          )
        `)
        .eq("id", proposal.id)
        .single();

      if (pdfError || !pdfData) {
        throw pdfError || new Error("Failed to fetch full proposal data for PDF");
      }

      const proposalForPdf = {
        ...proposal,
        ...pdfData,
        project_details: Array.isArray(pdfData.project_details)
          ? pdfData.project_details[0]
          : pdfData.project_details,
      } as unknown as ProposalWithJoins;

      const result = await generateProposalPDFBlob(proposalForPdf, true);

      if (result.success && result.blob) {
        setPreviewPDFBlob(result.blob);
        setPreviewTitle(`Proposal - ${proposal.title || proposal.project_details?.project_title || "Details"}`);
        setShowPDFPreview(true);
        return;
      }

      toast.error(result.error || "Failed to generate PDF preview");
    } catch (error) {
      console.error("PDF preview error:", error);
      toast.error("Failed to generate PDF preview");
    }
  };

  const handleDownloadFile = async (url: string, filename: string, id: string) => {
    try {
      setDownloadingFileId(id);
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
      window.open(url, "_blank");
    } finally {
      setDownloadingFileId(null);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <LoadingSpinner />
        <p className="text-sm text-muted-foreground tracking-tight">Loading proposal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center p-6 space-y-4">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <h2 className="text-xl font-medium text-foreground tracking-tight">
            Error Loading Proposal
          </h2>
          <p className="text-muted-foreground text-sm">{error}</p>
          <Button onClick={() => router.back()} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center p-6 space-y-4">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-medium text-foreground tracking-tight">
            Proposal Not Found
          </h2>
          <p className="text-muted-foreground text-sm">
            The requested proposal could not be found or may have been removed.
          </p>
          <Button onClick={() => router.push("/homeowner/proposals")} variant="outline" size="sm">
            View All Proposals
          </Button>
        </div>
      </div>
    );
  }

  if (userRole !== USER_ROLES.HOMEOWNER) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center p-6 space-y-3">
          <Shield className="h-10 w-10 text-destructive mx-auto" />
          <h2 className="text-xl font-medium text-foreground tracking-tight">
            Access Denied
          </h2>
          <p className="text-muted-foreground text-sm">
            You don&apos;t have permission to view this proposal.
          </p>
        </div>
      </div>
    );
  }

  if (decisionMade) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center p-8 space-y-4">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
          <h2 className="text-2xl font-semibold text-foreground tracking-tight">
            Decision Recorded
          </h2>
          <p className="text-muted-foreground text-sm">
            Your decision has been updated. Redirecting to your project...
          </p>
          <div className="w-full bg-muted/60 rounded-full h-1 overflow-hidden mt-2">
            <div className="bg-emerald-500 h-1 rounded-full animate-[pulse_1s_ease-in-out_infinite] w-full" />
          </div>
        </div>
      </div>
    );
  }

  const proposalStatusConfig = getProposalStatusConfig(proposal.status);
  const StatusIcon = proposalStatusConfig.icon;
  const isDecided = Boolean(proposal.accepted_date || proposal.rejected_date);

  const totalAmount = proposal.total_amount || 0;
  const subtotalAmount = proposal.subtotal_amount || 0;
  const calculatedTax = Math.max(0, totalAmount - subtotalAmount);
  const projectBudget = proposal.project_details?.budget || null;
  const savings = projectBudget && totalAmount ? projectBudget - totalAmount : null;
  const durationDays =
    proposal.proposed_start_date && proposal.proposed_end_date
      ? Math.max(
          1,
          Math.ceil(
            (new Date(proposal.proposed_end_date).getTime() -
              new Date(proposal.proposed_start_date).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : null;

  const contractorName =
    proposal.contractor_details?.business_name ||
    proposal.contractor_details?.full_name ||
    "Contractor";

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* Top Bar: Breadcrumbs */}
      <div>
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/homeowner/dashboard" },
            { label: "Proposals", href: "/homeowner/proposals" },
            {
              label: proposal.project_details?.project_title || "Proposal",
              href: "#",
            },
          ]}
        />
      </div>

      {/* Hero Header: Open, Commanding, Minimal */}
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 pb-2">
          <div className="space-y-3 flex-1">
            {/* Metadata Pills */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 font-medium px-2.5 py-0.5 rounded-full border border-border bg-muted/40 text-foreground">
                <span className={`h-1.5 w-1.5 rounded-full ${
                  proposal.status === PROPOSAL_STATUSES.ACCEPTED
                    ? "bg-emerald-500"
                    : proposal.status === PROPOSAL_STATUSES.REJECTED
                    ? "bg-rose-500"
                    : "bg-blue-500"
                }`} />
                {proposalStatusConfig.label}
              </span>

              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Submitted {formatDate(proposal.submitted_date)}
              </span>

              {proposal.expiry_date && (
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Valid to {formatDate(proposal.expiry_date)}
                </span>
              )}
            </div>

            {/* Title & Relationship */}
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
                {proposal.project_details?.project_title || "Project Proposal"}
              </h1>
              <p className="text-sm text-muted-foreground">
                Submitted by <span className="font-medium text-foreground">{contractorName}</span>
                {proposal.project && (
                  <>
                    {" · "}
                    <Link
                      href={`/homeowner/projects/view/${proposal.project}`}
                      className="hover:text-foreground underline underline-offset-4 decoration-border"
                    >
                      View project listing
                    </Link>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Action Button Suite */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={handleOpenDecisionPDF}
              variant="outline"
              size="sm"
              className="gap-2 h-9 text-xs font-medium"
            >
              <Eye className="h-3.5 w-3.5" />
              Preview PDF
            </Button>

            {!isDecided && (
              <>
                <Button
                  onClick={() => setShowRejectDialog(true)}
                  disabled={actionLoading}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-destructive gap-1.5 h-9"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Decline
                </Button>

                <Button
                  onClick={() => setShowAcceptDialog(true)}
                  disabled={actionLoading}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-1.5 h-9 text-xs px-4 shadow-xs"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {actionLoading ? "Processing..." : "Accept Proposal"}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Minimal Decided Banner */}
        {isDecided && (
          <div className="pt-2">
            {proposal.accepted_date ? (
              <div className="border-l-2 border-emerald-500 bg-emerald-500/5 px-4 py-3 rounded-r-lg text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    Proposal accepted on <strong>{formatDate(proposal.accepted_date)}</strong>. Project moved to next phase.
                  </span>
                </div>
                {proposal.project && (
                  <Link
                    href={`/homeowner/projects/view/${proposal.project}`}
                    className="font-medium underline underline-offset-4 hover:text-emerald-900 dark:hover:text-emerald-200 shrink-0"
                  >
                    Open Project &rarr;
                  </Link>
                )}
              </div>
            ) : (
              <div className="border-l-2 border-rose-500 bg-rose-500/5 px-4 py-3 rounded-r-lg text-xs sm:text-sm text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span>Proposal declined on <strong>{formatDate(proposal.rejected_date)}</strong>.</span>
                  {proposal.notes && (
                    <span className="block mt-0.5 text-xs text-rose-700/80 dark:text-rose-400/80 italic">
                      Note: &ldquo;{proposal.notes}&rdquo;
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Financial Highlight Strip: Borderless, Typographic, Minimal */}
      <div className="border-y border-border/50 py-5 my-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8">
          {/* Proposal Total */}
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
              Proposal Total
            </div>
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight font-mono text-foreground">
              {formatCurrency(totalAmount)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {proposal.tax_included === "yes" ? "Tax included" : "+ Tax (estimated)"}
            </div>
          </div>

          {/* GST / HST */}
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
              GST / HST
            </div>
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight font-mono text-foreground">
              {formatCurrency(calculatedTax)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {proposal.tax_included === "yes" ? "Included" : "Tax estimate"}
            </div>
          </div>

          {/* Target Budget */}
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
              Target Budget
            </div>
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight font-mono text-foreground">
              {projectBudget ? formatCurrency(projectBudget) : "—"}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {projectBudget ? "Homeowner baseline" : "Not specified"}
            </div>
          </div>

          {/* Budget Variance */}
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
              {savings !== null && savings < 0 ? "Variance" : "Estimated Savings"}
            </div>
            <div className={`text-2xl sm:text-3xl font-semibold tracking-tight font-mono ${
              savings !== null && savings >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : savings !== null && savings < 0
                ? "text-amber-600 dark:text-amber-400"
                : "text-foreground"
            }`}>
              {savings !== null ? formatCurrency(Math.abs(savings)) : "—"}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {savings !== null
                ? savings >= 0
                  ? "Under target budget"
                  : "Above target budget"
                : "No baseline"}
            </div>
          </div>

          {/* Delay Penalty */}
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
              Delay Penalty
            </div>
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight font-mono text-foreground">
              {proposal.delay_penalty && proposal.delay_penalty > 0
                ? formatCurrency(proposal.delay_penalty)
                : "—"}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {proposal.delay_penalty && proposal.delay_penalty > 0
                ? "Per day overdue"
                : "No penalty"}
            </div>
          </div>

          {/* Abandonment Penalty */}
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
              Default Clause
            </div>
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight font-mono text-foreground">
              {proposal.abandonment_penalty && proposal.abandonment_penalty > 0
                ? formatCurrency(proposal.abandonment_penalty)
                : "—"}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {proposal.abandonment_penalty && proposal.abandonment_penalty > 0
                ? "Abandonment penalty"
                : "Standard protection"}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Clean 2-Column Asymmetrical Editorial Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 pt-2">
        {/* Main Flow (8 cols) */}
        <div className="lg:col-span-8 space-y-12">
          {/* Section: Scope & Description of Work */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Scope & Description of Work
              </h2>
            </div>

            <div className="text-sm sm:text-base text-foreground/90 leading-relaxed whitespace-pre-wrap font-normal">
              {proposal.description_of_work || "No work description provided."}
            </div>

            {proposal.notes && (
              <div className="border-l-2 border-amber-500/70 pl-4 py-1 mt-6 text-sm text-muted-foreground space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground block">
                  Contractor Notes
                </span>
                <p className="leading-relaxed whitespace-pre-wrap">{proposal.notes}</p>
              </div>
            )}
          </section>

          {/* Section: Project Overview & Specs */}
          <section className="space-y-4 border-t border-border/40 pt-10">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Project Listing Specifications
            </h2>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div className="flex flex-col py-1 border-b border-border/30">
                <dt className="text-xs text-muted-foreground mb-1">Location</dt>
                <dd className="font-medium text-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  {formatLocation(proposal.project_details?.location)}
                </dd>
              </div>

              <div className="flex flex-col py-1 border-b border-border/30">
                <dt className="text-xs text-muted-foreground mb-1">Trade Category</dt>
                <dd className="font-medium text-foreground">
                  {proposal.project_details?.category ? (
                    Array.isArray(proposal.project_details.category) ? (
                      proposal.project_details.category.join(", ")
                    ) : (
                      proposal.project_details.category
                    )
                  ) : (
                    "Not specified"
                  )}
                </dd>
              </div>

              <div className="flex flex-col py-1 border-b border-border/30">
                <dt className="text-xs text-muted-foreground mb-1">Project Type</dt>
                <dd className="font-medium text-foreground">
                  {proposal.project_details?.project_type || "Standard Project"}
                </dd>
              </div>

              <div className="flex flex-col py-1 border-b border-border/30">
                <dt className="text-xs text-muted-foreground mb-1">Permit Requirement</dt>
                <dd className="font-medium text-foreground">
                  {proposal.project_details?.permit_required ? "Permit Required" : "No Permit Required"}
                </dd>
              </div>
            </dl>

            {proposal.project_details?.is_verified_project && (
              <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Verified Project Listing on Structra</span>
              </div>
            )}
          </section>

          {/* Section: Project Visuals & Files */}
          {(proposal.project_details?.project_photos?.length ||
            proposal.project_details?.files?.length) ? (
            <section className="space-y-5 border-t border-border/40 pt-10">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Project Visuals & Listing Files
              </h2>

              {proposal.project_details?.project_photos &&
                proposal.project_details.project_photos.length > 0 && (
                  <div className="rounded-lg overflow-hidden border border-border/50">
                    <ProjectImageGallery
                      projectPhotos={proposal.project_details.project_photos.map((photo) => ({
                        ...photo,
                        uploadedAt: photo.uploadedAt ? new Date(photo.uploadedAt) : undefined,
                      }))}
                      projectType={proposal.project_details.project_type}
                    />
                  </div>
                )}

              {proposal.project_details?.files && proposal.project_details.files.length > 0 && (
                <div className="divide-y divide-border/30 pt-2">
                  {proposal.project_details.files.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-2.5 text-sm"
                    >
                      <span className="font-medium text-foreground truncate pr-4">
                        {file.filename}
                      </span>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 shrink-0 underline underline-offset-4"
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {/* Section: Supporting Documents Submitted by Contractor */}
          {proposal.attached_files && proposal.attached_files.length > 0 && (
            <section className="space-y-4 border-t border-border/40 pt-10">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  Attached Proposal Documents
                </h2>
                <span className="text-xs text-muted-foreground">
                  {proposal.attached_files.length} {proposal.attached_files.length === 1 ? "file" : "files"}
                </span>
              </div>

              <div className="divide-y divide-border/30">
                {proposal.attached_files.map((file, index) => {
                  const isDownloading = downloadingFileId === (file.id || String(index));
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between py-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-4">
                        <FileDown className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {file.filename}
                          </p>
                          {file.size && (
                            <p className="text-xs text-muted-foreground">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isDownloading}
                        onClick={() =>
                          handleDownloadFile(file.url, file.filename, file.id || String(index))
                        }
                        className="h-8 text-xs text-muted-foreground hover:text-foreground shrink-0 gap-1"
                      >
                        <Download className="h-3.5 w-3.5" />
                        {isDownloading ? "..." : "Download"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar Rail (4 cols): Minimalist Contractor Profile & Milestones */}
        <aside className="lg:col-span-4 space-y-10 lg:border-l lg:border-border/40 lg:pl-10">
          {/* Contractor Profile */}
          <div className="space-y-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Contractor Profile
            </h3>

            <div className="flex items-center gap-3.5">
              <RandomAvatar
                name={contractorName}
                size={48}
                className="rounded-full ring-1 ring-border shrink-0"
              />
              <div className="min-w-0">
                <h4 className="font-semibold text-foreground text-base truncate">
                  {contractorName}
                </h4>
                {proposal.contractor_details?.business_name &&
                  proposal.contractor_details?.full_name && (
                    <p className="text-xs text-muted-foreground truncate">
                      {proposal.contractor_details.full_name}
                    </p>
                  )}
                {proposal.contractor_details?.is_insurance_verified && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                    <ShieldCheck className="h-3 w-3" />
                    Verified Pro
                  </span>
                )}
              </div>
            </div>

            {proposal.contractor_details?.bio && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {proposal.contractor_details.bio}
              </p>
            )}

            <dl className="space-y-2.5 text-xs pt-2">
              {proposal.contractor_details?.service_location && (
                <div className="flex justify-between py-1 border-b border-border/20">
                  <dt className="text-muted-foreground">Service Area</dt>
                  <dd className="font-medium text-foreground text-right">
                    {proposal.contractor_details.service_location}
                  </dd>
                </div>
              )}

              {proposal.contractor_details?.work_guarantee && (
                <div className="flex justify-between py-1 border-b border-border/20">
                  <dt className="text-muted-foreground">Guarantee</dt>
                  <dd className="font-medium text-foreground">
                    {proposal.contractor_details.work_guarantee} Months Warranty
                  </dd>
                </div>
              )}

              {proposal.contractor_details?.insurance_general_liability && (
                <div className="flex justify-between py-1 border-b border-border/20">
                  <dt className="text-muted-foreground">Liability Coverage</dt>
                  <dd className="font-mono font-medium text-foreground">
                    ${proposal.contractor_details.insurance_general_liability.toLocaleString()}
                  </dd>
                </div>
              )}

              {proposal.contractor_details?.insurance_expiry && (
                <div className="flex justify-between py-1 border-b border-border/20">
                  <dt className="text-muted-foreground">Insurance Expiry</dt>
                  <dd className="text-foreground">
                    {formatDate(proposal.contractor_details.insurance_expiry)}
                  </dd>
                </div>
              )}

              {proposal.contractor_details?.legal_entity_type && (
                <div className="flex justify-between py-1 border-b border-border/20">
                  <dt className="text-muted-foreground">Business Structure</dt>
                  <dd className="text-foreground">
                    {proposal.contractor_details.legal_entity_type}
                  </dd>
                </div>
              )}

              {proposal.contractor_details?.email && (
                <div className="flex justify-between py-1 border-b border-border/20">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="font-mono text-muted-foreground truncate max-w-[160px]">
                    {proposal.contractor_details.email}
                  </dd>
                </div>
              )}

              {proposal.contractor_details?.phone_number && (
                <div className="flex justify-between py-1 border-b border-border/20">
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd className="font-mono text-muted-foreground">
                    {proposal.contractor_details.phone_number}
                  </dd>
                </div>
              )}
            </dl>

            {proposal.contractor_details?.trade_category &&
              proposal.contractor_details.trade_category.length > 0 && (
                <div className="pt-2">
                  <div className="text-[11px] text-muted-foreground mb-1.5 uppercase tracking-wider">
                    Specialties
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {proposal.contractor_details.trade_category.map((specialty, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] text-muted-foreground bg-muted/40 px-2 py-0.5 rounded"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </div>

          {/* Timeline & Milestones */}
          <div className="space-y-4 border-t border-border/40 pt-8">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Proposed Milestones
            </h3>

            <dl className="space-y-3 text-xs">
              <div className="flex justify-between items-baseline py-1 border-b border-border/20">
                <dt className="text-muted-foreground">Target Start</dt>
                <dd className="font-semibold text-foreground">
                  {formatDate(proposal.proposed_start_date)}
                </dd>
              </div>

              <div className="flex justify-between items-baseline py-1 border-b border-border/20">
                <dt className="text-muted-foreground">Estimated Completion</dt>
                <dd className="font-semibold text-foreground">
                  {formatDate(proposal.proposed_end_date)}
                </dd>
              </div>

              <div className="flex justify-between items-baseline py-1 border-b border-border/20">
                <dt className="text-muted-foreground">Total Work Duration</dt>
                <dd className="font-semibold text-foreground">
                  {durationDays ? `${durationDays} Days` : "Not specified"}
                </dd>
              </div>

              {proposal.deposit_amount && proposal.deposit_amount > 0 ? (
                <div className="flex justify-between items-baseline py-1 border-b border-border/20">
                  <dt className="text-muted-foreground">Initial Deposit</dt>
                  <dd className="font-semibold text-foreground">
                    {formatCurrency(proposal.deposit_amount)}
                    {proposal.deposit_due_on && (
                      <span className="block text-[10px] text-muted-foreground font-normal">
                        Due: {formatDate(proposal.deposit_due_on)}
                      </span>
                    )}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        </aside>
      </div>

      {/* Confirmation Dialogs */}
      <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Accept Proposal
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              You are selecting the proposal of{" "}
              <strong className="text-foreground">{formatCurrency(totalAmount)}</strong> from{" "}
              <strong className="text-foreground">{contractorName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <p className="text-xs text-muted-foreground border-l-2 border-amber-500 pl-3 py-1 my-1">
            Accepting will decline other proposals on this project and move the project to the Proposal Selected stage.
          </p>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAcceptDialog(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAcceptProposal}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              {actionLoading ? "Accepting..." : "Confirm Acceptance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Decline Proposal
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Provide feedback to the contractor explaining why this proposal was declined.
            </DialogDescription>
          </DialogHeader>

          <div className="my-2">
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Budget constraints, scheduling conflict, or scope adjustment..."
              rows={4}
              disabled={actionLoading}
              className="text-xs resize-none"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectReason("");
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRejectProposal}
              disabled={actionLoading || !rejectReason.trim()}
            >
              {actionLoading ? "Declining..." : "Confirm Decline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Contract Preview Modal */}
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
        showDecisionActions={!proposal.accepted_date && !proposal.rejected_date}
        onAccept={() => {
          setShowAcceptDialog(true);
        }}
        onReject={() => {
          setRejectReason("");
          setShowRejectDialog(true);
        }}
      />
    </div>
  );
}
