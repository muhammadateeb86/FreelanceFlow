import { 
  users, type User, type InsertUser,
  clients, type Client, type InsertClient,
  projects, type Project, type InsertProject,
  workdays, type Workday, type InsertWorkday,
  invoices, type Invoice, type InsertInvoice
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

// Storage interface with all CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Client operations
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  
  // Project operations
  getProjects(): Promise<Project[]>;
  getProjectsByClientId(clientId: number): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Workday operations
  getWorkdaysByProjectId(projectId: number): Promise<Workday[]>;
  createWorkday(workday: InsertWorkday): Promise<Workday>;
  deleteWorkday(id: number): Promise<boolean>;
  
  // Invoice operations
  getInvoices(): Promise<Invoice[]>;
  getInvoicesByClientId(clientId: number): Promise<Invoice[]>;
  getInvoicesByProjectId(projectId: number): Promise<Invoice[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoiceStatus(id: number, status: string): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;
  getNextInvoiceNumber(): Promise<string>;
}

// Database Implementation
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  // Client operations
  async getClients(): Promise<Client[]> {
    return await db.select().from(clients);
  }
  
  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }
  
  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }
  
  async updateClient(id: number, clientUpdate: Partial<InsertClient>): Promise<Client | undefined> {
    const [updatedClient] = await db
      .update(clients)
      .set(clientUpdate)
      .where(eq(clients.id, id))
      .returning();
    return updatedClient || undefined;
  }
  
  async deleteClient(id: number): Promise<boolean> {
    // First delete all invoices associated with the client's projects
    const clientProjects = await this.getProjectsByClientId(id);
    for (const project of clientProjects) {
      const projectInvoices = await this.getInvoicesByProjectId(project.id);
      for (const invoice of projectInvoices) {
        await db.delete(invoices).where(eq(invoices.id, invoice.id));
      }
      // Delete project workdays
      await db.delete(workdays).where(eq(workdays.projectId, project.id));
      // Delete the project
      await db.delete(projects).where(eq(projects.id, project.id));
    }

    // Delete client's direct invoices
    await db.delete(invoices).where(eq(invoices.clientId, id));
    
    // Finally delete the client
    const result = await db.delete(clients).where(eq(clients.id, id));
    return result.rowCount > 0;
  }
  
  // Project operations
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }
  
  async getProjectsByClientId(clientId: number): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.clientId, clientId));
  }
  
  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id));
    return project || undefined;
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db
      .insert(projects)
      .values(project)
      .returning();
    return newProject;
  }
  
  async updateProject(id: number, projectUpdate: Partial<InsertProject>): Promise<Project | undefined> {
    const [updatedProject] = await db
      .update(projects)
      .set(projectUpdate)
      .where(eq(projects.id, id))
      .returning();
    return updatedProject || undefined;
  }
  
  async deleteProject(id: number): Promise<boolean> {
    // Delete project invoices
    await db.delete(invoices).where(eq(invoices.projectId, id));
    
    // Delete project workdays
    await db.delete(workdays).where(eq(workdays.projectId, id));
    
    // Delete the project
    const result = await db.delete(projects).where(eq(projects.id, id));
    return result.rowCount > 0;
  }
  
  // Workday operations
  async getWorkdaysByProjectId(projectId: number): Promise<Workday[]> {
    return await db
      .select()
      .from(workdays)
      .where(eq(workdays.projectId, projectId));
  }
  
  async createWorkday(workday: InsertWorkday): Promise<Workday> {
    const [newWorkday] = await db
      .insert(workdays)
      .values(workday)
      .returning();
    return newWorkday;
  }
  
  async deleteWorkday(id: number): Promise<boolean> {
    const result = await db.delete(workdays).where(eq(workdays.id, id));
    return result.rowCount > 0;
  }
  
  // Invoice operations
  async getInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices);
  }
  
  async getInvoicesByClientId(clientId: number): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.clientId, clientId));
  }
  
  async getInvoicesByProjectId(projectId: number): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.projectId, projectId));
  }
  
  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id));
    return invoice || undefined;
  }
  
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    // Generate invoice number if not provided
    let invoiceToInsert = { ...invoice };
    if (!invoiceToInsert.invoiceNumber) {
      invoiceToInsert.invoiceNumber = await this.getNextInvoiceNumber();
    }
    
    const [newInvoice] = await db
      .insert(invoices)
      .values(invoiceToInsert)
      .returning();
    return newInvoice;
  }
  
  async updateInvoiceStatus(id: number, status: string): Promise<Invoice | undefined> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set({ status })
      .where(eq(invoices.id, id))
      .returning();
    return updatedInvoice || undefined;
  }
  
  async deleteInvoice(id: number): Promise<boolean> {
    const result = await db.delete(invoices).where(eq(invoices.id, id));
    return result.rowCount > 0;
  }
  
  async getNextInvoiceNumber(): Promise<string> {
    // Get the latest invoice to determine the next number
    const [latestInvoice] = await db
      .select()
      .from(invoices)
      .orderBy(desc(invoices.id))
      .limit(1);
    
    const year = new Date().getFullYear();
    let nextNum = 1;
    
    if (latestInvoice && latestInvoice.invoiceNumber) {
      // Try to extract the number from the existing format (e.g., INV-2025-001)
      const match = latestInvoice.invoiceNumber.match(/INV-\d+-(\d+)/);
      if (match && match[1]) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    
    return `INV-${year}-${String(nextNum).padStart(3, '0')}`;
  }
}

// Initialize the database storage
export const storage = new DatabaseStorage();
