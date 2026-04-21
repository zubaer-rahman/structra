"use client";

import * as React from "react";
import { ChevronsUpDown, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface FormMultiSelectOption {
  value: string;
  label: string;
}

export interface FormMultiSelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  containerClassName?: string;
  placeholder?: string;
  options: FormMultiSelectOption[];
  value?: string[];
  onChange?: (value: string[]) => void;
  disabled?: boolean;
  searchable?: boolean;
  maxDisplayItems?: number;
}

const FormMultiSelect = React.forwardRef<
  HTMLButtonElement,
  FormMultiSelectProps
>(
  (
    {
      label,
      error,
      helperText,
      required,
      containerClassName,
      placeholder = "Select options...",
      options,
      value = [],
      onChange,
      disabled = false,
      searchable = true,
      maxDisplayItems = 3,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const selectId = `form-multi-select-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const handleSelect = (currentValue: string) => {
      if (disabled) return;

      const currentValues = value || [];
      let newValues: string[];

      if (currentValues.includes(currentValue)) {
        newValues = currentValues.filter((v) => v !== currentValue);
      } else {
        newValues = [...currentValues, currentValue];
      }

      onChange?.(newValues);
      // Keep popover open for multi-selection
    };

    const handleRemoveItem = (itemToRemove: string) => {
      if (disabled) return;
      const newValues = value?.filter((item) => item !== itemToRemove) || [];
      onChange?.(newValues);
    };

    const selectedOptions = options.filter((option) =>
      value?.includes(option.value)
    );

    return (
      <div className={cn("space-y-2", containerClassName)}>
        {label && (
          <Label
            htmlFor={selectId}
            className="text-sm font-medium text-gray-700 block"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              ref={ref}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className={cn(
                "w-full justify-between h-10 px-3 py-2 text-left font-normal",
                "transition-colors duration-200",
                "border-gray-300 focus-visible:border-blue-500 focus-visible:ring-offset-0 focus-visible:ring-0",
                "bg-white hover:bg-gray-50",
                error &&
                  "border-red-500",
                disabled && "opacity-50 cursor-not-allowed bg-gray-50"
              )}
            >
              <div className="flex-1 min-w-0 flex items-center">
                {selectedOptions.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {selectedOptions.slice(0, maxDisplayItems).map((option) => (
                      <Badge
                        key={option.value}
                        variant="outline"
                        className="inline-flex items-center gap-1 h-6 px-2 py-0.5 text-xs font-medium border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        <span className="truncate max-w-[120px]">
                          {option.label}
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveItem(option.value);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleRemoveItem(option.value);
                            }
                          }}
                          className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 cursor-pointer hover:bg-gray-200 p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3 text-gray-500" />
                          <span className="sr-only">Remove {option.label}</span>
                        </span>
                      </Badge>
                    ))}
                    {selectedOptions.length > maxDisplayItems && (
                      <Badge
                        variant="outline"
                        className="inline-flex items-center h-6 px-2 py-0.5 text-xs font-medium border-blue-200 bg-blue-50 text-blue-600"
                      >
                        +{selectedOptions.length - maxDisplayItems} more
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-500">{placeholder}</span>
                )}
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-0"
            align="start"
          >
            <Command>
              {searchable && (
                <CommandInput placeholder="Search options..." className="h-9" />
              )}
              <CommandList>
                <CommandEmpty>No options found.</CommandEmpty>

                <CommandGroup heading="All Options">
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => handleSelect(option.value)}
                      className="flex items-center"
                    >
                      {option.label}
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          value?.includes(option.value)
                            ? "opacity-100 text-gray-600"
                            : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {helperText && (
          <p className="text-xs text-gray-500 leading-relaxed">{helperText}</p>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

FormMultiSelect.displayName = "FormMultiSelect";

export { FormMultiSelect };
