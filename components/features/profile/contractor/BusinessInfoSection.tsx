"use client";

import { FormInput, FormSelect, FormTextarea, FormPhotoInput, FormDocumentInput } from "@/components/shared/form-input";
import { CompanyLogoUpload } from "@/components/shared/form-input/CompanyLogoUpload";
import { Badge } from "@/components/ui/badge";
import { Briefcase, X, Upload, File, Image, Download } from "lucide-react";
import { AVAILABLE_TRADE_CATEGORIES, ALL_TRADE_CATEGORY_VALUES } from "@/utils/constants/trades";
import { FileReference } from "@/server/database/schemas/base";
import { supabaseStorageService } from "@/server/services/SupabaseStorageService";
import { useState } from "react";
import toast from "react-hot-toast";

interface BusinessInfoSectionProps {
  formData: {
    business_name: string;
    phone_number: string;
    bio: string;
    trade_category: string[];
    portfolio: string[];
    portfolio_file?: FileReference[];
    licenses: string[];
    license_file?: FileReference[];
    work_guarantee_statement: string;
    company_logo_image?: FileReference | null;
  };
  onInputChange: (field: string, value: string | number | string[] | FileReference[]) => void;
  onTradeCategoryChange: (value: string) => void;
  onPortfolioChange: (value: string) => void;
  onPortfolioFileChange: (files: FileReference[]) => void;
  onLicensesChange: (value: string) => void;
  onLicenseFileChange: (files: FileReference[]) => void;
  onCompanyLogoChange: (file: FileReference | null) => void;
  missingFields?: string[];
  isVerified?: boolean;
}

export function BusinessInfoSection({ 
  formData, 
  onInputChange, 
  onTradeCategoryChange, 
  onPortfolioChange, 
  onPortfolioFileChange,
  onLicensesChange,
  onLicenseFileChange,
  onCompanyLogoChange,
  missingFields = [],
  isVerified = false
}: BusinessInfoSectionProps) {
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [uploadingLicenses, setUploadingLicenses] = useState(false);

  const isFieldMissing = (fieldName: string) => missingFields.includes(fieldName);
  const getValidationMessage = (fieldName: string, displayName: string) => 
    isFieldMissing(fieldName) ? `${displayName} is required for profile completion` : undefined;

  const uploadFileToSupabase = async (file: File): Promise<FileReference> => {
    try {
      const uploadResult = await supabaseStorageService.uploadFile(file, {
        fileType: 'documents',
        bucket: 'buildready-files'
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
  };

  const handlePortfolioFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadingPortfolio(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`${file.name} is larger than 10MB`);
        }

        // Check file type
        const fileExtension = file.name.toLowerCase().split('.').pop();
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx'];
        
        if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
          throw new Error(`${file.name} is not a supported file type`);
        }

        return await uploadFileToSupabase(file);
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      const currentFiles = formData.portfolio_file || [];
      onPortfolioFileChange([...currentFiles, ...uploadedFiles]);
      
      toast.success(`Successfully uploaded ${uploadedFiles.length} portfolio file(s)`);
    } catch (error) {
      console.error('Portfolio upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload portfolio files');
    } finally {
      setUploadingPortfolio(false);
    }
  };

  const handleLicenseFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadingLicenses(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`${file.name} is larger than 10MB`);
        }

        // Check file type
        const fileExtension = file.name.toLowerCase().split('.').pop();
        const allowedExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
        
        if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
          throw new Error(`${file.name} is not a supported file type`);
        }

        return await uploadFileToSupabase(file);
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      const currentFiles = formData.license_file || [];
      onLicenseFileChange([...currentFiles, ...uploadedFiles]);
      
      toast.success(`Successfully uploaded ${uploadedFiles.length} license file(s)`);
    } catch (error) {
      console.error('License upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload license files');
    } finally {
      setUploadingLicenses(false);
    }
  };

  const removePortfolioFile = (fileId: string) => {
    const currentFiles = formData.portfolio_file || [];
    const updatedFiles = currentFiles.filter(file => file.id !== fileId);
    onPortfolioFileChange(updatedFiles);
    toast.success('Portfolio file removed');
  };

  const removeLicenseFile = (fileId: string) => {
    const currentFiles = formData.license_file || [];
    const updatedFiles = currentFiles.filter(file => file.id !== fileId);
    onLicenseFileChange(updatedFiles);
    toast.success('License file removed');
  };

  const downloadFile = async (file: FileReference) => {
    try {
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download file');
    }
  };
  return (
    <div className="space-y-4">
      <div className="border-b pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center">
            <Briefcase className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
            <p className="text-sm text-gray-600">Your company and professional details</p>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <FormInput
            label="Business Name"
            value={formData.business_name}
            onChange={(e) => onInputChange("business_name", e.target.value)}
            placeholder="Enter your legal or trade business name"
            containerClassName="space-y-2"
            isInvalid={isFieldMissing('business_name')}
            validationMessage={getValidationMessage('business_name', 'Business Name')}
          />
        </div>

        <div>
          <CompanyLogoUpload
            value={formData.company_logo_image}
            onChange={onCompanyLogoChange}
            label="Company Logo"
            placeholder="Upload your company logo"
            required={false}
            accept="image/*"
            maxSize={5}
            error={isFieldMissing('company_logo_image') ? 'Company Logo is required for profile completion' : undefined}
          />
        </div>

        <div>
          <FormInput
            label="Business Phone Number"
            type="tel"
            value={formData.phone_number}
            onChange={(e) => onInputChange("phone_number", e.target.value)}
            placeholder="Enter your business phone number"
            containerClassName="space-y-2"
            isInvalid={isFieldMissing('phone_number')}
            validationMessage={getValidationMessage('phone_number', 'Business Phone Number')}
          />
        </div>

        <div>
          <FormTextarea
            label="Professional Bio"
            value={formData.bio}
            onChange={(e) => onInputChange("bio", e.target.value)}
            placeholder="Describe your experience, expertise, and what sets you apart..."
            rows={4}
            helperText="This will be visible to potential clients"
            containerClassName="space-y-2"
            isInvalid={isFieldMissing('bio')}
            validationMessage={getValidationMessage('bio', 'Professional Bio')}
          />
        </div>

        <div>
          <FormTextarea
            label="Work Guarantee Statement"
            value={formData.work_guarantee_statement}
            onChange={(e) => onInputChange("work_guarantee_statement", e.target.value)}
            placeholder={isVerified ? "This field is locked for verified contractors" : "Describe your work guarantee terms and conditions..."}
            rows={3}
            helperText={isVerified ? "This field is disabled for verified contractors" : "This statement will be included in proposals and contracts"}
            containerClassName="space-y-2"
            isInvalid={isFieldMissing('work_guarantee_statement')}
            validationMessage={getValidationMessage('work_guarantee_statement', 'Work Guarantee Statement')}
            disabled={isVerified}
          />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trade Categories
            </label>
            <FormSelect
              placeholder="Select trade categories"
              value=""
              onValueChange={(value) => {
                // Prevent selection of disabled categories
                if (value && value.includes("(Coming Soon)")) {
                  return;
                }
                if (value && !formData.trade_category.includes(value)) {
                  onTradeCategoryChange([...formData.trade_category, value].join(", "));
                }
              }}
              options={ALL_TRADE_CATEGORY_VALUES
                .filter(category => !formData.trade_category.includes(category))
                .map(category => ({ 
                  value: category, 
                  label: category,
                  disabled: category.includes("(Coming Soon)")
                }))}
              containerClassName="space-y-2"
              isInvalid={isFieldMissing('trade_category')}
              validationMessage={getValidationMessage('trade_category', 'Trade Categories')}
            />
            {formData.trade_category.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.trade_category.map((category, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {category}
                    <button
                      type="button"
                      onClick={() => {
                        const updatedCategories = formData.trade_category.filter((_, i) => i !== index);
                        onTradeCategoryChange(updatedCategories.join(", "));
                      }}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>


        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Portfolio Files
          </label>
          
          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              onChange={(e) => handlePortfolioFileChange(e.target.files)}
              className="hidden"
              id="portfolio-upload"
              disabled={uploadingPortfolio}
            />
            <label
              htmlFor="portfolio-upload"
              className={`cursor-pointer block ${uploadingPortfolio ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="text-gray-600">
                {uploadingPortfolio ? (
                  <Upload className="mx-auto h-12 w-12 text-blue-400 animate-pulse" />
                ) : (
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                )}
                <p className="mt-2 text-sm text-gray-600">
                  {uploadingPortfolio ? 'Uploading files...' : 'Upload photos and documents of your completed projects and work samples'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Maximum file size: 10MB per file. Supported formats: JPG, PNG, GIF, PDF, DOC, DOCX, XLS, XLSX
                </p>
              </div>
            </label>
          </div>

          {/* Uploaded Files List */}
          {formData.portfolio_file && formData.portfolio_file.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-gray-700">Uploaded Files:</p>
              <div className="space-y-2">
                {formData.portfolio_file.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {file.mimeType?.startsWith('image/') ? (
                        <Image className="h-5 w-5 text-blue-500" />
                      ) : (
                        <File className="h-5 w-5 text-gray-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.filename}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size ? file.size / 1024 / 1024 : 0).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => downloadFile(file)}
                        className="text-blue-500 hover:text-blue-700 p-1"
                        title="Download file"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removePortfolioFile(file.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Remove file"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            License Files
          </label>
          
          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => handleLicenseFileChange(e.target.files)}
              className="hidden"
              id="license-upload"
              disabled={uploadingLicenses}
            />
            <label
              htmlFor="license-upload"
              className={`cursor-pointer block ${uploadingLicenses ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="text-gray-600">
                {uploadingLicenses ? (
                  <Upload className="mx-auto h-12 w-12 text-blue-400 animate-pulse" />
                ) : (
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                )}
                <p className="mt-2 text-sm text-gray-600">
                  {uploadingLicenses ? 'Uploading files...' : 'Upload copies of your professional licenses and certifications'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Maximum file size: 10MB per document. Supported formats: PDF, DOC, DOCX, JPG, PNG
                </p>
              </div>
            </label>
          </div>

          {/* Uploaded Files List */}
          {formData.license_file && formData.license_file.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-gray-700">Uploaded Files:</p>
              <div className="space-y-2">
                {formData.license_file.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {file.mimeType?.startsWith('image/') ? (
                        <Image className="h-5 w-5 text-blue-500" />
                      ) : (
                        <File className="h-5 w-5 text-gray-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.filename}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size ? file.size / 1024 / 1024 : 0).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => downloadFile(file)}
                        className="text-blue-500 hover:text-blue-700 p-1"
                        title="Download file"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeLicenseFile(file.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Remove file"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
