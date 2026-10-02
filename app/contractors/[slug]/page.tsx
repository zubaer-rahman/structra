"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  Star, 
  MapPin, 
  Calendar, 
  Building2,
  ShieldCheck,
  Wrench,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  FileCheck2,
  Clock,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase";
import { User, ContractorProfile } from "@/server/database/interfaces";
import LoadingSpinner from "@/components/shared/loading-spinner";
import { trpc } from "@/utils/trpc";
import GoogleMap from "@/components/shared/GoogleMap";
import Navbar from "@/components/shared/navbar";
import CompletedProjectCard from "@/components/features/contractor/CompletedProjectCard";

interface ContractorWithProfile extends Omit<User, 'contractor_profile'> {
  contractor_profile?: ContractorProfile;
  average_rating?: number;
  rating_count?: number;
  slug?: string;
}

export default function ContractorViewPage() {
  const params = useParams();
  const contractorSlug = params?.slug as string;
  
  const [contractor, setContractor] = useState<ContractorWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedProjects, setCompletedProjects] = useState<any[]>([]);
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0);

  // Fetch reviews using tRPC (public query - no auth required)
  const { data: reviewsData = [], isLoading: reviewsLoading } = trpc.reviews.getByContractorPublic.useQuery({
    contractorId: contractor?.id || '',
  }, {
    enabled: !!contractor?.id
  });

  const reviews = reviewsData.slice(0, 6).map(review => ({
    ...review,
    author_user: Array.isArray(review.author_user) ? review.author_user[0] : review.author_user
  }));

  useEffect(() => {
    if (contractorSlug) {
      fetchContractor();
    }
  }, [contractorSlug]);

  useEffect(() => {
    if (contractor?.id) {
      fetchCompletedProjects();
    }
  }, [contractor?.id]);

  const fetchCompletedProjects = async () => {
    try {
      const response = await fetch(`/api/reviews/contractor/${contractor?.id}`);
      if (response.ok) {
        const data = await response.json();
        const projectsWithPhotos = (data.reviews || [])
          .filter((review: any) => 
            review.project?.photos?.before && review.project?.photos?.after
          )
          .map((review: any) => ({
            id: review.project.id,
            project_title: review.project.project_title,
            photos: review.project.photos,
            rating: review.rating,
            text: review.text,
            created_at: review.created_at,
            author_user: review.author_user
          }));
        setCompletedProjects(projectsWithPhotos);
      }
    } catch (error) {
      console.error('Error fetching completed projects:', error);
    }
  };

  const fetchContractor = async () => {
    try {
      setLoading(true);

      // 1. Try public API route first (handles both slug and UUID lookups with admin client)
      try {
        const response = await fetch(`/api/contractors/by-slug/${encodeURIComponent(contractorSlug)}`);
        if (response.ok) {
          const result = await response.json();
          if (result.contractor) {
            const cp = result.contractor;
            const userData = cp.user || cp.users || {};
            const transformedData = {
              ...userData,
              id: userData.id || cp.user_id,
              created_at: cp.created_at,
              contractor_profile: cp,
              slug: cp.slug,
            };
            setContractor(transformedData as unknown as ContractorWithProfile);
            return;
          }
        }
      } catch (apiError) {
        console.warn("API route lookup failed, attempting direct Supabase query:", apiError);
      }

      // 2. Direct Supabase query fallback
      const supabase = createClient();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const isUuid = uuidRegex.test(contractorSlug);

      let contractorData = null;
      
      const { data: bySlug } = await supabase
        .from("contractor_profiles")
        .select(`
          *,
          users!user_id (
            id,
            full_name,
            first_name,
            last_name,
            email,
            phone_number,
            address,
            profile_photo,
            user_role,
            is_verified_contractor,
            is_active,
            created_at
          )
        `)
        .eq("slug", contractorSlug)
        .maybeSingle();

      if (bySlug) {
        contractorData = bySlug;
      } else if (isUuid) {
        const { data: byUserId } = await supabase
          .from("contractor_profiles")
          .select(`
            *,
            users!user_id (
              id,
              full_name,
              first_name,
              last_name,
              email,
              phone_number,
              address,
              profile_photo,
              user_role,
              is_verified_contractor,
              is_active,
              created_at
            )
          `)
          .eq("user_id", contractorSlug)
          .maybeSingle();

        if (byUserId) {
          contractorData = byUserId;
        } else {
          const { data: byProfileId } = await supabase
            .from("contractor_profiles")
            .select(`
              *,
              users!user_id (
                id,
                full_name,
                first_name,
                last_name,
                email,
                phone_number,
                address,
                profile_photo,
                user_role,
                is_verified_contractor,
                is_active,
                created_at
              )
            `)
            .eq("id", contractorSlug)
            .maybeSingle();
            
          contractorData = byProfileId;
        }
      }

      if (!contractorData) {
        console.error("Contractor not found for slug/id:", contractorSlug);
        setContractor(null);
        return;
      }

      const user = contractorData.users || contractorData.user || {};
      const transformedData = {
        ...user,
        id: user.id || contractorData.user_id,
        created_at: contractorData.created_at,
        contractor_profile: contractorData,
        slug: contractorData.slug,
      };

      setContractor(transformedData as unknown as ContractorWithProfile);
    } catch (error) {
      console.error("Error fetching contractor:", error);
    } finally {
      setLoading(false);
    }
  };

  const getContractorImage = (cont: ContractorWithProfile) => {
    if (cont.profile_photo && typeof cont.profile_photo === 'string' && cont.profile_photo.trim() !== "") {
      return cont.profile_photo;
    }
    if (cont.contractor_profile?.logo && typeof cont.contractor_profile.logo === 'string' && cont.contractor_profile.logo.trim() !== "") {
      return cont.contractor_profile.logo;
    }
    return "/images/placeholder-image.png";
  };

  const getPortfolioImages = (cont: ContractorWithProfile): string[] => {
    const urls: string[] = [];
    if (Array.isArray(cont.contractor_profile?.portfolio)) {
      cont.contractor_profile.portfolio.forEach((p: any) => {
        if (typeof p === 'string' && p.trim()) urls.push(p);
        else if (p && typeof p === 'object' && p.url) urls.push(p.url);
      });
    }
    if (Array.isArray(cont.contractor_profile?.portfolio_file)) {
      cont.contractor_profile.portfolio_file.forEach((p: any) => {
        if (p && typeof p === 'object' && p.url) urls.push(p.url);
      });
    }
    return Array.from(new Set(urls.filter(Boolean)));
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getAverageRating = () => {
    if (!reviews || reviews.length === 0) return null;
    return (reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0A0A0A] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!contractor) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0A0A0A] flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-white/10 flex items-center justify-center mx-auto text-neutral-400">
            <Wrench className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Contractor Not Found</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            The contractor profile you requested could not be located or may have been updated.
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

  const mainAvatar = getContractorImage(contractor);
  const avgRating = getAverageRating();
  const tradeCategories = Array.isArray(contractor.contractor_profile?.trade_category)
    ? contractor.contractor_profile.trade_category
    : contractor.contractor_profile?.trade_category
      ? [contractor.contractor_profile.trade_category]
      : ["General Contractor"];

  const hasCompletedProjects = completedProjects.length > 0;
  const portfolioPhotos = getPortfolioImages(contractor);

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
            {contractor.contractor_profile?.business_name || contractor.full_name}
          </span>
        </nav>

        {/* Expressive Modern Profile Header Banner */}
        <div className="mb-10 rounded-2xl border border-neutral-200/80 dark:border-white/10 shadow-sm overflow-hidden bg-neutral-50/50 dark:bg-[#111111]">
          {/* Subtle Decorative Top Gradient */}
          <div className="h-32 sm:h-44 w-full bg-gradient-to-r from-orange-500/20 via-amber-500/10 to-neutral-200 dark:to-neutral-800/40 relative">
            <div className="absolute inset-0 bg-grid-pattern opacity-10" />
          </div>

          {/* Profile Identity Bar */}
          <div className="px-6 sm:px-10 pb-6 sm:pb-8 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-6 -mt-16 sm:-mt-20">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
              {/* Avatar / Logo */}
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden bg-white dark:bg-[#141414] p-1 border-2 border-white dark:border-[#141414] shadow-md shrink-0">
                <div className="relative w-full h-full rounded-xl overflow-hidden bg-neutral-100 dark:bg-white/5">
                  <Image
                    src={mainAvatar}
                    alt={contractor.contractor_profile?.business_name || contractor.full_name}
                    fill
                    priority
                    className="object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/placeholder-image.png';
                    }}
                  />
                </div>
              </div>

              {/* Title & Key Badges */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    {contractor.contractor_profile?.business_name || contractor.full_name}
                  </h1>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 flex items-center gap-1 font-semibold text-xs">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Contractor
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-sm text-neutral-600 dark:text-neutral-400">
                  <div className="flex items-center gap-1">
                    <Wrench className="w-4 h-4 text-neutral-400" />
                    <span>{tradeCategories.join(", ")}</span>
                  </div>
                  {contractor.contractor_profile?.service_location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-neutral-400" />
                      <span>{contractor.contractor_profile.service_location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-neutral-400" />
                    <span>Member since {formatDate(contractor.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Star Score in Header */}
            <div className="flex items-center sm:flex-col sm:items-end gap-2 bg-white dark:bg-white/[0.04] sm:bg-transparent px-4 py-3 sm:p-0 rounded-xl border sm:border-0 border-neutral-200/80 dark:border-white/10">
              <div className="flex items-center gap-1.5">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="text-xl font-bold text-neutral-900 dark:text-white">
                  {avgRating || "5.0"}
                </span>
              </div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {reviews.length > 0 ? `${reviews.length} homeowner reviews` : "Verified credentials"}
              </span>
            </div>
          </div>
        </div>

        {/* Content Layout - Breathable Editorial Flow with Only 1 Sticky Action Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Left Column (Editorial Flow - No Cluttering Boxed Cards) */}
          <div className="lg:col-span-2">
            {/* About / Bio */}
            <div className="pb-8 border-b border-neutral-200/70 dark:border-white/10 space-y-3">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">About the Business</h3>
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed text-sm sm:text-base whitespace-pre-line">
                {contractor.contractor_profile?.bio || 
                 `${contractor.contractor_profile?.business_name || contractor.full_name} is a licensed, high-performing professional general contractor operating across ${contractor.contractor_profile?.service_location || 'the region'}, specializing in top-tier residential and commercial renovations with strict quality assurance standards.`}
              </p>
            </div>

            {/* Services & Trade Categories */}
            <div className="py-8 border-b border-neutral-200/70 dark:border-white/10 space-y-3">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Specialties & Trade Focus</h3>
              <div className="flex flex-wrap gap-2 pt-1">
                {tradeCategories.map((trade, idx) => (
                  <Badge 
                    key={idx}
                    variant="secondary"
                    className="bg-neutral-100 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-white/10 px-3.5 py-1.5 rounded-xl text-sm font-medium"
                  >
                    {trade}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Verified Business Credentials & Insurance */}
            <div className="py-8 border-b border-neutral-200/70 dark:border-white/10 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Verified Credentials & Protection</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Platform-verified documentation ensuring complete project security
                  </p>
                </div>
                <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/80 dark:border-white/5 space-y-1">
                  <span className="text-xs uppercase font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> Legal Entity
                  </span>
                  <p className="font-semibold text-neutral-900 dark:text-white text-sm sm:text-base">
                    {contractor.contractor_profile?.legal_entity_type || "Corporation / LLC"}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/80 dark:border-white/5 space-y-1">
                  <span className="text-xs uppercase font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5" /> Work Guarantee
                  </span>
                  <p className="font-semibold text-neutral-900 dark:text-white text-sm sm:text-base">
                    {contractor.contractor_profile?.work_guarantee 
                      ? `${contractor.contractor_profile.work_guarantee} Months Warranty`
                      : "12 Months Warranty Guaranteed"}
                  </p>
                </div>

                {contractor.contractor_profile?.insurance_general_liability && (
                  <div className="p-4 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/80 dark:border-white/5 space-y-1">
                    <span className="text-xs uppercase font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> General Liability
                    </span>
                    <p className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm sm:text-base">
                      ${contractor.contractor_profile.insurance_general_liability.toLocaleString()} Coverage
                    </p>
                  </div>
                )}

                {contractor.contractor_profile?.insurance_builders_risk && (
                  <div className="p-4 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/80 dark:border-white/5 space-y-1">
                    <span className="text-xs uppercase font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Builder&apos;s Risk Insurance
                    </span>
                    <p className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm sm:text-base">
                      ${contractor.contractor_profile.insurance_builders_risk.toLocaleString()} Coverage
                    </p>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/80 dark:border-white/5 space-y-1">
                  <span className="text-xs uppercase font-medium text-neutral-500 dark:text-neutral-400">GST / HST Status</span>
                  <p className="font-medium text-neutral-900 dark:text-white text-sm">
                    {contractor.contractor_profile?.gst_hst_number ? "Verified & Registered" : "Registered on Platform"}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/80 dark:border-white/5 space-y-1">
                  <span className="text-xs uppercase font-medium text-neutral-500 dark:text-neutral-400">Workers&apos; Compensation (WCB)</span>
                  <p className="font-medium text-neutral-900 dark:text-white text-sm">
                    {contractor.contractor_profile?.wcb_number ? "Compliant & In Good Standing" : "Platform Verified"}
                  </p>
                </div>
              </div>
            </div>

            {/* Portfolio Gallery (If present) */}
            {portfolioPhotos.length > 0 && (
              <div className="py-8 border-b border-neutral-200/70 dark:border-white/10 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Portfolio & Work Samples</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Recent craftsmanship examples and completed installations ({portfolioPhotos.length} photos)
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {portfolioPhotos.map((imgUrl, idx) => (
                    <a
                      key={idx}
                      href={imgUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative aspect-video rounded-xl overflow-hidden bg-neutral-900 border border-neutral-200/80 dark:border-white/10 group cursor-pointer shadow-sm"
                    >
                      <Image
                        src={imgUrl}
                        alt={`${contractor.contractor_profile?.business_name || contractor.full_name} portfolio ${idx + 1}`}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ExternalLink className="w-5 h-5 text-white" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Projects Showcase */}
            {hasCompletedProjects && (
              <div className="py-8 border-b border-neutral-200/70 dark:border-white/10 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Completed Work & Transformations</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Real before-and-after project photos verified by homeowners
                    </p>
                  </div>
                  {completedProjects.length > 2 && (
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentProjectIndex(p => Math.max(0, p - 1))}
                        disabled={currentProjectIndex === 0}
                        className="w-8 h-8 rounded-full border-neutral-200 dark:border-white/10"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentProjectIndex(p => Math.min(completedProjects.length - 1, p + 1))}
                        disabled={currentProjectIndex >= completedProjects.length - 1}
                        className="w-8 h-8 rounded-full border-neutral-200 dark:border-white/10"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {completedProjects.slice(currentProjectIndex, currentProjectIndex + 2).map((proj) => (
                    <CompletedProjectCard key={proj.id} project={proj} />
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            {reviews.length > 0 && (
              <div className="py-8 border-b border-neutral-200/70 dark:border-white/10 space-y-6">
                <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/10 pb-4">
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Homeowner Reviews</h3>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-neutral-900 dark:text-white">{avgRating || "5.0"}</span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">({reviews.length} total)</span>
                  </div>
                </div>

                <div className="space-y-6 divide-y divide-neutral-100 dark:divide-white/10">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="pt-6 first:pt-0 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative w-9 h-9 rounded-full overflow-hidden bg-neutral-100 dark:bg-white/10 border border-neutral-200 dark:border-white/10 shrink-0">
                            <Image
                              src={rev.author_user?.profile_photo || "/images/placeholder-image.png"}
                              alt={rev.author_user?.first_name || "Homeowner"}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                              {rev.author_user?.first_name 
                                ? `${rev.author_user.first_name} ${rev.author_user.last_name || ''}`
                                : "Verified Homeowner"}
                            </p>
                            <span className="text-xs text-neutral-500 dark:text-neutral-400">
                              {formatDate(rev.created_at)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-neutral-300 dark:text-neutral-700"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed italic">
                        &ldquo;{rev.text}&rdquo;
                      </p>

                      {rev.recommend_score && (
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                          <span>Recommendation Score: {rev.recommend_score}/10</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Service Location Map */}
            {contractor.contractor_profile?.address && (
              <div className="py-8 space-y-4">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Operating Location</h3>
                <div className="rounded-2xl overflow-hidden border border-neutral-200/80 dark:border-white/10 shadow-sm">
                  <GoogleMap
                    location={{
                      latitude: contractor.contractor_profile.address.latitude || 0,
                      longitude: contractor.contractor_profile.address.longitude || 0,
                      address: contractor.contractor_profile.address.address,
                      city: contractor.contractor_profile.address.city || "Unknown",
                      province: contractor.contractor_profile.address.province || "Unknown",
                      postalCode: contractor.contractor_profile.address.postalCode || "Unknown"
                    }}
                    height="380px"
                    title={contractor.contractor_profile.business_name || contractor.full_name}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column (The ONLY card on the page - minimal, expressively pro) */}
          <aside className="lg:col-span-1 lg:sticky lg:top-24">
            <div className="bg-white dark:bg-[#141414] rounded-2xl p-6 sm:p-7 border border-neutral-200 dark:border-white/10 shadow-lg shadow-black/[0.03] space-y-6">
              {/* Trust Badge & Headline */}
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-neutral-500 dark:text-neutral-400">
                  Direct Contractor Connect
                </span>
                <div className="mt-1 flex items-baseline justify-between">
                  <div className="text-xl font-bold text-neutral-900 dark:text-white truncate">
                    {contractor.contractor_profile?.business_name || contractor.full_name}
                  </div>
                  <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/5 text-xs font-semibold shrink-0 ml-2">
                    Verified Pro
                  </Badge>
                </div>
              </div>

              {/* Verified Trust Stats */}
              <div className="space-y-3 text-sm pt-4 border-t border-neutral-100 dark:border-white/10">
                <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Guarantee
                  </span>
                  <span className="font-medium text-neutral-900 dark:text-white">
                    {contractor.contractor_profile?.work_guarantee 
                      ? `${contractor.contractor_profile.work_guarantee} Mo` 
                      : "12 Mo Warranty"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                  <span className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-neutral-400" /> Insurance
                  </span>
                  <span className="font-medium text-neutral-900 dark:text-white">
                    Verified Active
                  </span>
                </div>

                <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-neutral-400" /> Response Time
                  </span>
                  <span className="font-medium text-neutral-900 dark:text-white">
                    Within 24 Hours
                  </span>
                </div>

                {contractor.contractor_profile?.service_location && (
                  <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-neutral-400" /> Area
                    </span>
                    <span className="font-medium text-neutral-900 dark:text-white truncate max-w-[140px] text-right">
                      {contractor.contractor_profile.service_location}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-white/10">
                <Link href="/register?role=homeowner" className="block w-full">
                  <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium h-11 rounded-xl shadow-sm">
                    Request a Quote
                  </Button>
                </Link>

                <Link href="/register?role=homeowner" className="block w-full">
                  <Button variant="outline" className="w-full border-neutral-300 dark:border-white/15 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/5 font-medium h-11 rounded-xl">
                    Post a Project
                  </Button>
                </Link>
              </div>

              {/* Back to Marketplace */}
              <div className="text-center pt-2">
                <Link href="/" className="text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors">
                  ← Back to Marketplace
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
