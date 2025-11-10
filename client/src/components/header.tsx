import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Menu } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Header() {
  const [location] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Get current user
  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
    meta: { suppressErrorToast: true },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navigationItems = [
    { href: "/services", label: "Browse Services" },
    { href: "#", label: "How It Works" },
    { href: "/provider-panel", label: "For Providers" },
  ];

  const NavItems = ({ mobile = false, onItemClick = () => {} }) => (
    <>
      {navigationItems.map((item) => (
        <Link key={item.href} to={item.href} onClick={onItemClick}>
          <span 
            className={`${
              location === item.href 
                ? "text-blue-600" 
                : "text-gray-500 hover:text-blue-600"
            } ${mobile ? "block px-3 py-2 text-base" : "px-3 py-2 text-sm"} font-medium transition-colors cursor-pointer`}
            data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {item.label}
          </span>
        </Link>
      ))}
    </>
  );

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/">
                <h1 className="text-2xl font-bold text-blue-600 cursor-pointer" data-testid="logo-localfix">
                  LocalFix
                </h1>
              </Link>
            </div>
            <nav className="hidden md:ml-10 md:flex space-x-8">
              <NavItems />
            </nav>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/booking">
                  <Button variant="ghost" data-testid="button-my-bookings">
                    My Bookings
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" data-testid="button-user-menu">
                      <User className="h-4 w-4 mr-2" />
                      {user.firstName} {user.lastName}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to="/booking">
                        <span data-testid="menu-my-bookings">My Bookings</span>
                      </Link>
                    </DropdownMenuItem>
                    {user.role === "provider" && (
                      <DropdownMenuItem asChild>
                        <Link to="/provider-panel">
                          <span data-testid="menu-provider-panel">Provider Panel</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {user.role === "admin" && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin/dashboard/management">
                          <span data-testid="menu-admin-panel">Admin Panel</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      data-testid="menu-logout"
                    >
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link to="/signin">
                  <Button variant="ghost" data-testid="button-sign-in">
                    Sign In
                  </Button>
                </Link>
                <Link to="/provider-panel">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-join-provider">
                    Join as Provider
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" data-testid="button-mobile-menu">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <nav className="flex flex-col space-y-4">
                  <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
                    <h1 className="text-2xl font-bold text-blue-600 mb-6">LocalFix</h1>
                  </Link>
                  
                  <NavItems mobile onItemClick={() => setIsMobileMenuOpen(false)} />
                  
                  <div className="border-t pt-4">
                    {user ? (
                      <>
                        <div className="px-3 py-2 text-sm text-gray-600">
                          Welcome, {user.firstName}
                        </div>
                        <Link to="/booking" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start" data-testid="mobile-my-bookings">
                            My Bookings
                          </Button>
                        </Link>
                        {user.role === "provider" && (
                          <Link to="/provider-panel" onClick={() => setIsMobileMenuOpen(false)}>
                            <Button variant="ghost" className="w-full justify-start" data-testid="mobile-provider-panel">
                              Provider Panel
                            </Button>
                          </Link>
                        )}
                        {user.role === "admin" && (
                          <Link to="/admin/dashboard/management" onClick={() => setIsMobileMenuOpen(false)}>
                            <Button variant="ghost" className="w-full justify-start" data-testid="mobile-admin-panel">
                              Admin Panel
                            </Button>
                          </Link>
                        )}
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start" 
                          onClick={() => {
                            handleLogout();
                            setIsMobileMenuOpen(false);
                          }}
                          data-testid="mobile-logout"
                        >
                          Logout
                        </Button>
                      </>
                    ) : (
                      <>
                        <Link to="/signin" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start mb-2" data-testid="mobile-sign-in">
                            Sign In
                          </Button>
                        </Link>
                        <Link to="/provider-panel" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" data-testid="mobile-join-provider">
                            Join as Provider
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
