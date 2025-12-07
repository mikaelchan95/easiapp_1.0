# Invoice & SOA System Implementation Summary

## Overview

This document summarizes the complete implementation of the Order Detail, Invoice Management, and Monthly Statement of Account (SOA) system for both admin-web and mobile app.

## Issues Resolved

### 1. Order Detail Page "Order not found" Issue

**Problem:** Order detail page was showing "Order not found" when clicking on order links.

**Solution:**

- Enhanced error handling in `admin-web/src/pages/OrderDetail.tsx`
- Added proper null checks and error logging
- Fixed data mapping for order items (price field compatibility)
- Improved address display logic for both `delivery_address` (JSONB) and `shipping_address` (string) fields

**Files Modified:**

- `admin-web/src/pages/OrderDetail.tsx`

### 2. Invoice Page Not Working

**Problem:** Invoice page was querying a non-existent `invoices` table instead of `company_invoices`.

**Solution:**

- Updated `admin-web/src/pages/Invoices.tsx` to query `company_invoices` table
- Added company details join to show company name and UEN
- Enhanced invoice display with proper field mapping for both schema versions
- Updated Invoice TypeScript interface to support multiple schema field names
- Fixed status badges and filtering

**Files Modified:**

- `admin-web/src/pages/Invoices.tsx`
- `admin-web/src/types/index.ts`

### 3. Monthly SOA System - End-to-End Implementation

#### A. Admin Web - Company Invoice Management

**Created:** `admin-web/src/pages/CompanyInvoices.tsx`

**Features:**

- View all company invoices with filtering by company and status
- Generate monthly invoices for any company
- Search invoices by invoice number or company name
- Send invoice emails (placeholder for integration)
- Download invoices (placeholder for PDF generation)

**Routing:**

- Added `/company-invoices` route in `admin-web/src/App.tsx`
- Added "Company SOA" navigation item in `admin-web/src/components/Layout.tsx`

#### B. Automated Monthly Invoice Generation

**Created:** `supabase/functions/generate-monthly-invoices/`

**Features:**

- Supabase Edge Function for automated SOA generation
- Processes all active companies
- Calculates billing from delivered orders in previous month
- Generates unique invoice numbers (format: `INV-YYYY-MM-XXXXXX`)
- Sets NET30 payment terms by default
- Email notification framework (ready for SendGrid/Resend integration)

**Deployment:**

```bash
supabase functions deploy generate-monthly-invoices
```

**Scheduled Execution:**
Can be triggered via:

1. pg_cron extension (runs on Supabase)
2. GitHub Actions
3. External cron services (Vercel Cron, AWS EventBridge, etc.)

**Files Created:**

- `supabase/functions/generate-monthly-invoices/index.ts`
- `supabase/functions/generate-monthly-invoices/README.md`

#### C. Mobile App - Company Invoice Viewing

**Created:** `app/screens/CompanyInvoicesScreen.tsx`

**Features:**

- View monthly statements (SOA) for company accounts
- Filter by status (All, Pending, Paid, Overdue)
- Pull-to-refresh functionality
- Displays invoice details:
  - Invoice number
  - Invoice and due dates
  - Payment terms
  - Total and outstanding amounts
  - Status with color-coded badges
- Tap to view detailed invoice
- Company-only access (validates user.company_id)

**Integration:**

- Uses existing `companyBillingService` for data fetching
- Integrates with `useAuth` context for company validation
- Follows app's theme and design patterns

## Database Schema

### company_invoices Table

```sql
CREATE TABLE company_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    invoice_date DATE NOT NULL,
    payment_due_date DATE NOT NULL,
    billing_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    outstanding_amount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    payment_terms VARCHAR(20) NOT NULL DEFAULT 'NET30',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Usage Guide

### Admin Web

#### Viewing All Invoices

1. Navigate to "Invoices" in the sidebar
2. View all company invoices
3. Filter by status or search by company/invoice number

#### Managing Company SOAs

1. Navigate to "Company SOA" in the sidebar
2. Filter by company and status
3. Generate monthly invoice:
   - Select company from "Generate Invoice..." dropdown
   - System automatically:
     - Fetches delivered orders from previous month
     - Calculates total billing amount
     - Creates invoice with NET30 terms
     - Shows success message with amount
4. Send invoice emails (requires email integration)
5. Download invoice PDFs (requires PDF generation integration)

#### Generating Monthly Invoices Manually

From Company SOA page:

1. Click "Generate Invoice..." dropdown
2. Select company
3. System generates invoice for previous month's delivered orders
4. View generated invoice in the list

### Mobile App (Company Users)

#### Viewing Monthly Statements

1. Navigate to Company Invoices screen
2. View all monthly statements
3. Filter by:
   - All
   - Pending
   - Paid
   - Overdue
4. Pull down to refresh
5. Tap invoice to view details

#### Invoice Details

- Invoice number and date
- Due date and payment terms
- Total amount and outstanding balance
- Status badge with color coding
- Related order information

## Email Integration (Next Steps)

### Recommended Provider: Resend

1. **Sign up:**

   ```
   https://resend.com
   ```

2. **Get API Key:**
   - Create account
   - Generate API key

3. **Add to Supabase Secrets:**

   ```bash
   supabase secrets set RESEND_API_KEY=your_api_key
   ```

4. **Update Edge Function:**
   Replace the placeholder in `sendInvoiceEmail()` with:
   ```typescript
   await fetch('https://api.resend.com/emails', {
     method: 'POST',
     headers: {
       Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({
       from: 'billing@easiapp.com',
       to: company.email,
       subject: `Monthly Statement - ${invoice.invoice_number}`,
       html: emailContent.html,
     }),
   });
   ```

### Alternative: SendGrid

1. Sign up at https://sendgrid.com
2. Get API key
3. Add secret: `supabase secrets set SENDGRID_API_KEY=your_api_key`
4. Update function with SendGrid API calls

## Automation Setup

### Option 1: pg_cron (Recommended for Supabase)

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule monthly invoice generation (1st of each month at 2 AM)
SELECT cron.schedule(
  'generate-monthly-invoices',
  '0 2 1 * *',
  $$
  SELECT
    net.http_post(
      url := 'https://[project-ref].supabase.co/functions/v1/generate-monthly-invoices',
      headers := '{"Authorization": "Bearer [service-role-key]", "Content-Type": "application/json"}'::jsonb
    );
  $$
);
```

### Option 2: GitHub Actions

Create `.github/workflows/monthly-invoices.yml`:

```yaml
name: Generate Monthly Invoices

on:
  schedule:
    # Runs at 2 AM on the 1st of every month
    - cron: '0 2 1 * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - name: Call Edge Function
        run: |
          curl -X POST \
            https://${{ secrets.SUPABASE_PROJECT_REF }}.supabase.co/functions/v1/generate-monthly-invoices \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_KEY }}"
```

## Testing

### Test Order Detail Page

1. Navigate to Orders page in admin-web
2. Click any order link
3. Verify order details load correctly
4. Check that order items display properly
5. Verify address displays correctly

### Test Invoice Display

1. Navigate to Invoices page
2. Verify company invoices load
3. Test filtering by status
4. Test search functionality
5. Verify company details show correctly

### Test Invoice Generation

1. Go to Company SOA page
2. Select a company with recent orders
3. Generate invoice
4. Verify:
   - Invoice appears in list
   - Correct amount calculated
   - Status is 'pending'
   - Due date is 30 days from now

### Test Mobile App (Company User)

1. Log in as company user
2. Navigate to Company Invoices screen
3. Verify invoices display
4. Test filtering
5. Test pull-to-refresh
6. Tap invoice to view details

### Test Edge Function Locally

```bash
# Serve function locally
supabase functions serve generate-monthly-invoices --env-file .env.local

# Trigger function
curl -X POST http://localhost:54321/functions/v1/generate-monthly-invoices
```

## Files Created/Modified

### Created:

- `admin-web/src/pages/CompanyInvoices.tsx` - Company invoice management page
- `app/screens/CompanyInvoicesScreen.tsx` - Mobile invoice viewing screen
- `supabase/functions/generate-monthly-invoices/index.ts` - Automated generation
- `supabase/functions/generate-monthly-invoices/README.md` - Function documentation
- `IMPLEMENTATION_INVOICE_SOA_SYSTEM.md` - This file

### Modified:

- `admin-web/src/pages/OrderDetail.tsx` - Fixed error handling and data mapping
- `admin-web/src/pages/Invoices.tsx` - Fixed to use company_invoices table
- `admin-web/src/types/index.ts` - Updated Invoice interface
- `admin-web/src/App.tsx` - Added CompanyInvoices route
- `admin-web/src/components/Layout.tsx` - Added Company SOA navigation

## Next Steps

1. **Email Integration:**
   - ✅ Implemented `send-invoice-email` Edge Function using Resend
   - ✅ Integrated with `generate-monthly-invoices` for automated sending
   - ✅ Added "Send Email" button in Admin UI
   - ⚠️ Pending: `RESEND_API_KEY` in Supabase Secrets

2. **PDF Generation:**
   - ✅ Installed `jspdf` and `jspdf-autotable`
   - ✅ Implemented `generateInvoicePDF` utility
   - ✅ Integrated "Download" button in Admin UI
   - ⚠️ Future enhancement: Fetch detailed order items for PDF (currently summary only)

3. **Payment Recording:**
   - ✅ Created `invoice_payments` table with automatic status updates
   - ✅ Implemented `PaymentModal` component
   - ✅ Integrated "Record Payment" button in Admin UI
   - ✅ Supports partial payments and multiple payment methods

4. **Automation:**
   - Choose automation method (pg_cron, GitHub Actions, etc.)
   - Deploy and configure
   - Test automated generation
   - Set up monitoring/alerts

5. **Additional Features:**
   - Payment recording
   - Partial payment tracking
   - Invoice reminder emails
   - Overdue invoice handling
   - Credit note generation
   - Invoice dispute management

## Support

For issues or questions:

1. Check Supabase logs for Edge Function errors
2. Verify database connectivity and RLS policies
3. Check email service integration status
4. Review invoice generation logic in Edge Function
