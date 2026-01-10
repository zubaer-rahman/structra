"use client";

import { useParams } from "next/navigation";
import BlurredProjectGallery from "@/components/features/landing/BlurredProjectGallery";

export default function RecentProjectPreviewPage() {
  const params = useParams();
  const projectSlug = params.slug as string;

  return <BlurredProjectGallery projectSlug={projectSlug} />;
}
