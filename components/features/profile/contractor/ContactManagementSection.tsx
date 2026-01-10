"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

interface ContactManagementSectionProps {
  contractor_contacts: string[];
}

export function ContactManagementSection({
  contractor_contacts,
}: ContactManagementSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Contact Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-600 mb-2">Contact Management Disabled</h4>
          <p className="text-sm text-gray-500 mb-4">
            Contact management functionality is currently disabled.
          </p>
          <p className="text-xs text-gray-400">
            {contractor_contacts.length > 0 
              ? `Current contacts: ${contractor_contacts.length}` 
              : 'No contacts assigned'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
