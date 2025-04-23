import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertClientSchema, 
  insertProjectSchema, 
  insertWorkdaySchema, 
  insertInvoiceSchema,
  insertUserSchema 
} from "@shared/schema";
import { generateInvoicePDF } from "./pdf";
import { sendEmail } from "./email";

export async function registerRoutes(app: Express): Promise<Server> {
  // Client routes
  app.get("/api/clients", async (req: Request, res: Response) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);

      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", async (req: Request, res: Response) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.put("/api/clients/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(id, validatedData);

      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteClient(id);

      if (!success) {
        return res.status(404).json({ message: "Client not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Project routes
  app.get("/api/projects", async (req: Request, res: Response) => {
    try {
      const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;

      let projects;
      if (clientId) {
        projects = await storage.getProjectsByClientId(clientId);
      } else {
        projects = await storage.getProjects();
      }

      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req: Request, res: Response) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.put("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(id, validatedData);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProject(id);

      if (!success) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Workday routes
  app.get("/api/projects/:projectId/workdays", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const workdays = await storage.getWorkdaysByProjectId(projectId);
      res.json(workdays);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workdays" });
    }
  });

  app.post("/api/workdays", async (req: Request, res: Response) => {
    try {
      const validatedData = insertWorkdaySchema.parse(req.body);
      const workday = await storage.createWorkday(validatedData);
      res.status(201).json(workday);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid workday data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create workday" });
    }
  });

  app.delete("/api/workdays/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteWorkday(id);

      if (!success) {
        return res.status(404).json({ message: "Workday not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete workday" });
    }
  });

  // Invoice routes
  app.get("/api/invoices", async (req: Request, res: Response) => {
    try {
      const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;

      let invoices;
      if (clientId) {
        invoices = await storage.getInvoicesByClientId(clientId);
      } else if (projectId) {
        invoices = await storage.getInvoicesByProjectId(projectId);
      } else {
        invoices = await storage.getInvoices();
      }

      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await storage.getInvoice(id);

      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  app.post("/api/invoices", async (req: Request, res: Response) => {
    try {
      // If no invoice number is provided, generate one
      let invoiceData = req.body;
      if (!invoiceData.invoiceNumber) {
        invoiceData.invoiceNumber = await storage.getNextInvoiceNumber();
      }

      const validatedData = insertInvoiceSchema.parse(invoiceData);
      const invoice = await storage.createInvoice(validatedData);
      res.status(201).json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid invoice data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  app.put("/api/invoices/:id/status", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (!status || !["pending", "paid", "overdue"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }

      const invoice = await storage.updateInvoiceStatus(id, status);

      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Failed to update invoice status" });
    }
  });

  app.delete("/api/invoices/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteInvoice(id);

      if (!success) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });

  // PDF generation
  app.get("/api/invoices/:id/pdf", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await storage.getInvoice(id);

      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      const client = await storage.getClient(invoice.clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      const project = await storage.getProject(invoice.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const workdays = await Promise.all(
        invoice.workdaysIds.map(wdId => storage.getWorkdaysByProjectId(project.id))
      );


      const pdfBuffer = await generateInvoicePDF(invoice, client, project, workdays.flat());

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
      res.end(pdfBuffer);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate invoice PDF" });
    }
  });

  // Email sending
  app.post("/api/invoices/:id/send", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { recipient, subject, message } = req.body;

      if (!recipient || !subject || !message) {
        return res.status(400).json({ 
          message: "Missing required fields", 
          fields: { recipient, subject, message } 
        });
      }

      const invoice = await storage.getInvoice(id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      const client = await storage.getClient(invoice.clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      const project = await storage.getProject(invoice.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const workdays = await Promise.all(
        invoice.workdaysIds.map(wdId => storage.getWorkdaysByProjectId(project.id))
      );

      const pdfBuffer = await generateInvoicePDF(invoice, client, project, workdays.flat());

      const emailSent = await sendEmail({
        to: recipient,
        subject,
        text: message,
        attachments: [
          {
            filename: `invoice-${invoice.invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      });

      if (emailSent) {
        res.json({ message: "Invoice email sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send invoice email" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to send invoice email" });
    }
  });

  // Helper endpoints
  app.get("/api/next-invoice-number", async (req: Request, res: Response) => {
    try {
      const nextInvoiceNumber = await storage.getNextInvoiceNumber();
      res.json({ invoiceNumber: nextInvoiceNumber });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate next invoice number" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}