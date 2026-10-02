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
            className="text-sm font-medium text-gray-700 dark:text-gray-200 block"
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
                "border-gray-300 dark:border-white/10 focus-visible:border-blue-500 dark:focus-visible:border-blue-400 focus-visible:ring-offset-0 focus-visible:ring-0",
                "bg-white dark:bg-[#141414] hover:bg-gray-50 dark:hover:bg-white/5 text-gray-900 dark:text-white",
                error && "border-red-500 dark:border-red-500",
                disabled && "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-zinc-900"
              )}
            >
              <div className="flex-1 min-w-0 flex items-center">
                {selectedOptions.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {selectedOptions.slice(0, maxDisplayItems).map((option) => (
                      <Badge
                        key={option.value}
                        variant="outline"
                        className="inline-flex items-center gap-1 h-6 px-2 py-0.5 text-xs font-medium border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
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
                          className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 cursor-pointer hover:bg-blue-200 dark:hover:bg-white/20 p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3 text-blue-700 dark:text-blue-300" />
                          <span className="sr-only">Remove {option.label}</span>
                        </span>
                      </Badge>
                    ))}
                    {selectedOptions.length > maxDisplayItems && (
                      <Badge
                        variant="outline"
                        className="inline-flex items-center h-6 px-2 py-0.5 text-xs font-medium border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      >
                        +{selectedOptions.length - maxDisplayItems} more
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
                )}
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-gray-500 dark:text-gray-400" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-0 bg-white dark:bg-[#141414] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white shadow-xl"
            align="start"
          >
            <Command className="bg-transparent">
              {searchable && (
                <CommandInput placeholder="Search options..." className="h-9 placeholder:text-gray-400 dark:placeholder:text-gray-500" />
              )}
              <CommandList>
                <CommandEmpty className="text-sm py-4 text-center text-gray-500 dark:text-gray-400">No options found.</CommandEmpty>

                <CommandGroup heading="All Options">
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => handleSelect(option.value)}
                      className="flex items-center text-gray-900 dark:text-gray-100 aria-selected:bg-gray-100 dark:aria-selected:bg-white/10 aria-selected:text-gray-900 dark:aria-selected:text-white cursor-pointer"
                    >
                      {option.label}
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          value?.includes(option.value)
                            ? "opacity-100 text-blue-600 dark:text-blue-400"
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
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{helperText}</p>
        )}
        {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
      </div>
    );
  }
);

FormMultiSelect.displayName = "FormMultiSelect";

export { FormMultiSelect };
