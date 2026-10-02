"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  Star, 
  MapPin, 
  Calendar, 
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Building2,
  ArrowLeft,
  ShieldCheck,
  ExternalLink,
  Maximize2,
  X,
  Edit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase";
import { Project } from "@/server/database/interfaces";
import LoadingSpinner from "@/components/shared/loading-spinner";
import { trpc } from "@/utils/trpc";
import GoogleMap from "@/components/shared/GoogleMap";
import SiteAmenitiesDisplay from "@/components/features/projects/SiteAmenitiesDisplay";
import Navbar from "@/components/shared/navbar";
import { normalizeFileReferences } from "@/utils/helpers";
import { useAuth } from "@/contexts/AuthContext";

interface ProjectWithContractor extends Omit<Project, 'homeowner'> {
  contractor?: {
    id: string;
    full_name: string;
    profile_photo?: string;
    contractor_profile?: {
      id?: string;
      business_name?: string;
      trade_category?: string[] | string;
      slug?: string;
    };
    slug?: string;
  };
  homeowner?: {
    id: string;
    full_name: string;
    profile_photo?: string;
  };
}

interface GalleryItem {
  url: string;
  label: "Before" | "After" | "Project Photo";
}

export default function ProjectViewPage() {
  const params = useParams();
  const rawParam = params?.id as string;
  const { user } = useAuth();
  
  const [project, setProject] = useState<ProjectWithContractor | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Fetch contractor reviews (reviews about the contractor across all projects)
  const { data: contractorReviewsData = [] } = trpc.reviews.getByContractorPublic.useQuery({
    contractorId: project?.contractor?.id || '',
  }, {
    enabled: !!project?.contractor?.id
  });

  const contractorReviews = contractorReviewsData.map(review => ({
    ...review,
    author_user: Array.isArray(review.author_user) ? review.author_user[0] : review.author_user
  }));

  useEffect(() => {
    if (rawParam) {
      fetchProject();
    }
  }, [rawParam]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const isUuid = uuidRegex.test(rawParam);

      // Support lookup by either UUID or human-readable slug
      let query = supabase.from("projects").select("*");
      if (isUuid) {
        query = query.eq("id", rawParam);
      } else {
        query = query.eq("slug", rawParam);
      }

      const { data: projectData, error: projectError } = await query.maybeSingle();

      if (projectError || !projectData) {
        console.error("Project lookup error:", projectError);
        setProject(null);
        return;
      }

      // Fetch contractor from accepted proposal if present
      const { data: proposal } = await supabase
        .from("proposals")
        .select("contractor_id")
        .eq("project_id", projectData.id)
        .eq("status", "accepted")
        .limit(1)
        .maybeSingle();

      let contractor = null;
      if (proposal?.contractor_id) {
        const { data: contractorUser } = await supabase
          .from("users")
          .select(`
            id,
            full_name,
            profile_photo,
            contractor_profiles(*)
          `)
          .eq("id", proposal.contractor_id)
          .single();
        
        if (contractorUser) {
          const profile = Array.isArray(contractorUser.contractor_profiles)
            ? contractorUser.contractor_profiles[0]
            : contractorUser.contractor_profiles;
          
          contractor = {
            id: contractorUser.id,
            full_name: contractorUser.full_name,
            profile_photo: contractorUser.profile_photo,
            contractor_profile: profile,
            slug: profile?.slug || contractorUser.id
          };
        }
      }

      setProject({
        ...projectData,
        contractor
      });
    } catch (error) {
      console.error("Error fetching project:", error);
    } finally {
      setLoading(false);
    }
  };

  const getGalleryItems = (proj: ProjectWithContractor): GalleryItem[] => {
    const items: GalleryItem[] = [];
    const seenUrls = new Set<string>();

    const projPhotos = normalizeFileReferences(proj.project_photos).map(f => f.url).filter(Boolean);
    const afterPhotos = normalizeFileReferences(proj.after_photo).map(f => f.url).filter(Boolean);

    // If both project photos and after photo exist:
    if (projPhotos.length > 0 && afterPhotos.length > 0) {
      // First is Before
      items.push({ url: projPhotos[0], label: "Before" });
      seenUrls.add(projPhotos[0]);

      // Second is After
      items.push({ url: afterPhotos[0], label: "After" });
      seenUrls.add(afterPhotos[0]);

      // Any remaining are additional Project Photos
      for (let i = 1; i < projPhotos.length; i++) {
        if (!seenUrls.has(projPhotos[i])) {
          items.push({ url: projPhotos[i], label: "Project Photo" });
          seenUrls.add(projPhotos[i]);
        }
      }
    } else {
      // Fallback: collect all unique after and project photos
      afterPhotos.forEach(url => {
        if (!seenUrls.has(url)) {
          items.push({ url, label: "After" });
          seenUrls.add(url);
        }
      });
      projPhotos.forEach((url, i) => {
        if (!seenUrls.has(url)) {
          items.push({ url, label: i === 0 && afterPhotos.length > 0 ? "Before" : "Project Photo" });
          seenUrls.add(url);
        }
      });
    }

    if (items.length === 0) {
      items.push({ url: "/images/placeholder-image.png", label: "Project Photo" });
    }

    return items;
  };

  const formatBudget = (budget: number | null | undefined) => {
    if (!budget) return "Budget on request";
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(budget);
  };

  const formatDate = (date?: Date | string | null) => {
    if (!date) return "Not specified";
    return new Date(date).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const galleryItems = project ? getGalleryItems(project) : [];
  const currentItem = galleryItems[currentImageIndex] || galleryItems[0];

  const handleNextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryItems.length);
  }, [galleryItems.length]);

  const handlePrevImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryItems.length) % galleryItems.length);
  }, [galleryItems.length]);

  // Keyboard navigation for image gallery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen && galleryItems.length <= 1) return;
      if (e.key === "ArrowRight") handleNextImage();
      if (e.key === "ArrowLeft") handlePrevImage();
      if (e.key === "Escape") setIsLightboxOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, galleryItems.length, handleNextImage, handlePrevImage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0A0A0A] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0A0A0A] flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-white/10 flex items-center justify-center mx-auto text-neutral-400">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Project Not Found</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            The project you are looking for may have been removed or is no longer publicly available.
          </p>
          <Link href="/">
            <Button className="mt-2 bg-orange-600 hover:bg-orange-700 text-white">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const contractorSlug = project.contractor?.contractor_profile?.slug || project.contractor?.id;
  const averageRating = contractorReviews.length > 0 
    ? (contractorReviews.reduce((acc, r) => acc + r.rating, 0) / contractorReviews.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A] text-neutral-900 dark:text-neutral-100 antialiased">
      <Navbar />

      {/* Main Content - Consistent max-w-[1440px] matching other public pages */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm text-neutral-500 dark:text-neutral-400 mb-6">
          <Link href="/" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-neutral-900 dark:text-white font-medium truncate max-w-xs sm:max-w-md">
            {project.project_title}
          </span>
        </nav>

        {/* Gallery Section - Full Multi-Image Support */}
        <div className="mb-10">
          {galleryItems.length === 1 ? (
            // Exactly 1 Image
            <div className="relative w-full h-[360px] sm:h-[480px] md:h-[540px] rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-200/80 dark:border-white/10 shadow-sm group">
              <Image
                src={galleryItems[0].url}
                alt={project.project_title}
                fill
                priority
                className="object-contain cursor-pointer transition-transform duration-300 group-hover:scale-[1.01]"
                onClick={() => setIsLightboxOpen(true)}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/placeholder-image.png';
                }}
              />
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsLightboxOpen(true)}
                  className="bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 text-xs h-8 rounded-full"
                >
                  <Maximize2 className="w-3.5 h-3.5 mr-1" /> Expand
                </Button>
                <a
                  href={galleryItems[0].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-black/60 hover:bg-orange-600 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ) : galleryItems.length === 2 ? (
            // Exactly 2 Images (Before & After Side-by-Side)
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {galleryItems.map((item, idx) => (
                <div
                  key={idx}
                  className="relative w-full h-[280px] sm:h-[360px] md:h-[440px] rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-200/80 dark:border-white/10 shadow-sm group flex items-center justify-center"
                >
                  <Image
                    src={item.url}
                    alt={`${project.project_title} - ${item.label}`}
                    fill
                    priority
                    className="object-contain p-2 cursor-pointer transition-transform duration-300 group-hover:scale-[1.01]"
                    onClick={() => {
                      setCurrentImageIndex(idx);
                      setIsLightboxOpen(true);
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/placeholder-image.png';
                    }}
                  />
                  {/* Top-left Label Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-black/75 text-white border border-white/20 backdrop-blur-md shadow-sm">
                      {item.label}
                    </span>
                  </div>
                  {/* Bottom-right Action Buttons */}
                  <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setCurrentImageIndex(idx);
                        setIsLightboxOpen(true);
                      }}
                      className="bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 text-xs h-7 px-2.5 rounded-full"
                    >
                      <Maximize2 className="w-3 h-3 mr-1" /> View Full
                    </Button>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded-full bg-black/60 hover:bg-orange-600 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-colors"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // 3 or More Images (Featured Hero with Prev/Next Navigation + Thumbnail Strip)
            <div className="space-y-3">
              <div className="relative w-full h-[360px] sm:h-[460px] md:h-[520px] rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-200/80 dark:border-white/10 shadow-sm group">
                <Image
                  src={currentItem.url}
                  alt={`${project.project_title} - ${currentItem.label}`}
                  fill
                  priority
                  className="object-contain p-2 cursor-pointer transition-all duration-300"
                  onClick={() => setIsLightboxOpen(true)}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/placeholder-image.png';
                  }}
                />

                {/* Top-left Label Badge */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                  <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-black/75 text-white border border-white/20 backdrop-blur-md shadow-sm">
                    {currentItem.label}
                  </span>
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-black/60 text-white/90 border border-white/15 backdrop-blur-md">
                    Photo {currentImageIndex + 1} of {galleryItems.length}
                  </span>
                </div>

                {/* Left/Right Carousel Controls */}
                <div className="absolute inset-y-0 inset-x-3 flex items-center justify-between pointer-events-none">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevImage();
                    }}
                    className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/85 text-white border border-white/20 backdrop-blur-md pointer-events-auto shadow-md transition-transform hover:scale-105"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextImage();
                    }}
                    className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/85 text-white border border-white/20 backdrop-blur-md pointer-events-auto shadow-md transition-transform hover:scale-105"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>

                {/* Bottom-right Fullscreen / External Link buttons */}
                <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setIsLightboxOpen(true)}
                    className="bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 text-xs h-8 rounded-full shadow-md"
                  >
                    <Maximize2 className="w-3.5 h-3.5 mr-1.5" /> View All {galleryItems.length} Photos
                  </Button>
                  <a
                    href={currentItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-black/60 hover:bg-orange-600 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-colors shadow-md"
                    title="Open image in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Thumbnail Strip */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {galleryItems.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`relative w-20 h-14 sm:w-24 sm:h-16 rounded-xl overflow-hidden shrink-0 bg-neutral-900 border transition-all ${
                      idx === currentImageIndex
                        ? "ring-2 ring-orange-500 border-transparent scale-105"
                        : "border-neutral-200/80 dark:border-white/10 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={item.url}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/placeholder-image.png';
                      }}
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white text-center py-0.5 truncate px-1 font-medium">
                      {item.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content Layout - Breathable Editorial Flow with Only 1 Sticky Action Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Left Column (Editorial Content Flow - No Cluttering Boxed Cards) */}
          <div className="lg:col-span-2">
            {/* Header Details */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 font-medium">
                  {Array.isArray(project.category) ? project.category.join(", ") : project.category || "Renovation"}
                </Badge>
                <Badge variant="outline" className="text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-white/10">
                  {project.project_type || "Completed"}
                </Badge>
                {project.status && (
                  <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/5">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {project.status}
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white mb-3">
                {project.project_title}
              </h1>

              <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                <MapPin className="w-4 h-4 mr-1.5 text-neutral-400 shrink-0" />
                <span>
                  {project.location?.city && project.location?.province 
                    ? `${project.location.city}, ${project.location.province}`
                    : project.location?.address || 'Vancouver, BC'
                  }
                </span>
              </div>

              {/* Key Specs Bar */}
              <div className="grid grid-cols-3 gap-6 py-5 border-y border-neutral-200/70 dark:border-white/10">
                <div>
                  <span className="text-xs uppercase font-medium text-neutral-500 dark:text-neutral-400">Total Budget</span>
                  <p className="text-lg font-bold text-neutral-900 dark:text-white mt-0.5">
                    {formatBudget(project.budget)}
                  </p>
                </div>
                <div>
                  <span className="text-xs uppercase font-medium text-neutral-500 dark:text-neutral-400">Completion</span>
                  <p className="text-lg font-bold text-neutral-900 dark:text-white mt-0.5">
                    {formatDate(project.substantial_completion || project.created_at)}
                  </p>
                </div>
                <div>
                  <span className="text-xs uppercase font-medium text-neutral-500 dark:text-neutral-400">Type</span>
                  <p className="text-lg font-bold text-neutral-900 dark:text-white mt-0.5">
                    {project.project_type || "Residential"}
                  </p>
                </div>
              </div>
            </div>

            {/* Contractor Credit Block */}
            {project.contractor && (
              <div className="py-8 border-b border-neutral-200/70 dark:border-white/10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                      Executed By
                    </span>
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white mt-0.5">
                      {project.contractor.contractor_profile?.business_name || project.contractor.full_name}
                    </h3>
                  </div>
                  {contractorSlug && (
                    <Link href={`/contractors/${contractorSlug}`}>
                      <Button variant="outline" size="sm" className="rounded-xl border-neutral-300 dark:border-white/15 text-xs font-medium">
                        View Profile
                      </Button>
                    </Link>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-white/10 border border-neutral-200 dark:border-white/10 shrink-0">
                    <Image
                      src={project.contractor.profile_photo || "/images/placeholder-image.png"}
                      alt={project.contractor.full_name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-neutral-600 dark:text-neutral-300">
                      {Array.isArray(project.contractor.contractor_profile?.trade_category)
                        ? project.contractor.contractor_profile.trade_category.join(", ")
                        : project.contractor.contractor_profile?.trade_category || "General Contractor"
                      }
                    </p>
                    <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                      {averageRating ? (
                        <div className="flex items-center gap-1 font-medium text-neutral-900 dark:text-white">
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                          <span>{averageRating}</span>
                          <span className="text-neutral-400 font-normal">({contractorReviews.length} reviews)</span>
                        </div>
                      ) : (
                        <span>Verified Contractor</span>
                      )}
                      <span>·</span>
                      <span className="flex items-center text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5 mr-0.5" /> Identity Verified
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Statement of Work */}
            <div className="py-8 border-b border-neutral-200/70 dark:border-white/10 space-y-3">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">About This Project</h3>
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {project.statement_of_work || "Detailed architectural transformation including premium structural remodelling, modern interior finishes, and upgraded fixtures throughout."}
              </p>
            </div>

            {/* Site Amenities */}
            {project.site_amenities && (
              <div className="py-8 border-b border-neutral-200/70 dark:border-white/10">
                <SiteAmenitiesDisplay amenities={project.site_amenities} />
              </div>
            )}

            {/* Location Map */}
            {project.location && (
              <div className="py-8 space-y-4">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Project Location</h3>
                <div className="rounded-2xl overflow-hidden border border-neutral-200/80 dark:border-white/10 shadow-sm">
                  <GoogleMap
                    location={{
                      latitude: project.location.latitude,
                      longitude: project.location.longitude,
                      address: project.location.address,
                      city: project.location.city || "Unknown",
                      province: project.location.province || "Unknown",
                      postalCode: project.location.postalCode || "Unknown"
                    }}
                    height="380px"
                    title={project.project_title}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column (The ONLY card on the page - minimal, expressively pro) */}
          <aside className="lg:col-span-1 lg:sticky lg:top-24">
            <div className="bg-white dark:bg-[#141414] rounded-2xl p-6 sm:p-7 border border-neutral-200 dark:border-white/10 shadow-lg shadow-black/[0.03] space-y-6">
              {/* Snapshot Header */}
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-neutral-500 dark:text-neutral-400">
                  Marketplace Showcase
                </span>
                <div className="mt-1 flex items-baseline justify-between">
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {formatBudget(project.budget)}
                  </div>
                  <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/5 text-xs font-semibold">
                    Verified Work
                  </Badge>
                </div>
              </div>

              {/* Quick specs */}
              <div className="space-y-3 text-sm pt-4 border-t border-neutral-100 dark:border-white/10">
                <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                  <span className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-neutral-400" /> Category
                  </span>
                  <span className="font-medium text-neutral-900 dark:text-white truncate max-w-[140px] text-right">
                    {Array.isArray(project.category) ? project.category.join(", ") : project.category || "Renovation"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-neutral-400" /> Start Date
                  </span>
                  <span className="font-medium text-neutral-900 dark:text-white">
                    {formatDate(project.start_date)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-neutral-400" /> Completed
                  </span>
                  <span className="font-medium text-neutral-900 dark:text-white">
                    {formatDate(project.substantial_completion || project.created_at)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-white/10">
                <Link href="/register?role=homeowner" className="block w-full">
                  <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium h-11 rounded-xl shadow-sm">
                    Start a Project Like This
                  </Button>
                </Link>

                {contractorSlug ? (
                  <Link href={`/contractors/${contractorSlug}`} className="block w-full">
                    <Button variant="outline" className="w-full border-neutral-300 dark:border-white/15 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/5 font-medium h-11 rounded-xl">
                      Connect with Contractor
                    </Button>
                  </Link>
                ) : (
                  <Link href="/register?role=contractor" className="block w-full">
                    <Button variant="outline" className="w-full border-neutral-300 dark:border-white/15 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/5 font-medium h-11 rounded-xl">
                      Join as Contractor
                    </Button>
                  </Link>
                )}
              </div>

              {/* Back to Home Link */}
              <div className="text-center pt-2">
                <Link href="/" className="text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors">
                  ← Back to Marketplace
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Full-Screen Lightbox Dialog for Multi-Image Browsing */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-6xl w-full h-[88vh] p-0 bg-black/95 border-neutral-800 text-white flex flex-col justify-between overflow-hidden rounded-2xl" showCloseButton={false}>
          <DialogTitle className="sr-only">Project Photo Gallery</DialogTitle>
          
          {/* Lightbox Top Header */}
          <div className="p-4 px-6 flex items-center justify-between border-b border-white/10 z-10">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-sm truncate max-w-sm sm:max-w-md">{project.project_title}</span>
              <span className="px-2.5 py-0.5 text-xs font-bold uppercase rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                {currentItem.label}
              </span>
              <span className="text-xs text-neutral-400">
                {currentImageIndex + 1} of {galleryItems.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={currentItem.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                title="Open original in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsLightboxOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Lightbox Center Image Stage */}
          <div className="relative flex-1 w-full h-full flex items-center justify-center p-4">
            <Image
              src={currentItem.url}
              alt={`${project.project_title} - ${currentItem.label}`}
              fill
              className="object-contain p-2 select-none"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/placeholder-image.png';
              }}
            />

            {galleryItems.length > 1 && (
              <div className="absolute inset-y-0 inset-x-4 flex items-center justify-between pointer-events-none">
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={handlePrevImage}
                  className="w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md pointer-events-auto shadow-lg"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={handleNextImage}
                  className="w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md pointer-events-auto shadow-lg"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>
            )}
          </div>

          {/* Lightbox Bottom Thumbnail Tray */}
          {galleryItems.length > 1 && (
            <div className="p-3 px-6 border-t border-white/10 bg-black/50 flex items-center justify-center gap-2 overflow-x-auto z-10">
              {galleryItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border transition-all ${
                    idx === currentImageIndex
                      ? "ring-2 ring-orange-500 border-transparent scale-105"
                      : "border-white/10 opacity-50 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={item.url}
                    alt={`Thumb ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
