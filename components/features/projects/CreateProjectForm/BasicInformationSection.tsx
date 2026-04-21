import * as React from "react"
import { FormField, FormInput, FormTextarea, FormSelect, FormMultiSelect, LocationInput } from "@/components/shared/form-input"
import { PROJECT_TYPE_VALUES } from "@/utils/constants"
import { AVAILABLE_TRADE_CATEGORIES } from "@/utils/constants/trades"
 
interface BasicInformationSectionProps {
  disabled?: boolean;
}

export function BasicInformationSection({ disabled = false }: BasicInformationSectionProps) {

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h3>
      <div className="space-y-6">
        {/* Project Title - Full Width */}
        <FormField name="project_title">
          {({ field, error }) => (
            <FormInput
              {...field}
              label="Project Title"
              placeholder="Enter a descriptive title for your project"
              required
              error={error}
              className="w-full"
            />
          )}
        </FormField>

        {/* Statement of Work - Full Width */}
        <FormField name="statement_of_work">
          {({ field, error }) => (
            <FormTextarea
              {...field}
              label="Statement of Work"
              placeholder="Provide a detailed description of the work to be done, including scope, requirements, and any specific details contractors should know"
              rows={5}
              required
              error={error}
              className="w-full"
            />
          )}
        </FormField>

        {/* Category and Project Type - Two Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField name="category">
            {({ field, error }) => (
              <FormMultiSelect
                label="Trade Categories"
                placeholder="Select relevant trade categories"
                options={AVAILABLE_TRADE_CATEGORIES.map(value => ({ value, label: value }))}
                value={field.value}
                onChange={field.onChange}
                required
                error={error}
              />
            )}
          </FormField>

          <FormField name="project_type">
            {({ field, error }) => (
              <FormSelect
                label="Project Type"
                placeholder="Select project type"
                options={PROJECT_TYPE_VALUES.map(value => ({ value, label: value }))}
                value={field.value || ''}
                onValueChange={field.onChange}
                required
                error={error}
              />
            )}
          </FormField>
        </div>

        {/* PID - Single Column */}
        <div className="grid grid-cols-1 gap-6">
          <FormField name="pid">
            {({ field, error }) => (
              <FormInput
                {...field}
                label="Parcel Identifier"
                placeholder="Enter 9-digit parcel identifier"
                required
                error={error}
                className="w-full max-w-md"
                type="number"
                maxLength={9}
              />
            )}
          </FormField>
        </div>

        {/* Location - Full Width */}
        <FormField name="location">
          {({ field, error }) => {
            // Get location error from the error prop passed by FormField
            const locationError = error;
            
            return (
              <LocationInput
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                label="Project Location"
                placeholder="Enter the complete project address"
                required
                error={locationError}
                showMap={false}
                showSelectedLocation={false}
                className="w-full"
                disabled={disabled}
              />
            );
          }}
        </FormField>
      </div>
    </div>
  )
}
