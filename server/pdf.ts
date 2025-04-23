
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
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
    });
    
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    // Register a font for bold text
    doc.font('Helvetica-Bold');
    
    // Header Section
    doc.fontSize(28).text('INVOICE', { align: 'center' });
    doc.fontSize(16).text(`#${invoice.invoiceNumber}`, { align: 'center' });
    doc.moveDown(2);

    // Company Info - Right Aligned
    doc.fontSize(18).text('FreelanceFlow', { align: 'right' });
    doc.font('Helvetica').fontSize(10)
      .text('123 Main Street', { align: 'right' })
      .text('New York, NY 10001', { align: 'right' })
      .text('contact@freelanceflow.com', { align: 'right' });
    doc.moveDown(2);

    // Bill To Section - Left Aligned
    doc.font('Helvetica-Bold').fontSize(10).text('Bill To:');
    doc.font('Helvetica').fontSize(12).moveDown(0.5);
    doc.text(client.companyName);
    if (client.contactPerson) doc.text(`Attn: ${client.contactPerson}`);
    if (client.address) doc.text(client.address);
    doc.text(client.billingEmail);
    doc.moveDown();

    // Grid Details
    const detailsX = 350;
    const labelX = detailsX;
    const valueX = detailsX + 120;
    
    const addGridRow = (label: string, value: string) => {
      doc.font('Helvetica-Bold').fontSize(10).text(label, labelX);
      doc.font('Helvetica').fontSize(12).text(value, valueX, doc.y - doc.currentLineHeight());
      doc.moveDown(0.5);
    };

    addGridRow('Invoice Date:', formatDate(invoice.invoiceDate));
    addGridRow('Due Date:', formatDate(invoice.dueDate));
    addGridRow('Project:', project.name);
    addGridRow('Amount Due:', formatCurrency(invoice.amount));
    doc.moveDown(2);

    // Line Items Table
    const tableTop = doc.y;
    const colPadding = 12;
    const descriptionX = 50;
    const rateX = 350;
    const quantityX = 430;
    const amountX = 510;

    // Table Headers
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('Description', descriptionX, tableTop);
    doc.text('Rate', rateX, tableTop, { width: 70, align: 'center' });
    doc.text('Qty', quantityX, tableTop, { width: 40, align: 'center' });
    doc.text('Amount', amountX, tableTop, { width: 70, align: 'right' });
    
    // Draw header line
    doc.moveTo(50, tableTop + 20).lineTo(580, tableTop + 20).stroke();
    doc.moveDown();

    // Table Content
    doc.font('Helvetica').fontSize(11);
    let currentY = tableTop + 35;

    if (project.type === 'daily_rate') {
      const sortedWorkdays = [...workdays].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      sortedWorkdays.forEach(workday => {
        doc.text(`Daily Rate - ${formatDate(workday.date)}`, descriptionX, currentY);
        doc.text(formatCurrency(project.rate), rateX, currentY, { width: 70, align: 'center' });
        doc.text('1', quantityX, currentY, { width: 40, align: 'center' });
        doc.text(formatCurrency(project.rate), amountX, currentY, { width: 70, align: 'right' });
        currentY += 25;
      });
    } else {
      doc.text(`${project.name} - Fixed Price`, descriptionX, currentY);
      doc.text(formatCurrency(project.rate), rateX, currentY, { width: 70, align: 'center' });
      doc.text('1', quantityX, currentY, { width: 40, align: 'center' });
      doc.text(formatCurrency(project.rate), amountX, currentY, { width: 70, align: 'right' });
      currentY += 25;
    }

    // Draw separator line
    doc.moveTo(50, currentY + 10).lineTo(580, currentY + 10).stroke();
    currentY += 30;

    // Totals section
    const totalsX = 440;
    const addTotalRow = (label: string, value: string, isFinal = false) => {
      doc.font(isFinal ? 'Helvetica-Bold' : 'Helvetica').fontSize(isFinal ? 12 : 10);
      doc.text(label, totalsX, currentY);
      doc.text(value, amountX, currentY, { width: 70, align: 'right' });
      currentY += 20;
    };

    addTotalRow('Subtotal:', formatCurrency(invoice.amount));
    addTotalRow('Tax (0%):', '$0.00');
    currentY += 5;
    // Draw line before final total
    doc.moveTo(totalsX, currentY).lineTo(580, currentY).stroke();
    currentY += 10;
    addTotalRow('Total:', formatCurrency(invoice.amount), true);

    // Notes Section
    currentY += 40;
    doc.font('Helvetica-Bold').fontSize(10).text('Notes:', 50, currentY);
    doc.font('Helvetica').fontSize(10).moveDown(0.5);
    doc.text(invoice.notes || 'Thank you for your business! Payment is due within 14 days of invoice date.');
    
    doc.moveDown();
    doc.text('Please make payment via bank transfer to the following account:');
    doc.moveDown(0.5);
    doc.text('Bank: Example Bank');
    doc.text('Account Name: FreelanceFlow Inc.');
    doc.text('Account Number: XXXX-XXXX-XXXX-1234');

    doc.end();
  });
}
