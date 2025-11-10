import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Star } from "lucide-react";

const bookingSchema = z.object({
  providerId: z.string().min(1, "Please select a provider"),
  serviceDescription: z.string().min(10, "Please describe the service needed (at least 10 characters)"),
  scheduledDate: z.string().min(1, "Please select a date"),
  scheduledTime: z.string().min(1, "Please select a time"),
  customerAddress: z.string().min(5, "Please provide your address"),
  estimatedDuration: z.number().min(1, "Please estimate duration"),
  notes: z.string().optional(),
});

const reviewSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  providerId: z.string().min(1, "Provider ID is required"),
  rating: z.number().min(1, "Rating is required").max(5, "Rating must be between 1 and 5"),
  comment: z.string().optional(),
});

export default function Booking() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<any>(null);

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
    meta: { suppressErrorToast: true },
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['/api/bookings'],
    enabled: !!user,
  });

  const { data: providers = [], isLoading: isLoadingProviders } = useQuery({
    queryKey: ['/api/providers'],
    enabled: !!user,
    select: (data) => {
      if (!data || !Array.isArray(data)) return [];
      return data.filter((p: any) => p && p.isApproved && p.isAvailable);
    },
  });

  const bookingForm = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      providerId: "",
      serviceDescription: "",
      scheduledDate: "",
      scheduledTime: "",
      customerAddress: "",
      estimatedDuration: 2,
      notes: "",
    },
  });

  const reviewForm = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      bookingId: "",
      providerId: "",
      rating: 5,
      comment: "",
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const bookingData = {
        providerId: data.providerId,
        serviceDescription: data.serviceDescription,
        scheduledDate: new Date(data.scheduledDate + 'T' + data.scheduledTime).toISOString(),
        scheduledTime: data.scheduledTime,
        customerAddress: data.customerAddress,
        estimatedDuration: Number(data.estimatedDuration),
        notes: data.notes || "",
      };

      const response = await apiRequest("POST", "/api/bookings", bookingData);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to create booking");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      bookingForm.reset();
      toast({
        title: "Booking Created",
        description: "Your booking request has been sent to the provider.",
      });
    },
    onError: (error: any) => {
      console.error("Booking error:", error);
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/reviews", data);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to create review");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      reviewForm.reset();
      setSelectedBookingForReview(null);
      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Review Failed",
        description: error.message || "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onCreateBooking = (data: any) => {
    createBookingMutation.mutate(data);
  };

  const onCreateReview = (data: any) => {
    createReviewMutation.mutate(data);
  };

  if (!isLoadingUser && !user) {
    setTimeout(() => setLocation('/signin'), 100);
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-md mx-auto px-4 py-12 text-center">
          <p>Redirecting to sign in...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-md mx-auto px-4 py-12 text-center">
          <p>Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600">Manage your service bookings</p>
        </div>

        <Tabs defaultValue="my-bookings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="my-bookings">My Bookings</TabsTrigger>
            <TabsTrigger value="create-booking">Book New Service</TabsTrigger>
          </TabsList>

          <TabsContent value="my-bookings">
            <Card>
              <CardHeader>
                <CardTitle>Your Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">No bookings yet</p>
                    <Button onClick={() => setLocation('/services')}>
                      Browse Services
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(bookings as any[]).map((booking: any) => (
                      <div key={booking.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">
                              {booking.provider?.user?.firstName} {booking.provider?.user?.lastName}
                            </h3>
                            <p className="text-gray-600">{booking.serviceDescription}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(booking.scheduledDate).toLocaleDateString()} at {booking.scheduledTime}
                            </p>
                            {/* Added customer phone display */}
                            <p className="text-sm text-gray-500">Phone: {booking.customerPhone}</p>
                            <p className="text-sm text-gray-500">{booking.customerAddress}</p>
                            {booking.notes && (
                              <p className="text-sm text-gray-500">Notes: {booking.notes}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant={
                                booking.status === 'confirmed' ? 'default' :
                                booking.status === 'completed' ? 'outline' :
                                booking.status === 'cancelled' ? 'destructive' :
                                'secondary'
                              }
                            >
                              {booking.status}
                            </Badge>
                          </div>
                        </div>

                        {booking.status === 'completed' && (
                          <div className="mt-3">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" onClick={() => {
                                  setSelectedBookingForReview(booking);
                                  reviewForm.setValue("bookingId", booking.id);
                                  reviewForm.setValue("providerId", booking.providerId);
                                }}>
                                  Leave Review
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Leave a Review</DialogTitle>
                                </DialogHeader>
                                <Form {...reviewForm}>
                                  <form onSubmit={reviewForm.handleSubmit(onCreateReview)} className="space-y-4">
                                    <FormField
                                      control={reviewForm.control}
                                      name="rating"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Rating</FormLabel>
                                          <FormControl>
                                            <div className="flex gap-2">
                                              {[1, 2, 3, 4, 5].map((star) => (
                                                <Button
                                                  key={star}
                                                  type="button"
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => field.onChange(star)}
                                                  className="p-0 h-8 w-8"
                                                >
                                                  <Star 
                                                    className={`h-6 w-6 ${
                                                      star <= field.value 
                                                        ? 'fill-yellow-400 text-yellow-400' 
                                                        : 'text-gray-300'
                                                    }`}
                                                  />
                                                </Button>
                                              ))}
                                            </div>
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />

                                    <FormField
                                      control={reviewForm.control}
                                      name="comment"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Comment (Optional)</FormLabel>
                                          <FormControl>
                                            <Textarea 
                                              {...field} 
                                              placeholder="Share your experience..."
                                              rows={3}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />

                                    <Button 
                                      type="submit" 
                                      disabled={createReviewMutation.isPending}
                                    >
                                      {createReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                                    </Button>
                                  </form>
                                </Form>
                              </DialogContent>
                            </Dialog>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create-booking">
            <Card>
              <CardHeader>
                <CardTitle>Book New Service</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...bookingForm}>
                  <form onSubmit={bookingForm.handleSubmit(onCreateBooking)} className="space-y-6">
                    <FormField
                      control={bookingForm.control}
                      name="providerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Provider</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a provider" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {isLoadingProviders ? (
                                <SelectItem value="" disabled>Loading providers...</SelectItem>
                              ) : providers && providers.length > 0 ? (
                                providers.map((provider: any) => (
                                  <SelectItem key={provider.id} value={provider.id}>
                                    {provider.user?.firstName} {provider.user?.lastName} - {provider.specialty} (${Number(provider.hourlyRate || 0).toFixed(0)}/hr)
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="" disabled>No providers available</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={bookingForm.control}
                      name="serviceDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Describe the service you need in detail..."
                              rows={4}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={bookingForm.control}
                        name="scheduledDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferred Date</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                {...field} 
                                min={new Date().toISOString().split('T')[0]}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={bookingForm.control}
                        name="scheduledTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferred Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={bookingForm.control}
                      name="customerAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Address</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="123 Main St, City, State, ZIP" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={bookingForm.control}
                      name="estimatedDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Duration (hours)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.5" 
                              min="0.5" 
                              max="24"
                              value={field.value || ""} 
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={bookingForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Any additional information..."
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      disabled={createBookingMutation.isPending}
                      className="w-full"
                    >
                      {createBookingMutation.isPending ? "Creating Booking..." : "Create Booking"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
