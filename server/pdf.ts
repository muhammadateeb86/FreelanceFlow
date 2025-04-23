
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
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    // Company Header
    doc.fontSize(24).text('INVOICE', { align: 'center' });
    doc.fontSize(14).text(`#${invoice.invoiceNumber}`, { align: 'center' });
    doc.moveDown(2);

    // Company and Client Info
    doc.fontSize(16).text('FreelanceFlow', { align: 'right' });
    doc.fontSize(10)
      .text('123 Main Street', { align: 'right' })
      .text('New York, NY 10001', { align: 'right' })
      .text('contact@freelanceflow.com', { align: 'right' });

    doc.moveDown(2);

    // Bill To Section
    doc.fontSize(10).text('Bill To:', { continued: true });
    doc.moveDown();
    doc.fontSize(12).text(client.companyName);
    if (client.contactPerson) doc.text(`Attn: ${client.contactPerson}`);
    if (client.address) doc.text(client.address);
    doc.text(client.billingEmail);

    doc.moveDown();

    // Invoice Details Grid
    const detailsX = 300;
    doc.fontSize(10).text('Invoice Date:', detailsX);
    doc.fontSize(12).text(formatDate(invoice.invoiceDate), detailsX + 100);
    
    doc.fontSize(10).text('Due Date:', detailsX);
    doc.fontSize(12).text(formatDate(invoice.dueDate), detailsX + 100);
    
    doc.fontSize(10).text('Project:', detailsX);
    doc.fontSize(12).text(project.name, detailsX + 100);
    
    doc.fontSize(10).text('Amount Due:', detailsX);
    doc.fontSize(12).text(formatCurrency(invoice.amount), detailsX + 100);

    doc.moveDown(2);

    // Line Items Table
    const tableTop = doc.y;
    const itemX = 50;
    const descriptionX = itemX + 0;
    const rateX = itemX + 250;
    const quantityX = itemX + 350;
    const amountX = itemX + 450;

    // Table Headers
    doc.fontSize(10)
      .text('Description', descriptionX)
      .text('Rate', rateX)
      .text('Quantity', quantityX)
      .text('Amount', amountX);

    doc.moveDown();

    // Table Content
    if (project.type === 'daily_rate') {
      // For daily rate projects, show each workday
      const sortedWorkdays = [...workdays].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      sortedWorkdays.forEach(workday => {
        doc.text(`Daily Rate - ${formatDate(workday.date)}`, descriptionX)
           .text(formatCurrency(project.rate), rateX)
           .text('1', quantityX)
           .text(formatCurrency(project.rate), amountX);
        doc.moveDown();
      });
    } else {
      // For fixed price projects, show one line item
      doc.text(`${project.name} - Fixed Price`, descriptionX)
         .text(formatCurrency(project.rate), rateX)
         .text('1', quantityX)
         .text(formatCurrency(project.rate), amountX);
    }

    doc.moveDown(2);

    // Totals
    doc.fontSize(10).text('Subtotal:', amountX - 100);
    doc.fontSize(12).text(formatCurrency(invoice.amount), amountX);
    
    doc.fontSize(10).text('Tax (0%):', amountX - 100);
    doc.fontSize(12).text('$0.00', amountX);
    
    doc.moveDown();
    doc.fontSize(12).text('Total:', amountX - 100);
    doc.fontSize(14).text(formatCurrency(invoice.amount), amountX);

    // Notes
    doc.moveDown(2);
    doc.fontSize(10).text('Notes:');
    doc.fontSize(10).text(invoice.notes || 'Thank you for your business! Payment is due within 14 days of invoice date.');
    
    doc.moveDown();
    doc.text('Please make payment via bank transfer to the following account:');
    doc.text('Bank: Example Bank');
    doc.text('Account Name: FreelanceFlow Inc.');
    doc.text('Account Number: XXXX-XXXX-XXXX-1234');

    doc.end();
  });
}
