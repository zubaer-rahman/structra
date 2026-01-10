"use client";

import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import LandingProjectCard from "./LandingProjectCard";
import SeeMoreCard from "./SeeMoreCard";
import { Project } from "@/server/database/interfaces";


interface ProjectCarouselProps {
  projects: Project[];
  selectedProject: Project | null;
  formatBudget: (budget: number) => string;
  formatDate: (dateString: string) => string;
  title?: string;
  subtitle?: string;
}

export default function ProjectCarousel({
  projects,
  selectedProject,
  formatBudget,
  formatDate,
}: ProjectCarouselProps) {
  return (
    <div>
      {/* Carousel Container */}
      <div className="relative mt-14">
        {/* Navigation Buttons - Top Right */}
        <div className="absolute -top-12 right-0 z-10 flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full bg-white shadow-lg border-gray-200 hover:bg-gray-50 swiper-button-prev-custom"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full bg-white shadow-lg border-gray-200 hover:bg-gray-50 swiper-button-next-custom"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Swiper */}
        <Swiper
          modules={[Navigation, Pagination]}
          spaceBetween={24}
          slidesPerView={1}
          navigation={{
            prevEl: ".swiper-button-prev-custom",
            nextEl: ".swiper-button-next-custom",
          }}
          pagination={{
            clickable: true,
            el: ".swiper-pagination-custom",
          }}
          breakpoints={{
            640: {
              slidesPerView: 2,
              spaceBetween: 20,
            },
            768: {
              slidesPerView: 2,
              spaceBetween: 24,
            },
            1024: {
              slidesPerView: 3,
              spaceBetween: 24,
            },
            1280: {
              slidesPerView: 4,
              spaceBetween: 24,
            },
          }}
          className="!overflow-hidden"
        >
          {projects.map((project) => (
            <SwiperSlide key={project.id} className="!h-auto">
              <LandingProjectCard
                project={project}
                selectedProject={selectedProject}
                formatBudget={formatBudget}
                formatDate={formatDate}
              />
            </SwiperSlide>
          ))}

          {/* See More Card */}
          <SwiperSlide className="!h-auto">
            <SeeMoreCard />
          </SwiperSlide>
        </Swiper>

        {/* Custom Pagination */}
        <div className="swiper-pagination-custom flex justify-center mt-8 space-x-2"></div>
      </div>
    </div>
  );
}
