"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Search, 
  MapPin, 
  ChevronDown,
  Hammer,
  Wrench,
  Home,
  Settings,
  Paintbrush,
  TreePine,
  Building,
  Trash2,
  Ruler,
  Square,
  Hexagon
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { PROJECT_TYPE_VALUES } from "@/utils/constants";

// Project type icon mapping
const PROJECT_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "New Build": Building,
  "Renovation": Hammer,
  "Repair": Wrench,
  "Addition": Home,
  "Demolition": Trash2,
  "Landscaping": TreePine,
  "Specialty": Settings,
  "Other": Hexagon,
};

export function AirbnbHero() {
  const { user } = useAuth();
  const [searchData, setSearchData] = useState({
    location: "",
    projectType: ""
  });
  const [showProjectTypeDropdown, setShowProjectTypeDropdown] = useState(false);
  const [stats, setStats] = useState({
    contractors: 0,
    projects: 0,
    satisfaction: 98
  });
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          setIsScrolled(scrollTop > 100);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setShowProjectTypeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchStats = async () => {
    try {
      const supabase = createClient();
      
      // Get contractor count
      const { count: contractorCount } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("user_role", "contractor")
        .eq("is_active", true)
        .eq("is_verified_contractor", true);

      // Get completed projects count
      const { count: projectCount } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("status", "Completed");

      setStats({
        contractors: contractorCount || 0,
        projects: projectCount || 0,
        satisfaction: 98 // Keep static for now
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleSearch = () => {
    // Build search query parameters
    const searchParams = new URLSearchParams();
    
    if (searchData.location) searchParams.set('location', searchData.location);
    if (searchData.projectType) searchParams.set('projectType', searchData.projectType);
    
    // Navigate to search results page
    const searchUrl = `/search?${searchParams.toString()}`;
    window.location.href = searchUrl;
  };

  return (
    <>
      {/* Main Hero Section */}
      <div className="relative z-30 bg-gray-50 pb-4">
        {/* Hero Content */}
        <div className="w-full px-4 sm:px-6 lg:px-8 py-1 pt-3">
          {/* Desktop Search Bar */}
          <div className={`hidden lg:block w-full max-w-6xl mx-auto transition-all duration-500 ease-in-out transform-gpu ${
            isScrolled ? 'max-w-xl scale-90' : 'max-w-6xl scale-100'
          }`}>
            <div className={`bg-white shadow-lg border border-gray-200 flex flex-row items-center transition-all duration-500 ease-in-out transform-gpu ${
              isScrolled ? 'p-1.5 shadow-md rounded-full h-12' : 'p-2 shadow-lg rounded-4xl'
            }`}>
              {/* Project Type */}
              <div className={`relative flex-1 border-r border-gray-200 transition-all duration-500 ease-in-out transform-gpu ${
                isScrolled ? 'px-2 py-1' : 'p-4'
              }`}>
                <div className="flex items-center space-x-2">
                  <div className={`text-gray-400 ${isScrolled ? 'text-lg' : 'text-xl'}`}>🏠</div>
                  <div className={`relative w-full dropdown-container ${isScrolled ? 'flex-1' : ''}`}>
                    {!isScrolled && (
                      <label className="font-medium text-gray-900 block text-xs">Project Type</label>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowProjectTypeDropdown(!showProjectTypeDropdown)}
                      className={`w-full text-left text-gray-900 placeholder-gray-500 border-0 outline-none text-sm flex items-center justify-between ${
                        isScrolled ? 'bg-transparent' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {searchData.projectType && PROJECT_TYPE_ICONS[searchData.projectType] ? (() => {
                          const IconComponent = PROJECT_TYPE_ICONS[searchData.projectType];
                          return <IconComponent className="w-4 h-4 text-gray-500" />;
                        })() : null}
                        <span className={searchData.projectType ? "text-gray-900" : "text-gray-500"}>
                          {isScrolled 
                            ? (searchData.projectType || "What") 
                            : (searchData.projectType || "Select project type")
                          }
                        </span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                    {showProjectTypeDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[60] max-h-60 overflow-y-auto">
                        {PROJECT_TYPE_VALUES.map((type) => {
                          const IconComponent = PROJECT_TYPE_ICONS[type];
                          return (
                            <button
                              key={type}
                              type="button"
                              onClick={() => {
                                setSearchData({...searchData, projectType: type});
                                setShowProjectTypeDropdown(false);
                              }}
                              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 text-gray-900 flex items-center space-x-3"
                            >
                              <IconComponent className="w-4 h-4 text-gray-500" />
                              <span>{type}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className={`flex-1 border-r border-gray-200 transition-all duration-500 ease-in-out transform-gpu ${
                isScrolled ? 'px-2 py-1' : 'p-4'
              }`}>
                <div className="flex items-center space-x-2">
                  <MapPin className={`text-gray-400 ${isScrolled ? 'w-4 h-4' : 'w-5 h-5'}`} />
                  {isScrolled ? (
                    <input
                      type="text"
                      placeholder="Where"
                      value={searchData.location}
                      onChange={(e) => setSearchData({...searchData, location: e.target.value})}
                      className="flex-1 text-gray-900 placeholder-gray-500 border-0 outline-none text-sm bg-transparent"
                    />
                  ) : (
                    <div className="flex-1">
                      <label className="font-medium text-gray-900 block text-xs">Where</label>
                      <input
                        type="text"
                        placeholder="Search locations"
                        value={searchData.location}
                        onChange={(e) => setSearchData({...searchData, location: e.target.value})}
                        className="w-full text-gray-900 placeholder-gray-500 border-0 outline-none text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Search Button */}
              <div className={`transition-all duration-500 ease-in-out transform-gpu ${
                isScrolled ? 'p-1' : 'p-2'
              }`}>
                <Button
                  onClick={handleSearch}
                  className="w-10 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center p-0"
                >
                  <Search className={isScrolled ? "w-5 h-5" : "w-4 h-4"} />
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="lg:hidden w-full max-w-6xl mx-auto">
            <div className="bg-white shadow-lg border border-gray-200 rounded-2xl p-4">
              <Dialog>
                <DialogTrigger asChild>
                  <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <Search className="w-5 h-5 text-gray-500" />
                      <div className="text-left">
                        <div className="text-sm font-medium text-gray-900">
                          {searchData.projectType || "Any project type"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {searchData.location || "Any location"}
                        </div>
                      </div>
                    </div>
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Search Projects</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    {/* Project Type Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Project Type</label>
                      <div className="relative dropdown-container">
                        <button
                          type="button"
                          onClick={() => setShowProjectTypeDropdown(!showProjectTypeDropdown)}
                          className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            {searchData.projectType && PROJECT_TYPE_ICONS[searchData.projectType] ? (() => {
                              const IconComponent = PROJECT_TYPE_ICONS[searchData.projectType];
                              return <IconComponent className="w-5 h-5 text-gray-500" />;
                            })() : null}
                            <span className={searchData.projectType ? "text-gray-900" : "text-gray-500"}>
                              {searchData.projectType || "Select project type"}
                            </span>
                          </div>
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        </button>
                        {showProjectTypeDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-[60] max-h-60 overflow-y-auto">
                            {PROJECT_TYPE_VALUES.map((type) => {
                              const IconComponent = PROJECT_TYPE_ICONS[type];
                              return (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => {
                                    setSearchData({...searchData, projectType: type});
                                    setShowProjectTypeDropdown(false);
                                  }}
                                  className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 text-gray-900 flex items-center space-x-3"
                                >
                                  <IconComponent className="w-5 h-5 text-gray-500" />
                                  <span>{type}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Location Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search locations"
                          value={searchData.location}
                          onChange={(e) => setSearchData({...searchData, location: e.target.value})}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Search Button */}
                    <Button
                      onClick={handleSearch}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-medium"
                    >
                      <Search className="w-5 h-5 mr-2" />
                      Search Projects
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>


      {/* Sticky Search Bar - Only shows when scrolled on desktop */}
      {isScrolled && (
        <div className="hidden lg:block fixed top-16 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-3">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white shadow-lg border border-gray-200 flex flex-row items-center rounded-full h-12 p-1.5">
                {/* Location */}
                <div className="flex-1 border-r border-gray-200 px-2 py-1">
                  <div className="flex items-center space-x-2">
                    <MapPin className="text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Where"
                      value={searchData.location}
                      onChange={(e) => setSearchData({...searchData, location: e.target.value})}
                      className="flex-1 text-gray-900 placeholder-gray-500 border-0 outline-none text-sm bg-transparent"
                    />
                  </div>
                </div>

                {/* Project Type */}
                <div className="relative flex-1 border-r border-gray-200 px-2 py-1">
                  <div className="flex items-center space-x-2">
                    <div className="text-gray-400 text-lg">🏠</div>
                    <div className="relative w-full dropdown-container flex-1">
                      <button
                        type="button"
                        onClick={() => setShowProjectTypeDropdown(!showProjectTypeDropdown)}
                        className="w-full text-left text-gray-900 placeholder-gray-500 border-0 outline-none text-sm flex items-center justify-between bg-transparent"
                      >
                        <div className="flex items-center space-x-2">
                          {searchData.projectType && PROJECT_TYPE_ICONS[searchData.projectType] ? (() => {
                            const IconComponent = PROJECT_TYPE_ICONS[searchData.projectType];
                            return <IconComponent className="w-4 h-4 text-gray-500" />;
                          })() : null}
                          <span className={searchData.projectType ? "text-gray-900" : "text-gray-500"}>
                            {searchData.projectType || "What"}
                          </span>
                        </div>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </button>
                      {showProjectTypeDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[60] max-h-60 overflow-y-auto">
                          {PROJECT_TYPE_VALUES.map((type) => {
                            const IconComponent = PROJECT_TYPE_ICONS[type];
                            return (
                              <button
                                key={type}
                                type="button"
                                onClick={() => {
                                  setSearchData({...searchData, projectType: type});
                                  setShowProjectTypeDropdown(false);
                                }}
                                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 text-gray-900 flex items-center space-x-3"
                              >
                                <IconComponent className="w-4 h-4 text-gray-500" />
                                <span>{type}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Search Button */}
                <div className="p-1">
                  <Button
                    onClick={handleSearch}
                    className="w-10 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center p-0"
                  >
                    <Search className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
