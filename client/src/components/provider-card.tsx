import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, MapPin } from "lucide-react";
import { Link } from "wouter";

interface ProviderCardProps {
  provider: {
    id: string;
    specialty: string;
    description: string;
    location: string;
    hourlyRate: string;
    rating: string;
    reviewCount: number;
    isAvailable: boolean;
    isApproved: boolean;
    categories?: string[]; // Added categories field
    user?: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  onBook: () => void;
}

export default function ProviderCard({ provider, onBook }: ProviderCardProps) {
  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'PR';
  };

  return (
    <Card className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow" data-testid={`provider-card-${provider.id}`}>
      <div className="w-full h-48 bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center">
        <Avatar className="w-20 h-20">
          <AvatarFallback className="text-2xl bg-blue-600 text-white">
            {getInitials(provider.user?.firstName, provider.user?.lastName)}
          </AvatarFallback>
        </Avatar>
      </div>

      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900" data-testid={`provider-name-${provider.id}`}>
              {provider.user?.firstName} {provider.user?.lastName}
            </h3>
            <p className="text-gray-600 text-sm" data-testid={`provider-specialty-${provider.id}`}>
              {provider.specialty}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center text-yellow-500 mb-1">
              <span className="text-sm font-medium text-gray-900 mr-1" data-testid={`provider-rating-${provider.id}`}>
                {Number(provider.rating).toFixed(1)}
              </span>
              <Star className="w-4 h-4 fill-current" />
            </div>
            <p className="text-xs text-gray-500" data-testid={`provider-reviews-${provider.id}`}>
              {provider.reviewCount} reviews
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <MapPin className="w-4 h-4" />
            <span>{provider.location}</span>
          </div>

          {provider.categories && provider.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {provider.categories.slice(0, 3).map((category: string) => (
                <Badge key={category} variant="secondary" className="text-xs">
                  {category}
                </Badge>
              ))}
              {provider.categories.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{provider.categories.length - 3} more
                </Badge>
              )}
            </div>
          )}

        <p className="text-gray-600 text-sm mb-4" data-testid={`provider-description-${provider.id}`}>
          {provider.description?.substring(0, 120)}...
        </p>

        <div className="flex items-center gap-2 mb-4">
          <Badge variant={provider.isAvailable ? "default" : "secondary"}>
            {provider.isAvailable ? "Available" : "Unavailable"}
          </Badge>
          {provider.isApproved && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              Verified
            </Badge>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="text-lg font-semibold text-gray-900">
            Starting at <span className="text-blue-600" data-testid={`provider-rate-${provider.id}`}>
              ${Number(provider.hourlyRate).toFixed(0)}/hr
            </span>
          </div>
          <div className="flex gap-2">
            <Link to={`/provider/${provider.id}`}>
              <Button variant="outline" size="sm" data-testid={`button-view-${provider.id}`}>
                View Profile
              </Button>
            </Link>
            <Button 
              onClick={onBook}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
              disabled={!provider.isAvailable}
              data-testid={`button-book-${provider.id}`}
            >
              Book Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}