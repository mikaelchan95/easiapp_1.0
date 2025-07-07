export const calculateDaysUntilDue = (dueDate: string): number => {
  const due = new Date(dueDate);
  const now = new Date();
  const diffTime = due.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const formatDaysUntilDue = (dueDate: string): string => {
  const days = calculateDaysUntilDue(dueDate);
  
  if (days < 0) {
    return `${Math.abs(days)} days overdue`;
  } else if (days === 0) {
    return 'Due today';
  } else if (days === 1) {
    return 'Due tomorrow';
  } else {
    return `Due in ${days} days`;
  }
};

export const getCreditScoreColor = (score: number): string => {
  if (score >= 750) return 'text-green-600';
  if (score >= 650) return 'text-yellow-600';
  return 'text-red-600';
};

export const getCreditScoreLabel = (score: number): string => {
  if (score >= 750) return 'Excellent';
  if (score >= 700) return 'Good';
  if (score >= 650) return 'Fair';
  return 'Poor';
};

export const formatInvoiceNumber = (invoiceId: string): string => {
  return invoiceId.replace('INV-', '');
};

export const calculateInterest = (amount: number, rate: number, days: number): number => {
  return (amount * (rate / 100) * days) / 365;
};

export const formatBusinessType = (type: string): string => {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export const generateInvoicePDF = async (invoice: any): Promise<Blob> => {
  // In a real app, this would generate a proper PDF
  const content = `
Invoice: ${invoice.id}
Date: ${new Date(invoice.issueDate).toLocaleDateString()}
Due: ${new Date(invoice.dueDate).toLocaleDateString()}
Amount: $${invoice.total.toFixed(2)}
Terms: Net ${invoice.paymentTerms} days
  `;
  
  return new Blob([content], { type: 'text/plain' });
};