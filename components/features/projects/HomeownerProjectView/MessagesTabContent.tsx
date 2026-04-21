"use client";

import { MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function MessagesTabContent() {
  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-64 text-center text-gray-500">
          <MessageSquare className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Messages Yet</h3>
          <p className="text-sm text-gray-500 max-w-md px-4">
            Start the conversation by sending the first message to contractors or other project stakeholders.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
