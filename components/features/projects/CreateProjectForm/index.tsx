"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Resolver, FieldErrors, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExtendedUser } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";
import { CreateProjectFormInputData, createProjectFormInputSchema } from "@/utils/validation/projects";
import toast from "react-hot-toast";
import { trpc } from "@/utils/trpc";

import { VISIBILITY_SETTINGS, PROJECT_TYPES, PROJECT_STATUSES } from "@/utils/constants";
// Slug generation removed - will be generated on admin approval
import { BasicInformationSection } from "./BasicInformationSection";
import { BudgetSection } from "./BudgetSection";
import { TimelineSection } from "./TimelineSection";
import { FileUploadSection } from "./FileUploadSection";
import { FormActions } from "./FormActions";
import PaymentWall from "@/components/shared/PaymentWall";

interface CreateProjectFormProps {
  user: ExtendedUser;
  className?: string;
}

export default function CreateProjectForm({
  user,
  className = "",
}: CreateProjectFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPaymentWall, setShowPaymentWall] = useState(false);
  const [draftProjectId, setDraftProjectId] = useState<string | null>(null);
  const [pendingProjectData, setPendingProjectData] = useState<CreateProjectFormInputData | null>(null);
  const [isCheckingPid, setIsCheckingPid] = useState(false);
  const [isProcessingPaymentSuccess, setIsProcessingPaymentSuccess] = useState(false);

  // TRPC mutation for updating homeowner verification status
  const updateHomeownerVerificationMutation = trpc.users.updateHomeownerVerificationStatus.useMutation();

  // PID uniqueness validation removed - duplicates are now allowed

  // Check for pending project data on component mount
  useEffect(() => {
    const checkPendingProject = async () => {
      // Check URL parameters for payment success
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get('payment');
      
      if (paymentStatus === 'success') {
        // User returned from successful payment, check for pending project data
        const stored = localStorage.getItem('pendingProjectData');
        if (stored) {
          try {
            const data = JSON.parse(stored);
            // Check if this is for the current user and not too old (within 1 hour)
            if (data.userId === user.id && (Date.now() - data.timestamp) < 3600000) {
              setIsProcessingPaymentSuccess(true);
              toast.loading('Payment successful! Publishing your project...', { id: 'publishing-project' });
              setPendingProjectData(data.formData);
              // Try to create the project
              await createProjectAfterPayment(data.formData);
              // Clear the stored data
              localStorage.removeItem('pendingProjectData');
              // Clean up URL
              window.history.replaceState({}, document.title, window.location.pathname);
              toast.dismiss('publishing-project');
            } else {
              // Clear old or invalid data
              localStorage.removeItem('pendingProjectData');
            }
          } catch (error) {
            console.error('Error processing pending project:', error);
            localStorage.removeItem('pendingProjectData');
            toast.dismiss('publishing-project');
            setIsProcessingPaymentSuccess(false);
          }
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
  }, [user.id]);

  // Handle escape key to close payment wall
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showPaymentWall) {
        handleClosePaymentWall();
      }
    };

    if (showPaymentWall) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showPaymentWall]);

  const form = useForm<CreateProjectFormInputData>({
    resolver: zodResolver(
      createProjectFormInputSchema
    ) as Resolver<CreateProjectFormInputData>,
    mode: "onSubmit",
    defaultValues: {
      project_title: "",
      statement_of_work: "",
      budget: 0,
      category: [],
      pid: "",
      location: {
        address: "",
        city: "",
        province: "",
        postalCode: "",
        latitude: 0,
        longitude: 0,
      },
      project_type: PROJECT_TYPES.RENOVATION,
      start_date: "",
      end_date: "",
      expiry_date: "",
      decision_date: "",
      permit_required: false,
      delay_penalty: 0,
      abandonment_penalty: 0,
      project_photos: [],
      files: [],
    },
  });

  const { handleSubmit } = form;

  const saveAsDraft = async (data: CreateProjectFormInputData) => {
    if (!data.pid || data.pid.trim() === '') {
      toast.error("Parcel Identifier is required");
      return;
    }

    // PID uniqueness check removed - duplicates are now allowed
    setLoading(true);
    try {
      const supabase = createClient();

      // Note: Slug will be generated when admin approves the project (title_awarded = true)

      // Create project with draft status
      const { data: project, error: createError } = await supabase
        .from('projects')
        .insert({
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
          visibility_settings: 'Public To Marketplace', // Default visibility
          status: PROJECT_STATUSES.DRAFT,
          delay_penalty: data.delay_penalty,
          abandonment_penalty: data.abandonment_penalty,
          project_photos: data.project_photos || [],
          files: data.files || [],
          creator: user.id,
          // slug will be generated when admin approves the project
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (createError) {
        throw createError;
      }

      setDraftProjectId(project.id);
      toast.success("Project saved as draft successfully!");
      router.push("/homeowner/projects");

    } catch (error) {
      console.error('Failed to save project as draft:', error);
      toast.error("Failed to save project as draft. Please try again.");
    } finally {
      setLoading(false);
      setIsCheckingPid(false);
    }
  };

  const handlePublish = async (data: CreateProjectFormInputData) => {
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
      localStorage.setItem('pendingProjectData', JSON.stringify(pendingData));
      
      // Store the form data temporarily and show payment wall
      setPendingProjectData({ ...data, pid: data.pid.trim() });
      setShowPaymentWall(true);
    } catch (error) {
      console.error('Failed to store project data:', error);
      toast.error("Failed to prepare project for payment. Please try again.");
    }
  };

  const handlePaymentSuccess = async () => {
    if (!pendingProjectData) {
      toast.error("No project data found. Please try again.");
      return;
    }

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

          if (response.ok) {
            console.log('✅ Transaction status updated to succeeded');
          } else {
            console.error('Failed to update transaction status:', await response.text());
          }
        } catch (error) {
          console.error('Error updating transaction status:', error);
          // Continue with project creation even if transaction update fails
        }
      }

      const supabase = createClient();

      // Create project with open for proposals status after successful payment
      const { data: project, error: createError } = await supabase
        .from('projects')
        .insert({
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
          visibility_settings: 'Public To Marketplace', // Default visibility
          status: PROJECT_STATUSES.OPEN_FOR_PROPOSALS,
          is_verified_project: true, // Mark as verified project after successful payment
          delay_penalty: pendingProjectData.delay_penalty || 0,
          abandonment_penalty: pendingProjectData.abandonment_penalty || 0,
          creator: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (createError) {
        throw createError;
      }

      // Clear pending data
      setPendingProjectData(null);
      
      // Redirect to confirmation page with project details
      const projectTitle = encodeURIComponent(pendingProjectData.project_title);
      window.location.href = `/homeowner/projects/published?title=${projectTitle}&id=${project.id}`;

    } catch (error) {
      console.error('Failed to create project after payment:', error);
      toast.error("Payment was successful but failed to create project. Please contact support.");
    } finally {
      setLoading(false);
      setIsProcessingPaymentSuccess(false);
    }
  };

  const createProjectAfterPayment = async (data: CreateProjectFormInputData) => {
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
          // Continue with project creation even if transaction update fails
        }
      }

      const supabase = createClient();

      // Validate required fields
      if (!data.project_title || !data.statement_of_work || !data.budget || !data.category) {
        throw new Error('Missing required project data');
      }

      const projectData = {
        project_title: data.project_title,
        statement_of_work: data.statement_of_work,
        budget: data.budget,
        category: Array.isArray(data.category) ? data.category : [data.category], // Ensure category is an array
        pid: data.pid.trim(), // Ensure PID is trimmed
        location: data.location,
        project_type: data.project_type,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
        expiry_date: new Date(data.expiry_date),
        decision_date: data.decision_date ? new Date(data.decision_date) : null,
        permit_required: data.permit_required || false,
        visibility_settings: 'Public To Marketplace', // Default visibility
        status: PROJECT_STATUSES.OPEN_FOR_PROPOSALS,
        is_verified_project: true, // Mark as verified project after successful payment
        delay_penalty: data.delay_penalty || 0,
        abandonment_penalty: data.abandonment_penalty || 0,
        project_photos: data.project_photos || [],
        files: data.files || [],
        creator: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: project, error: createError } = await supabase
        .from('projects')
        .insert(projectData)
        .select('id')
        .single();

      if (createError) {
        throw createError;
      }

      // Update homeowner verification status to true
      try {
        await updateHomeownerVerificationMutation.mutateAsync({
          userId: user.id,
          isVerified: true,
        });
      } catch (verificationError) {
        console.error('Warning: Failed to update homeowner verification status:', verificationError);
        // Don't fail the whole operation if verification update fails
      }

      // Redirect to confirmation page with project details
      const projectTitle = encodeURIComponent(data.project_title);
      window.location.href = `/homeowner/projects/published?title=${projectTitle}&id=${project.id}`;

    } catch (error) {
      console.error('Failed to create project after payment:', error);
      toast.error("Payment was successful but failed to create project. Please contact support.");
    } finally {
      setLoading(false);
    }
  };

  const onFormError = (formErrors: FieldErrors<CreateProjectFormInputData>) => {
    // Helper function to get the first error message from nested objects
    const getFirstErrorMessage = (errors: unknown): string | null => {
      if (typeof errors === 'object' && errors !== null) {
        const errorObj = errors as Record<string, unknown>;
        for (const key in errorObj) {
          const value = errorObj[key];
          if (value && typeof value === 'object' && 'message' in value && typeof value.message === 'string') {
            return value.message;
          }
          if (value && typeof value === 'object') {
            const nestedError = getFirstErrorMessage(value);
            if (nestedError) return nestedError;
          }
        }
      }
      return null;
    };

    // Get the first validation error message
    const firstErrorMessage = getFirstErrorMessage(formErrors);
    
    if (firstErrorMessage) {
      toast.error(firstErrorMessage);
    } else {
      toast.error("Please fix the form validation errors before submitting");
    }
  };

  const handleClosePaymentWall = () => {
    setShowPaymentWall(false);
    setPendingProjectData(null);
    // Clear localStorage if user cancels
    localStorage.removeItem('pendingProjectData');
  };

  // Show payment wall if needed
  if (showPaymentWall) {
    return (
      <div className={`space-y-6 ${className} ${isProcessingPaymentSuccess ? 'relative' : ''}`}>
        {isProcessingPaymentSuccess && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-gray-700 font-medium">Publishing your project...</p>
              <p className="text-gray-500 text-sm mt-2">Please wait while we process your payment and publish your project.</p>
            </div>
          </div>
        )}
        <FormProvider {...form}>
          <form className="space-y-6">
            <BasicInformationSection />
            <BudgetSection form={form} />
            <TimelineSection />
            <FileUploadSection />

            <FormActions 
              loading={loading || isProcessingPaymentSuccess}
              showDraftButton={true}
              onSaveAsDraft={handleSubmit(saveAsDraft, onFormError)}
              onPublish={handleSubmit(handlePublish, onFormError)}
              isDraftLoading={loading || isCheckingPid || isProcessingPaymentSuccess}
              isPublishLoading={loading || isCheckingPid || isProcessingPaymentSuccess}
              isProcessingPaymentSuccess={isProcessingPaymentSuccess}
            />
          </form>
        </FormProvider>

        {/* Payment Dialog */}
        <PaymentWall 
          user={user} 
          onPaymentSuccess={handlePaymentSuccess}
          onClose={handleClosePaymentWall}
          open={showPaymentWall}
        />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className} ${isProcessingPaymentSuccess ? 'relative' : ''}`}>
      {isProcessingPaymentSuccess && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Publishing your project...</p>
            <p className="text-gray-500 text-sm mt-2">Please wait while we process your payment and publish your project.</p>
          </div>
        </div>
      )}
      <FormProvider {...form}>
        <form className="space-y-6">
          <BasicInformationSection />
          <BudgetSection form={form} />
          <TimelineSection />
          <FileUploadSection />

          <FormActions 
            loading={loading || isProcessingPaymentSuccess}
            showDraftButton={true}
            onSaveAsDraft={handleSubmit(saveAsDraft, onFormError)}
            onPublish={handleSubmit(handlePublish, onFormError)}
            isDraftLoading={loading || isCheckingPid || isProcessingPaymentSuccess}
            isPublishLoading={loading || isCheckingPid || isProcessingPaymentSuccess}
            isProcessingPaymentSuccess={isProcessingPaymentSuccess}
          />
        </form>
      </FormProvider>
    </div>
  );
}
