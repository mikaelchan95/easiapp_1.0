// Supabase Edge Function to send invoice emails
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface InvoiceEmailRequest {
  invoice_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { invoice_id } = await req.json() as InvoiceEmailRequest;

    if (!invoice_id) {
      throw new Error('Invoice ID is required');
    }

    // Fetch invoice details with company info
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from('company_invoices')
      .select('*, company:companies(name, email, uen)')
      .eq('id', invoice_id)
      .single();

    if (invoiceError || !invoice) {
      throw new Error('Invoice not found');
    }

    const company = invoice.company;
    if (!company.email) {
      throw new Error('Company has no email address');
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.log('RESEND_API_KEY not set. Logging email content instead.');
      console.log(`To: ${company.email}`);
      console.log(`Subject: Invoice ${invoice.invoice_number}`);
      return new Response(
        JSON.stringify({ success: true, message: 'Email logged (no API key)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate HTML content
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
          .button { display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          .total { font-weight: bold; font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Invoice ${invoice.invoice_number}</h1>
          </div>
          <div class="content">
            <p>Dear ${company.name},</p>
            <p>This is a notification that a new invoice has been generated for your account.</p>
            
            <table>
              <tr>
                <td><strong>Invoice Date:</strong></td>
                <td>${new Date(invoice.invoice_date).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td><strong>Due Date:</strong></td>
                <td>${new Date(invoice.payment_due_date).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td><strong>Status:</strong></td>
                <td>${invoice.status.toUpperCase()}</td>
              </tr>
              <tr class="total">
                <td><strong>Total Amount:</strong></td>
                <td>$${invoice.billing_amount.toFixed(2)}</td>
              </tr>
            </table>

            <p style="margin-top: 30px;">
              Please arrange for payment by the due date. You can view the full details in the app.
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} EasiApp. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'EasiApp Billing <billing@easiapp.com>', // Update this with your verified domain
        to: company.email,
        subject: `Invoice ${invoice.invoice_number} from EasiApp`,
        html: htmlContent,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to send email');
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
