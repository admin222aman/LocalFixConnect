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
  getAllUsers(): Promise<User[]>;
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

  async initializeSeedData() {
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

    // Create sample providers (data object remains the same for easy reference)
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
        // Ensure role is included for the final User object
        role: providerData.role, 
      });

      // RETAIN: Only pass fields expected by InsertProvider (omitting rating/reviewCount)
      await this.createProvider({
        userId: user.id,
        specialty: providerData.specialty,
        location: providerData.location,
        description: providerData.description,
        hourlyRate: providerData.hourlyRate,
        isApproved: providerData.isApproved,
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

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
      // ✅ FIX: Ensure defaults for phone and role, assuming they are required on the final User object
      phone: (insertUser as any).phone ?? null, 
      role: (insertUser as any).role ?? "customer", // Default to 'customer' if not provided
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
      createdAt: new Date(),
      userId: provider.userId,
      specialty: provider.specialty,
      location: provider.location ?? "",
      description: provider.description ?? null,
      isApproved: provider.isApproved ?? false,
      
      // ✅ FIX: Ensure all required fields have safe defaults
      isAvailable: (provider as any).isAvailable ?? true, 
      businessName: (provider as any).businessName ?? null,
      serviceRadius: (provider as any).serviceRadius ?? null,
      hourlyRate: (provider as any).hourlyRate ?? null,

      // 💥 CRITICAL FIX: The rating must be a STRING ("0") to match the assumed schema type
      rating: (provider as any).rating ?? "0", 
      reviewCount: (provider as any).reviewCount ?? 0,
      categories: provider.categories ?? [],
      availability: (provider as any).availability ?? null,

      // ✅ FIX: Added missing fields required by the full Provider type
      profileImage: (provider as any).profileImage ?? null, 
      portfolio: (provider as any).portfolio ?? [], 
      certifications: (provider as any).certifications ?? [], 
      yearsExperience: (provider as any).yearsExperience ?? null,
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
      status: booking.status ?? "pending",
      estimatedDuration: booking.estimatedDuration ?? null,
      estimatedCost: booking.estimatedCost ?? null,
      actualCost: booking.actualCost ?? null,
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

import { db } from "./db";
import { users, serviceCategories, providers, providerCategories, bookings, reviews } from "@shared/schema";
import { eq, and, like, sql } from "drizzle-orm";

export class DbStorage implements IStorage {
  async initializeSeedData() {
    // Check if data already exists
    const existingCategories = await db.select().from(serviceCategories);
    if (existingCategories.length > 0) return;

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
    const allCategories = await db.select().from(serviceCategories);
    const electricalCat = allCategories.find(c => c.name === "Electrical");
    const plumbingCat = allCategories.find(c => c.name === "Plumbing");
    const carpentryCat = allCategories.find(c => c.name === "Carpentry");

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
        reviewCount: 93,
        categories: plumbingCat ? [plumbingCat.id] : [],
      },
      {
        email: "david@example.com",
        password: await bcrypt.hash("password123", 10),
        firstName: "David",
        lastName: "Chen",
        role: "provider" as const,
        specialty: "Master Carpenter",
        location: "West End",
        description: "Custom furniture, deck building, and general carpentry. Quality craftsmanship guaranteed.",
        hourlyRate: "75.00",
        isApproved: true,
        rating: "5.0",
        reviewCount: 45,
        categories: carpentryCat ? [carpentryCat.id] : [],
      },
    ];

    for (const providerData of sampleProviders) {
      const { categories: cats, ...userData } = providerData;
      const user = await this.createUser(userData);
      const provider = await this.createProvider({
        userId: user.id,
        businessName: `${providerData.firstName}'s ${providerData.specialty}`,
        specialty: providerData.specialty,
        description: providerData.description,
        location: providerData.location,
        hourlyRate: providerData.hourlyRate,
        isApproved: providerData.isApproved,
        categories: cats,
      });
      
      // Update rating and review count separately (not part of InsertProvider)
      await this.updateProvider(provider.id, {
        rating: providerData.rating,
        reviewCount: providerData.reviewCount,
      });
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  // Service category methods
  async getServiceCategories(): Promise<ServiceCategory[]> {
    return db.select().from(serviceCategories);
  }

  async createServiceCategory(category: InsertServiceCategory): Promise<ServiceCategory> {
    const result = await db.insert(serviceCategories).values(category).returning();
    return result[0];
  }

  // Provider methods
  async getProvider(id: string): Promise<Provider | undefined> {
    const result = await db.select().from(providers).where(eq(providers.id, id));
    return result[0];
  }

  async getProviderByUserId(userId: string): Promise<Provider | undefined> {
    const result = await db.select().from(providers).where(eq(providers.userId, userId));
    return result[0];
  }

  async getProviders(filters?: { categoryId?: string; location?: string; isApproved?: boolean }): Promise<Provider[]> {
    let query = db.select().from(providers);
    
    const conditions = [];
    if (filters?.isApproved !== undefined) {
      conditions.push(eq(providers.isApproved, filters.isApproved));
    }
    if (filters?.location) {
      conditions.push(like(providers.location, `%${filters.location}%`));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const allProviders = await query;
    
    // Filter by category if provided
    if (filters?.categoryId) {
      return allProviders.filter(p => p.categories?.includes(filters.categoryId!));
    }
    
    return allProviders;
  }

  async createProvider(provider: InsertProvider): Promise<Provider> {
    const result = await db.insert(providers).values(provider).returning();
    return result[0];
  }

  async updateProvider(id: string, updates: Partial<Provider>): Promise<Provider | undefined> {
    const result = await db.update(providers).set(updates).where(eq(providers.id, id)).returning();
    return result[0];
  }

  // Provider category methods
  async getProviderCategories(providerId: string): Promise<ProviderCategory[]> {
    return db.select().from(providerCategories).where(eq(providerCategories.providerId, providerId));
  }

  async createProviderCategory(pc: InsertProviderCategory): Promise<ProviderCategory> {
    const result = await db.insert(providerCategories).values(pc).returning();
    return result[0];
  }

  // Booking methods
  async getBooking(id: string): Promise<Booking | undefined> {
    const result = await db.select().from(bookings).where(eq(bookings.id, id));
    return result[0];
  }

  async getBookings(filters?: { customerId?: string; providerId?: string; status?: string }): Promise<Booking[]> {
    const conditions = [];
    if (filters?.customerId) conditions.push(eq(bookings.customerId, filters.customerId));
    if (filters?.providerId) conditions.push(eq(bookings.providerId, filters.providerId));
    if (filters?.status) conditions.push(eq(bookings.status, filters.status as any));
    
    if (conditions.length > 0) {
      return db.select().from(bookings).where(and(...conditions));
    }
    return db.select().from(bookings);
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const result = await db.insert(bookings).values(booking).returning();
    return result[0];
  }

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | undefined> {
    const result = await db.update(bookings).set(updates).where(eq(bookings.id, id)).returning();
    return result[0];
  }

  // Review methods
  async getReviews(providerId: string): Promise<Review[]> {
    return db.select().from(reviews).where(eq(reviews.providerId, providerId));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const result = await db.insert(reviews).values(review).returning();
    return result[0];
  }

  async updateReview(id: string, updates: Partial<Review>): Promise<Review | undefined> {
    const result = await db.update(reviews).set(updates).where(eq(reviews.id, id)).returning();
    return result[0];
  }

  async deleteReview(id: string): Promise<boolean> {
    const result = await db.delete(reviews).where(eq(reviews.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = process.env.NODE_ENV === 'test' ? new MemStorage() : new DbStorage();
