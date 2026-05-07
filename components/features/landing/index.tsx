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
    <div className="min-h-screen bg-[#0A0A0A] selection:bg-orange-500/30">
      {/* Technical Grid Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20" 
           style={{ 
             backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
             backgroundSize: '100px 100px'
           }} 
      />
      
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
