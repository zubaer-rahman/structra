export const PROJECT_TYPES = {
  NEW_BUILD: "New Build",
  RENOVATION: "Renovation",
  REPAIR: "Repair",
  ADDITION: "Addition",
  DEMOLITION: "Demolition",
  LANDSCAPING: "Landscaping",
  SPECIALTY: "Specialty",
  OTHER: "Other",
} as const;

export type ProjectType = (typeof PROJECT_TYPES)[keyof typeof PROJECT_TYPES];

export const PROJECT_TYPE_VALUES = Object.values(PROJECT_TYPES);

export const PROJECT_TYPE_DESCRIPTIONS: Record<ProjectType, string> = {
  [PROJECT_TYPES.NEW_BUILD]:
    "Full construction from the ground up; may trigger HPO warranty and other regulatory checks.",
  [PROJECT_TYPES.RENOVATION]: "General improvements to existing structures.",
  [PROJECT_TYPES.REPAIR]:
    "Fixes or corrections to damaged or malfunctioning parts of a home; typically bypasses milestone builder.",
  [PROJECT_TYPES.ADDITION]:
    "Expanding the footprint of the home (e.g., extra rooms, garage, second story).",
  [PROJECT_TYPES.DEMOLITION]: "Tear-downs or structural removal projects.",
  [PROJECT_TYPES.LANDSCAPING]:
    "Outdoor-focused work including grading, planting, hardscapes, or drainage.",
  [PROJECT_TYPES.SPECIALTY]:
    "Niche services such as solar installs, home automation, or custom finishes.",
  [PROJECT_TYPES.OTHER]: "Used for uncategorized or edge case projects.",
};

export const PROJECT_STATUSES = {
  DRAFT: "Draft",
  OPEN_FOR_PROPOSALS: "Open for Proposals",
  PROPOSAL_SELECTED: "Proposal Selected",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
} as const;

export type ProjectStatus =
  (typeof PROJECT_STATUSES)[keyof typeof PROJECT_STATUSES];

export const PROJECT_STATUS_VALUES = Object.values(PROJECT_STATUSES);

export const PROJECT_STATUS_DESCRIPTIONS: Record<ProjectStatus, string> = {
  [PROJECT_STATUSES.DRAFT]:
    "The project is being created but not yet published or open for bidding.",
  [PROJECT_STATUSES.OPEN_FOR_PROPOSALS]:
    "The project is visible to contractors and accepting proposal submissions.",
  [PROJECT_STATUSES.PROPOSAL_SELECTED]:
    "A homeowner has accepted one or more proposals but work has not yet begun.",
  [PROJECT_STATUSES.IN_PROGRESS]: "Work has officially started on the project.",
  [PROJECT_STATUSES.COMPLETED]:
    "The project is fully completed and all legal or financial conditions are resolved.",
  [PROJECT_STATUSES.CANCELLED]:
    "The project has been withdrawn or terminated before completion.",
};
