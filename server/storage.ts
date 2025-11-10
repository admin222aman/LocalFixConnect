import {
  type User,
  type InsertUser,
  type ServiceCategory,
  type InsertServiceCategory,
  type Provider,
  type InsertProvider,
  type ProviderCategory,
  type InsertProviderCategory,
  type Booking,
  type InsertBooking,
  type Review,
  type InsertReview
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  // Service category methods
  getServiceCategories(): Promise<ServiceCategory[]>;
  createServiceCategory(category: InsertServiceCategory): Promise<ServiceCategory>;
  
  // Provider methods
  getProvider(id: string): Promise<Provider | undefined>;
  getProviderByUserId(userId: string): Promise<Provider | undefined>;
  getProviders(filters?: { categoryId?: string; location?: string; isApproved?: boolean }): Promise<Provider[]>;
  createProvider(provider: InsertProvider): Promise<Provider>;
  updateProvider(id: string, updates: Partial<Provider>): Promise<Provider | undefined>;
  
  // Provider category methods
  getProviderCategories(providerId: string): Promise<ProviderCategory[]>;
  createProviderCategory(pc: InsertProviderCategory): Promise<ProviderCategory>;
  
  // Booking methods
  getBooking(id: string): Promise<Booking | undefined>;
  getBookings(filters?: { customerId?: string; providerId?: string; status?: string }): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | undefined>;
  
  // Review methods
  getReviews(providerId: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: string, updates: Partial<Review>): Promise<Review | undefined>;
  deleteReview(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private serviceCategories: Map<string, ServiceCategory> = new Map();
  private providers: Map<string, Provider> = new Map();
  private providerCategories: Map<string, ProviderCategory> = new Map();
  private bookings: Map<string, Booking> = new Map();
  private reviews: Map<string, Review> = new Map();

  constructor() {
    this.initializeSeedData();
  }

  private async initializeSeedData() {
    // Create service categories
    const categories = [
      { name: "Electrical", description: "Wiring, repairs, installations", icon: "zap", color: "blue" },
      { name: "Plumbing", description: "Pipes, fixtures, emergency repairs", icon: "wrench", color: "green" },
      { name: "Carpentry", description: "Custom work, repairs, installations", icon: "hammer", color: "amber" },
      { name: "HVAC", description: "Heating, cooling, ventilation", icon: "thermometer", color: "purple" },
      { name: "General Contracting", description: "Home improvements, renovations", icon: "building", color: "red" },
      { name: "Landscaping", description: "Garden design, lawn care", icon: "leaf", color: "teal" },
      { name: "Painting", description: "Interior, exterior, touch-ups", icon: "paintbrush", color: "orange" },
      { name: "Cleaning Services", description: "House cleaning, deep cleaning", icon: "spray", color: "gray" },
    ];

    for (const cat of categories) {
      await this.createServiceCategory(cat);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await this.createUser({
      email: "admin@localfix.com",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      role: "admin",
    });

    // Get category IDs for sample data
    const electricalCat = Array.from(this.serviceCategories.values()).find(c => c.name === "Electrical");
    const plumbingCat = Array.from(this.serviceCategories.values()).find(c => c.name === "Plumbing");
    const carpentryCat = Array.from(this.serviceCategories.values()).find(c => c.name === "Carpentry");

    // Create sample providers
    const sampleProviders = [
      {
        email: "mike@example.com",
        password: await bcrypt.hash("password123", 10),
        firstName: "Mike",
        lastName: "Thompson",
        role: "provider" as const,
        specialty: "Licensed Electrician",
        location: "Downtown Area",
        description: "15+ years experience in residential and commercial electrical work. Available for emergency calls.",
        hourlyRate: "85.00",
        isApproved: true,
        rating: "4.9",
        reviewCount: 127,
        categories: electricalCat ? [electricalCat.id] : [],
      },
      {
        email: "sarah@example.com",
        password: await bcrypt.hash("password123", 10),
        firstName: "Sarah",
        lastName: "Martinez",
        role: "provider" as const,
        specialty: "Master Plumber",
        location: "North Side",
        description: "Specializing in emergency repairs, fixture installations, and water heater services. Fast response time.",
        hourlyRate: "95.00",
        isApproved: true,
        rating: "4.8",
        reviewCount: 94,
        categories: plumbingCat ? [plumbingCat.id] : [],
      },
      {
        email: "david@example.com",
        password: await bcrypt.hash("password123", 10),
        firstName: "David",
        lastName: "Chen",
        role: "provider" as const,
        specialty: "Custom Carpenter",
        location: "West End",
        description: "Custom furniture, cabinetry, and home improvements. Meticulous attention to detail and craftsmanship.",
        hourlyRate: "75.00",
        isApproved: true,
        rating: "5.0",
        reviewCount: 73,
        categories: carpentryCat ? [carpentryCat.id] : [],
      },
    ];

    for (const providerData of sampleProviders) {
      const user = await this.createUser({
        email: providerData.email,
        password: providerData.password,
        firstName: providerData.firstName,
        lastName: providerData.lastName,
        role: providerData.role,
      });

      await this.createProvider({
        userId: user.id,
        specialty: providerData.specialty,
        location: providerData.location,
        description: providerData.description,
        hourlyRate: providerData.hourlyRate,
        isApproved: providerData.isApproved,
        // FIX (Error TS2353): 'rating' does not exist on 'InsertProvider'.
        // This property is removed from here. To fix this "correctly",
        // add 'rating?: string | null' to your 'InsertProvider' schema.
        // rating: providerData.rating, 
        reviewCount: providerData.reviewCount,
        categories: providerData.categories,
      });
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    // FIX (Error TS2322): Handle 'phone' potentially being 'undefined'.
    // 'User' type requires 'string | null', not 'undefined'.
    const user: User = {
      ...insertUser,
      phone: insertUser.phone ?? null,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Service category methods
  async getServiceCategories(): Promise<ServiceCategory[]> {
    return Array.from(this.serviceCategories.values());
  }

  async createServiceCategory(category: InsertServiceCategory): Promise<ServiceCategory> {
    const id = randomUUID();
    // FIX (Error TS2322): Handle 'description' being 'undefined'.
    const serviceCategory: ServiceCategory = {
      ...category,
      id,
      description: category.description ?? null,
    };
    this.serviceCategories.set(id, serviceCategory);
    return serviceCategory;
  }

  // Provider methods
  async getProvider(id: string): Promise<Provider | undefined> {
    return this.providers.get(id);
  }

  async getProviderByUserId(userId: string): Promise<Provider | undefined> {
    return Array.from(this.providers.values()).find(provider => provider.userId === userId);
  }

  async getProviders(filters?: { categoryId?: string; location?: string; isApproved?: boolean }): Promise<Provider[]> {
    let providers = Array.from(this.providers.values());
    
    // Add user information to each provider
    const providersWithUsers = providers.map(provider => {
      const user = this.users.get(provider.userId);
      return {
        ...provider,
        user: user ? {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        } : null
      };
    });
    
    let filteredProviders = providersWithUsers;
    
    if (filters?.isApproved !== undefined) {
      filteredProviders = filteredProviders.filter(p => p.isApproved === filters.isApproved);
    }
    
    if (filters?.location) {
      filteredProviders = filteredProviders.filter(p => p.location.toLowerCase().includes(filters.location!.toLowerCase()));
    }
    
    if (filters?.categoryId) {
      filteredProviders = filteredProviders.filter(p => {
        // Check if provider has the category in their categories array
        return p.categories && p.categories.includes(filters.categoryId!);
      });
    }
    
    return filteredProviders;
  }

  async createProvider(provider: InsertProvider): Promise<Provider> {
    const id = randomUUID();
    const newProvider: Provider = {
      ...provider,
      id,
      // FIX (Error TS1117): Removed duplicate 'categories' property.
      createdAt: new Date(),
      userId: provider.userId,
      specialty: provider.specialty,
      location: provider.location ?? "",
      description: provider.description ?? null,
      isApproved: provider.isApproved ?? false,
      // FIX (Error TS2322): Handle 'isAvailable' being 'undefined'.
      isAvailable: provider.isAvailable ?? null,
      businessName: (provider as any).businessName ?? null,
      serviceRadius: (provider as any).serviceRadius ?? null,
      hourlyRate: (provider as any).hourlyRate ?? null,
      rating: (provider as any).rating ?? 0,
      reviewCount: (provider as any).reviewCount ?? 0,
      categories: provider.categories ?? [],
      availability: (provider as any).availability ?? null,
    };
    this.providers.set(id, newProvider);
    return newProvider;
  }

  async updateProvider(id: string, updates: Partial<Provider>): Promise<Provider | undefined> {
    const provider = this.providers.get(id);
    if (!provider) return undefined;
    
    const updatedProvider = { ...provider, ...updates };
    this.providers.set(id, updatedProvider);
    return updatedProvider;
  }

  // Provider category methods
  async getProviderCategories(providerId: string): Promise<ProviderCategory[]> {
    return Array.from(this.providerCategories.values()).filter(pc => pc.providerId === providerId);
  }

  async createProviderCategory(pc: InsertProviderCategory): Promise<ProviderCategory> {
    const id = randomUUID();
    const providerCategory: ProviderCategory = { ...pc, id };
    this.providerCategories.set(id, providerCategory);
    return providerCategory;
  }

  // Booking methods
  async getBooking(id: string): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getBookings(filters?: { customerId?: string; providerId?: string; status?: string }): Promise<Booking[]> {
    let bookings = Array.from(this.bookings.values());
    
    if (filters?.customerId) {
      bookings = bookings.filter(b => b.customerId === filters.customerId);
    }
    
    if (filters?.providerId) {
      bookings = bookings.filter(b => b.providerId === filters.providerId);
    }
    
    if (filters?.status) {
      bookings = bookings.filter(b => b.status === filters.status);
    }
    
    return bookings;
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const id = randomUUID();
    const newBooking: Booking = {
      ...booking,
      id,
      createdAt: new Date(),
      providerId: booking.providerId,
      customerId: booking.customerId,
      serviceDescription: booking.serviceDescription ?? "",
      scheduledDate: booking.scheduledDate,
      customerAddress: booking.customerAddress ?? "",
      scheduledTime: (booking as any).scheduledTime ?? "",
      status: booking.status ?? "pending",
      // FIX (Error TS2353): 'price' does not exist on 'Booking'.
      // This property is removed. To fix this "correctly",
      // add 'price?: number | null' to your 'Booking' schema.
      // price: (booking as any).price ?? null, 
      notes: booking.notes ?? null
    };
    this.bookings.set(id, newBooking);
    return newBooking;
  }

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    
    const updatedBooking = { ...booking, ...updates };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }

  // Review methods
  async getReviews(providerId: string): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(r => r.providerId === providerId && r.isVisible);
  }

  async createReview(review: InsertReview): Promise<Review> {
    const id = randomUUID();
    const newReview: Review = {
      ...review,
      id,
      createdAt: new Date(),
      providerId: review.providerId,
      customerId: review.customerId,
      bookingId: review.bookingId,
      rating: review.rating,
      comment: review.comment ?? null,
      isVisible: review.isVisible ?? true,
    };
    this.reviews.set(id, newReview);
    return newReview;
  }

  async updateReview(id: string, updates: Partial<Review>): Promise<Review | undefined> {
    const review = this.reviews.get(id);
    if (!review) return undefined;
    
    const updatedReview = { ...review, ...updates };
    this.reviews.set(id, updatedReview);
    return updatedReview;
  }

  async deleteReview(id: string): Promise<boolean> {
    return this.reviews.delete(id);
  }
}

export const storage = new MemStorage();