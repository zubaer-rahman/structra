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
    
export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
       <Navbar />  
       <Hero />  
       <ImageShowcase />
       <ExploreProjects />  
       <FeaturedProjects />
       <HowItWorks />   
       <ExploreContractors />
       <Features />  
       <CTA /> 
       <Footer />
       <MessageIcon />
    </div>
  );
}
