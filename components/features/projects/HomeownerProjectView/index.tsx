"use client";

import { useState, useEffect } from "react";
import { Project, SiteAmenities } from "@/server/database/interfaces";
import { ProposalWithJoins } from "@/server/database/interfaces/proposals";
import { User } from "@/server/database/interfaces/auth";
import { ProjectViewTabs } from "./ProjectViewTabs";
import ProjectViewHeader from "./ProjectViewHeader";
// Removed unused imports: ProjectImageGallery, Button, Share, Globe, PROJECT_STATUSES
import { USER_ROLES, PROJECT_STATUSES } from "@/utils/constants";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { LoadingSpinner } from "@/components/shared";
import {
  DetailsTabContent,
  ProposalsTabContent,
} from "@/components/features/projects";
import { CertificateTabContent } from "../CertificateTabContent";
import { ProjectPhotosTab } from "../ProjectPhotosTab";
import HomeownerProjectFilesTab from "./HomeownerProjectFilesTab";
import ReviewsTabContent from "../ReviewsTabContent";
import { HomeownerStreetViewTab } from "./HomeownerStreetViewTab";
import { Button } from "@/components/ui/button";
import { Edit, CheckCircle, Camera, DollarSign } from "lucide-react";
import SiteAmenitiesTab from "../SiteAmenitiesTab";
import PaymentWall from "@/components/shared/PaymentWall";
import toast from "react-hot-toast";


export type TabType = "details" | "proposals" | "files" | "photos" | "amenities" | "reviews" | "streetview" | "certificate";

interface ProjectViewProps {
  project: Project;
  proposals: ProposalWithJoins[];
  user: User;
  userRole: (typeof USER_ROLES)[keyof typeof USER_ROLES];
  onAcceptProposal: (proposalId: string) => Promise<void>;
  onRejectProposal: (
    proposalId: string,
    reason?: string,
    notes?: string
  ) => Promise<void>;
  onViewProposal: (proposalId: string) => void;
  onSubmitProposal?: (proposalData: Record<string, unknown>) => Promise<void>;
  onEdit?: () => void;
  onMarkComplete?: () => Promise<void>;
  onUploadAfterPhoto?: () => void;
  onUpdateAmenities?: (amenities: SiteAmenities) => Promise<void>;
  loading?: boolean;
  proposalsLoading?: boolean;
  updatingProposal?: string | null;
  updateAmenitiesLoading?: boolean;
}

export default function HomeownerProjectView({
  project,
  proposals,
  user,
  userRole,
  onAcceptProposal,
  onRejectProposal,
  onViewProposal,
  onSubmitProposal,
  onEdit,
  onMarkComplete,
  onUploadAfterPhoto,
  onUpdateAmenities,
  loading = false,
  proposalsLoading = false,
  updatingProposal = null,
  updateAmenitiesLoading = false,
}: ProjectViewProps) {
  // Smart tab selection based on context
  const [activeTab, setActiveTab] = useState<TabType>("details");
  
  // Payment state
  const [showPaymentWall, setShowPaymentWall] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const hasSelectedProposal = proposals.some((proposal) => proposal.is_selected === "yes");

  // Auto-select most relevant tab based on context
  useEffect(() => {
    if (userRole === USER_ROLES.HOMEOWNER) {
      if (
        proposals.length > 0 &&
        proposals.some((p) => p.status === "submitted")
      ) {
        setActiveTab("proposals");
      }
    } else if (userRole === USER_ROLES.CONTRACTOR) {
      if (proposals.length === 0) {
        setActiveTab("details");
      } else {
        setActiveTab("proposals");
      }
    }
  }, [userRole, proposals, project.status]);

  // Payment handlers
  const handlePublishProject = async () => {
    if (!user?.id) {
      toast.error('Please log in to continue');
      return;
    }

    setShowPaymentWall(true);
  };

  const handlePaymentSuccess = async () => {
    if (!user?.id || !project) {
      toast.error('User or project not found');
      return;
    }

    setShowPaymentWall(false);
    setIsProcessingPayment(true);

    try {
      // Update the transaction status to succeeded
      const urlParams = new URLSearchParams(window.location.search);
      const userId = urlParams.get('userId');
      const sessionId = urlParams.get('sessionId');
      
      if (userId) {
        try {
          const { createClient } = await import('@/lib/supabase');
          const authClient = createClient();
          const { data: { session } } = await authClient.auth.getSession();
          const response = await fetch('/api/project-publish-success', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
            },
            body: JSON.stringify({
              userId,
              sessionId,
            }),
          });

          if (response.ok) {
            console.log('✅ Transaction status updated to succeeded');
          } else {
            console.error('Failed to update transaction status:', await response.text());
          }
        } catch (error) {
          console.error('Error updating transaction status:', error);
        }
      }

      // Update project status to OPEN_FOR_PROPOSALS
      const { createClient } = await import('@/lib/supabase');
      const supabase = createClient();
      
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          status: PROJECT_STATUSES.OPEN_FOR_PROPOSALS,
          is_verified_project: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id)
        .eq('creator', user.id);

      if (updateError) {
        throw updateError;
      }

      toast.success('Project published successfully!');
      
      // Refresh the page to show updated status
      window.location.reload();

    } catch (error) {
      console.error('Failed to publish project after payment:', error);
      toast.error("Payment was successful but failed to publish project. Please contact support.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleClosePaymentWall = () => {
    setShowPaymentWall(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <LoadingSpinner size="lg" text="Loading project details..." />
      </div>
    );
  }

  const renderTabContent = () => {
    const commonProps = {
      project,
      userRole,
      user,
    };

    switch (activeTab) {
      case "details":
        return <DetailsTabContent {...commonProps} />;
      case "proposals":
        return (
          <ProposalsTabContent
            {...commonProps}
            proposals={proposals}
            onAcceptProposal={onAcceptProposal}
            onRejectProposal={onRejectProposal}
            onViewProposal={onViewProposal}
            onSubmitProposal={onSubmitProposal}
            loading={proposalsLoading}
            updatingProposal={updatingProposal}
          />
        );
      case "files":
        return <HomeownerProjectFilesTab {...commonProps} />;
      case "photos":
        return <ProjectPhotosTab {...commonProps} />;
      case "amenities":
        return onUpdateAmenities ? (
          <SiteAmenitiesTab 
            project={project} 
            onUpdateAmenities={onUpdateAmenities}
            loading={false}
            saving={updateAmenitiesLoading}
          />
        ) : (
          <div className="p-6 text-center text-gray-500">
            Amenities management not available
          </div>
        );
      case "reviews":
        return <ReviewsTabContent {...commonProps} />;
      case "streetview":
        return <HomeownerStreetViewTab {...commonProps} />;
      case "certificate":
        return <CertificateTabContent {...commonProps} />;
      default:
        return <DetailsTabContent {...commonProps} />;
    }
  };

  const getAvailableTabs = (): TabType[] => {
    const baseTabs: TabType[] = ["details"];

    if (userRole === USER_ROLES.HOMEOWNER) {
      const tabs: TabType[] = [...baseTabs, "proposals", "files", "photos", "amenities", "streetview", "certificate"];
      // Only show reviews tab if project is completed
      if (project.status === PROJECT_STATUSES.COMPLETED) {
        tabs.push("reviews");
      }
      return tabs;
    } else if (userRole === USER_ROLES.CONTRACTOR) {
      const tabs: TabType[] = [...baseTabs, "proposals", "photos", "amenities", "streetview"];
      // Only show reviews tab if project is completed
      if (project.status === PROJECT_STATUSES.COMPLETED) {
        tabs.push("reviews");
      }
      return tabs;
    }
    return baseTabs;
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Top Section with Breadcrumbs and Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
          <div className="flex-shrink-0">
            <Breadcrumbs />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {onUploadAfterPhoto && (project.status === PROJECT_STATUSES.PROPOSAL_SELECTED || project.status === PROJECT_STATUSES.IN_PROGRESS) && (
              <Button
                onClick={onUploadAfterPhoto}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 transition-all duration-200 font-medium px-3 py-2 rounded-lg text-xs sm:text-sm"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Upload After Photo</span>
                <span className="sm:hidden">Upload Photo</span>
              </Button>
            )}
            {onMarkComplete && project.status === PROJECT_STATUSES.PROPOSAL_SELECTED && (
              <Button
                onClick={onMarkComplete}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 transition-all duration-200 font-medium px-3 py-2 rounded-lg text-xs sm:text-sm"
              >
                <CheckCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Mark Complete</span>
                <span className="sm:hidden">Complete</span>
              </Button>
            )}
            {project.status === PROJECT_STATUSES.DRAFT && (
              <Button
                onClick={handlePublishProject}
                disabled={isProcessingPayment}
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2 transition-all duration-200 font-medium px-3 py-2 rounded-lg text-xs sm:text-sm"
              >
                <DollarSign className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {isProcessingPayment ? "Publishing..." : "Publish Project (Pay $29)"}
                </span>
                <span className="sm:hidden">
                  {isProcessingPayment ? "Publishing..." : "Publish ($29)"}
                </span>
              </Button>
            )}
            {onEdit && !hasSelectedProposal && project.status !== PROJECT_STATUSES.PROPOSAL_SELECTED && project.status !== PROJECT_STATUSES.COMPLETED && (
              <Button
                onClick={onEdit}
                variant="ghost"
                size="sm"
                className="bg-transparent border-none text-orange-500 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 transition-all duration-200 font-medium px-3 py-2 rounded-lg cursor-pointer text-xs sm:text-sm"
              >
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">Edit Project</span>
                <span className="sm:hidden">Edit</span>
              </Button>
            )}
          </div>
        </div>

        {/* Project Header - Image-like UI */}
        <div className="mb-4 sm:mb-6">
          <ProjectViewHeader project={project} user={user} />
        </div>



        {/* Navigation Tabs */}
        <div className=" mb-4 sm:mb-6 overflow-x-auto">
          <ProjectViewTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            userRole={userRole}
            availableTabs={getAvailableTabs()}
            proposalCount={proposals.length}
            project={project}
          />
        </div>

        {/* Tab Content */}
        <div className="  overflow-hidden">{renderTabContent()}</div>
      </div>

      {/* Payment Wall */}
      {showPaymentWall && (
        <PaymentWall
          user={user as any}
          onPaymentSuccess={handlePaymentSuccess}
          onClose={handleClosePaymentWall}
          open={showPaymentWall}
          successUrl={`${window.location.origin}/homeowner/projects/view/${project.id}?payment=success`}
          cancelUrl={`${window.location.origin}/homeowner/projects/view/${project.id}?payment=cancelled`}
        />
      )}
    </div>
  );
}
