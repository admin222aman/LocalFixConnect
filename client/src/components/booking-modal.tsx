
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const bookingSchema = z.object({
  preferredDate: z.string().min(1, "Date is required"),
  preferredTime: z.string().min(1, "Time is required"),
  estimatedDuration: z.string().min(1, "Duration is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  phone: z.string().min(10, "Valid phone number is required"),
  additionalNotes: z.string().optional(),
});

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: any;
}

export default function BookingModal({ isOpen, onClose, provider }: BookingModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      preferredDate: "",
      preferredTime: "09:00",
      estimatedDuration: "2",
      description: "",
      address: "",
      phone: "",
      additionalNotes: "",
    },
  });

  const bookingMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Submitting booking form:", data);
      
      const bookingData = {
        providerId: provider.id,
        serviceDescription: data.description,
        scheduledDate: new Date(data.preferredDate).toISOString(),
        scheduledTime: data.preferredTime,
        customerAddress: data.address,
        estimatedDuration: Number(data.estimatedDuration),
        notes: data.additionalNotes || "",
        customerPhone: data.phone,
        serviceType: provider.specialty || "general",
        status: "pending"
      };

      console.log("Sending booking data:", bookingData);

      const response = await apiRequest("POST", "/api/bookings", bookingData);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Booking error response:", errorText);
        throw new Error(errorText || "Failed to create booking");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Booking created successfully:", data);
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: "Booking Created!",
        description: "Your booking request has been sent to the provider.",
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      console.log("Booking error:", error);
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    bookingMutation.mutate(data);
  };

  if (!provider) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book Service with {provider.user?.firstName} {provider.user?.lastName}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="preferredDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferredTime"
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
              control={form.control}
              name="estimatedDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Duration (hours)</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max="8" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Describe the work you need done..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Address</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter full address" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Your contact number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="additionalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Any additional information..."
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={bookingMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {bookingMutation.isPending ? "Creating Booking..." : "Create Booking"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
