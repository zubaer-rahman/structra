"use client";

import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner, Breadcrumbs } from "@/components/shared";
import dynamic from "next/dynamic";

const CreateProjectForm = dynamic(
  () =>
    import("@/components/features/projects/CreateProjectForm").then((mod) => ({
      default: mod.default,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </div>
    ),
  }
);

export default function CreateProjectPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Post a Project</h1>
          <p className="text-muted-foreground">
            Create a detailed project request to attract quality contractors
          </p>
        </div>
      </div>
      <CreateProjectForm user={user} />
    </div>
  );
}
