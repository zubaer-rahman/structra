import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Home, Users, Award } from "lucide-react";
import Link from "next/link";

export function ImageShowcase() {
  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-white to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
            Transform Your Vision Into Reality
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl sm:max-w-4xl mx-auto px-4">
            Discover how Structra connects homeowners with skilled contractors to bring construction dreams to life
          </p>
        </div>

        <div className="space-y-8">
          {/* Image 1 - Dream Projects */}
          <div className="relative group overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500">
            <div className="relative h-96 sm:h-[500px] lg:h-[600px] flex">
              <div className="flex-1">
                <Image
                  src="/images/landing/landing1.png"
                  alt="Beautiful home construction project"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-black/70" />
              
              {/* Motivational Text - Right Side (Mobile Only) */}
              <div className="absolute right-[31px] top-1/2 transform -translate-y-1/2 sm:hidden">
                <div className="text-white font-black text-xl leading-tight tracking-wider drop-shadow-2xl">
                  <span className="block bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">DREAM</span>
                  <span className="block text-white">HOME</span>
                </div>
              </div>
              
              {/* Text Overlay - Right Side */}
              <div className="absolute right-0 top-0 bottom-0 w-full sm:w-1/2 lg:w-2/5 p-6 sm:p-8 text-white flex flex-col justify-end sm:justify-center items-end sm:items-start">
                <div className="hidden sm:flex items-center mb-3">
                  <Home className="w-6 h-6 mr-2 text-orange-400" />
                  <span className="text-sm font-medium text-orange-400 uppercase tracking-wide">Dream Projects</span>
                </div>
                <h3 className="hidden sm:block text-xl sm:text-2xl lg:text-3xl font-bold mb-3 leading-tight">
                  Turn Your Vision Into Your Dream Home
                </h3>
                <p className="hidden sm:block text-sm sm:text-base text-gray-200 mb-4 leading-relaxed">
                  From concept to completion, connect with verified contractors who understand your vision and deliver exceptional results.
                </p>
                <Link href="/register">
                  <Button 
                    size="sm" 
                    className="bg-orange-600 hover:bg-orange-700 text-white border-0 group/btn w-fit"
                  >
                    Start Building
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Image 2 - Expert Contractors */}
          {/* 
          <div className="relative group overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500">
            <div className="relative h-96 sm:h-[500px] lg:h-[600px] flex">
              <div className="flex-1">
                <Image
                  src="/images/landing/landing2.png"
                  alt="Professional contractors at work"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  style={{ objectPosition: 'center calc(30% + 100px)' }}
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-black/70" />
              
              {/* Motivational Text - Right Side (Mobile Only) */}
              {/* 
              <div className="absolute right-[41px] top-1/2 transform -translate-y-1/2 sm:hidden">
                <div className="text-white font-black text-xl leading-tight tracking-wider drop-shadow-2xl">
                  <span className="block text-white">EXPERT</span>
                  <span className="block text-white">TEAM</span>
                </div>
              </div>
              */}
              
              {/* Text Overlay - Right Side */}
              {/* 
              <div className="absolute right-0 top-0 bottom-0 w-full sm:w-1/2 lg:w-2/5 p-6 sm:p-8 text-white flex flex-col justify-end sm:justify-center items-end sm:items-start">
                <div className="hidden sm:flex items-center mb-3">
                  <Users className="w-6 h-6 mr-2 text-blue-400" />
                  <span className="text-sm font-medium text-white uppercase tracking-wide">Expert Network</span>
                </div>
                <h3 className="hidden sm:block text-xl sm:text-2xl lg:text-3xl font-bold mb-3 leading-tight">
                  Work With Verified Professionals
                </h3>
                <p className="hidden sm:block text-sm sm:text-base text-gray-200 mb-4 leading-relaxed">
                  Access a curated network of licensed, insured, and highly-rated contractors ready to bring expertise to your project.
                </p>
                <Link href="/register">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-gray-900 group/btn w-fit bg-black/20 sm:bg-transparent"
                  >
                    Browse Projects
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          */}

          {/* Image 3 - Quality Results */}
          {/* 
          <div className="relative group overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500">
            <div className="relative h-96 sm:h-[500px] lg:h-[600px] flex">
              <div className="flex-1">
                <Image
                  src="/images/landing/landing3.png"
                  alt="Completed quality construction project"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-black/70" />
              
              {/* Motivational Text - Right Side (Mobile Only) */}
              {/* 
              <div className="absolute right-[31px] top-1/2 transform -translate-y-1/2 sm:hidden">
                <div className="text-white font-black text-xl leading-tight tracking-wider drop-shadow-2xl">
                  <span className="block bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">QUALITY</span>
                  <span className="block text-white">WORK</span>
                </div>
              </div>
              */}
              
              {/* Text Overlay - Right Side */}
              {/* 
              <div className="absolute right-[30px] sm:right-[90px] top-0 bottom-0 w-full sm:w-1/2 lg:w-2/5 p-6 sm:p-8 text-white flex flex-col justify-end sm:justify-center items-end sm:items-start">
                <div className="hidden sm:flex items-center mb-3">
                  <Award className="w-6 h-6 mr-2 text-green-400" />
                  <span className="text-sm font-medium text-green-400 uppercase tracking-wide">Quality Results</span>
                </div>
                <h3 className="hidden sm:block text-xl sm:text-2xl lg:text-3xl font-bold mb-3 leading-tight">
                  Exceptional Results, Every Time
                </h3>
                <p className="hidden sm:block text-sm sm:text-base text-gray-200 mb-4 leading-relaxed">
                  Experience the satisfaction of projects completed on time, within budget, and exceeding expectations.
                </p>
                <div className="text-right sm:text-left">
                  <Link href="/register">
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700 text-white border-0 group/btn w-fit"
                    >
                      Get Started
                      <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          */}
        </div>


      </div>
    </section>
  );
}