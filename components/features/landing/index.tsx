import { Hero } from "./Hero";
import { ImageShowcase } from "./ImageShowcase";
import { Features } from "./Features";
import { HowItWorks } from "./HowItWorks";
import { CTA } from "./CTA";
import { Footer } from "./Footer";
import { Navbar, MessageIcon } from "@/components/shared";
import ExploreProjects from "./ExploreProjects";
import ExploreContractors from "./ExploreContractors";
import FeaturedProjects from "./FeaturedProjects";
import { FeaturedContractorsCarousel } from "./FeaturedContractorsCarousel";
import { InstitutionalTrust } from "./InstitutionalTrust";
import { Metrics } from "./Metrics";
    
export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0A0A] text-slate-900 dark:text-white selection:bg-orange-500/30 transition-colors duration-300">

      <div className="relative z-10">
        <Navbar />  
        <Hero />  
        <InstitutionalTrust />
        <ImageShowcase />
        <Metrics />
        <div id="network">
          <ExploreProjects />  
        </div>
        <FeaturedProjects />
        <HowItWorks />   
        <FeaturedContractorsCarousel />
        <div id="exchange">
          <ExploreContractors />
        </div>
        <div id="infrastructure">
          <Features />  
        </div>
        <CTA /> 
        <Footer />
        <MessageIcon />
      </div>
    </div>
  );
}
