// Supabase Edge Function to generate monthly invoices for all companies
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface Order {
  id: string;
  company_id: string;
  total: number;
  created_at: string;
}

interface Company {
  id: string;
  name: string;
  email: string;
  uen: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get current month and year
    const now = new Date();
    const month = now.getMonth(); // 0-11, so this gives us last month if run at start of month
    const year = now.getFullYear();

    // Calculate previous month's date range
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    console.log(
      `Generating invoices for ${startDate.toISOString()} to ${endDate.toISOString()}`
    );

    // Get all active companies
    const { data: companies, error: companiesError } = await supabaseClient
      .from('companies')
      .select('id, name, email, uen')
      .eq('is_active', true);

    if (companiesError) {
      throw companiesError;
    }

    const results = [];

    // For each company, generate invoice
    for (const company of companies as Company[]) {
      try {
        // Get company's delivered orders for the month
        const { data: orders, error: ordersError } = await supabaseClient
          .from('orders')
          .select('id, total, created_at')
          .eq('company_id', company.id)
          .eq('status', 'delivered')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        if (ordersError) {
          throw ordersError;
        }

        // Skip if no orders
        if (!orders || orders.length === 0) {
          results.push({
            company_id: company.id,
            company_name: company.name,
            status: 'skipped',
            reason: 'No delivered orders for the period',
          });
          continue;
        }

        // Calculate total amount
        const totalAmount = (orders as Order[]).reduce(
          (sum, order) => sum + order.total,
          0
        );

        // Generate invoice number
        const invoiceNumber = `INV-${year}-${month.toString().padStart(2, '0')}-${company.id.slice(0, 6)}`;

        // Calculate due date (NET30)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);

        // Create invoice
        const { data: invoice, error: invoiceError } = await supabaseClient
          .from('company_invoices')
          .insert({
            company_id: company.id,
            invoice_number: invoiceNumber,
            invoice_date: now.toISOString().split('T')[0],
            payment_due_date: dueDate.toISOString().split('T')[0],
            billing_amount: totalAmount,
            outstanding_amount: totalAmount,
            status: 'pending',
            payment_terms: 'NET30',
          })
          .select()
          .single();

        if (invoiceError) {
          throw invoiceError;
        }

        // Send email notification
        await sendInvoiceEmail(company, invoice, orders as Order[]);

        results.push({
          company_id: company.id,
          company_name: company.name,
          status: 'success',
          invoice_number: invoiceNumber,
          total_amount: totalAmount,
          order_count: orders.length,
        });
      } catch (error) {
        console.error(`Error processing company ${company.id}:`, error);
        results.push({
          company_id: company.id,
          company_name: company.name,
          status: 'error',
          error: error.message,
        });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error generating monthly invoices:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function sendInvoiceEmail(
  company: Company,
  invoice: any,
  orders: Order[]
) {
  // TODO: Integrate with email service (SendGrid, Resend, etc.)
  // For now, this is a placeholder
  console.log(`Sending invoice email to ${company.email}`);
  console.log(`Invoice: ${invoice.invoice_number}`);
  console.log(`Amount: $${invoice.billing_amount}`);
  console.log(`Orders: ${orders.length}`);

  // Example email content
  const emailContent = {
    to: company.email,
    subject: `Monthly Statement of Account - ${invoice.invoice_number}`,
    html: `
      <h2>Monthly Statement of Account</h2>
      <p>Dear ${company.name},</p>
      <p>Please find your monthly statement of account below:</p>
      <table>
        <tr>
          <td><strong>Invoice Number:</strong></td>
          <td>${invoice.invoice_number}</td>
        </tr>
        <tr>
          <td><strong>Invoice Date:</strong></td>
          <td>${new Date(invoice.invoice_date).toLocaleDateString()}</td>
        </tr>
        <tr>
          <td><strong>Due Date:</strong></td>
          <td>${new Date(invoice.payment_due_date).toLocaleDateString()}</td>
        </tr>
        <tr>
          <td><strong>Total Orders:</strong></td>
          <td>${orders.length}</td>
        </tr>
        <tr>
          <td><strong>Total Amount:</strong></td>
          <td>$${invoice.billing_amount.toFixed(2)}</td>
        </tr>
      </table>
      <p>Please arrange payment by the due date.</p>
      <p>Thank you for your business!</p>
    `,
  };

  // Integration point for email service
  // await fetch('https://api.sendgrid.com/v3/mail/send', { ... });
  // or
  // await fetch('https://api.resend.com/emails', { ... });

  return emailContent;
}
