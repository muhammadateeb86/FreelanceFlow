
import PDFDocument from 'pdfkit';
import { Client, Invoice, Project, Workday } from "@shared/schema";
import { formatCurrency, formatDate } from '@shared/utils';

export async function generateInvoicePDF(
  invoice: Invoice,
  client: Client,
  project: Project,
  workdays: Workday[]
): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    // Header
    doc.fontSize(20).text('INVOICE', { align: 'center' });
    doc.moveDown();

    // Invoice Details
    doc.fontSize(12);
    doc.text(`Invoice Number: ${invoice.invoiceNumber}`);
    doc.text(`Date: ${formatDate(invoice.invoiceDate)}`);
    doc.text(`Due Date: ${formatDate(invoice.dueDate)}`);
    doc.moveDown();

    // Client Details
    doc.text('Bill To:');
    doc.text(client.companyName);
    if (client.contactPerson) doc.text(client.contactPerson);
    if (client.address) doc.text(client.address);
    doc.moveDown();

    // Project Details
    doc.text('Project:');
    doc.text(`Name: ${project.name}`);
    doc.text(`Type: ${project.type}`);
    doc.moveDown();

    // Workdays
    doc.text('Work Period:');
    const sortedWorkdays = [...workdays].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (sortedWorkdays.length > 0) {
      doc.text(`From ${formatDate(sortedWorkdays[0].date)} to ${formatDate(sortedWorkdays[sortedWorkdays.length - 1].date)}`);
    }
    doc.text(`Total Days: ${workdays.length}`);
    doc.moveDown();

    // Amount
    doc.fontSize(14);
    doc.text('Amount Due:', { continued: true })
       .text(formatCurrency(invoice.amount), { align: 'right' });

    doc.end();
  });
}
