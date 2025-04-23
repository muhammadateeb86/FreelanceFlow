// Client Types
export interface Client {
  id: number;
  companyName: string;
  contactPerson: string | null;
  emails: string[];
  billingEmail: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CreateClientInput {
  companyName: string;
  contactPerson?: string;
  emails: string[];
  billingEmail: string;
  phone?: string;
  address?: string;
  notes?: string;
}

// Project Types
export type ProjectType = 'daily_rate' | 'fixed_price';
export type ProjectStatus = 'open' | 'in_progress' | 'completed';

export interface Project {
  id: number;
  name: string;
  clientId: number;
  type: ProjectType;
  rate: number; // Stored in cents
  startDate: string | null;
  endDate: string | null;
  status: ProjectStatus;
  description: string | null;
  createdAt: string;
}

export interface CreateProjectInput {
  name: string;
  clientId: number;
  type: ProjectType;
  rate: number;
  startDate?: string;
  endDate?: string;
  status: ProjectStatus;
  description?: string;
}

// Workday Types
export interface Workday {
  id: number;
  projectId: number;
  date: string;
  createdAt: string;
}

export interface CreateWorkdayInput {
  projectId: number;
  date: string;
}

// Invoice Types
export type InvoiceStatus = 'pending' | 'paid' | 'overdue';

export interface Invoice {
  id: number;
  invoiceNumber: string;
  projectId: number;
  clientId: number;
  amount: number; // Stored in cents
  status: InvoiceStatus;
  invoiceDate: string;
  dueDate: string;
  workdaysIds: number[];
  notes: string | null;
  createdAt: string;
}

export interface CreateInvoiceInput {
  invoiceNumber?: string;
  projectId: number;
  clientId: number;
  amount: number;
  status?: InvoiceStatus;
  invoiceDate: string;
  dueDate: string;
  workdaysIds: number[];
  notes?: string;
}

// User Types
export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  company: string | null;
  address: string | null;
  phone: string | null;
  createdAt: string;
}

// Dashboard Stats Type
export interface DashboardStats {
  activeProjects: number;
  totalClients: number;
  invoicesSent: number;
  totalEarnings: number;
}

// Project With Client
export interface ProjectWithClient extends Project {
  client?: Client;
}

// Invoice With Client and Project
export interface InvoiceWithDetails extends Invoice {
  client?: Client;
  project?: Project;
}

// Email Types
export interface SendInvoiceEmailInput {
  recipient: string;
  subject: string;
  message: string;
  attachPdf?: boolean;
}
