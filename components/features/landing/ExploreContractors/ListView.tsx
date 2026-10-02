"use client";

import React from "react";
import { User, ContractorProfile } from "@/server/database/interfaces";
import ContractorCard from "./ContractorCard";
import SeeMoreCard from "./SeeMoreCard";
import { Wrench } from "lucide-react";

interface ContractorWithProfile extends Omit<User, 'contractor_profile'> {
  contractor_profile?: ContractorProfile;
  average_rating?: number;
  rating_count?: number;
  slug?: string;
}

interface ListViewProps {
  contractors: ContractorWithProfile[];
  selectedContractor: ContractorWithProfile | null;
  formatDate: (dateString: string) => string;
}

export default function ListView({ contractors, selectedContractor, formatDate }: ListViewProps) {
  if (contractors.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[500px] p-12">
        <div className="text-center">
          <Wrench className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
          <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            No verified contractors found
          </p>
        </div>
      </div>
    );
  }

  // Optional: Limit the number of contractors displayed in the grid before the "See More" card
  const limitedContractors = contractors.slice(0, 11);

  return (
    <div className="p-6 sm:p-8">
      {/* Count header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
          {contractors.length} verified contractor{contractors.length !== 1 ? "s" : ""}
        </p>
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {limitedContractors.map((contractor, index) => (
          <ContractorCard
            key={contractor.id || `contractor-${index}`}
            contractor={contractor}
            selectedContractor={selectedContractor}
            formatDate={formatDate}
          />
        ))}
        <SeeMoreCard />
      </div>
    </div>
  );
}
