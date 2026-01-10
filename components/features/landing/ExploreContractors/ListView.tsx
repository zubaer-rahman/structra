"use client";

import React from "react";
import { User, ContractorProfile } from "@/server/database/interfaces";
import ContractorCard from "./ContractorCard";

interface ContractorWithProfile extends Omit<User, 'contractor_profile'> {
  contractor_profile?: ContractorProfile; // This will be the actual profile object from our query
  average_rating?: number;
  rating_count?: number;
}

interface ListViewProps {
  contractors: ContractorWithProfile[];
  selectedContractor: ContractorWithProfile | null;
  formatDate: (dateString: string) => string;
}

export default function ListView({
  contractors,
  selectedContractor,
  formatDate
}: ListViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {contractors.map((contractor, index) => (
        <ContractorCard
          key={`contractor-${contractor.id || contractor.contractor_profile?.id || index}`}
          contractor={contractor}
          selectedContractor={selectedContractor}
          formatDate={formatDate}
        />
      ))}
    </div>
  );
}
