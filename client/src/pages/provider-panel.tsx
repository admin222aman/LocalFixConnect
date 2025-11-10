import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Zap, Wrench, Hammer, Wind, Home, Leaf, Paintbrush, Sparkles } from "lucide-react";

const registrationSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
});

const providerSchema = z.object({
  specialty: z.string().min(1, "Specialty is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(1, "Location is required"),
  hourlyRate: z.string().min(1, "Hourly rate is required"),
  yearsExperience: z.number().min(0, "Years of experience must be 0 or greater"),
  serviceRadius: z.number().min(1, "Service radius must be at least 1 mile"),
  categories: z.array(z.string()).min(1, "At least one category is required"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function ProviderPanel() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user is logged in
  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
    meta: { suppressErrorToast: true },
  });

  // Get provider profile
  const { data: providers } = useQuery({
    queryKey: ['/api/providers'],
    enabled: !!user,
    select: (data: any[]) => data.find((p: any) => p.userId === (user as any)?.id),
  });

  // Get bookings for provider
  const { data: bookings = [] } = useQuery({
    queryKey: ['/api/bookings'],
    enabled: !!user && (user as any).role === "provider",
  });

  // Get categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  const currentProvider = providers;

  // Registration form
  const registrationForm = useForm({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phone: "",
    },
  });

  // Login form
  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Provider form
  const providerForm = useForm({
    resolver: zodResolver(providerSchema),
    defaultValues: {
      specialty: currentProvider?.specialty || "",
      description: currentProvider?.description || "",
      location: currentProvider?.location || "",
      hourlyRate: currentProvider?.hourlyRate || "",
      yearsExperience: currentProvider?.yearsExperience || 0,
      serviceRadius: currentProvider?.serviceRadius || 25,
      categories: currentProvider?.categories || [],
    },
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentUser(data);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Registration Successful",
        description: "Welcome to LocalFix! You can now create your provider profile.",
      });
    },
    onError: () => {
      toast({
        title: "Registration Failed",
        description: "Please check your information and try again.",
        variant: "destructive",
      });
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentUser(data);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
    },
    onError: () => {
      toast({
        title: "Login Failed",
        description: "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Provider profile mutation
  const providerMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = currentProvider ? `/api/providers/${currentProvider.id}` : "/api/providers";
      const method = currentProvider ? "PUT" : "POST";
      const response = await apiRequest(method, url, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/providers'] });
      toast({
        title: currentProvider ? "Profile Updated" : "Profile Created",
        description: currentProvider 
          ? "Your provider profile has been updated successfully."
          : "Your provider profile has been created and is pending approval.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save provider profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Availability mutation
  const availabilityMutation = useMutation({
    mutationFn: async (isAvailable: boolean) => {
      if (!currentProvider) throw new Error("Provider not found");
      const response = await apiRequest("PUT", `/api/providers/${currentProvider.id}`, { isAvailable });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/providers'] });
      toast({
        title: "Availability Updated",
        description: "Your availability status has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update availability. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update booking status mutation
  const updateBookingMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/bookings/${bookingId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: "Booking Updated",
        description: "The booking status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update booking status.",
        variant: "destructive",
      });
    },
  });

  const onRegister = (data: any) => {
    registerMutation.mutate(data);
  };

  const onLogin = (data: any) => {
    loginMutation.mutate(data);
  };

  const onProviderSubmit = (data: any) => {
    providerMutation.mutate({
      ...data,
      yearsExperience: Number(data.yearsExperience) || 0,
      serviceRadius: Number(data.serviceRadius) || 25,
      hourlyRate: data.hourlyRate ? data.hourlyRate.toString() : "0",
      categories: data.categories || [],
    });
  };

  const toggleAvailability = () => {
    if (currentProvider) {
      availabilityMutation.mutate(!currentProvider.isAvailable);
    }
  };

  const handleUpdateBooking = (bookingId: string, status: string) => {
    updateBookingMutation.mutate({ bookingId, status });
  };

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      setCurrentUser(null);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // If not logged in, show login/registration form
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />

        <div className="max-w-md mx-auto px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                {isRegistering ? "Join as a Provider" : "Provider Login"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isRegistering ? (
                <Form {...registrationForm}>
                  <form onSubmit={registrationForm.handleSubmit(onRegister)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={registrationForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-first-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registrationForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-last-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email"
                        name="email"
                        type="text"
                        value={registrationForm.watch("email") || ""}
                        onChange={(e) => registrationForm.setValue("email", e.target.value)}
                        placeholder="Enter your email address"
                        className="mt-1"
                        data-testid="input-email" 
                      />
                      {registrationForm.formState.errors.email && (
                        <p className="text-sm text-red-600 mt-1">
                          {registrationForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <FormField
                      control={registrationForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} data-testid="input-password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registrationForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                      data-testid="button-register"
                    >
                      {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </Form>
              ) : (
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <div>
                      <Label htmlFor="login-email">Email</Label>
                      <Input 
                        id="login-email"
                        name="email"
                        type="text"
                        value={loginForm.watch("email") || ""}
                        onChange={(e) => loginForm.setValue("email", e.target.value)}
                        placeholder="Enter your email address"
                        className="mt-1"
                        data-testid="input-login-email" 
                      />
                      {loginForm.formState.errors.email && (
                        <p className="text-sm text-red-600 mt-1">
                          {loginForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} data-testid="input-login-password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                      data-testid="button-login"
                    >
                      {loginMutation.isPending ? "Signing In..." : "Sign In"}
                    </Button>
                  </form>
                </Form>
              )}

              <div className="mt-4 text-center">
                <Button
                  variant="link"
                  onClick={() => setIsRegistering(!isRegistering)}
                  data-testid="button-toggle-form"
                >
                  {isRegistering 
                    ? "Already have an account? Sign In" 
                    : "Don't have an account? Register"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Provider Dashboard</h1>
            <p className="text-gray-600">
              Welcome back, {(user as any).firstName} {(user as any).lastName}
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline" data-testid="button-logout">
            Logout
          </Button>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Provider Profile</CardTitle>
                {currentProvider && (
                  <div className="flex gap-2">
                    <Badge variant={currentProvider.isApproved ? "default" : "secondary"}>
                      {currentProvider.isApproved ? "Approved" : "Pending Approval"}
                    </Badge>
                    <Badge variant={currentProvider.isAvailable ? "default" : "destructive"}>
                      {currentProvider.isAvailable ? "Available" : "Unavailable"}
                    </Badge>
                  </div>
                )}
                {currentProvider && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium">Availability Status</h3>
                          <p className="text-sm text-gray-600">
                            Toggle your availability to let customers know if you're accepting new bookings
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-medium ${currentProvider.isAvailable ? 'text-green-600' : 'text-gray-600'}`}>
                            {currentProvider.isAvailable ? 'Available' : 'Unavailable'}
                          </span>
                          <Button
                            type="button"
                            onClick={() => toggleAvailability()}
                            variant={currentProvider.isAvailable ? "destructive" : "default"}
                            size="sm"
                            disabled={availabilityMutation.isPending}
                          >
                            {availabilityMutation.isPending 
                              ? "Updating..." 
                              : currentProvider.isAvailable 
                                ? "Mark Unavailable" 
                                : "Mark Available"
                            }
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
              </CardHeader>
              <CardContent>
                <Form {...providerForm}>
                  <form onSubmit={providerForm.handleSubmit(onProviderSubmit)} className="space-y-6">
                    <FormField
                      control={providerForm.control}
                      name="categories"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Categories</FormLabel>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
                            {categories.map((category: any) => {
                              const getCategoryIcon = (name: string) => {
                                const lowerName = name.toLowerCase();
                                if (lowerName.includes('electrical')) return Zap;
                                if (lowerName.includes('plumbing')) return Wrench;
                                if (lowerName.includes('carpentry')) return Hammer;
                                if (lowerName.includes('hvac')) return Wind;
                                if (lowerName.includes('general')) return Home;
                                if (lowerName.includes('landscaping')) return Leaf;
                                if (lowerName.includes('painting')) return Paintbrush;
                                if (lowerName.includes('cleaning')) return Sparkles;
                                return Wrench;
                              };

                              const IconComponent = getCategoryIcon(category.name);
                              const isSelected = field.value?.includes(category.name);

                              return (
                                <div
                                  key={category.name}
                                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 ${
                                    isSelected
                                      ? "bg-blue-600 text-white border-blue-600 shadow-lg" 
                                      : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:shadow-md"
                                  }`}
                                  onClick={() => {
                                    const currentCategories = field.value || [];
                                    const newCategories = isSelected
                                      ? currentCategories.filter((cat: string) => cat !== category.name)
                                      : [...currentCategories, category.name];
                                    field.onChange(newCategories);
                                  }}
                                  data-testid={`category-${category.name.toLowerCase().replace(/\s+/g, '-')}`}
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
                                </div>
                              );
                            })}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={providerForm.control}
                      name="specialty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specialty Details</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="e.g., Licensed Electrician, Master Plumber"
                              data-testid="input-specialty"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={providerForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              rows={4}
                              placeholder="Describe your services, experience, and what makes you unique..."
                              data-testid="textarea-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={providerForm.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Service Location</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="e.g., Downtown Area, North Side"
                                data-testid="input-location"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={providerForm.control}
                        name="hourlyRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hourly Rate ($)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="75.00"
                                data-testid="input-hourly-rate"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={providerForm.control}
                        name="yearsExperience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Years of Experience</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number"
                                min="0"
                                value={field.value || ""}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-years-experience"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={providerForm.control}
                        name="serviceRadius"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Service Radius (miles)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number"
                                min="1"
                                value={field.value || ""}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 25)}
                                data-testid="input-service-radius"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      disabled={providerMutation.isPending}
                      data-testid="button-save-profile"
                    >
                      {providerMutation.isPending 
                        ? "Saving..." 
                        : currentProvider ? "Update Profile" : "Create Profile"
                      }
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>Your Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {(bookings as any[]).length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No bookings yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(bookings as any[]).map((booking: any) => (
                      <div key={booking.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">
                              {booking.customer?.firstName} {booking.customer?.lastName}
                            </h3>
                            <p className="text-gray-600">{booking.serviceDescription}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(booking.scheduledDate).toLocaleDateString()} at {booking.scheduledTime}
                            </p>
                            <p className="text-sm text-gray-500">
                              Phone: {booking.customerPhone ?? booking.customer?.phone ?? booking.customer?.user?.phone ?? '-'}
                            </p>
                            <p className="text-sm text-gray-500">{booking.customerAddress}</p>
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

                        {booking.status === 'pending' && (
                          <div className="flex gap-2 mt-3">
                            <Button 
                              size="sm" 
                              onClick={() => handleUpdateBooking(booking.id, 'confirmed')}
                              data-testid={`button-confirm-${booking.id}`}
                            >
                              Confirm
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleUpdateBooking(booking.id, 'cancelled')}
                              data-testid={`button-cancel-${booking.id}`}
                            >
                              Decline
                            </Button>
                          </div>
                        )}

                        {booking.status === 'confirmed' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleUpdateBooking(booking.id, 'completed')}
                            className="mt-3"
                            data-testid={`button-complete-${booking.id}`}
                          >
                            Mark as Completed
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="availability">
            <Card>
              <CardHeader>
                <CardTitle>Availability Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">Currently Available</h3>
                      <p className="text-sm text-gray-600">
                        Toggle your availability to receive new booking requests
                      </p>
                    </div>
                    <Badge variant={currentProvider?.isAvailable ? "default" : "secondary"}>
                      {currentProvider?.isAvailable ? "Available" : "Unavailable"}
                    </Badge>
                  </div>

                  <p className="text-gray-600">
                    Advanced scheduling features will be available in a future update.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}