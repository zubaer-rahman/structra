import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  containerClassName?: string;
  isInvalid?: boolean;
  validationMessage?: string;
}

const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      required,
      containerClassName,
      id,
      rows = 4,
      isInvalid,
      validationMessage,
      ...props
    },
    ref
  ) => {
    const textareaId =
      id || `form-textarea-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={cn("space-y-2", containerClassName)}>
        {label && (
          <Label
            htmlFor={textareaId}
            className={cn(
              "text-sm font-medium block",
              isInvalid ? "text-red-700 dark:text-red-400" : "text-gray-700 dark:text-gray-200"
            )}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <Textarea
          id={textareaId}
          rows={rows}
          className={cn(
            "focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-blue-500 dark:focus-visible:border-blue-400",
            "border-gray-300 dark:border-white/10 bg-white dark:bg-[#161616] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500",
            (error || isInvalid) && "border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-950/20 focus-visible:border-red-500",
            className
          )}
          ref={ref}
          {...props}
        />
        {helperText && <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>}
        {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
        {!error && isInvalid && validationMessage && (
          <p className="text-sm text-red-500 dark:text-red-400">{validationMessage}</p>
        )}
      </div>
    );
  }
);
FormTextarea.displayName = "FormTextarea";

export { FormTextarea };
