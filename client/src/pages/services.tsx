
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ProviderCard from "@/components/provider-card";
import BookingModal from "@/components/booking-modal";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Wrench, Hammer, Wind, Home, Leaf, Paintbrush, Sparkles } from "lucide-react";

export default function Services() {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [location] = useLocation();

  // Extract search parameters from URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    const locationParam = urlParams.get('location');
    const categoryParam = urlParams.get('category');

    if (searchParam) {
      setSearchQuery(searchParam);
    }
    if (locationParam) {
      setLocationFilter(locationParam);
    }
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [location]);

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['/api/providers'],
    select: (data) => {
      return data.filter((p: any) => p.isApproved);
    },
  });

  // Create maps for category lookups
  const categoryIdToName: { [key: string]: string } = {};
  const categoryNameToId: { [key: string]: string } = {};
  
  categories.forEach((cat: any) => {
    categoryIdToName[cat.id] = cat.name;
    categoryNameToId[cat.name] = cat.id;
  });

  // Filter providers based on search criteria
  const filteredProviders = providers.filter((provider: any) => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        provider.specialty?.toLowerCase().includes(searchLower) ||
        provider.description?.toLowerCase().includes(searchLower) ||
        provider.user?.firstName?.toLowerCase().includes(searchLower) ||
        provider.user?.lastName?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // Location filter
    if (locationFilter) {
      const locationLower = locationFilter.toLowerCase();
      const matchesLocation = provider.location?.toLowerCase().includes(locationLower);
      
      if (!matchesLocation) return false;
    }

    // Category filter
    if (selectedCategory && provider.categories && Array.isArray(provider.categories)) {
      // Get the selected category name from ID
      const selectedCategoryName = categoryIdToName[selectedCategory];
      
      if (!selectedCategoryName) return false;
      
      // Check if provider categories contain the selected category
      const hasCategory = provider.categories.some((providerCat: string) => {
        // If provider category is a UUID, convert to name and compare
        if (categoryIdToName[providerCat]) {
          return categoryIdToName[providerCat] === selectedCategoryName;
        }
        // If provider category is already a name, compare directly
        return providerCat === selectedCategoryName;
      });
      
      if (!hasCategory) return false;
    }

    return true;
  });

  const handleBookProvider = (provider: any) => {
    setSelectedProvider(provider);
    setIsBookingModalOpen(true);
  };

  // Map for category icons
  const iconMap: { [key: string]: React.ElementType } = {
    'Electrical': Zap,
    'Plumbing': Wrench,
    'Carpentry': Hammer,
    'HVAC': Wind,
    'General Contracting': Home,
    'Landscaping': Leaf,
    'Painting': Paintbrush,
    'Cleaning Services': Sparkles,
  };

  const getCategoryIcon = (name: string) => {
    return iconMap[name] || Sparkles;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Browse Service Providers</h1>
          <p className="text-lg text-gray-600">Find qualified professionals for your project needs</p>
        </div>

        {/* Category Filter Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Browse by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                selectedCategory === null 
                  ? "bg-blue-600 text-white border-blue-600 shadow-lg" 
                  : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:shadow-md"
              }`}
              data-testid="button-category-all"
            >
              <div className="flex flex-col items-center space-y-2">
                <div className={`p-2 rounded-lg ${selectedCategory === null ? "bg-white/20" : "bg-gray-100"}`}>
                  <Home className={`h-6 w-6 ${selectedCategory === null ? "text-white" : "text-gray-600"}`} />
                </div>
                <span className="text-sm font-medium">All Categories</span>
              </div>
            </button>
            {categories.map((category: any) => {
              const IconComponent = getCategoryIcon(category.name);
              const isSelected = selectedCategory === category.id;

              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600 shadow-lg" 
                      : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:shadow-md"
                  }`}
                  data-testid={`button-category-${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className={`p-2 rounded-lg ${isSelected ? "bg-white/20" : "bg-gray-100"}`}>
                      <IconComponent className={`h-6 w-6 ${isSelected ? "text-white" : "text-gray-600"}`} />
                    </div>
                    <span className="text-sm font-medium text-center">{category.name}</span>
                    {category.description && (
                      <span className={`text-xs text-center ${isSelected ? "text-white/80" : "text-gray-500"}`}>
                        {category.description}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Advanced Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Services
                </label>
                <Input
                  type="text"
                  placeholder="e.g., electrical, plumbing"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-services"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <Input
                  type="text"
                  placeholder="Enter location"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  data-testid="input-location-filter"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <Select>
                  <SelectTrigger data-testid="select-sort">
                    <SelectValue placeholder="Select sorting" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="reviews">Most Reviews</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-600">Loading providers...</div>
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-600 mb-4">No providers found matching your criteria</div>
            <p className="text-sm text-gray-500">Try adjusting your search filters</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex justify-between items-center">
              <span className="text-gray-600">
                {filteredProviders.length} provider{filteredProviders.length !== 1 ? 's' : ''} found
                {selectedCategory && (
                  <span> in {categories.find((cat: any) => cat.id === selectedCategory)?.name}</span>
                )}
              </span>
              {(searchQuery || locationFilter || selectedCategory) && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setLocationFilter("");
                    setSelectedCategory(null);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                  data-testid="button-clear-filters"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProviders.map((provider: any) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  onBook={() => handleBookProvider(provider)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <Footer />

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        provider={selectedProvider}
      />
    </div>
  );
}
