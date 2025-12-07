# Generate Monthly Invoices Edge Function

This Supabase Edge Function automatically generates monthly Statement of Accounts (SOA) for all active companies.

## Features

- Generates invoices for all companies with delivered orders in the previous month
- Automatically calculates total billing amount
- Sets NET30 payment terms
- Sends email notifications to companies
- Returns detailed results for each company processed

## Deployment

```bash
supabase functions deploy generate-monthly-invoices
```

## Usage

### Manual Trigger

```bash
curl -X POST \
  https://[your-project-ref].supabase.co/functions/v1/generate-monthly-invoices \
  -H "Authorization: Bearer [your-anon-key]"
```

### Scheduled Execution (Recommended)

Set up a cron job to run this function on the 1st of each month:

1. Go to your Supabase Dashboard
2. Navigate to Database > Cron Jobs (if using pg_cron extension)
3. Create a new cron job:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule monthly invoice generation (1st of each month at 2 AM)
SELECT cron.schedule(
  'generate-monthly-invoices',
  '0 2 1 * *',  -- At 02:00 on day 1 of every month
  $$
  SELECT
    net.http_post(
      url := 'https://[your-project-ref].supabase.co/functions/v1/generate-monthly-invoices',
      headers := '{"Authorization": "Bearer [your-service-role-key]", "Content-Type": "application/json"}'::jsonb
    );
  $$
);
```

Alternatively, use an external cron service like:

- GitHub Actions (recommended)
- Vercel Cron
- AWS EventBridge
- Google Cloud Scheduler

## Email Integration

To enable email sending, integrate with an email service provider:

### Option 1: Resend (Recommended)

1. Sign up at https://resend.com
2. Get your API key
3. Add to Supabase secrets:

```bash
supabase secrets set RESEND_API_KEY=your_api_key
```

4. Update the `sendInvoiceEmail` function to use Resend API

### Option 2: SendGrid

1. Sign up at https://sendgrid.com
2. Get your API key
3. Add to Supabase secrets:

```bash
supabase secrets set SENDGRID_API_KEY=your_api_key
```

4. Update the `sendInvoiceEmail` function to use SendGrid API

## Response Format

```json
{
  "success": true,
  "results": [
    {
      "company_id": "uuid",
      "company_name": "Company Name",
      "status": "success",
      "invoice_number": "INV-2025-01-abc123",
      "total_amount": 1234.56,
      "order_count": 15
    },
    {
      "company_id": "uuid",
      "company_name": "Another Company",
      "status": "skipped",
      "reason": "No delivered orders for the period"
    }
  ]
}
```

## Testing

Test the function locally:

```bash
supabase functions serve generate-monthly-invoices --env-file .env.local
```

Then trigger it:

```bash
curl -X POST http://localhost:54321/functions/v1/generate-monthly-invoices
```
