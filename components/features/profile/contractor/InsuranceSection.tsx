"use client";

import { FormInput, FormSelect } from "@/components/shared/form-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, Upload, Download, X, FileText, Lock } from "lucide-react";
import { LEGAL_ENTITY_TYPE_VALUES } from "@/utils/constants/business";
import { useState, useCallback, useEffect } from "react";
import { supabaseStorageService } from "@/server/services/SupabaseStorageService";
import { createClient } from "@/lib/supabase";
import toast from "react-hot-toast";

interface InsuranceFileData {
  id: string;
  filename: string;
  url: string;
  size?: number;
  mimeType?: string;
  uploadedAt?: Date;
}

interface InsuranceSectionProps {
  formData: {
    legal_entity_type: string;
    gst_hst_number: string;
    wcb_number: string;
    work_guarantee: number;
    insurance_general_liability: number;
    insurance_builders_risk: number;
    insurance_expiry: string | null;
    insurance_upload: string | InsuranceFileData;
    gst_hst_clearance_document?: string | InsuranceFileData;
    wcb_clearance_document?: string | InsuranceFileData;
    insurance_certificate?: string | InsuranceFileData;
    is_admin_verified?: boolean;
    is_insurance_verified?: boolean;
    user_id?: string;
  };
  onInputChange: (field: string, value: string | number | boolean | InsuranceFileData) => void;
  missingFields?: string[];
  isVerified?: boolean;
  isAdmin?: boolean;
}

export function InsuranceSection({ formData, onInputChange, missingFields = [], isVerified = false, isAdmin = false }: InsuranceSectionProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [adminEditing, setAdminEditing] = useState(false);
  const [tempGeneralLiability, setTempGeneralLiability] = useState(formData.insurance_general_liability);
  const [tempBuildersRisk, setTempBuildersRisk] = useState(formData.insurance_builders_risk);
  const [saving, setSaving] = useState(false);

  const isFieldInvalid = (fieldName: string) => missingFields.includes(fieldName);
  const getValidationMessage = (fieldName: string) => 
    isFieldInvalid(fieldName) ? `${fieldName.replace(/_/g, ' ')} is required` : undefined;

  // Check if insurance document is uploaded
  const hasInsuranceDocument = formData.insurance_upload && formData.insurance_upload !== '';
  
  // Check if insurance is admin verified
  const isInsuranceAdminVerified = formData.is_insurance_verified || false;

  
  // Check if insurance amounts are $0 (for potential future use)
  // const hasZeroInsuranceAmounts = formData.insurance_general_liability === 0 && formData.insurance_builders_risk === 0;
  
  // Determine if fields should be disabled
  // - If no insurance document uploaded: disable amounts and hide expiry
  // - If insurance document uploaded and admin verified: disable amounts and expiry (unless admin is editing)
  // - If insurance document uploaded but not admin verified: allow editing
  const areAmountsDisabled = !hasInsuranceDocument || (hasInsuranceDocument && isInsuranceAdminVerified && !adminEditing);
  
  // Always show expiry field - users should be able to set it regardless of other conditions
  const shouldHideExpiry = false;
  
  // Hide document upload section if insurance is verified
  const shouldHideDocumentUpload = isInsuranceAdminVerified;

  // Auto-set insurance amounts to $0 when no document is uploaded
  useEffect(() => {
    if (!hasInsuranceDocument && !isAdmin) {
      if (formData.insurance_general_liability !== 0) {
        onInputChange("insurance_general_liability", 0);
      }
      if (formData.insurance_builders_risk !== 0) {
        onInputChange("insurance_builders_risk", 0);
      }
    }
  }, [hasInsuranceDocument, isAdmin, formData.insurance_general_liability, formData.insurance_builders_risk, onInputChange]);

  // Update temp values when formData changes
  useEffect(() => {
    setTempGeneralLiability(formData.insurance_general_liability);
    setTempBuildersRisk(formData.insurance_builders_risk);
  }, [formData.insurance_general_liability, formData.insurance_builders_risk]);

  // Admin editing functions
  const handleAdminEdit = () => {
    setAdminEditing(true);
    setTempGeneralLiability(formData.insurance_general_liability);
    setTempBuildersRisk(formData.insurance_builders_risk);
  };

  const handleAdminCancel = () => {
    setAdminEditing(false);
    setTempGeneralLiability(formData.insurance_general_liability);
    setTempBuildersRisk(formData.insurance_builders_risk);
  };

  const handleAdminSave = async () => {
    if (!isAdmin) return;
    
    setSaving(true);
    try {
      // Update the form data with the new values
      onInputChange("insurance_general_liability", tempGeneralLiability);
      onInputChange("insurance_builders_risk", tempBuildersRisk);
      
      // Here you would typically make an API call to save the changes
      // For now, we'll just simulate a save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAdminEditing(false);
      // You could add a toast notification here for success
    } catch (error) {
      console.error('Error saving insurance amounts:', error);
      // You could add a toast notification here for error
    } finally {
      setSaving(false);
    }
  };

  // Check if insurance_upload is a file object or just a URL string
  const insuranceFile = typeof formData.insurance_upload === 'object' ? formData.insurance_upload : null;
  const insuranceUrl = typeof formData.insurance_upload === 'string' ? formData.insurance_upload : null;

  const uploadFile = useCallback(async (file: File): Promise<InsuranceFileData> => {
    try {
      const uploadResult = await supabaseStorageService.uploadFile(file, {
        fileType: 'documents',
        bucket: 'structra-files'
      });

      return {
        id: crypto.randomUUID(),
        filename: file.name,
        url: uploadResult.url,
        size: uploadResult.size,
        mimeType: uploadResult.mimeType,
        uploadedAt: new Date(uploadResult.uploadedAt),
      };
    } catch (error) {
      console.error('Upload failed for file:', file.name, error);
      throw new Error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  const handleFileChange = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const fileExtension = file.name.toLowerCase().split('.').pop();
    if (!fileExtension || !allowedTypes.includes(`.${fileExtension}`)) {
      setUploadError('Please upload a PDF, DOC, DOCX, JPG, or PNG file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const uploadedFile = await uploadFile(file);
      onInputChange("insurance_upload", uploadedFile);
      toast.success('Insurance certificate uploaded successfully');
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      toast.error('Failed to upload insurance certificate');
    } finally {
      setUploading(false);
    }
  }, [uploadFile, onInputChange]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files);
    }
  }, [handleFileChange]);

  const removeFile = useCallback(async () => {
    try {
      // Update local state first
      onInputChange("insurance_upload", "");
      
      // Save to database immediately
      const supabase = createClient();
      const { error } = await supabase
        .from("contractor_profiles")
        .update({ 
          insurance_upload: null,
          insurance_general_liability: 0,
          insurance_builders_risk: 0,
          insurance_expiry: null,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", formData.user_id || "");

      if (error) {
        console.error("Error removing insurance file:", error);
        toast.error("Failed to remove insurance certificate. Please try again.");
        return;
      }

      toast.success('Insurance certificate removed successfully');
    } catch (error) {
      console.error("Error removing insurance file:", error);
      toast.error("Failed to remove insurance certificate. Please try again.");
    }
  }, [onInputChange, formData.user_id]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  return (
    <>
      {/* Legal Information */}
      <div className="space-y-4">
        <div className="border-b pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Legal & Compliance Information</h3>
              <p className="text-sm text-gray-600">Legal entity details and compliance information</p>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <FormSelect
              label="Legal Entity Type"
              placeholder="Select legal entity type"
              value={formData.legal_entity_type}
              onValueChange={(value) => onInputChange("legal_entity_type", value)}
              options={LEGAL_ENTITY_TYPE_VALUES.map(type => ({ value: type, label: type }))}
              containerClassName="space-y-2"
              isInvalid={isFieldInvalid("legal_entity_type")}
              validationMessage={getValidationMessage("legal_entity_type")}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <span>GST/HST Number</span>
                    {formData.is_admin_verified && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <Lock className="h-3 w-3" />
                        <span className="text-xs font-medium">Locked</span>
                      </div>
                    )}
                  </label>
                  {formData.is_admin_verified && (
                    <div className="flex items-center space-x-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-xs font-medium">Verified by Admin</span>
                    </div>
                  )}
                </div>
                <FormInput
                  value={formData.gst_hst_number}
                  onChange={(e) => onInputChange("gst_hst_number", e.target.value)}
                  placeholder="Enter your CRA GST/HST number"
                  containerClassName="space-y-2"
                  isInvalid={isFieldInvalid("gst_hst_number")}
                  validationMessage={getValidationMessage("gst_hst_number")}
                  disabled={formData.is_admin_verified}
                />
              </div>
            </div>
            <div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <span>WCB Number</span>
                    {formData.is_admin_verified && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <Lock className="h-3 w-3" />
                        <span className="text-xs font-medium">Locked</span>
                      </div>
                    )}
                  </label>
                  {formData.is_admin_verified && (
                    <div className="flex items-center space-x-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-xs font-medium">Verified by Admin</span>
                    </div>
                  )}
                </div>
                <FormInput
                  value={formData.wcb_number}
                  onChange={(e) => onInputChange("wcb_number", e.target.value)}
                  placeholder="Enter Workers' Compensation Board number"
                  containerClassName="space-y-2"
                  isInvalid={isFieldInvalid("wcb_number")}
                  validationMessage={getValidationMessage("wcb_number")}
                  disabled={formData.is_admin_verified}
                />
              </div>
            </div>
          </div>
          
          {/* Clearance Documents Display */}
          {(formData.gst_hst_clearance_document || formData.wcb_clearance_document) && (
            <div className="space-y-4">
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700">Admin Verification Documents</h4>
                  {formData.is_admin_verified && (
                    <div className="flex items-center space-x-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-xs font-medium">Verified by Admin</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.gst_hst_clearance_document && (
                    <div className={`p-3 border rounded-lg ${
                      formData.is_admin_verified 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className={`h-4 w-4 ${
                            formData.is_admin_verified ? 'text-green-600' : 'text-yellow-600'
                          }`} />
                          <div>
                            <span className={`text-sm font-medium ${
                              formData.is_admin_verified ? 'text-green-800' : 'text-yellow-800'
                            }`}>
                              GST/HST Clearance Document
                            </span>
                            {!formData.is_admin_verified && (
                              <p className="text-xs text-yellow-700">Pending admin verification</p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            // Handle both string URL and file reference object
                            const url = typeof formData.gst_hst_clearance_document === 'string' 
                              ? formData.gst_hst_clearance_document 
                              : (formData.gst_hst_clearance_document as InsuranceFileData | undefined)?.url;
                            if (url) {
                              try {
                                const response = await fetch(url);
                                const blob = await response.blob();
                                const blobUrl = window.URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = blobUrl;
                                link.download = (formData.gst_hst_clearance_document as InsuranceFileData | undefined)?.filename || 'gst-hst-clearance-document.pdf';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                window.URL.revokeObjectURL(blobUrl);
                              } catch (error) {
                                console.error('Download failed:', error);
                                // Fallback to direct link
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = (formData.gst_hst_clearance_document as InsuranceFileData | undefined)?.filename || 'gst-hst-clearance-document.pdf';
                                link.target = '_blank';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }
                            }
                          }}
                          className={`${
                            formData.is_admin_verified 
                              ? 'text-green-700 border-green-300 hover:bg-green-100'
                              : 'text-yellow-700 border-yellow-300 hover:bg-yellow-100'
                          }`}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {formData.wcb_clearance_document && (
                    <div className={`p-3 border rounded-lg ${
                      formData.is_admin_verified 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className={`h-4 w-4 ${
                            formData.is_admin_verified ? 'text-green-600' : 'text-yellow-600'
                          }`} />
                          <div>
                            <span className={`text-sm font-medium ${
                              formData.is_admin_verified ? 'text-green-800' : 'text-yellow-800'
                            }`}>
                              WCB Clearance Document
                            </span>
                            {!formData.is_admin_verified && (
                              <p className="text-xs text-yellow-700">Pending admin verification</p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            // Handle both string URL and file reference object
                            const url = typeof formData.wcb_clearance_document === 'string' 
                              ? formData.wcb_clearance_document 
                              : (formData.wcb_clearance_document as InsuranceFileData | undefined)?.url;
                            if (url) {
                              try {
                                const response = await fetch(url);
                                const blob = await response.blob();
                                const blobUrl = window.URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = blobUrl;
                                link.download = (formData.wcb_clearance_document as InsuranceFileData | undefined)?.filename || 'wcb-clearance-document.pdf';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                window.URL.revokeObjectURL(blobUrl);
                              } catch (error) {
                                console.error('Download failed:', error);
                                // Fallback to direct link
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = (formData.wcb_clearance_document as InsuranceFileData | undefined)?.filename || 'wcb-clearance-document.pdf';
                                link.target = '_blank';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }
                            }
                          }}
                          className={`${
                            formData.is_admin_verified 
                              ? 'text-green-700 border-green-300 hover:bg-green-100'
                              : 'text-yellow-700 border-yellow-300 hover:bg-yellow-100'
                          }`}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  )}
                  
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="work_guarantee" className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <CheckCircle className="h-4 w-4 text-gray-500" />
              <span>Work Guarantee (Months)</span>
            </Label>
            <Input
              id="work_guarantee"
              type="number"
              min="0"
              value={formData.work_guarantee}
              onChange={(e) => onInputChange("work_guarantee", parseInt(e.target.value) || 0)}
              placeholder="Enter guarantee period in months"
            />
          </div>
        </div>
      </div>

      {/* Insurance Information */}
      <div className="space-y-4">
        <div className="border-b pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Insurance Information</h3>
              {!isInsuranceAdminVerified && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Upload your insurance certificate below and enter your coverage amounts.</strong> Admin will verify your insurance only after you upload the certificate. If no certificate is uploaded, your coverage limits will be set to $0. This can only be updated annually alongside your business verification.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {/* Admin Edit Controls - Only show if contractor has uploaded insurance document */}
          {isAdmin && isInsuranceAdminVerified && !adminEditing && hasInsuranceDocument && (
            <div className="flex justify-end">
              <Button
                onClick={handleAdminEdit}
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                <FileText className="h-4 w-4 mr-2" />
                Edit Insurance Amounts
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FormInput
                label="General Liability (CAD)"
                type="number"
                min="0"
                value={adminEditing ? tempGeneralLiability : formData.insurance_general_liability}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  if (adminEditing) {
                    setTempGeneralLiability(value);
                  } else {
                    onInputChange("insurance_general_liability", value);
                  }
                }}
                placeholder="Enter coverage amount in CAD"
                containerClassName="space-y-2"
                isInvalid={isFieldInvalid("insurance_general_liability")}
                validationMessage={getValidationMessage("insurance_general_liability")}
                disabled={areAmountsDisabled}
              />
            </div>
            <div>
              <FormInput
                label="Builders Risk (CAD)"
                type="number"
                min="0"
                value={adminEditing ? tempBuildersRisk : formData.insurance_builders_risk}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  if (adminEditing) {
                    setTempBuildersRisk(value);
                  } else {
                    onInputChange("insurance_builders_risk", value);
                  }
                }}
                placeholder="Enter coverage amount in CAD"
                containerClassName="space-y-2"
                isInvalid={isFieldInvalid("insurance_builders_risk")}
                validationMessage={getValidationMessage("insurance_builders_risk")}
                disabled={areAmountsDisabled}
              />
            </div>
          </div>

          {/* Admin Save/Cancel Buttons */}
          {isAdmin && adminEditing && (
            <div className="flex justify-end space-x-2">
              <Button
                onClick={handleAdminCancel}
                variant="outline"
                size="sm"
                disabled={saving}
                className="text-gray-600 border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAdminSave}
                size="sm"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
          {!shouldHideExpiry && (
            <div>
              <FormInput
                label="Insurance Expiry Date"
                type="date"
                value={formData.insurance_expiry || ""}
                onChange={(e) => onInputChange("insurance_expiry", e.target.value)}
                containerClassName="space-y-2"
                isInvalid={isFieldInvalid("insurance_expiry")}
                validationMessage={getValidationMessage("insurance_expiry")}
                disabled={false}
              />
            </div>
          )}
          
          {/* Show admin verification message for contractors when insurance is verified */}
          {!isAdmin && shouldHideDocumentUpload && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <h4 className="text-sm font-medium text-green-800">Insurance Verified</h4>
                  <p className="text-sm text-green-700">
                    Your insurance has been verified by admin. Coverage amounts are now locked and cannot be modified by you.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Show admin message when insurance is verified */}
          {isAdmin && isInsuranceAdminVerified && !adminEditing && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800">Insurance Verified</h4>
                  <p className="text-sm text-blue-700">
                    {hasInsuranceDocument 
                      ? 'Insurance has been verified. You can edit the coverage amounts using the "Edit Insurance Amounts" button above.'
                      : 'Insurance has been verified but no document was uploaded by contractor.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {(isAdmin || (!isAdmin && !shouldHideDocumentUpload)) && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <FileText className="h-4 w-4" />
                  <span>{isAdmin ? 'Certificate of Insurance (Admin Only)' : 'Certificate of Insurance'}</span>
                </Label>
                {isInsuranceAdminVerified && (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Insurance Verified
                  </Badge>
                )}
              </div>
            
            {/* File Upload Area */}
            <div
              className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isInsuranceAdminVerified
                  ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-50"
                  : dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onDragEnter={isInsuranceAdminVerified ? undefined : handleDrag}
              onDragLeave={isInsuranceAdminVerified ? undefined : handleDrag}
              onDragOver={isInsuranceAdminVerified ? undefined : handleDrag}
              onDrop={isInsuranceAdminVerified ? undefined : handleDrop}
            >
              <Upload className={`mx-auto h-12 w-12 mb-4 ${isInsuranceAdminVerified ? 'text-gray-300' : 'text-gray-400'}`} />
              <p className={`text-sm mb-2 ${isInsuranceAdminVerified ? 'text-gray-400' : 'text-gray-600'}`}>
                {isInsuranceAdminVerified 
                  ? 'Insurance document upload is disabled - Insurance has been verified'
                  : 'Drag and drop your certificate of insurance here, or click to browse'
                }
              </p>
              <p className={`text-xs mb-4 ${isInsuranceAdminVerified ? 'text-gray-400' : 'text-gray-500'}`}>
                {isInsuranceAdminVerified 
                  ? 'Upload is disabled after verification'
                  : 'Supports PDF, DOC, DOCX, JPG, PNG up to 10MB'
                }
              </p>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange(e.target.files)}
                className="mt-4 bg-white"
                disabled={uploading || isInsuranceAdminVerified}
              />
            </div>

            {/* Upload Error */}
            {uploadError && (
              <p className="mt-2 text-sm text-red-600">{uploadError}</p>
            )}

            {/* Uploaded File Display */}
            {(insuranceFile || insuranceUrl) && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Uploaded Certificate
                </p>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-8 bg-white rounded border flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700 truncate">
                          {insuranceFile?.filename || 'Certificate of Insurance'}
                        </span>
                      </div>
                      {insuranceFile?.size && (
                        <p className="text-xs text-gray-500">
                          {formatFileSize(insuranceFile.size)} • {insuranceFile.mimeType}
                        </p>
                      )}
                      {uploading && (
                        <div className="flex items-center space-x-1 text-xs text-blue-600">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                          <span>Uploading...</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={removeFile}
                    title="Remove file"
                    disabled={uploading || isInsuranceAdminVerified}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Validation Message */}
            {isFieldInvalid("insurance_upload") && (
              <p className="mt-1 text-sm text-red-600">
                {getValidationMessage("insurance_upload")}
              </p>
            )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
