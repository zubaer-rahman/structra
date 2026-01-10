"use client";

import { Project } from "@/server/database/interfaces";
import { Button } from "@/components/ui/button";
import { CheckCircle, Upload, Camera } from "lucide-react";
import { PROJECT_STATUSES } from "@/utils/constants";

interface ProjectActionsProps {
  project: Project;
  onCompleteProject?: () => Promise<void>;
  onMakeOpenForProposal?: () => Promise<void>;
  onUploadAfterPhoto?: () => void;
}

export default function ProjectActions({
  project,
  onCompleteProject,
  onMakeOpenForProposal,
  onUploadAfterPhoto,
}: ProjectActionsProps) {
  // Check if any actions are available
  const hasDraftAction = project.status === PROJECT_STATUSES.DRAFT && onMakeOpenForProposal;
  const hasCompleteAction = project.status === PROJECT_STATUSES.PROPOSAL_SELECTED && onCompleteProject;
  const hasUploadAfterPhotoAction = (project.status === PROJECT_STATUSES.PROPOSAL_SELECTED || project.status === PROJECT_STATUSES.IN_PROGRESS) && onUploadAfterPhoto;
  
  if (!hasDraftAction && !hasCompleteAction && !hasUploadAfterPhotoAction) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Project Actions</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage your project status and workflow
          </p>
        </div>
        
        <div className="flex gap-3">
          {hasDraftAction && (
            <Button
              size="lg"
              onClick={onMakeOpenForProposal}
              className="bg-green-600 hover:bg-green-700 text-white px-6"
            >
              <Upload className="w-4 h-4 mr-2" />
              Publish Project
            </Button>
          )}
          
          {hasUploadAfterPhotoAction && (
            <Button
              size="lg"
              onClick={onUploadAfterPhoto}
              variant="outline"
              className="px-6"
            >
              <Camera className="w-4 h-4 mr-2" />
              Upload After Photo
            </Button>
          )}
          
          {hasCompleteAction && (
            <Button
              size="lg"
              onClick={onCompleteProject}
              variant="outline"
              className="px-6"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark Complete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
