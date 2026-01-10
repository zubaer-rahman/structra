import * as React from "react"
import { DollarSign } from "lucide-react"
import { FormField, FormInput } from "@/components/shared/form-input"
import { UseFormReturn } from "react-hook-form"

interface BudgetSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>
}

export function BudgetSection({ form }: BudgetSectionProps) {
  const { watch, setValue } = form;
  
  // Watch delay_penalty and auto-calculate abandonment_penalty
  const delayPenalty = watch('delay_penalty');
  React.useEffect(() => {
    const penaltyValue = typeof delayPenalty === 'number' ? delayPenalty : 0;
    const abandonmentPenalty = penaltyValue * 30;
    setValue('abandonment_penalty', abandonmentPenalty);
  }, [delayPenalty, setValue]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2 mb-6">
        <DollarSign className="h-5 w-5 text-blue-600" />
        <span>Budget & Financial Details</span>
      </h3>

      <div className="space-y-6">
        <FormField name="budget">
          {({ field, error }) => (
            <FormInput
              {...field}
              value={field.value === 0 ? '' : field.value}
              label="Project Budget"
              placeholder="Enter your total project budget in dollars"
              type="number"
              required
              error={error}
              className="w-full max-w-md"
              onChange={(e) => {
                const value = e.target.value;
                const numValue = value === '' ? 0 : parseFloat(value);
                field.onChange(isNaN(numValue) ? 0 : numValue);
              }}
            />
          )}
        </FormField>

        <FormField name="delay_penalty">
          {({ field, error }) => (
            <FormInput
              {...field}
              value={field.value === 0 ? '' : field.value}
              label="Delay Penalty (Per Day)"
              placeholder="Enter daily penalty amount"
              type="number"
              step="0.01"
              error={error}
              className="w-full max-w-md"
              onChange={(e) => {
                const value = e.target.value;
                const numValue = value === '' ? 0 : parseFloat(value);
                field.onChange(isNaN(numValue) ? 0 : numValue);
              }}
              helperText="A reasonable delay penalty is around 0.2% of contract value per day (capped at 30 days). For a $10,000 project, this would be $20/day with a maximum of $600."
            />
          )}
        </FormField>

        <FormField name="abandonment_penalty">
          {({ field, error }) => (
            <FormInput
              {...field}
              value={field.value === 0 ? '' : field.value}
              label="Abandonment Penalty (Max)"
              placeholder="Auto-calculated from delay penalty"
              type="number"
              step="0.01"
              error={error}
              className="w-full max-w-md"
              disabled={true}
              helperText="Automatically calculated as delay penalty × 30 days. This penalty applies if the contractor abandons the contract after signing but before the start date."
            />
          )}
        </FormField>
      </div>
    </div>
  )
}
