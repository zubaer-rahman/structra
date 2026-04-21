import { User } from "./auth";
import { FileReference, GeospatialLocation } from "./common";
import { ProjectType, ProjectStatus, VisibilitySettings } from "@/utils/constants";

// Site Amenities Interface - Similar to Airbnb's "What this place offers"
export interface SiteAmenities {
  power: string[];
  sanitation: string[];
  water: string[];
  parking: string[];
  comfort: string[];
  safety: string[];
  security: string[];
  logistics: string[];
}

export interface Project {
  id: string;
  project_title: string;
  statement_of_work: string;
  budget: number;
  category: string[];
  pid: string;
  location: GeospatialLocation;
  location_geom?: any;
  certificate_of_title?: string | null;
  project_type: ProjectType;
  status: ProjectStatus;
  visibility_settings: VisibilitySettings;
  start_date: Date;
  end_date: Date;
  expiry_date: Date;
  decision_date?: Date | null;
  permit_required: boolean;
  substantial_completion?: Date | null;
  is_verified_project: boolean;
  is_featured_project: boolean;
  delay_penalty: number;
  abandonment_penalty: number;
  project_photos: FileReference[];
  files: FileReference[];
  // After photo field for project completion (before photo is taken from first project_photo)
  after_photo?: FileReference;
  creator: string;
  proposal_count: number;
  site_amenities?: SiteAmenities;
  title_awarded: boolean;
  project_certificate?: FileReference | null;
  slug?: string;
  created_at: Date;
  updated_at: Date;
  homeowner?: User;
}
