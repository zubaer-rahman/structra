import * as React from "react"
import { FormPhotoInput, FormDocumentInput } from "@/components/shared/form-input"
import { useFormContext } from "react-hook-form"
import { CreateProjectFormInputData } from "@/utils/validation/projects"
import { Upload } from "lucide-react"

export function FileUploadSection() {
  const formContext = useFormContext<CreateProjectFormInputData>();
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2 mb-6">
        <Upload className="h-5 w-5" />
        <span>Project Documentation & Files</span>
      </h3>

      <div className="space-y-8">
        {/* Area of Work Pictures */}
        <div>
          <FormPhotoInput
            name="project_photos"
            label="Area of Work Pictures"
            placeholder="Drag and drop photos here, or click to browse. Upload clear images that show the current state and requirements of your project."
            required={true}
            accept="image/*"
            maxSize={5}
            error={formContext.formState.errors.project_photos?.message}
          />
          <div className="mt-2 space-y-1">
            <p className="text-xs text-gray-500">
              Maximum file size: 5MB per image. Supported formats: JPG, PNG, GIF
            </p>
            <p className="text-xs text-blue-600 font-medium">
              📸 Note: The first uploaded picture will be used as the "before" picture for the area of work
            </p>
          </div>
        </div>

        {/* Project Files */}
        <div>
           
          <FormDocumentInput
            name="files"
            label="Project Files"
            placeholder="Drag and drop documents here, or click to browse. Include plans, specifications, permits, or any relevant documentation."
            required={false}
            accept=".pdf,.doc,.docx,.xls,.xlsx"
            maxSize={10}
          />
          <p className="text-xs text-gray-500 mt-2">
            Maximum file size: 10MB per document. Supported formats: PDF, DOC, DOCX, XLS, XLSX
          </p>
        </div>
      </div>
    </div>
  )
}
