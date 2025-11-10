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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const adminLoginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if admin is logged in
  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
    meta: { suppressErrorToast: true },
  });

  // Get providers for admin
  const { data: providers = [] } = useQuery({
    queryKey: ['/api/admin/providers'],
    enabled: isAuthenticated || (user && user.role === 'admin'),
  });

  // Get bookings for admin
  const { data: bookings = [] } = useQuery({
    queryKey: ['/api/admin/bookings'],
    enabled: isAuthenticated || (user && user.role === 'admin'),
  });

  // Admin login form
  const adminLoginForm = useForm({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      password: "",
    },
  });

  // Admin login mutation
  const adminLoginMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/auth/admin-login", data);
      return response.json();
    },
    onSuccess: (data) => {
      setIsAuthenticated(true);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/providers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bookings'] });
      toast({
        title: "Admin Access Granted",
        description: "Welcome to the admin panel.",
      });
    },
    onError: () => {
      toast({
        title: "Access Denied",
        description: "Invalid admin password.",
        variant: "destructive",
      });
    },
  });

  // Provider approval mutation
  const approveProviderMutation = useMutation({
    mutationFn: async ({ providerId, isApproved }: { providerId: string; isApproved: boolean }) => {
      const response = await apiRequest("PUT", `/api/admin/providers/${providerId}/approve`, { isApproved });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/providers'] });
      toast({
        title: "Provider Status Updated",
        description: "The provider status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update provider status.",
        variant: "destructive",
      });
    },
  });

  // Delete review mutation
  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/reviews/${reviewId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: "Review Deleted",
        description: "The review has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete review.",
        variant: "destructive",
      });
    },
  });

  const onAdminLogin = (data: any) => {
    adminLoginMutation.mutate(data);
  };

  const handleApproveProvider = (providerId: string, isApproved: boolean) => {
    approveProviderMutation.mutate({ providerId, isApproved });
  };

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      setIsAuthenticated(false);
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

  // If not authenticated, show login form
  if (!isAuthenticated && (!user || user.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <div className="max-w-md mx-auto px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Admin Access</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...adminLoginForm}>
                <form onSubmit={adminLoginForm.handleSubmit(onAdminLogin)} className="space-y-4">
                  <FormField
                    control={adminLoginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            {...field} 
                            placeholder="Enter admin password"
                            data-testid="input-admin-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={adminLoginMutation.isPending}
                    data-testid="button-admin-login"
                  >
                    {adminLoginMutation.isPending ? "Authenticating..." : "Access Admin Panel"}
                  </Button>
                </form>
              </Form>
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
            <h1 className="text-3xl font-bold text-gray-900">Admin Aman Sinha Dashboard</h1>
            <p className="text-gray-600">Manage users, providers, and platform content</p>
          </div>
          <Button onClick={handleLogout} variant="outline" data-testid="button-admin-logout">
            Logout
          </Button>
        </div>

        <Tabs defaultValue="providers" className="space-y-6">
          <TabsList>
            <TabsTrigger value="providers">Providers</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="providers">
            <Card>
              <CardHeader>
                <CardTitle>Provider Management</CardTitle>
              </CardHeader>
              <CardContent>
                {providers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No providers registered yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Specialty</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {providers.map((provider: any) => (
                        <TableRow key={provider.id}>
                          <TableCell>
                            {provider.user?.firstName} {provider.user?.lastName}
                          </TableCell>
                          <TableCell>{provider.specialty}</TableCell>
                          <TableCell>{provider.location}</TableCell>
                          <TableCell>${Number(provider.hourlyRate).toFixed(0)}/hr</TableCell>
                          <TableCell>
                            <Badge variant={provider.isApproved ? "default" : "secondary"}>
                              {provider.isApproved ? "Approved" : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {!provider.isApproved && (
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveProvider(provider.id, true)}
                                  data-testid={`button-approve-${provider.id}`}
                                >
                                  Approve
                                </Button>
                              )}
                              {provider.isApproved && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleApproveProvider(provider.id, false)}
                                  data-testid={`button-revoke-${provider.id}`}
                                >
                                  Revoke
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>Booking Management</CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No bookings yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((booking: any) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            {booking.customer?.firstName} {booking.customer?.lastName}
                          </TableCell>
                          <TableCell>
                            {booking.customer?.phone ?? booking.customerPhone ?? "-"}
                          </TableCell>
                          <TableCell>
                            {booking.provider?.user?.firstName} {booking.provider?.user?.lastName}
                          </TableCell>
                          <TableCell>{booking.serviceDescription}</TableCell>
                          <TableCell>
                            {new Date(booking.scheduledDate).toLocaleDateString()} at {booking.scheduledTime}
                          </TableCell>
                          <TableCell>
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
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-600">User management features will be added in a future update.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Review Moderation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-600">Review moderation features will be added in a future update.</p>
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
