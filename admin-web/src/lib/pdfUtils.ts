import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice } from '../types';

export const generateInvoicePDF = (invoice: Invoice) => {
  const doc = new jsPDF();
  const company = invoice.company;

  // Header
  doc.setFontSize(24);
  doc.text('INVOICE', 14, 20);

  doc.setFontSize(10);
  doc.text('The Winery', 14, 30);
  doc.text('123 Wine Street', 14, 35);
  doc.text('Singapore, 123456', 14, 40);
  doc.text('UEN: 202312345W', 14, 45);
  doc.text('Email: billing@thewinery.com.sg', 14, 50);

  // Invoice Details
  doc.setFontSize(12);
  doc.text(`Invoice #: ${invoice.invoice_number}`, 140, 30);
  doc.text(
    `Date: ${new Date(invoice.invoice_date).toLocaleDateString()}`,
    140,
    36
  );
  doc.text(
    `Due Date: ${new Date(invoice.payment_due_date).toLocaleDateString()}`,
    140,
    42
  );
  doc.text(`Terms: ${invoice.payment_terms}`, 140, 48);

  // Bill To
  doc.setFontSize(12);
  doc.text('Bill To:', 14, 65);
  doc.setFontSize(10);
  if (company) {
    doc.text(company.name, 14, 72);
    doc.text(company.email, 14, 77);
    if (company.uen) doc.text(`UEN: ${company.uen}`, 14, 82);
    // Add address if available
  }

  // Items Table
  // Since the invoice object from the list view might not have order details,
  // we would ideally fetch the orders associated with this invoice here.
  // For this initial implementation, we'll show a summary line.
  
  const tableData = [
    [
      'Monthly Service & Orders',
      '1',
      `$${invoice.billing_amount.toFixed(2)}`,
      `$${invoice.billing_amount.toFixed(2)}`,
    ],
  ];

  autoTable(doc, {
    startY: 90,
    head: [['Description', 'Qty', 'Unit Price', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [0, 0, 0] }, // Black header
  });

  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.text('Subtotal:', 140, finalY);
  doc.text(`$${invoice.billing_amount.toFixed(2)}`, 170, finalY, { align: 'right' });
  
  doc.text('Total:', 140, finalY + 6);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`$${invoice.billing_amount.toFixed(2)}`, 170, finalY + 6, { align: 'right' });
  
  // Payment Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Payment Instructions:', 14, finalY + 20);
  doc.text('Bank Transfer to: DBS Bank', 14, finalY + 26);
  doc.text('Account Name: The Winery Pte Ltd', 14, finalY + 31);
  doc.text('Account No: 123-456-789-0', 14, finalY + 36);
  doc.text('Please quote invoice number in transfer reference.', 14, finalY + 42);

  // Footer
  doc.setFontSize(8);
  doc.text('Thank you for your business!', 105, 280, { align: 'center' });

  // Save
  doc.save(`${invoice.invoice_number}.pdf`);
};
