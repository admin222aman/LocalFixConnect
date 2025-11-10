import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";
import BookingModal from "@/components/booking-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, MapPin, Clock, DollarSign, Phone, Mail } from "lucide-react";
import { useState } from "react";

export default function ProviderProfile() {
  const [, params] = useRoute("/provider/:id");
  const providerId = params?.id;
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const { data: provider, isLoading } = useQuery({
    queryKey: ['/api/providers', providerId],
    enabled: !!providerId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">Loading provider details...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Provider Not Found</h1>
            <p className="text-gray-600">The provider you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'PR';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Provider Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <Avatar className="w-24 h-24">
                <AvatarFallback className="text-2xl">
                  {getInitials(provider.user?.firstName, provider.user?.lastName)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-provider-name">
                      {provider.user?.firstName} {provider.user?.lastName}
                    </h1>
                    <p className="text-xl text-gray-600 mb-4" data-testid="text-provider-specialty">
                      {provider.specialty}
                    </p>
                    
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold" data-testid="text-provider-rating">
                          {Number(provider.rating).toFixed(1)}
                        </span>
                        <span className="text-gray-600">
                          ({provider.reviewCount} reviews)
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span data-testid="text-provider-location">{provider.location}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={provider.isAvailable ? "default" : "secondary"}>
                        {provider.isAvailable ? "Available" : "Unavailable"}
                      </Badge>
                      {provider.isApproved && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600 mb-2" data-testid="text-provider-rate">
                      ${Number(provider.hourlyRate).toFixed(0)}/hr
                    </div>
                    <Button 
                      onClick={() => setIsBookingModalOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={!provider.isAvailable}
                      data-testid="button-book-provider"
                    >
                      Book Now
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700" data-testid="text-provider-description">
                  {provider.description || "No description provided."}
                </p>
              </CardContent>
            </Card>

            {/* Experience & Certifications */}
            <Card>
              <CardHeader>
                <CardTitle>Experience & Qualifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {provider.yearsExperience && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <span>{provider.yearsExperience} years of experience</span>
                  </div>
                )}
                
                {provider.certifications && provider.certifications.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Certifications</h4>
                    <div className="flex flex-wrap gap-2">
                      {provider.certifications.map((cert: string, index: number) => (
                        <Badge key={index} variant="outline">{cert}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                {provider.reviews && provider.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {provider.reviews.map((review: any) => (
                      <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-gray-700">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No reviews yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {provider.user?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{provider.user.email}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">Starting at ${Number(provider.hourlyRate).toFixed(0)}/hour</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">Services {provider.location}</span>
                </div>
              </CardContent>
            </Card>

            {/* Service Area */}
            <Card>
              <CardHeader>
                <CardTitle>Service Area</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Serves within {provider.serviceRadius || 25} miles of {provider.location}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        provider={provider}
      />
    </div>
  );
}
