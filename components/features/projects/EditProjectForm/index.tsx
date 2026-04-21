
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, Resolver, FieldErrors, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExtendedUser } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";
import { EditProjectFormInputData, editProjectFormInputSchema } from "@/utils/validation/projects";
import { toast } from "sonner";
import { Project } from "@/server/database/interfaces";

import { VISIBILITY_SETTINGS, PROJECT_TYPES, PROJECT_STATUSES } from "@/utils/constants";
import { BasicInformationSection } from "../CreateProjectForm/BasicInformationSection";
import { BudgetSection } from "../CreateProjectForm/BudgetSection";
import { TimelineSection } from "../CreateProjectForm/TimelineSection";
import { FileUploadSection } from "../CreateProjectForm/FileUploadSection";
import { FormActions } from "../CreateProjectForm/FormActions";
import PaymentWall from "@/components/shared/PaymentWall";
import { ErrorDisplay } from "../CreateProjectForm/ErrorDisplay";

interface EditProjectFormProps {
  user: ExtendedUser;
  projectId: string;
  className?: string;
}

export default function EditProjectForm({
  user,
  projectId,
  className = "",
}: EditProjectFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [pendingProjectData, setPendingProjectData] = useState<EditProjectFormInputData | null>(null);
  const [showPaymentWall, setShowPaymentWall] = useState(false);
  const [isCheckingPid, setIsCheckingPid] = useState(false);
  const [urlKey, setUrlKey] = useState(0); // Force re-run when URL changes


  const form = useForm<EditProjectFormInputData>({
    resolver: zodResolver(
      editProjectFormInputSchema
    ) as Resolver<EditProjectFormInputData>,
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      project_title: "",
      statement_of_work: "",
      budget: 1000,
      category: [],
      pid: "",
      location: {
        address: "",
        city: "Vancouver",
        province: "BC",
        postalCode: "V6B 1A1",
        latitude: 49.2827,
        longitude: -123.1207,
      },
      certificate_of_title: "",
      project_type: PROJECT_TYPES.RENOVATION,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      expiry_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      decision_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      substantial_completion: "",
      permit_required: false,
      delay_penalty: 0,
      abandonment_penalty: 0,
      project_photos: [],
      files: [],
    },
  });

  const { handleSubmit, reset } = form;

  // PID uniqueness validation removed - duplicates are now allowed

  // Fetch existing project data
  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId || !user) {
        setInitialLoading(false);
        return;
      }
      
      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .eq('creator', user.id)
          .single();
        
        if (fetchError || !data) {
          setError('Project not found or access denied');
          setInitialLoading(false);
          return;
        }
        
        // Store current project data for reference
        setCurrentProject(data);
        
        // Reset form with existing project data
        reset({
          project_title: data.project_title || "",
          statement_of_work: data.statement_of_work || "",
          budget: data.budget || 1000,
          category: Array.isArray(data.category) ? data.category : [],
          pid: data.pid || "",
          location: {
            address: data.location?.address || "",
            city: data.location?.city || "Vancouver",
            province: data.location?.province || "BC",
            postalCode: data.location?.postalCode || "V6B 1A1",
            latitude: data.location?.latitude || 49.2827,
            longitude: data.location?.longitude || -123.1207,
          },
          certificate_of_title: data.certificate_of_title || "",
          project_type: data.project_type || PROJECT_TYPES.RENOVATION,
          start_date: data.start_date ? new Date(data.start_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          end_date: data.end_date ? new Date(data.end_date).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          expiry_date: data.expiry_date ? new Date(data.expiry_date).toISOString().split('T')[0] : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          decision_date: data.decision_date ? new Date(data.decision_date).toISOString().split('T')[0] : new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          substantial_completion: data.substantial_completion ? new Date(data.substantial_completion).toISOString().split('T')[0] : "",
          permit_required: data.permit_required || false,
          delay_penalty: data.delay_penalty || 0,
          abandonment_penalty: data.abandonment_penalty || 0,
          project_photos: data.project_photos || [],
          files: data.files || [],
        });
        
        setInitialLoading(false);
      } catch (error) {
        console.error('Error fetching project:', error);
        setError('Failed to load project details');
        setInitialLoading(false);
      }
    };
    
    fetchProject();
  }, [projectId, user, reset]);

  const handlePublish = async (data: EditProjectFormInputData) => {
    if (!data.pid || data.pid.trim() === '') {
      toast.error("Parcel Identifier is required");
      return;
    }

    // PID uniqueness check removed - duplicates are now allowed
    try {

      // Store the form data in localStorage for retrieval after payment
      const pendingData = {
        userId: user.id,
        formData: { ...data, pid: data.pid.trim() }, // Ensure PID is trimmed
        timestamp: Date.now()
      };
      console.log('💾 Storing pending project data in localStorage:', pendingData);
      localStorage.setItem('pendingProjectData', JSON.stringify(pendingData));
      
      setPendingProjectData(data);
      setShowPaymentWall(true);
    } catch (error) {
      console.error('Failed to store project data:', error);
      toast.error("Failed to prepare project for payment. Please try again.");
    }
  };

  const publishProjectDirectly = async (data: EditProjectFormInputData) => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      // Validate required fields
      if (!data.pid || !data.start_date || !data.end_date || !data.expiry_date) {
        toast.error("Missing required fields");
        return;
      }
      
      // Update project to published status
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          project_title: data.project_title,
          statement_of_work: data.statement_of_work,
          budget: data.budget,
          category: Array.isArray(data.category) ? data.category : [data.category],
          pid: data.pid.trim(),
          location: data.location,
          project_type: data.project_type,
          start_date: new Date(data.start_date),
          end_date: new Date(data.end_date),
          expiry_date: new Date(data.expiry_date),
          decision_date: data.decision_date ? new Date(data.decision_date) : null,
          permit_required: data.permit_required || false,
          delay_penalty: data.delay_penalty || 0,
          abandonment_penalty: data.abandonment_penalty || 0,
          visibility_settings: 'Public To Marketplace', // Default visibility
          status: PROJECT_STATUSES.OPEN_FOR_PROPOSALS,
          project_photos: data.project_photos || [],
          files: data.files || [],
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (updateError) {
        throw updateError;
      }

      toast.success("Project published successfully!");
      
      // Small delay to ensure toast is visible, then redirect
      setTimeout(() => {
        router.push("/homeowner/projects");
      }, 1000);

    } catch (error) {
      console.error('Failed to publish project:', error);
      toast.error("Failed to publish project. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = useCallback(async () => {
    
    if (!pendingProjectData) {
      console.log('❌ No pending project data found');
      toast.error("No project data found. Please try again.");
      return;
    }

    // Validate required fields
    if (!pendingProjectData.pid || !pendingProjectData.start_date || !pendingProjectData.end_date || !pendingProjectData.expiry_date) {
      console.log('❌ Missing required fields:', { 
        pid: pendingProjectData.pid, 
        start_date: pendingProjectData.start_date, 
        end_date: pendingProjectData.end_date, 
        expiry_date: pendingProjectData.expiry_date 
      });
      toast.error("Missing required fields");
      return;
    }

    console.log('✅ Validation passed, proceeding with project update...');
    setShowPaymentWall(false);
    setLoading(true);

    try {
      // First, update the transaction status to succeeded
      const urlParams = new URLSearchParams(window.location.search);
      const userId = urlParams.get('userId');
      const sessionId = urlParams.get('sessionId');
      
      if (userId) {
        try {
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();
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

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to update transaction status:', errorText);
          }
        } catch (error) {
          console.error('Error updating transaction status:', error);
          // Continue with project update even if transaction update fails
        }
      }

      const supabase = createClient();

      // Update project with open for proposals status after successful payment
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          project_title: pendingProjectData.project_title,
          statement_of_work: pendingProjectData.statement_of_work,
          budget: pendingProjectData.budget,
          category: Array.isArray(pendingProjectData.category) ? pendingProjectData.category : [pendingProjectData.category],
          pid: pendingProjectData.pid.trim(),
          location: pendingProjectData.location,
          project_type: pendingProjectData.project_type,
          start_date: new Date(pendingProjectData.start_date),
          end_date: new Date(pendingProjectData.end_date),
          expiry_date: new Date(pendingProjectData.expiry_date),
          decision_date: pendingProjectData.decision_date ? new Date(pendingProjectData.decision_date) : null,
          permit_required: pendingProjectData.permit_required || false,
          delay_penalty: pendingProjectData.delay_penalty || 0,
          visibility_settings: 'Public To Marketplace', // Default visibility
          status: PROJECT_STATUSES.OPEN_FOR_PROPOSALS,
          is_verified_project: true, // Mark as verified project after successful payment
          project_photos: pendingProjectData.project_photos || [],
          files: pendingProjectData.files || [],
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (updateError) {
        throw updateError;
      }

      // Clear pending data
      setPendingProjectData(null);
      
      toast.success("Payment successful! Your project has been published with 'Open for Proposals' status.");
      
      // Small delay to ensure toast is visible, then redirect
      setTimeout(() => {
        router.push("/homeowner/projects");
      }, 1000);

    } catch (error) {
      console.error('Failed to update project after payment:', error);
      toast.error("Payment was successful but failed to update project. Please contact support.");
    } finally {
      setLoading(false);
    }
  }, [pendingProjectData, projectId, router]);

  const handleClosePaymentWall = () => {
    setShowPaymentWall(false);
    setPendingProjectData(null);
    // Also clear localStorage data when closing payment wall
    localStorage.removeItem('pendingProjectData');
  };

  // Check for pending project data on component mount and when URL changes
  useEffect(() => {
    const checkPendingProject = async () => {
      console.log('🔍 Checking URL parameters for payment status...');
      // Check URL parameters for payment success
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get('payment');
      console.log('📋 Payment status from URL:', paymentStatus);
      
      if (paymentStatus === 'success') {
        console.log('✅ Payment success detected, checking localStorage...');
        // User returned from successful payment, check for pending project data
        const stored = localStorage.getItem('pendingProjectData');
        console.log('💾 Stored data from localStorage:', stored ? 'Found' : 'Not found');
        
        if (stored) {
          try {
            const data = JSON.parse(stored);
            console.log('📝 Parsed data:', { userId: data.userId, currentUserId: user.id, timestamp: data.timestamp });
            
            // Check if this is for the current user and not too old (within 1 hour)
            if (data.userId === user.id && (Date.now() - data.timestamp) < 3600000) {
              console.log('✅ Valid data found, setting pending data and calling handlePaymentSuccess...');
              setPendingProjectData(data.formData);
              // Try to update the project
              await handlePaymentSuccess();
              // Clear the stored data
              localStorage.removeItem('pendingProjectData');
              // Clean up URL
              window.history.replaceState({}, document.title, window.location.pathname);
            } else {
              console.log('❌ Data invalid or expired, clearing...');
              // Clear old or invalid data
              localStorage.removeItem('pendingProjectData');
            }
          } catch (error) {
            console.error('❌ Error processing pending project:', error);
            localStorage.removeItem('pendingProjectData');
          }
        } else {
        }
      } else if (paymentStatus === 'cancelled') {
        // Payment was cancelled, clear pending data and cancel transaction
        localStorage.removeItem('pendingProjectData');
        
        // Cancel any pending project creation transactions
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('userId');
        const sessionId = urlParams.get('sessionId');
        
        if (userId) {
          console.log('Calling project creation cancel API with:', { userId, sessionId });
          try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch('/api/project-creation-cancel', {
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
              const result = await response.json();
              console.log('Transaction cancelled successfully:', result);
            } else {
              console.error('Failed to cancel transaction:', await response.text());
            }
          } catch (error) {
            console.error('Error cancelling transaction:', error);
          }
        } else {
          console.warn('No userId found in URL parameters, cannot cancel transaction');
        }
        
        toast("Payment was cancelled. Your project data has been cleared.");
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    checkPendingProject();
  }, [user.id, urlKey, handlePaymentSuccess]); // Use urlKey to force re-run when URL changes

  // Listen for URL changes (when returning from payment)
  useEffect(() => {
    const handleUrlChange = () => {
      setUrlKey(prev => prev + 1);
    };

    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  const handleSaveAsDraft = async (data: EditProjectFormInputData) => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      // Validate required fields
      if (!data.pid || !data.start_date || !data.end_date || !data.expiry_date) {
        toast.error("Missing required fields");
        return;
      }
      
      // Update project with draft status (keep existing status if it's already published)
      const updateData = {
          project_title: data.project_title,
          statement_of_work: data.statement_of_work,
          budget: data.budget,
          category: Array.isArray(data.category) ? data.category : [data.category],
          pid: data.pid.trim(),
          location: data.location,
          project_type: data.project_type,
          start_date: new Date(data.start_date),
          end_date: new Date(data.end_date),
          expiry_date: new Date(data.expiry_date),
          decision_date: data.decision_date ? new Date(data.decision_date) : null,
          permit_required: data.permit_required || false,
          delay_penalty: data.delay_penalty || 0,
          abandonment_penalty: data.abandonment_penalty || 0,
          visibility_settings: 'Public To Marketplace', // Default visibility
          // Keep existing status if already published, otherwise set to draft
          status: currentProject?.status === PROJECT_STATUSES.OPEN_FOR_PROPOSALS 
            ? PROJECT_STATUSES.OPEN_FOR_PROPOSALS 
            : PROJECT_STATUSES.DRAFT,
          project_photos: data.project_photos || [],
          files: data.files || [],
          updated_at: new Date().toISOString()
        };
        
        const { error: updateError } = await supabase
          .from('projects')
          .update(updateData)
          .eq('id', projectId);

      if (updateError) {
        throw updateError;
      }

      toast.success("Project changes saved successfully!");
      
      // Small delay to ensure toast is visible, then redirect
      setTimeout(() => {
        router.push(`/homeowner/projects/view/${projectId}`);
      }, 1000);

    } catch (error) {
      console.error('Failed to save project changes:', error);
      toast.error("Failed to save project changes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: EditProjectFormInputData) => {
    if (user.user_role !== "homeowner") {
      setError("Only homeowners can edit projects");
      return;
    }

    // Show payment wall for publishing
    await handlePublish(data);
  };

  const onFormError = (formErrors: FieldErrors<EditProjectFormInputData>) => {
    console.log('Form validation errors:', formErrors);
    // Don't set generic error - let field-specific errors show
  };

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">Loading project details...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Only show non-validation errors */}
      {error && !error.includes('Validation error:') && !error.includes('Please fix the following errors:') && (
        <ErrorDisplay error={error} />
      )}

      <FormProvider {...form}>
        <form 
          onSubmit={handleSubmit(onSubmit, onFormError)} 
          className="space-y-6"
          noValidate
        >
          <BasicInformationSection 
            disabled={currentProject?.status === PROJECT_STATUSES.OPEN_FOR_PROPOSALS || 
                     currentProject?.status === PROJECT_STATUSES.PROPOSAL_SELECTED || 
                     currentProject?.status === PROJECT_STATUSES.IN_PROGRESS || 
                     currentProject?.status === PROJECT_STATUSES.COMPLETED} 
          />
          <BudgetSection form={form} />
          <TimelineSection />
          <FileUploadSection />
          
          <FormActions 
            loading={loading || isCheckingPid}
            cancelUrl={`/homeowner/projects/view/${projectId}`}
            buttonText="Save Changes"
            showDraftButton={true}
            onSaveAsDraft={() => handleSaveAsDraft(form.getValues())}
            onPublish={() => handlePublish(form.getValues())}
            isDraftLoading={loading}
            isPublishLoading={loading || isCheckingPid}
            isEditMode={true}
            hidePublishButton={currentProject?.status === PROJECT_STATUSES.OPEN_FOR_PROPOSALS}
            publishButtonText={currentProject?.status === PROJECT_STATUSES.DRAFT ? "Publish (Pay $29)" : "Publish Changes"}
          />
        </form>
      </FormProvider>

      {/* Payment Wall */}
      {showPaymentWall && (
        <PaymentWall
          user={user}
          onPaymentSuccess={handlePaymentSuccess}
          onClose={handleClosePaymentWall}
          open={showPaymentWall}
          successUrl={`${window.location.origin}/homeowner/projects/edit/${projectId}?payment=success`}
          cancelUrl={`${window.location.origin}/homeowner/projects/edit/${projectId}?payment=cancelled`}
        />
      )}
    </div>
  );
}
