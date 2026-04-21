'use client'

import { useFormContext, FieldPath, FieldValues, ControllerRenderProps, PathValue } from "react-hook-form"

export interface UseFormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName
}

export function useFormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({ name }: UseFormFieldProps<TFieldValues, TName>) {
  const { getFieldState, formState, setValue, watch } = useFormContext<TFieldValues>()
  
  const fieldState = getFieldState(name, formState)
  const error = fieldState?.error?.message
  
  // Create a properly typed field object that matches ControllerRenderProps exactly
  const field: ControllerRenderProps<TFieldValues, TName> = {
    name,
    value: watch(name) as PathValue<TFieldValues, TName>,
    onChange: (event: unknown) => {
      // Handle different input types properly
      let value: PathValue<TFieldValues, TName>
      
      if (event && typeof event === 'object' && event !== null) {
        // Handle React synthetic events
        if ('target' in event && event.target && typeof event.target === 'object' && event.target !== null) {
          const target = event.target as { type?: string; checked?: boolean; files?: FileList; value?: string }
          if (target.type === 'checkbox') {
            value = (target.checked as PathValue<TFieldValues, TName>) || (false as PathValue<TFieldValues, TName>)
          } else if (target.type === 'file') {
            value = (target.files as PathValue<TFieldValues, TName>) || ([] as PathValue<TFieldValues, TName>)
          } else {
            value = (target.value as PathValue<TFieldValues, TName>) || ('' as PathValue<TFieldValues, TName>)
          }
        } else if ('value' in event && event.value !== undefined) {
          // Handle custom components that pass { value } directly
          value = event.value as PathValue<TFieldValues, TName>
        } else {
          // Fallback: use the event itself if it's a primitive
          value = event as PathValue<TFieldValues, TName>
        }
      } else {
        // Handle primitive values directly
        value = event as PathValue<TFieldValues, TName>
      }
      
      setValue(name, value, { shouldValidate: true })
    },
    onBlur: () => {
      // Trigger validation on blur if needed
    },
    ref: () => {},
  }

  return {
    field,
    error,
  }
}
