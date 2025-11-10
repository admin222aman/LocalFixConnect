import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  loginSchema,
  adminLoginSchema,
  insertProviderSchema,
  insertBookingSchema,
  insertReviewSchema
} from "@shared/schema";
import bcrypt from "bcryptjs";
import session from "express-session";
import MemoryStore from "memorystore";

const MemoryStoreSession = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(session({
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    secret: process.env.SESSION_SECRET || 'localfix-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  const requireProvider = async (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "provider") {
      return res.status(403).json({ message: "Provider access required" });
    }

    req.user = user;
    next();
  };

  const requireAdmin = async (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    req.user = user;
    next();
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      req.session.userId = user.id;

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Invalid login data" });
    }
  });

  app.post("/api/auth/admin-login", async (req, res) => {
    try {
      const { password } = adminLoginSchema.parse(req.body);

      if (password !== "GHOSTISREAL") {
        return res.status(401).json({ message: "Invalid admin password" });
      }

      const adminUser = await storage.getUserByEmail("admin@localfix.com");
      if (adminUser) {
        req.session.userId = adminUser.id;
        const { password: _, ...userWithoutPassword } = adminUser;
        res.json(userWithoutPassword);
      } else {
        res.status(500).json({ message: "Admin user not found" });
      }
    } catch (error) {
      res.status(400).json({ message: "Invalid admin login data" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // Service categories
  app.get("/api/categories", async (req, res) => {
    const categories = await storage.getServiceCategories();
    res.json(categories);
  });

  // Providers
  app.get("/api/providers", async (req, res) => {
    const { categoryId, location, isApproved } = req.query;
    const providers = await storage.getProviders({
      categoryId: categoryId as string,
      location: location as string,
      isApproved: isApproved === 'true' ? true : isApproved === 'false' ? false : undefined,
    });

    // Get user info for each provider
    const providersWithUsers = await Promise.all(
      providers.map(async (provider) => {
        const user = await storage.getUser(provider.userId);
        return {
          ...provider,
          user: user ? { firstName: user.firstName, lastName: user.lastName, email: user.email } : null,
        };
      })
    );

    res.json(providersWithUsers);
  });

  app.get("/api/providers/:id", async (req, res) => {
    const provider = await storage.getProvider(req.params.id);
    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    const user = await storage.getUser(provider.userId);
    const reviews = await storage.getReviews(provider.id);

    res.json({
      ...provider,
      user: user ? { firstName: user.firstName, lastName: user.lastName, email: user.email } : null,
      reviews,
    });
  });

  // Create provider profile
  app.post("/api/providers", requireAuth, async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Authentication required - no user ID in session" });
      }

      // Check if user already has a provider profile
      const existingProvider = await storage.getProviderByUserId(req.session.userId);
      if (existingProvider) {
        return res.status(400).json({ message: "User already has a provider profile" });
      }

      // Parse and validate the provider data, excluding userId from validation
      const { userId, ...providerDataWithoutUserId } = req.body;
      const validatedData = insertProviderSchema.omit({ userId: true }).parse(providerDataWithoutUserId);

      const provider = await storage.createProvider({
        ...validatedData,
        userId: req.session.userId,
        categories: validatedData.categories || [], // Add categories here
      });

      // Update user role
      await storage.updateUser(req.session.userId, { role: "provider" });

      res.status(201).json(provider);
    } catch (error) {
      console.error("Provider creation error:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ message: "Validation failed", details: (error as any).issues });
      } else {
        res.status(400).json({ message: "Invalid provider data", error: error instanceof Error ? error.message : "Unknown error" });
      }
    }
  });

  // Update provider profile
  app.put("/api/providers/:id", requireProvider, async (req, res) => {
    try {
      const provider = await storage.getProvider(req.params.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }

      if (provider.userId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const updates = insertProviderSchema.partial().parse(req.body);
      const updatedProvider = await storage.updateProvider(req.params.id, {
        ...updates,
        categories: updates.categories || [], // Add categories here
      });

      res.json(updatedProvider);
    } catch (error) {
      console.error("Provider update error:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ message: "Validation failed", details: (error as any).issues });
      } else {
        res.status(400).json({ message: "Invalid update data", error: error instanceof Error ? error.message : "Unknown error" });
      }
    }
  });

  // Bookings
  app.get("/api/bookings", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let filters: any = {};

    if (user.role === "customer") {
      filters.customerId = user.id;
    } else if (user.role === "provider") {
      const provider = await storage.getProviderByUserId(user.id);
      if (provider) {
        filters.providerId = provider.id;
      }
    }

    if (req.query.status) {
      filters.status = req.query.status;
    }

    const bookings = await storage.getBookings(filters);

    // Get additional data for each booking
    const bookingsWithDetails = await Promise.all(
      bookings.map(async (booking) => {
        const customer = await storage.getUser(booking.customerId);
        const provider = await storage.getProvider(booking.providerId);
        const providerUser = provider ? await storage.getUser(provider.userId) : null;

        return {
          ...booking,
          customer: customer ? { firstName: customer.firstName, lastName: customer.lastName, email: customer.email } : null,
          provider: provider ? {
            ...provider,
            user: providerUser ? { firstName: providerUser.firstName, lastName: providerUser.lastName } : null,
          } : null,
        };
      })
    );

    res.json(bookingsWithDetails);
  });

  app.post("/api/bookings", requireAuth, async (req, res) => {
    try {
      console.log("Creating booking with data:", req.body);
      console.log("User ID:", req.session.userId);

      // Validate required fields
      const requiredFields = {
        providerId: "Provider ID is required",
        serviceDescription: "Service description is required",
        scheduledDate: "Scheduled date is required",
        customerAddress: "Customer address is required",
        customerPhone: "Customer phone is required"
      };

      for (const [field, message] of Object.entries(requiredFields)) {
        if (!req.body[field]) {
          return res.status(400).json({ message });
        }
      }

      // Check if provider exists and is approved
      const provider = await storage.getProvider(req.body.providerId);
      if (!provider) {
        return res.status(400).json({ message: "Provider not found" });
      }
      
      if (!provider.isApproved) {
        return res.status(400).json({ message: "Provider is not approved" });
      }

      // Validate and parse date
      const scheduledDate = new Date(req.body.scheduledDate);
      if (isNaN(scheduledDate.getTime())) {
        return res.status(400).json({ message: "Invalid scheduled date" });
      }

      // Parse and validate the booking data
      const bookingData = {
        customerId: req.session.userId,
        providerId: req.body.providerId,
        serviceDescription: req.body.serviceDescription,
        scheduledDate: scheduledDate,
        scheduledTime: req.body.scheduledTime || "09:00",
        status: "pending",
        customerAddress: req.body.customerAddress,
        customerPhone: req.body.customerPhone,
        estimatedDuration: Number(req.body.estimatedDuration) || 2,
        notes: req.body.notes || "",
      };

      console.log("Processed booking data:", bookingData);

      const booking = await storage.createBooking(bookingData);

      console.log("Created booking:", booking);

      res.status(201).json(booking);
    } catch (error) {
      console.error("Booking creation error:", error);
      res.status(400).json({ 
        message: "Invalid booking data", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.put("/api/bookings/:id", requireAuth, async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const user = await storage.getUser(req.session.userId);

      // Check authorization
      let canUpdate = false;
      if (user?.role === "admin") {
        canUpdate = true;
      } else if (booking.customerId === req.session.userId) {
        canUpdate = true;
      } else if (user?.role === "provider") {
        const provider = await storage.getProviderByUserId(req.session.userId);
        if (provider && provider.id === booking.providerId) {
          canUpdate = true;
        }
      }

      if (!canUpdate) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const updates = insertBookingSchema.partial().parse(req.body);
      const updatedBooking = await storage.updateBooking(req.params.id, updates);

      res.json(updatedBooking);
    } catch (error) {
      res.status(400).json({ message: "Invalid update data" });
    }
  });

  // Reviews
  app.post("/api/reviews", requireAuth, async (req, res) => {
    try {
      const reviewData = insertReviewSchema.parse(req.body);

      // Verify booking exists and belongs to user
      const booking = await storage.getBooking(reviewData.bookingId);
      if (!booking || booking.customerId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const review = await storage.createReview({
        ...reviewData,
        customerId: req.session.userId,
      });

      // Update provider rating
      const reviews = await storage.getReviews(reviewData.providerId);
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

      await storage.updateProvider(reviewData.providerId, {
        rating: averageRating.toFixed(2),
        reviewCount: reviews.length,
      });

      res.status(201).json(review);
    } catch (error) {
      res.status(400).json({ message: "Invalid review data" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    // This would normally come from a database, for demo we'll return limited data
    res.json([{ message: "Admin users endpoint - implement as needed" }]);
  });

  app.get("/api/admin/providers", requireAdmin, async (req, res) => {
    const providers = await storage.getProviders();
    const providersWithUsers = await Promise.all(
      providers.map(async (provider) => {
        const user = await storage.getUser(provider.userId);
        return {
          ...provider,
          user: user ? { firstName: user.firstName, lastName: user.lastName, email: user.email } : null,
        };
      })
    );
    res.json(providersWithUsers);
  });

  app.put("/api/admin/providers/:id/approve", requireAdmin, async (req, res) => {
    const { isApproved } = req.body;
    const provider = await storage.updateProvider(req.params.id, { isApproved });
    res.json(provider);
  });

  app.get("/api/admin/bookings", requireAdmin, async (req, res) => {
    const bookings = await storage.getBookings();
    const bookingsWithDetails = await Promise.all(
      bookings.map(async (booking) => {
        const customer = await storage.getUser(booking.customerId);
        const provider = await storage.getProvider(booking.providerId);
        const providerUser = provider ? await storage.getUser(provider.userId) : null;

        return {
          ...booking,
          customer: customer ? { firstName: customer.firstName, lastName: customer.lastName, email: customer.email } : null,
          provider: provider ? {
            ...provider,
            user: providerUser ? { firstName: providerUser.firstName, lastName: providerUser.lastName } : null,
          } : null,
        };
      })
    );
    res.json(bookingsWithDetails);
  });

  app.delete("/api/admin/reviews/:id", requireAdmin, async (req, res) => {
    const success = await storage.deleteReview(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Review not found" });
    }
    res.json({ message: "Review deleted successfully" });
  });

  const httpServer = createServer(app);
  return httpServer;
}