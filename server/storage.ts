import { 
  users, type User, type InsertUser,
  clients, type Client, type InsertClient,
  projects, type Project, type InsertProject,
  workdays, type Workday, type InsertWorkday,
  invoices, type Invoice, type InsertInvoice
} from "@shared/schema";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private clients: Map<number, Client>;
  private projects: Map<number, Project>;
  private workdays: Map<number, Workday>;
  private invoices: Map<number, Invoice>;
  private userId: number;
  private clientId: number;
  private projectId: number;
  private workdayId: number;
  private invoiceId: number;
  private invoiceCount: number;

  constructor() {
    this.users = new Map();
    this.clients = new Map();
    this.projects = new Map();
    this.workdays = new Map();
    this.invoices = new Map();
    this.userId = 1;
    this.clientId = 1;
    this.projectId = 1;
    this.workdayId = 1;
    this.invoiceId = 1;
    this.invoiceCount = 1;
    
    // Initialize with default user
    this.createUser({
      username: "admin",
      password: "password", // In a real app, this would be hashed
      name: "John Doe",
      email: "john@example.com",
      company: "FreelanceFlow",
      address: "123 Main Street, New York, NY 10001",
      phone: "+1 (123) 456-7890"
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }

  // Client methods
  async getClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async createClient(client: InsertClient): Promise<Client> {
    const id = this.clientId++;
    const now = new Date();
    const newClient: Client = { ...client, id, createdAt: now };
    this.clients.set(id, newClient);
    return newClient;
  }

  async updateClient(id: number, clientUpdate: Partial<InsertClient>): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;
    
    const updatedClient: Client = { ...client, ...clientUpdate };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: number): Promise<boolean> {
    return this.clients.delete(id);
  }

  // Project methods
  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProjectsByClientId(clientId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      (project) => project.clientId === clientId
    );
  }

  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(project: InsertProject): Promise<Project> {
    const id = this.projectId++;
    const now = new Date();
    const newProject: Project = { ...project, id, createdAt: now };
    this.projects.set(id, newProject);
    return newProject;
  }

  async updateProject(id: number, projectUpdate: Partial<InsertProject>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const updatedProject: Project = { ...project, ...projectUpdate };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }

  // Workday methods
  async getWorkdaysByProjectId(projectId: number): Promise<Workday[]> {
    return Array.from(this.workdays.values()).filter(
      (workday) => workday.projectId === projectId
    );
  }

  async createWorkday(workday: InsertWorkday): Promise<Workday> {
    const id = this.workdayId++;
    const now = new Date();
    const newWorkday: Workday = { ...workday, id, createdAt: now };
    this.workdays.set(id, newWorkday);
    return newWorkday;
  }

  async deleteWorkday(id: number): Promise<boolean> {
    return this.workdays.delete(id);
  }

  // Invoice methods
  async getInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values());
  }

  async getInvoicesByClientId(clientId: number): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(
      (invoice) => invoice.clientId === clientId
    );
  }

  async getInvoicesByProjectId(projectId: number): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(
      (invoice) => invoice.projectId === projectId
    );
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const id = this.invoiceId++;
    const now = new Date();
    const newInvoice: Invoice = { ...invoice, id, createdAt: now };
    this.invoices.set(id, newInvoice);
    return newInvoice;
  }

  async updateInvoiceStatus(id: number, status: string): Promise<Invoice | undefined> {
    const invoice = this.invoices.get(id);
    if (!invoice) return undefined;
    
    const updatedInvoice: Invoice = { ...invoice, status };
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    return this.invoices.delete(id);
  }

  async getNextInvoiceNumber(): Promise<string> {
    // Format: INV-YEAR-SEQUENCE (e.g., INV-2023-001)
    const year = new Date().getFullYear();
    const sequence = this.invoiceCount++;
    return `INV-${year}-${sequence.toString().padStart(3, '0')}`;
  }
}

export const storage = new MemStorage();
