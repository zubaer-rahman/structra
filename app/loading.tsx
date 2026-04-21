"use client";

import { LoadingSpinner } from "@/components/shared";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <LoadingSpinner 
            size="xl" 
            variant="default" 
            text="Loading..." 
            subtitle="Please wait while we load your content." 
          />
        </div>
      </div>
    </div>
  );
}
