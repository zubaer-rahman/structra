"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Building,
  User,
  DollarSign,
  FileText,
  AlertCircle,
  Shield,
  ThumbsUp,
  ThumbsDown,
  Clock4,
  CheckCircle,
  AlertTriangle,
  Image,
  Award,
  XCircle,
  Download,
  Share2,
} from "lucide-react";
import { USER_ROLES } from "@/utils/constants";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase";
import { getProposalStatusConfig } from "@/utils/helpers";
import ProjectImageGallery from "@/components/features/projects/HomeownerProjectView/ProjectImageGallery";
import PDFPreviewModal from "@/components/shared/PDFPreviewModal";
import { generateProposalPDFBlob } from "@/utils/helpers/pdfPreviewGenerator";
import { ProposalWithJoins } from "@/server/database/interfaces/proposals";

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
  const [rejectReason, setRejectReason] = useState("");
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [previewPDFBlob, setPreviewPDFBlob] = useState<Blob | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");

  // Unwrap params using React.use()
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
            id,
            title,
            description_of_work,
            subtotal_amount,
            tax_included,
            total_amount,
            deposit_amount,
            deposit_due_on,
            delay_penalty,
            abandonment_penalty,
            proposed_start_date,
            proposed_end_date,
            expiry_date,
            status,
            is_selected,
            is_deleted,
            submitted_date,
            accepted_date,
            rejected_date,
            withdrawn_date,
            viewed_date,
            last_updated,
            rejected_by,
            rejection_reason,
            rejection_reason_notes,
            clause_preview_html,
            attached_files,
            notes,
            visibility_settings,
            project,
            contractor,
            homeowner,
            created_by,
            last_modified_by,
            created_at,
            updated_at,
            project:projects (
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
          console.error("Error fetching proposal:", fetchError);
          setError(fetchError.message);
          return;
        }


        // Manually fetch contractor details
        let contractor_details = null;
        if (data.contractor) {
          const { data: contractorData, error: contractorError } =
            await supabase
              .from("users")
              .select(
                "id, full_name, email, phone_number, address"
              )
              .eq("id", data.contractor)
              .single();

          // Also fetch contractor profile data
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
              ...profileData
            };
          }
        }

        // Transform the data to match our HomeownerProposalData interface
        const transformedData: HomeownerProposalData = {
          ...data,
          project: data.project?.id || data.project, // Preserve the project ID string
          project_details: {
            ...data.project,
            location: {
              ...data.project?.location,
              ...(data.project?.location_geom?.coordinates && {
                lat: data.project.location_geom.coordinates[1],
                lng: data.project.location_geom.coordinates[0]
              })
            }
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
      
      // First, mark the selected proposal as viewed (if not already)
      await supabase
        .from('proposals')
        .update({
          status: PROPOSAL_STATUSES.VIEWED,
          viewed_date: new Date().toISOString(),
          last_updated: new Date().toISOString(),
          last_modified_by: user.id
        })
        .eq('id', proposal.id)
        .eq('status', PROPOSAL_STATUSES.SUBMITTED);
      
      // Accept the selected proposal
      const { error: acceptError } = await supabase
        .from('proposals')
        .update({
          status: PROPOSAL_STATUSES.ACCEPTED,
          is_selected: 'yes',
          accepted_date: new Date().toISOString(),
          contract_reviewed: true,
          homeowner_contract_reviewed: true,
          contract_reviewed_at: new Date().toISOString(),
          homeowner_contract_reviewed_at: new Date().toISOString(),
          last_updated: new Date().toISOString(),
          last_modified_by: user.id
        })
        .eq('id', proposal.id)
        .eq('homeowner', user.id);
      
      if (acceptError) {
        throw acceptError;
      }

      // Ensure only the accepted proposal remains selected.
      const { error: clearSelectionError } = await supabase
        .from('proposals')
        .update({
          is_selected: 'no',
          last_updated: new Date().toISOString(),
          last_modified_by: user.id
        })
        .eq('project', proposal.project)
        .eq('homeowner', user.id)
        .neq('id', proposal.id);

      if (clearSelectionError) {
        throw clearSelectionError;
      }
      
      // Reject all other proposals for this project
      const { error: rejectError } = await supabase
        .from('proposals')
        .update({
          status: PROPOSAL_STATUSES.REJECTED,
          rejected_date: new Date().toISOString(),
          rejection_reason: 'other',
          rejection_reason_notes: 'Another proposal was selected by the homeowner',
          last_updated: new Date().toISOString(),
          last_modified_by: user.id
        })
        .eq('project', proposal.project)
        .neq('id', proposal.id)
        .in('status', [PROPOSAL_STATUSES.SUBMITTED, PROPOSAL_STATUSES.VIEWED]);
      
      if (rejectError) {
        throw rejectError;
      }
      
      // Update project status to proposal selected
      const { error: projectError } = await supabase
        .from('projects')
        .update({ status: PROJECT_STATUSES.PROPOSAL_SELECTED })
        .eq('id', proposal.project);
      
      if (projectError) {
        throw projectError;
      }
      
      console.log("Proposal accepted:", proposal.id);
      toast.success("Proposal accepted successfully!");
      setDecisionMade(true);
      // Redirect to project details or show success message
      setTimeout(
        () => router.push(`/homeowner/projects/view/${proposal.project}`),
        2000
      );
    } catch (error) {
      console.error("Error accepting proposal:", error);
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
      
      // Update proposal status to rejected
      const { error: rejectError } = await supabase
        .from('proposals')
        .update({
          status: PROPOSAL_STATUSES.REJECTED,
          rejected_date: new Date().toISOString(),
          rejection_reason: 'other',
          rejection_reason_notes: trimmedReason,
          last_updated: new Date().toISOString(),
          last_modified_by: user.id
        })
        .eq('id', proposal.id)
        .eq('homeowner', user.id);
      
      if (rejectError) {
        throw rejectError;
      }
      
      console.log("Proposal rejected:", proposal.id);
      toast.success("Proposal rejected successfully!");
      setDecisionMade(true);
      setRejectReason("");
      // Show rejection reason modal or redirect
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
        setPreviewTitle(`Proposal - ${proposal.title}`);
        setShowPDFPreview(true);
        return;
      }

      toast.error(result.error || "Failed to generate PDF preview");
    } catch (error) {
      console.error("PDF preview error:", error);
      toast.error("Failed to generate PDF preview");
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Proposal
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Proposal Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The requested proposal could not be found.
          </p>
          <Button onClick={() => router.push("/homeowner/proposals")}>
            View All Proposals
          </Button>
        </div>
      </div>
    );
  }

  if (userRole !== USER_ROLES.HOMEOWNER) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don&apos;t have permission to view this proposal.
          </p>
        </div>
      </div>
    );
  }

  const proposalStatusConfig = getProposalStatusConfig(proposal.status);
  const StatusIcon = proposalStatusConfig.icon;

  if (decisionMade) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Decision Recorded
          </h2>
          <p className="text-gray-600 mb-4">
            Your decision has been recorded. You&apos;ll be redirected shortly.
          </p>
          <div className="animate-pulse">
            <div className="h-2 bg-gray-200 rounded-full mb-2"></div>
            <div className="h-2 bg-gray-200 rounded-full w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        <div className="bg-white px-4 py-4 mb-6">
          <div className="max-w-7xl mx-auto">
            <Breadcrumbs
              items={[
                { label: "Dashboard", href: "/homeowner/dashboard" },
                { label: "Proposals", href: "/homeowner/proposals" },
                { label: proposal.project_details?.project_title || "Project Proposal", href: "#" },
              ]}
            />
          </div>
        </div>

        {/* Decision Header */}
        <div className="bg-white p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <StatusIcon className="h-5 w-5 text-black" />
                <Badge className="bg-black text-white border-0 px-3 py-1">
                  {proposalStatusConfig.label}
                </Badge>
                <span className="text-sm text-gray-600">
                  Submitted {proposal.submitted_date ? formatDate(proposal.submitted_date) : "Date not specified"}
                </span>
              </div>

              <h1 className="text-3xl font-bold text-black mb-2">
                {proposal.project_details?.project_title || "Project Details"}
              </h1>
              <p className="text-gray-600">
                Proposal from {proposal.contractor_details?.business_name || proposal.contractor_details?.full_name || "Contractor"}
              </p>
            </div>

            {/* Quick Decision Actions */}
            {!proposal.accepted_date && !proposal.rejected_date && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => {
                    handleOpenDecisionPDF();
                  }}
                  disabled={actionLoading}
                  variant="outline"
                  className="px-6 py-2 font-medium"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {actionLoading ? "Processing..." : "Accept"}
                </Button>
                <Button
                  onClick={() => {
                    handleOpenDecisionPDF();
                  }}
                  disabled={actionLoading}
                  variant="outline"
                  className="px-6 py-2 font-medium"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {actionLoading ? "Processing..." : "Reject"}
                </Button>
              </div>
            )}
            
            {/* Show status message if already decided */}
            {(proposal.accepted_date || proposal.rejected_date) && (
              <div className="flex items-center justify-between px-4 py-2 bg-gray-100">
                <div className="flex items-center gap-3">
                  {proposal.accepted_date ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-black" />
                      <span className="text-black font-medium">
                        Proposal Accepted on {formatDate(proposal.accepted_date)}
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-gray-600" />
                      <span className="text-gray-600 font-medium">
                        Proposal Rejected on {formatDate(proposal.rejected_date!)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Project & Proposal Details */}
          <div className="xl:col-span-2 space-y-6">
            {/* Financial Summary */}
            <div className="bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <DollarSign className="h-5 w-5 text-black" />
                <h2 className="text-2xl font-bold text-black">
                  Financial Summary
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="text-center p-4 bg-orange-50">
                  <p className="text-sm text-gray-600 font-medium mb-2">Proposal Amount</p>
                  <p className="text-2xl font-bold text-black">
                    {formatCurrency(proposal.total_amount || 0)}
                  </p>
                </div>
                <div className="text-center p-4 bg-blue-50">
                  <p className="text-sm text-gray-600 font-medium mb-2">GST/HST</p>
                  <p className="text-xl font-bold text-blue-700">
                    {formatCurrency((proposal.total_amount || 0) - (proposal.subtotal_amount || 0))}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50">
                  <p className="text-sm text-gray-600 font-medium mb-2">Project Budget</p>
                  <p className="text-xl font-semibold text-gray-700">
                    {proposal.project_details?.budget
                      ? formatCurrency(proposal.project_details.budget)
                      : "Not specified"}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50">
                  <p className="text-sm text-gray-600 font-medium mb-2">Potential Savings</p>
                  <p className="text-xl font-bold text-black">
                    {proposal.project_details?.budget && proposal.total_amount
                      ? formatCurrency(
                          proposal.project_details.budget -
                            proposal.total_amount
                        )
                      : "Not specified"}
                  </p>
                </div>
                <div className="text-center p-4 bg-red-50">
                  <p className="text-sm text-gray-600 font-medium mb-2">Delay Penalty (Per Day)</p>
                  <p className="text-xl font-bold text-red-700">
                    {proposal.delay_penalty && proposal.delay_penalty > 0
                      ? formatCurrency(proposal.delay_penalty)
                      : "No penalty"}
                  </p>
                </div>
                <div className="text-center p-4 bg-orange-50">
                  <p className="text-sm text-gray-600 font-medium mb-2">Abandonment Penalty</p>
                  <p className="text-xl font-bold text-orange-700">
                    {proposal.abandonment_penalty && proposal.abandonment_penalty > 0
                      ? formatCurrency(proposal.abandonment_penalty)
                      : "No penalty"}
                  </p>
                </div>
              </div>
            </div>

            {/* Work Description */}
            <div className="bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="h-5 w-5 text-black" />
                <h2 className="text-2xl font-bold text-black">
                  Work Description
                </h2>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-gray-50">
                  <h3 className="font-semibold text-black mb-3">
                    Description of Work
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {proposal.description_of_work || "No description provided"}
                  </p>
                </div>

                {proposal.notes && (
                  <div className="p-4 bg-gray-50">
                    <h3 className="font-semibold text-black mb-3">Additional Notes</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {proposal.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Project Photos */}
            {(proposal.project_details?.certificate_of_title || proposal.project_details?.project_photos || proposal.project_details?.files) && (
              <div className="bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Image className="h-5 w-5 text-black" aria-label="Project photos icon" />
                  <h2 className="text-2xl font-bold text-black">
                    Project Photos
                  </h2>
                </div>
                
                {/* Photo Gallery */}
                {proposal.project_details?.project_photos && proposal.project_details.project_photos.length > 0 && (
                  <div className="mb-6">
                    <ProjectImageGallery 
                      projectPhotos={proposal.project_details.project_photos?.map(photo => ({
                        ...photo,
                        uploadedAt: photo.uploadedAt ? new Date(photo.uploadedAt) : undefined
                      }))}
                      projectType={proposal.project_details.project_type}
                    />
                  </div>
                )}
                
                {/* Project Files */}
                {proposal.project_details?.files && proposal.project_details.files.length > 0 && (
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-50">
                      <div className="flex items-center space-x-3 mb-2">
                        <FileText className="h-5 w-5 text-gray-600" />
                        <span className="font-medium text-black">Project Files ({proposal.project_details.files.length})</span>
                      </div>
                      <div className="text-sm text-gray-600">Additional project documents available</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Project Details */}
            <div className="bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Building className="h-5 w-5 text-black" />
                <h2 className="text-2xl font-bold text-black">
                  Project Details
                </h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50">
                    <h3 className="font-medium text-black mb-2">Location</h3>
                    <p className="text-gray-700 text-sm">
                      {proposal.project_details?.location
                        ? `${proposal.project_details.location.city || 'Unknown City'}, ${proposal.project_details.location.province || 'Unknown Province'}`
                        : "Location not specified"}
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50">
                    <h3 className="font-medium text-black mb-2">Category</h3>
                    <p className="text-gray-700 text-sm">
                      {proposal.project_details?.category
                        ? Array.isArray(proposal.project_details.category)
                          ? proposal.project_details.category.join(", ")
                          : proposal.project_details.category
                        : "Not specified"}
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50">
                    <h3 className="font-medium text-black mb-2">Project Type</h3>
                    <p className="text-gray-700 text-sm">
                      {proposal.project_details?.project_type || "Type not specified"}
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50">
                    <h3 className="font-medium text-black mb-2">Permit Required</h3>
                    <p className="text-gray-700 text-sm">
                      {proposal.project_details?.permit_required
                        ? "Yes"
                        : "No"}
                    </p>
                  </div>
                </div>



                {/* Verified Project Badge */}
                <div className="pt-4">
                  <div className="space-y-3">
                    {proposal.project_details?.is_verified_project && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50">
                        <Award className="h-4 w-4 text-black" />
                        <span className="text-black font-medium">
                          Verified Project
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Attached Files */}
            {proposal.attached_files && proposal.attached_files.length > 0 && (
              <div className="bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <Download className="h-5 w-5 text-black" />
                  <h2 className="text-2xl font-bold text-black">
                    Supporting Documents
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {proposal.attached_files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium text-black">{file.filename}</p>
                          {file.size && (
                            <p className="text-sm text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            // Fetch the file as a blob to force download
                            const response = await fetch(file.url)
                            const blob = await response.blob()
                            const url = window.URL.createObjectURL(blob)
                            const link = document.createElement('a')
                            link.href = url
                            link.download = file.filename
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                            window.URL.revokeObjectURL(url)
                          } catch (error) {
                            console.error('Download failed:', error)
                            // Fallback to direct link if fetch fails
                            const link = document.createElement('a')
                            link.href = file.url
                            link.download = file.filename
                            link.style.display = 'none'
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                          }
                        }}
                        className="h-8 px-3 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Contractor & Actions */}
          <div className="space-y-6">
            {/* Contractor Profile */}
            <div className="bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <User className="h-5 w-5 text-black" />
                <h2 className="text-2xl font-bold text-black">
                  Contractor Profile
                </h2>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-semibold text-black">
                  {proposal.contractor_details?.full_name || "Contractor"}
                </h3>
                <p className="text-gray-600 font-medium">
                  {proposal.contractor_details?.business_name ||
                    "Business Name Not Available"}
                </p>
                {proposal.contractor_details?.bio && (
                  <p className="text-sm text-gray-500 mt-1">
                    {proposal.contractor_details.bio}
                  </p>
                )}
              </div>



              {/* Business Information */}
              <div className="p-4 mb-4 bg-gray-50">
                <h3 className="font-medium text-black mb-3">Business Information</h3>
                <div className="space-y-3">
                  {proposal.contractor_details?.service_location && (
                    <div className="text-sm">
                      <span className="font-medium text-black">Service Area:</span>
                      <span className="text-gray-700 ml-2">{proposal.contractor_details.service_location}</span>
                    </div>
                  )}
                  {proposal.contractor_details?.trade_category && proposal.contractor_details.trade_category.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium text-black">Specialties:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {proposal.contractor_details.trade_category.map((category, index) => (
                          <span key={index} className="bg-white text-black text-xs px-2 py-1">
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {proposal.contractor_details?.work_guarantee && (
                    <div className="text-sm">
                      <span className="font-medium text-black">Work Guarantee:</span>
                      <span className="text-gray-700 ml-2">{proposal.contractor_details.work_guarantee} months</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Credentials */}
              <div className="p-4 bg-gray-50">
                <h3 className="font-medium text-black mb-3">Credentials</h3>
                <div className="space-y-3">
                  {proposal.contractor_details?.licenses && proposal.contractor_details.licenses.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium text-black">Licensed:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {proposal.contractor_details.licenses.map((license, index) => (
                          <span key={index} className="bg-white text-black text-xs px-2 py-1">
                            {license}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(proposal.contractor_details?.insurance_general_liability || proposal.contractor_details?.insurance_builders_risk) && (
                    <div className="text-sm">
                      <div className="font-medium text-black mb-1">Insurance Coverage:</div>
                      <div className="text-gray-700 space-y-1">
                        {proposal.contractor_details?.insurance_general_liability && (
                          <div className="text-xs">General Liability: ${proposal.contractor_details.insurance_general_liability.toLocaleString()}</div>
                        )}
                        {proposal.contractor_details?.insurance_builders_risk && (
                          <div className="text-xs">Builder&apos;s Risk: ${proposal.contractor_details.insurance_builders_risk.toLocaleString()}</div>
                        )}
                        {proposal.contractor_details?.insurance_expiry && (
                          <div className="text-xs">Expires: {new Date(proposal.contractor_details.insurance_expiry).toLocaleDateString()}</div>
                        )}
                        {proposal.contractor_details?.is_insurance_verified && (
                          <div className="text-xs text-black font-medium">✓ Verified</div>
                        )}
                      </div>
                    </div>
                  )}
                  {proposal.contractor_details?.legal_entity_type && (
                    <div className="text-sm">
                      <span className="font-medium text-black">Business Type:</span>
                      <span className="text-gray-700 ml-2">{proposal.contractor_details.legal_entity_type}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>



            {/* Timeline */}
            <div className="bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Clock4 className="h-5 w-5 text-black" />
                <h2 className="text-2xl font-bold text-black">
                  Timeline
                </h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50">
                  <span className="font-medium text-black">Proposed Start Date</span>
                  <span className="text-gray-700 text-sm">
                    {proposal.proposed_start_date
                      ? formatDate(proposal.proposed_start_date)
                      : "Not specified"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50">
                  <span className="font-medium text-black">Proposed End Date</span>
                  <span className="text-gray-700 text-sm">
                    {proposal.proposed_end_date
                      ? formatDate(proposal.proposed_end_date)
                      : "Not specified"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50">
                  <span className="font-medium text-black">Proposed Duration</span>
                  <span className="text-gray-700 text-sm">
                    {proposal.proposed_start_date && proposal.proposed_end_date
                      ? `${Math.ceil(
                          (new Date(proposal.proposed_end_date).getTime() -
                            new Date(proposal.proposed_start_date).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )} days`
                      : "Not specified"}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact & Actions - Hidden for now */}
            {/* 
             <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
               <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact & Actions</h2>
               
               <div className="space-y-3">
                 <Button variant="outline" className="w-full">
                   <Phone className="h-4 w-4 mr-2" />
                   Call Contractor
                 </Button>
                 <Button variant="outline" className="w-full">
                   <Mail className="h-4 w-4 mr-2" />
                   Send Message
                 </Button>
                 <Button variant="outline" className="w-full" onClick={handleGeneratePDF}>
                   <Download className="h-4 w-4 mr-2" />
                   Download PDF
                 </Button>
                 <Button variant="outline" className="w-full">
                   <Share2 className="h-4 w-4 mr-2" />
                   Share
                 </Button>
               </div>
             </div>
             */}
          </div>
        </div>
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
              onClick={() => {
                setShowAcceptDialog(false);
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAcceptProposal}
              disabled={actionLoading}
              variant="outline"
            >
              {actionLoading ? "Accepting..." : "Accept Proposal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Reject Confirmation Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Proposal</DialogTitle>
            <DialogDescription>
              Provide a reason so the contractor can update and resubmit the contract.
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
                setShowRejectDialog(false);
                setRejectReason("");
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRejectProposal}
              disabled={actionLoading || !rejectReason.trim()}
              variant="outline"
            >
              {actionLoading ? "Rejecting..." : "Reject Proposal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
