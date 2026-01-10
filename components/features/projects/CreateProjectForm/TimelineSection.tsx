import * as React from "react"
import { Calendar } from "lucide-react"
import { FormField, FormInput, FormSwitch } from "@/components/shared/form-input"

export function TimelineSection() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2 mb-6">
        <Calendar className="h-5 w-5 text-blue-600" />
        <span>Project Timeline & Deadlines</span>
      </h3>

      <div className="space-y-6">
        {/* Project Duration */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-4">Project Duration</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField name="start_date">
              {({ field, error }) => (
                <FormInput
                  {...field}
                  label="Start Date"
                  type="date"
                  required
                  error={error}
                  className="w-full"
                />
              )}
            </FormField>
            <FormField name="end_date">
              {({ field, error }) => (
                <FormInput
                  {...field}
                  label="End Date"
                  type="date"
                  required
                  error={error}
                  className="w-full"
                />
              )}
            </FormField>
          </div>
        </div>

        {/* Proposal & Decision Deadlines */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-4">Proposal & Decision Deadlines</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField name="expiry_date">
              {({ field, error }) => (
                <FormInput
                  {...field}
                  label="Proposal Deadline"
                  type="date"
                  required
                  helperText="Date when contractors can no longer submit proposals"
                  error={error}
                  className="w-full"
                />
              )}
            </FormField>
            <FormField name="decision_date">
              {({ field, error }) => (
                <FormInput
                  {...field}
                  label="Decision Date"
                  type="date"
                  required
                  helperText="Date when you must choose the winning contractor"
                  error={error}
                  className="w-full"
                />
              )}
            </FormField>
          </div>
        </div>

        {/* Optional Timeline Details */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-4">Additional Timeline Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField name="permit_required">
              {({ field, error }) => (
                <FormSwitch
                  {...field}
                  label="Permit Required"
                  helperText="Check if this project requires building permits"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  error={error}
                />
              )}
            </FormField>
          </div>
        </div>
      </div>
    </div>
  )
}
