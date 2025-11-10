import Header from "@/components/header";
import Footer from "@/components/footer";
import ServiceCard from "@/components/service-card";
import ProviderCard from "@/components/provider-card";
import BookingModal from "@/components/booking-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useLocation } from "wouter";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [, navigate] = useLocation();

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  const { data: providers = [] } = useQuery({
    queryKey: ['/api/providers'],
    select: (data) => data.filter((p: any) => p.isApproved).slice(0, 3), // Featured providers
  });

  const handleSearch = () => {
    console.log('Search:', { searchQuery, location: locationInput });
    
    // Navigate to services page with search parameters
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim());
    }
    if (locationInput.trim()) {
      params.set('location', locationInput.trim());
    }
    
    const searchUrl = params.toString() ? `/services?${params.toString()}` : '/services';
    navigate(searchUrl);
  };

  const handleBookProvider = (provider: any) => {
    setSelectedProvider(provider);
    setIsBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-blue-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Find Trusted Local <br />
            <span className="text-blue-600">Service Professionals</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect with skilled electricians, plumbers, carpenters, and more in your area. Get quality work done with confidence.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4 bg-white p-2 rounded-xl shadow-lg">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="What service do you need?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-0 focus-visible:ring-0 text-gray-700 bg-transparent"
                  data-testid="input-search-service"
                />
              </div>
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Enter your location"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  className="border-0 border-l sm:border-l border-gray-200 focus-visible:ring-0 text-gray-700 bg-transparent"
                  data-testid="input-location"
                />
              </div>
              <Button 
                onClick={handleSearch}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                data-testid="button-search"
              >
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Popular Service Categories</h2>
            <p className="text-lg text-gray-600">Find the right professional for your needs</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((category: any) => (
              <ServiceCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Providers */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Service Providers</h2>
            <p className="text-lg text-gray-600">Highly rated professionals in your area</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {providers.map((provider: any) => (
              <ProviderCard 
                key={provider.id} 
                provider={provider} 
                onBook={() => handleBookProvider(provider)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How LocalFix Works</h2>
            <p className="text-lg text-gray-600">Get quality service in three simple steps</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Search & Compare</h3>
              <p className="text-gray-600">Browse service categories and compare qualified professionals in your area based on reviews, ratings, and availability.</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Book & Schedule</h3>
              <p className="text-gray-600">Select your preferred provider and book an appointment that fits your schedule. Get instant confirmation and provider contact details.</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Get Quality Service</h3>
              <p className="text-gray-600">Meet your professional at the scheduled time and enjoy quality service. Leave a review to help other customers make informed decisions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Provider Call to Action */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Are You a Service Professional?</h2>
          <p className="text-xl mb-8 text-blue-100">Join thousands of professionals growing their business with LocalFix</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 mb-4 text-blue-200">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Expand Your Reach</h3>
              <p className="text-blue-100 text-sm">Connect with new customers in your area</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 mb-4 text-blue-200">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4l2 2 4-4m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Manage Your Business</h3>
              <p className="text-blue-100 text-sm">Easy booking and schedule management</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 mb-4 text-blue-200">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Grow Your Income</h3>
              <p className="text-blue-100 text-sm">Set your own rates and increase bookings</p>
            </div>
          </div>
          <div className="space-y-4 sm:space-y-0 sm:flex sm:space-x-4 sm:justify-center">
            <Link to="/provider-panel">
              <Button className="w-full sm:w-auto bg-white text-blue-600 px-8 py-3 hover:bg-gray-50" data-testid="button-join-provider">
                Join as a Provider
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="w-full sm:w-auto border-2 border-white text-white px-8 py-3 bg-transparent hover:bg-white hover:text-blue-600"
              data-testid="button-learn-more"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      <Footer />

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        provider={selectedProvider}
      />
    </div>
  );
}
