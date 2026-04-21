import * as React from "react"
import { FieldPath, FieldValues, ControllerRenderProps } from "react-hook-form"
import { useFormField } from "@/hooks"
import { FormInput } from "./FormInput"
import { FormTextarea } from "./FormTextarea"
import { FormSelect } from "./FormSelect"
import { FormSwitch } from "./FormSwitch"
import { LocationInput, LocationData } from "./LocationInput"

export interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName
  children: (props: { field: ControllerRenderProps<TFieldValues, TName>; error?: string }) => React.ReactNode
}

export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({ name, children }: FormFieldProps<TFieldValues, TName>) {
  const { field, error } = useFormField<TFieldValues, TName>({ name })

  return <>{children({ field, error })}</>
}

// Convenience components for common field types
export interface FormFieldInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName
  label: string
  placeholder?: string
  required?: boolean
  type?: string
  helperText?: string
}

export function FormFieldInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({ name, ...props }: FormFieldInputProps<TFieldValues, TName>) {
  return (
    <FormField name={name}>
      {({ field, error }) => (
        <FormInput
          {...field}
          {...props}
          error={error}
        />
      )}
    </FormField>
  )
}

export interface FormFieldTextareaProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName
  label: string
  placeholder?: string
  required?: boolean
  rows?: number
  helperText?: string
}

export function FormFieldTextarea<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({ name, ...props }: FormFieldTextareaProps<TFieldValues, TName>) {
  return (
    <FormField name={name}>
      {({ field, error }) => (
        <FormTextarea
          {...field}
          {...props}
          error={error}
        />
      )}
    </FormField>
  )
}

export interface FormFieldSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName
  label: string
  placeholder?: string
  required?: boolean
  options: Array<{ value: string; label: string }>
  helperText?: string
}

export function FormFieldSelect<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({ name, ...props }: FormFieldSelectProps<TFieldValues, TName>) {
  return (
    <FormField name={name}>
      {({ field, error }) => (
        <FormSelect
          {...props}
          value={field.value}
          onValueChange={field.onChange}
          error={error}
        />
      )}
    </FormField>
  )
}

export interface FormFieldSwitchProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName
  label: string
  helperText?: string
}

export function FormFieldSwitch<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({ name, ...props }: FormFieldSwitchProps<TFieldValues, TName>) {
  return (
    <FormField name={name}>
      {({ field, error }) => (
        <FormSwitch
          {...props}
          checked={field.value}
          onCheckedChange={field.onChange}
          error={error}
        />
      )}
    </FormField>
  )
}

export interface FormFieldLocationProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName
  label?: string
  placeholder?: string
  required?: boolean
  helperText?: string
  showMap?: boolean
}

export function FormFieldLocation<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({ name, ...props }: FormFieldLocationProps<TFieldValues, TName>) {
  return (
    <FormField name={name}>
      {({ field, error }) => (
        <LocationInput
          {...props}
          value={field.value as LocationData}
          onChange={field.onChange}
          onBlur={field.onBlur}
          error={error}
        />
      )}
    </FormField>
  )
}
