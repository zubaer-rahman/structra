import { AirbnbHero } from "@/components/features/landing/AirbnbHero";
import { FeaturedProjectsCarousel } from "@/components/features/landing/FeaturedProjectsCarousel";
import { RecentProjectsCarousel } from "@/components/features/landing/RecentProjectsCarousel";
import { FeaturedContractorsCarousel } from "@/components/features/landing/FeaturedContractorsCarousel";
import { AirbnbFooter } from "@/components/features/landing/AirbnbFooter";
import Navbar from "@/components/shared/navbar";

export default function NewLandingPage() {
  return (
    <div className="min-h-screen bg-white">
       <Navbar />  
       <div className="pt-16">
         <AirbnbHero />
       </div>
       <FeaturedProjectsCarousel />
       <RecentProjectsCarousel />
       <FeaturedContractorsCarousel />
       <AirbnbFooter />
       
    </div>
  );
}
