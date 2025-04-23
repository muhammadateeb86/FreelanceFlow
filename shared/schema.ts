import { pgTable, text, serial, integer, boolean, date, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Client Schema
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  contactPerson: text("contact_person"),
  emails: jsonb("emails").$type<string[]>().notNull().default([]),
  billingEmail: text("billing_email").notNull(),
  phone: text("phone"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

// Project Schema
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  type: text("type").notNull(), // "daily_rate" or "fixed_price"
  rate: integer("rate").notNull(), // Daily rate or fixed price in cents
  startDate: date("start_date"),
  endDate: date("end_date"),
  status: text("status").notNull().default("open"), // "open", "in_progress", "completed"
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// Workday Schema
export const workdays = pgTable("workdays", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWorkdaySchema = createInsertSchema(workdays).omit({
  id: true,
  createdAt: true,
});

export type InsertWorkday = z.infer<typeof insertWorkdaySchema>;
export type Workday = typeof workdays.$inferSelect;

// Invoice Schema
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  amount: integer("amount").notNull(), // Total amount in cents
  status: text("status").notNull().default("pending"), // "pending", "paid", "overdue"
  invoiceDate: date("invoice_date").notNull(),
  dueDate: date("due_date").notNull(),
  workdaysIds: jsonb("workdays_ids").$type<number[]>().notNull().default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// User Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  address: text("address"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
