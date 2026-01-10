"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function ProjectPublishedPage() {
  const [projectTitle, setProjectTitle] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    // Get project details from URL parameters
    const titleParam = searchParams.get('title');
    const idParam = searchParams.get('id');
    
    if (titleParam) {
      setProjectTitle(decodeURIComponent(titleParam));
    }
    
    if (idParam) {
      setProjectId(idParam);
    }
  }, [searchParams]);

  const handleViewProject = () => {
    if (projectId) {
      router.push(`/homeowner/projects/view/${projectId}`);
    } else {
      router.push('/homeowner/projects');
    }
  };

  const handleViewAllProjects = () => {
    router.push('/homeowner/projects');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          
          {/* Success Message */}
          <h2 className="text-xl font-semibold text-gray-800 mb-3">
            Project Published Successfully!
          </h2>
          
          <div className="space-y-3 mb-4">
            <p className="text-sm text-gray-600">
              Your project has been published and is now open for proposals.
            </p>
            
            {projectTitle && (
              <div className="bg-gray-50 rounded p-2 border">
                <span className="text-sm font-medium text-gray-800">{projectTitle}</span>
              </div>
            )}
          </div>

          {/* Action Link */}
          {projectId && (
            <a
              href={`/homeowner/projects/view/${projectId}`}
              className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium text-sm transition-colors"
            >
              <Eye className="h-4 w-4 mr-2" />
              View your project
            </a>
          )}
        </div>
      </div>
    </div>
  );
}