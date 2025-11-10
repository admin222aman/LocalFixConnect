import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Pages
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Services from "@/pages/services";
import ProviderProfile from "@/pages/provider-profile";
import ProviderPanel from "@/pages/provider-panel";
import AdminPanel from "@/pages/admin-panel";
import Booking from "@/pages/booking";
import SignIn from "@/pages/signin";
import Register from "@/pages/register";  // ← Add this import

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/services" component={Services} />
      <Route path="/provider/:id" component={ProviderProfile} />
      <Route path="/provider-panel" component={ProviderPanel} />
      <Route path="/admin/dashboard/management" component={AdminPanel} />
      <Route path="/booking" component={Booking} />
      <Route path="/signin" component={SignIn} />
      <Route path="/register" component={Register} />  {/* ← Add route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
