import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  role: text("role", { enum: ["customer", "provider", "admin"] }).notNull().default("customer"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const serviceCategories = pgTable("service_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
});

export const providers = pgTable("providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  businessName: text("business_name"),
  specialty: text("specialty").notNull(),
  description: text("description"),
  location: text("location").notNull(),
  serviceRadius: integer("service_radius").default(25),
  hourlyRate: decimal("hourly_rate", { precision: 8, scale: 2 }),
  isApproved: boolean("is_approved").default(false),
  isAvailable: boolean("is_available").default(true),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  profileImage: text("profile_image"),
  portfolio: jsonb("portfolio").$type<string[]>().default([]),
  certifications: text("certifications").array().default([]),
  categories: text("categories").array().default([]),
  yearsExperience: integer("years_experience"),
  availability: jsonb("availability").$type<{
    [key: string]: { start: string; end: string; available: boolean }[];
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const providerCategories = pgTable("provider_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: varchar("provider_id").notNull(),
  categoryId: varchar("category_id").notNull(),
});

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull(),
  providerId: varchar("provider_id").notNull(),
  serviceDescription: text("service_description").notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  scheduledTime: text("scheduled_time").notNull(),
  status: text("status", { enum: ["pending", "confirmed", "completed", "cancelled"] }).notNull().default("pending"),
  customerAddress: text("customer_address").notNull(),
  estimatedDuration: integer("estimated_duration"), // in hours
  estimatedCost: decimal("estimated_cost", { precision: 8, scale: 2 }),
  actualCost: decimal("actual_cost", { precision: 8, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull(),
  customerId: varchar("customer_id").notNull(),
  providerId: varchar("provider_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  isVisible: boolean("is_visible").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertServiceCategorySchema = createInsertSchema(serviceCategories).omit({
  id: true,
});

export const insertProviderSchema = createInsertSchema(providers).omit({
  id: true,
  rating: true,
  reviewCount: true,
  createdAt: true,
});

export const insertProviderCategorySchema = createInsertSchema(providerCategories).omit({
  id: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Admin login schema
export const adminLoginSchema = z.object({
  password: z.string(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type ServiceCategory = typeof serviceCategories.$inferSelect;
export type InsertServiceCategory = z.infer<typeof insertServiceCategorySchema>;
export type Provider = typeof providers.$inferSelect;
export type InsertProvider = z.infer<typeof insertProviderSchema>;
export type ProviderCategory = typeof providerCategories.$inferSelect;
export type InsertProviderCategory = z.infer<typeof insertProviderCategorySchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
