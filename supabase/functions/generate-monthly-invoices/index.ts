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
          // If duplicate, maybe log it but continue
          if (invoiceError.code === '23505') { // Unique violation
             console.log(`Invoice ${invoiceNumber} already exists. Skipping creation.`);
             // Ideally we might want to fetch it to send the email anyway
             results.push({
               company_id: company.id,
               status: 'skipped',
               reason: 'Invoice already exists'
             });
             continue;
          }
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
  console.log(`Sending invoice email to ${company.email}`);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 1px solid #eee; }
        .content { padding: 30px 20px; }
        .footer { text-align: center; font-size: 12px; color: #888; margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .total { font-weight: bold; font-size: 18px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Monthly Statement</h1>
        </div>
        <div class="content">
          <p>Dear ${company.name},</p>
          <p>Please find your monthly statement of account below for the period.</p>
          
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
            <tr class="total">
              <td><strong>Total Amount:</strong></td>
              <td>$${invoice.billing_amount.toFixed(2)}</td>
            </tr>
          </table>

          <p style="margin-top: 30px;">
            Please arrange payment by the due date.
          </p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} EasiApp</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  
  if (!resendApiKey) {
    console.log('RESEND_API_KEY not set. Logging email content instead.');
    return { skipped: true, reason: 'No API key' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'EasiApp Billing <billing@easiapp.com>',
        to: company.email,
        subject: `Monthly Statement - ${invoice.invoice_number}`,
        html: htmlContent,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to send email');
    }

    return await res.json();
  } catch (error) {
    console.error(`Failed to send email to ${company.email}:`, error);
    // Don't throw here, just log error so we can proceed with other companies
    return { error: error.message };
  }
}
