"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Calendar, Building2, Eye, DollarSign, CheckCircle, Clock, Filter, List, Map, Home, Wrench, Hammer, Paintbrush, TreePine, Trash2, Plus, Settings } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/shared/navbar";
import { PROJECT_TYPE_VALUES } from "@/utils/constants";
import ProjectMapView from "@/components/features/landing/ProjectMapView";

interface Project {
  id: string;
  project_title: string;
  statement_of_work: string;
  budget: number;
  category: string[];
  location: {
    city: string;
    province: string;
    address: string;
    latitude?: number;
    longitude?: number;
  };
  project_type: string;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
  project_photos: any[];
  after_photo?: any[];
  creator: string;
  slug: string;
  homeowner: {
    id: string;
    full_name: string;
    profile_photo: string;
  };
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    location: searchParams.get('location') || '',
    projectType: searchParams.get('projectType') || ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([43.6532, -79.3832]); // Default to Toronto
  const [isClient, setIsClient] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 5;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update filters when URL parameters change
  useEffect(() => {
    const location = searchParams.get('location') || '';
    const projectType = searchParams.get('projectType') || '';
    
    console.log('URL Parameters:', { location, projectType });
    
    setFilters({
      location,
      projectType
    });
  }, [searchParams]);

  // Fetch projects when URL parameters change
  useEffect(() => {
    if (isClient) {
      fetchProjects();
    }
  }, [searchParams, isClient]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setCurrentPage(1); // Reset to first page when new search
      
      // Build query parameters from current URL params
      const urlParams = new URLSearchParams();
      const location = searchParams.get('location') || '';
      const projectType = searchParams.get('projectType') || '';
      
      if (location) urlParams.set('location', location);
      if (projectType) urlParams.set('projectType', projectType);

      console.log('Fetching projects with URL params:', { location, projectType });
      console.log('Current filters state:', filters);
      
      const response = await fetch(`/api/search/projects?${urlParams.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch projects');
      }

      const data = await response.json();
      console.log('Projects data:', data);
      const projectsData = data.projects || [];
      setProjects(projectsData);
      
      // Update map center based on first project location
      if (projectsData.length > 0 && projectsData[0].location?.latitude && projectsData[0].location?.longitude) {
        setMapCenter([projectsData[0].location.latitude, projectsData[0].location.longitude]);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectsWithFilters = async (searchFilters: { location: string; projectType: string }) => {
    try {
      setLoading(true);
      setCurrentPage(1); // Reset to first page when new search
      
      // Build query parameters from provided filters
      const urlParams = new URLSearchParams();
      
      if (searchFilters.location.trim()) urlParams.set('location', searchFilters.location.trim());
      if (searchFilters.projectType.trim()) urlParams.set('projectType', searchFilters.projectType.trim());

      console.log('Fetching projects with filters:', searchFilters);
      
      const response = await fetch(`/api/search/projects?${urlParams.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch projects');
      }

      const data = await response.json();
      console.log('Projects data:', data);
      const projectsData = data.projects || [];
      setProjects(projectsData);
      
      // Update map center based on first project location
      if (projectsData.length > 0 && projectsData[0].location?.latitude && projectsData[0].location?.longitude) {
        setMapCenter([projectsData[0].location.latitude, projectsData[0].location.longitude]);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      location: '',
      projectType: ''
    });
    // Update URL to remove filters
    router.push('/search');
  };

  const handleSearch = () => {
    // Update URL with current filter values
    const searchParams = new URLSearchParams();
    
    if (filters.location.trim()) {
      searchParams.set('location', filters.location.trim());
    }
    
    if (filters.projectType.trim()) {
      searchParams.set('projectType', filters.projectType.trim());
    }
    
    // Build the new URL
    const newUrl = `/search?${searchParams.toString()}`;
    
    // Navigate to the new URL
    router.push(newUrl);
    
    // Also fetch projects with current filters immediately
    fetchProjectsWithFilters(filters);
  };

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    // Update map center to selected project
    if (project.location?.latitude && project.location?.longitude) {
      setMapCenter([project.location.latitude, project.location.longitude]);
    }
  };

  const handleProjectView = (project: Project) => {
    if (project.status === 'Open for Proposals') {
      // For open projects, show blurred gallery
      window.open(`/recent-project-preview/${project.slug || project.id}`, '_blank');
    } else {
      // For completed projects, show full details
      window.open(`/new-project-view/${project.slug || project.id}`, '_blank');
    }
  };

  const formatBudget = (budget: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(budget);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Pagination logic
  const totalPages = Math.ceil(projects.length / projectsPerPage);
  const startIndex = (currentPage - 1) * projectsPerPage;
  const endIndex = startIndex + projectsPerPage;
  const currentProjects = projects.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of sidebar when page changes
    const sidebar = document.querySelector('.project-sidebar');
    if (sidebar) {
      sidebar.scrollTop = 0;
    }
  };

  // Helper function to get project type icon
  const getProjectTypeIcon = (projectType: string) => {
    switch (projectType) {
      case 'New Build':
        return <Home className="w-3 h-3" />
      case 'Renovation':
        return <Wrench className="w-3 h-3" />
      case 'Repair':
        return <Hammer className="w-3 h-3" />
      case 'Addition':
        return <Plus className="w-3 h-3" />
      case 'Demolition':
        return <Trash2 className="w-3 h-3" />
      case 'Landscaping':
        return <TreePine className="w-3 h-3" />
      case 'Specialty':
        return <Settings className="w-3 h-3" />
      default:
        return <Building2 className="w-3 h-3" />
    }
  }

  // Helper function to safely get image URL from various formats
  const getProjectImage = (project: Project): string => {
    // Helper function to safely get image URL from various formats
    const getImageUrl = (imageData: any): string | null => {
      if (!imageData) return null;
      
      // If it's already a string
      if (typeof imageData === 'string' && imageData.trim() !== '') {
        return imageData;
      }
      
      // If it's an object with url property
      if (typeof imageData === 'object' && imageData.url && typeof imageData.url === 'string' && imageData.url.trim() !== '') {
        return imageData.url;
      }
      
      // If it's an object with src property
      if (typeof imageData === 'object' && imageData.src && typeof imageData.src === 'string' && imageData.src.trim() !== '') {
        return imageData.src;
      }
      
      return null;
    };

    // Check for valid after photo
    if (project.after_photo && Array.isArray(project.after_photo) && project.after_photo.length > 0) {
      const imageUrl = getImageUrl(project.after_photo[0]);
      if (imageUrl) return imageUrl;
    }
    
    // Check for valid project photos
    if (project.project_photos && Array.isArray(project.project_photos) && project.project_photos.length > 0) {
      const imageUrl = getImageUrl(project.project_photos[0]);
      if (imageUrl) return imageUrl;
    }
    
    return "/images/placeholder-image.png";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex-1 px-4 sm:px-6 lg:px-8 pt-20 pb-6">
        <div className="w-full max-w-7xl mx-auto flex flex-col h-full">

          {/* Search Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 relative z-30">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-gray-400 focus-within:border-gray-400 transition-all">
                <MapPin className="text-gray-400 w-5 h-5 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search locations (e.g., Toronto, ON)"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  className="flex-1 text-sm text-gray-900 placeholder-gray-500 border-0 outline-none bg-transparent"
                />
              </div>

              <div className="flex-1 relative" ref={dropdownRef}>
                <div 
                  className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 hover:border-gray-300 transition-all focus-within:ring-2 focus-within:ring-gray-400 focus-within:border-gray-400"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <Wrench className="text-gray-400 w-5 h-5 flex-shrink-0" />
                  <span className="flex-1 text-sm text-gray-900 truncate">
                    {filters.projectType || "All project types"}
                  </span>
                  <svg 
                    className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                    <div 
                      className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                      onClick={() => {
                        handleFilterChange('projectType', '');
                        setIsDropdownOpen(false);
                      }}
                    >
                      <Wrench className="text-gray-400 w-4 h-4" />
                      <span className="text-sm text-gray-900">All project types</span>
                    </div>
                    {PROJECT_TYPE_VALUES.map((type) => (
                      <div 
                        key={type}
                        className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          handleFilterChange('projectType', type);
                          setIsDropdownOpen(false);
                        }}
                      >
                        {getProjectTypeIcon(type)}
                        <span className="text-sm text-gray-900">{type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={handleSearch}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 text-sm font-medium rounded-lg transition-colors flex items-center justify-center space-x-2 min-w-[120px]"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </Button>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 flex flex-col min-h-0">
            {loading ? (
              <div className="flex-1 flex justify-center items-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-gray-600 mx-auto mb-4"></div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Searching projects...</h3>
                  <p className="text-gray-500">Finding the best matches for your criteria</p>
                </div>
              </div>
            ) : projects.length === 0 ? (
              <div className="flex-1 flex justify-center items-center py-16">
                <div className="text-center max-w-md">
                  <div className="flex justify-center mb-6">
                    <div className="p-6 bg-gray-100 rounded-full">
                      <Building2 className="h-16 w-16 text-gray-400" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">No projects found</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    We couldn't find any projects matching your search criteria. 
                    Try adjusting your location or project type filters.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      onClick={clearFilters} 
                      variant="outline" 
                      className="flex items-center space-x-2 px-6 py-3"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Clear filters</span>
                    </Button>
                    <Button 
                      onClick={() => fetchProjectsWithFilters(filters)} 
                      className="flex items-center space-x-2 px-6 py-3"
                    >
                      <Search className="w-4 h-4" />
                      <span>Search again</span>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-0">
              {/* Left Sidebar - Project List */}
              <div className="xl:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full max-w-md xl:max-w-none">
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <List className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Projects Found
                      </h3>
                      <p className="text-sm text-gray-500">
                        {projects.length} project{projects.length !== 1 ? 's' : ''} found
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-200">
                    <Map className="w-4 h-4 text-gray-500" />
                    <p>Click on a project to view on map</p>
                  </div>
                </div>
                
                <div className="project-sidebar overflow-y-auto flex-1">
                  {currentProjects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => handleProjectClick(project)}
                      className={`p-5 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-all duration-200 group ${
                        selectedProject?.id === project.id ? 'bg-gray-50 border-l-4 border-l-gray-400' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 relative shadow-sm group-hover:shadow-md transition-shadow">
                          <Image
                            src={getProjectImage(project)}
                            alt={project.project_title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/images/placeholder-image.png";
                            }}
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <h4 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-gray-700 transition-colors">
                            {project.project_title}
                          </h4>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3 leading-relaxed">
                            {project.statement_of_work}
                          </p>
                          
                          <div className="flex items-center text-sm text-gray-500 mb-3">
                            <MapPin className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
                            <span className="font-medium truncate">
                              {project.location?.city}, {project.location?.province}
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <DollarSign className="w-4 h-4 text-gray-600 flex-shrink-0" />
                              <span className="text-lg font-bold text-gray-900 truncate">
                                {formatBudget(project.budget)}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              <span className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold ${
                                project.status === 'Completed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {project.status === 'Completed' ? (
                                  <CheckCircle className="w-3 h-3 flex-shrink-0" />
                                ) : (
                                  <Clock className="w-3 h-3 flex-shrink-0" />
                                )}
                                <span className="truncate">{project.status}</span>
                              </span>
                              <span className="flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
                                {getProjectTypeIcon(project.project_type)}
                                <span className="truncate">{project.project_type}</span>
                              </span>
                            </div>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProjectView(project);
                              }}
                              size="sm"
                              className="w-full mt-2 text-xs"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex flex-col items-center gap-3">
                      <div className="text-xs text-gray-600 font-medium text-center">
                        Showing {startIndex + 1}-{Math.min(endIndex, projects.length)} of {projects.length} projects
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-1.5 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Prev
                        </Button>
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let page;
                            if (totalPages <= 5) {
                              page = i + 1;
                            } else if (currentPage <= 3) {
                              page = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              page = totalPages - 4 + i;
                            } else {
                              page = currentPage - 2 + i;
                            }
                            
                            return (
                              <Button
                                key={page}
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(page)}
                                className={`px-2 py-1.5 min-w-[32px] text-xs font-medium ${
                                  currentPage === page 
                                    ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                                    : 'hover:bg-gray-100'
                                }`}
                              >
                                {page}
                              </Button>
                            );
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1.5 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side - Map View */}
              <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative z-10 flex flex-col h-full">
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Map className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Interactive Map</h3>
                      <p className="text-sm text-gray-500">Hover over markers for project details</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  {isClient ? (
                    <ProjectMapView
                      projects={projects}
                      selectedProject={selectedProject}
                      mapCenter={mapCenter}
                      isClient={isClient}
                      onProjectClick={handleProjectClick}
                      formatBudget={formatBudget}
                      formatDate={formatDate}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-gray-600 mx-auto mb-4"></div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Loading map...</h3>
                        <p className="text-gray-500">Initializing interactive map</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}