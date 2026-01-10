/**
 * ActionDropdown Component
 *
 * A flexible, reusable dropdown menu component for table actions.
 *
 * Features:
 * - Customizable actions with icons and variants
 * - Consistent styling and behavior across the app
 *
 * Usage Examples:
 *
 * // Basic usage with custom actions
 * <ActionDropdown
 *   actions={[
 *     { label: 'Download', icon: <Download />, onClick: handleDownload },
 *     { label: 'Share', icon: <Share />, onClick: handleShare }
 *   ]}
 * />
 *
 * // Pre-configured table actions
 * <TableActionDropdown
 *   onView={() => handleView(item)}
 *   onEdit={() => handleEdit(item)}
 *   onDelete={() => handleDelete(item)}
 * />
 */

import React from "react";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Download,
} from "lucide-react";
import { FileTypeIcon } from "./FileTypeIcon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ActionItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive";
  fileType?: 'agreement' | 'proposal' | 'contract' | 'document' | 'generic';
}

interface ActionDropdownProps {
  actions: ActionItem[];
  triggerClassName?: string;
  align?: "start" | "center" | "end";
}

export function ActionDropdown({
  actions,
  triggerClassName = "h-8 w-8 p-0",
  align = "end",
}: ActionDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={triggerClassName}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-48">
        {/* Action items */}
        {actions.map((action, index) => (
          <DropdownMenuItem
            key={index}
            variant={action.variant}
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
            }}
            className="px-3 py-2"
          >
            {action.fileType ? (
              <FileTypeIcon 
                fileType={action.fileType} 
                size={16} 
                className="mr-2"
              />
            ) : (
              action.icon
            )}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Pre-configured dropdown for common table actions
interface TableActionDropdownProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  triggerClassName?: string;
  align?: "start" | "center" | "end";
}

export function TableActionDropdown({
  onView,
  onEdit,
  onDelete,
  triggerClassName,
  align,
}: TableActionDropdownProps) {
  const actions: ActionItem[] = [
    ...(onView
      ? [
          {
            label: "View",
            icon: <Eye className="h-4 w-4 mr-2" />,
            onClick: onView,
          },
        ]
      : []),
    ...(onEdit
      ? [
          {
            label: "Edit",
            icon: <Edit className="h-4 w-4 mr-2" />,
            onClick: onEdit,
          },
        ]
      : []),
    ...(onDelete
      ? [
          {
            label: "Delete",
            icon: <Trash2 className="h-4 w-4 mr-2" />,
            onClick: onDelete,
            variant: "destructive" as const,
          },
        ]
      : []),
  ];

  return (
    <ActionDropdown
      actions={actions}
      triggerClassName={triggerClassName}
      align={align}
    />
  );
}

// Pre-configured dropdown for file-related actions
interface FileActionDropdownProps {
  onDownload?: () => void;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  fileType?: 'agreement' | 'proposal' | 'contract' | 'document';
  triggerClassName?: string;
  align?: "start" | "center" | "end";
}

export function FileActionDropdown({
  onDownload,
  onView,
  onEdit,
  onDelete,
  fileType = 'document',
  triggerClassName,
  align,
}: FileActionDropdownProps) {
  const actions: ActionItem[] = [
    ...(onDownload
      ? [
          {
            label: "Download",
            icon: <Download className="h-4 w-4 mr-2" />,
            onClick: onDownload,
            fileType: fileType,
          },
        ]
      : []),
    ...(onView
      ? [
          {
            label: "View",
            icon: <Eye className="h-4 w-4 mr-2" />,
            onClick: onView,
          },
        ]
      : []),
    ...(onEdit
      ? [
          {
            label: "Edit",
            icon: <Edit className="h-4 w-4 mr-2" />,
            onClick: onEdit,
          },
        ]
      : []),
    ...(onDelete
      ? [
          {
            label: "Delete",
            icon: <Trash2 className="h-4 w-4 mr-2" />,
            onClick: onDelete,
            variant: "destructive" as const,
          },
        ]
      : []),
  ];

  return (
    <ActionDropdown
      actions={actions}
      triggerClassName={triggerClassName}
      align={align}
    />
  );
}
