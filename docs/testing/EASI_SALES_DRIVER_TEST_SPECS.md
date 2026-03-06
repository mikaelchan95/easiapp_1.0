# EASI Sales & Driver — QA Test Specifications

**Version:** 1.0
**Date:** 2026-03-06
**Author:** EASI QA Engineering
**Status:** Ready for Beta Testing
**Related:** [Architecture Document](../architecture/EASI_SALES_DRIVER_ARCHITECTURE.md)

---

## Table of Contents

1. [Test Strategy](#1-test-strategy)
2. [EasiSales Test Cases (S1–S7)](#2-easisales-test-cases)
3. [EasiDriver Test Cases (D1–D6)](#3-easidriver-test-cases)
4. [Cross-App Integration Test Cases](#4-cross-app-integration-test-cases)
5. [Edge Cases and Error Scenarios](#5-edge-cases-and-error-scenarios)

---

## 1. Test Strategy

### 1.1 Testing Pyramid

```
          /  E2E  \           ← Future: Playwright/Cypress
         /─────────\
        / Integration\        ← Supabase queries, cross-table, RLS
       /──────────────\
      /   Unit Tests    \     ← Components, utils, validation logic
     /───────────────────\
    /   Manual Testing     \  ← Beta launch primary method
   /────────────────────────\
```

### 1.2 Manual Testing (Beta Phase — Primary)

- **Scope:** All P0 and P1 test cases executed manually before each release
- **Environment:** Staging Supabase project with test data
- **Browsers:** Chrome (primary), Safari (secondary — PWA testing for EasiDriver)
- **Devices:** Desktop Chrome (salesman tablet simulation), Mobile Chrome DevTools (driver phone simulation)
- **Test data:** Seed script creates 3 salesmen, 3 drivers, 10 companies, 50 products, 20 orders
- **Bug tracking:** GitHub Issues with labels `bug/easi-sales`, `bug/easi-driver`

### 1.3 Unit Test Approach

- **Framework:** Jest 29 + React Testing Library (same as EASI App)
- **Coverage target:** 70% for branches, functions, lines, statements
- **Scope:**
  - Form validation logic (credit limit, UEN format, required fields)
  - Pricing calculations (trade pricing, GST, delivery fee)
  - Status transition logic (delivery pipeline validation)
  - Date/time formatting utilities
  - Component rendering (key UI components render without crash)
- **Not in scope for beta:** Supabase integration mocks (these are covered by integration tests)

### 1.4 Integration Test Approach

- **Framework:** Jest with `@supabase/supabase-js` against staging Supabase
- **Scope:**
  - RLS policy verification (each role can only access permitted data)
  - CRUD operations on new tables (`staff_profiles`, `delivery_assignments`, etc.)
  - Real-time subscription delivery
  - Storage bucket upload/download for delivery proofs
- **Test isolation:** Each test suite creates its own data and cleans up after

### 1.5 E2E Test Approach (Future — Post-Beta)

- **Framework:** Playwright (recommended, cross-browser)
- **Scope:** Full user journeys across apps (salesman places order → admin assigns driver → driver delivers → customer confirms)
- **Not planned for beta** due to multi-app coordination complexity

### 1.6 Priority Definitions

| Priority | Definition                                                           | Beta Gate?                  |
| -------- | -------------------------------------------------------------------- | --------------------------- |
| **P0**   | Must pass for beta release. App is broken or unusable if this fails. | Yes — blocks release        |
| **P1**   | Important for user experience. Should pass, but a workaround exists. | No — tracked as known issue |
| **P2**   | Nice-to-have. UX polish, edge cases unlikely in normal use.          | No — backlog                |

---

## 2. EasiSales Test Cases

### 2.1 S1 — Salesman Authentication

#### S1-TC01: Valid Salesman Login

| Field               | Value                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **ID**              | S1-TC01                                                                                                             |
| **Description**     | Salesman logs in with valid credentials and is granted access                                                       |
| **Priority**        | P0                                                                                                                  |
| **Pre-conditions**  | Auth user exists in `auth.users`; `staff_profiles` row exists with `staff_role = 'salesman'` and `is_active = true` |
| **Steps**           | 1. Navigate to EasiSales login page<br>2. Enter valid email and password<br>3. Click "Sign In"                      |
| **Expected Result** | User is authenticated, redirected to salesman dashboard. Staff profile data (name, territory) is displayed.         |

#### S1-TC02: Invalid Credentials

| Field               | Value                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| **ID**              | S1-TC02                                                                                              |
| **Description**     | Login attempt with wrong password is rejected                                                        |
| **Priority**        | P0                                                                                                   |
| **Pre-conditions**  | Valid auth user exists                                                                               |
| **Steps**           | 1. Navigate to login page<br>2. Enter valid email, wrong password<br>3. Click "Sign In"              |
| **Expected Result** | Error message "Invalid email or password" displayed. User remains on login page. No session created. |

#### S1-TC03: Non-Salesman Role Rejected

| Field               | Value                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | S1-TC03                                                                                                                                                 |
| **Description**     | User with driver role cannot access EasiSales                                                                                                           |
| **Priority**        | P0                                                                                                                                                      |
| **Pre-conditions**  | Auth user exists; `staff_profiles` row exists with `staff_role = 'driver'`                                                                              |
| **Steps**           | 1. Navigate to EasiSales login page<br>2. Enter driver's email and password<br>3. Click "Sign In"                                                       |
| **Expected Result** | Auth succeeds but role check fails. Error message "Access denied — salesman account required" displayed. User is signed out and returned to login page. |

#### S1-TC04: No Staff Profile Rejected

| Field               | Value                                                                                                                               |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | S1-TC04                                                                                                                             |
| **Description**     | Regular customer cannot access EasiSales                                                                                            |
| **Priority**        | P0                                                                                                                                  |
| **Pre-conditions**  | Auth user exists; no row in `staff_profiles` for this user                                                                          |
| **Steps**           | 1. Navigate to EasiSales login page<br>2. Enter customer's email and password<br>3. Click "Sign In"                                 |
| **Expected Result** | Auth succeeds but staff profile lookup returns empty. Error message "Access denied — salesman account required". Session destroyed. |

#### S1-TC05: Deactivated Salesman Rejected

| Field               | Value                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| **ID**              | S1-TC05                                                                                              |
| **Description**     | Salesman with `is_active = false` cannot login                                                       |
| **Priority**        | P1                                                                                                   |
| **Pre-conditions**  | Auth user exists; `staff_profiles` row exists with `staff_role = 'salesman'` and `is_active = false` |
| **Steps**           | 1. Navigate to login page<br>2. Enter deactivated salesman's credentials<br>3. Click "Sign In"       |
| **Expected Result** | Error message indicating account is deactivated. Session destroyed.                                  |

#### S1-TC06: Session Persistence

| Field               | Value                                                                        |
| ------------------- | ---------------------------------------------------------------------------- |
| **ID**              | S1-TC06                                                                      |
| **Description**     | Salesman session persists across page refresh                                |
| **Priority**        | P1                                                                           |
| **Pre-conditions**  | Salesman is logged in                                                        |
| **Steps**           | 1. Login successfully<br>2. Refresh the browser page                         |
| **Expected Result** | User remains logged in. Dashboard loads without requiring re-authentication. |

#### S1-TC07: Logout

| Field               | Value                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------ |
| **ID**              | S1-TC07                                                                                    |
| **Description**     | Salesman can log out cleanly                                                               |
| **Priority**        | P0                                                                                         |
| **Pre-conditions**  | Salesman is logged in                                                                      |
| **Steps**           | 1. Click profile/menu<br>2. Click "Sign Out"                                               |
| **Expected Result** | Session is destroyed. User is redirected to login page. Protected routes are inaccessible. |

---

### 2.2 S2 — Customer List & Search

#### S2-TC01: Customer List Loads

| Field               | Value                                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------- |
| **ID**              | S2-TC01                                                                                   |
| **Description**     | Customer list displays all B2B companies                                                  |
| **Priority**        | P0                                                                                        |
| **Pre-conditions**  | Salesman is logged in; at least 3 companies exist in database                             |
| **Steps**           | 1. Navigate to "Customers" from sidebar/menu                                              |
| **Expected Result** | List displays all companies with name, UEN, and status. Sorted alphabetically by default. |

#### S2-TC02: Search by Company Name

| Field               | Value                                                                       |
| ------------------- | --------------------------------------------------------------------------- |
| **ID**              | S2-TC02                                                                     |
| **Description**     | Search filters companies by name                                            |
| **Priority**        | P0                                                                          |
| **Pre-conditions**  | Salesman is logged in; companies "The Winery" and "Singapore Spirits" exist |
| **Steps**           | 1. Navigate to customer list<br>2. Type "Winery" in search field            |
| **Expected Result** | Only "The Winery" appears in the list. Other companies are filtered out.    |

#### S2-TC03: Search by UEN

| Field               | Value                                                                |
| ------------------- | -------------------------------------------------------------------- |
| **ID**              | S2-TC03                                                              |
| **Description**     | Search filters companies by UEN number                               |
| **Priority**        | P1                                                                   |
| **Pre-conditions**  | Salesman is logged in; company with UEN "201234567A" exists          |
| **Steps**           | 1. Navigate to customer list<br>2. Type "201234567A" in search field |
| **Expected Result** | Company with matching UEN is displayed.                              |

#### S2-TC04: Empty Search Results

| Field               | Value                                                                        |
| ------------------- | ---------------------------------------------------------------------------- |
| **ID**              | S2-TC04                                                                      |
| **Description**     | Searching for non-existent company shows empty state                         |
| **Priority**        | P1                                                                           |
| **Pre-conditions**  | Salesman is logged in                                                        |
| **Steps**           | 1. Navigate to customer list<br>2. Type "XYZNONEXISTENT" in search field     |
| **Expected Result** | Empty state message displayed (e.g., "No companies found"). No error thrown. |

#### S2-TC05: Customer List Shows Credit Status

| Field               | Value                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | S2-TC05                                                                                                                   |
| **Description**     | Each company card shows credit availability indicator                                                                     |
| **Priority**        | P1                                                                                                                        |
| **Pre-conditions**  | Companies exist with varying credit_limit and current_credit values                                                       |
| **Steps**           | 1. Navigate to customer list                                                                                              |
| **Expected Result** | Each company row/card displays available credit (credit_limit - current_credit) or a visual indicator (green/yellow/red). |

---

### 2.3 S3 — Customer Detail

#### S3-TC01: Customer Detail Loads

| Field               | Value                                                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **ID**              | S3-TC01                                                                                                                 |
| **Description**     | Tapping a customer opens their detail page with correct data                                                            |
| **Priority**        | P0                                                                                                                      |
| **Pre-conditions**  | Salesman is logged in; company "The Winery" exists with known data                                                      |
| **Steps**           | 1. Navigate to customer list<br>2. Tap on "The Winery"                                                                  |
| **Expected Result** | Detail page shows: company name, UEN, address, phone, email, credit limit, current credit usage, payment terms, status. |

#### S3-TC02: Order History Displayed

| Field               | Value                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | S3-TC02                                                                                                                   |
| **Description**     | Customer detail shows recent orders for this company                                                                      |
| **Priority**        | P0                                                                                                                        |
| **Pre-conditions**  | Company has at least 3 orders in `orders` table                                                                           |
| **Steps**           | 1. Open customer detail for company with orders                                                                           |
| **Expected Result** | Order history section shows orders sorted by date (newest first). Each order shows order number, date, total, and status. |

#### S3-TC03: Credit Status Calculation

| Field               | Value                                                                          |
| ------------------- | ------------------------------------------------------------------------------ |
| **ID**              | S3-TC03                                                                        |
| **Description**     | Available credit is correctly calculated                                       |
| **Priority**        | P0                                                                             |
| **Pre-conditions**  | Company has credit_limit = $50,000 and current_credit = $15,000                |
| **Steps**           | 1. Open customer detail for this company                                       |
| **Expected Result** | Available credit shows $35,000. Credit usage bar or percentage shows 30% used. |

#### S3-TC04: Customer with No Orders

| Field               | Value                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------- |
| **ID**              | S3-TC04                                                                                     |
| **Description**     | New customer with no orders shows appropriate empty state                                   |
| **Priority**        | P2                                                                                          |
| **Pre-conditions**  | Company exists with zero orders                                                             |
| **Steps**           | 1. Open customer detail                                                                     |
| **Expected Result** | Order history section shows "No orders yet" message. Company info still displays correctly. |

---

### 2.4 S4 — Order on Behalf of Customer

#### S4-TC01: Start New Order

| Field               | Value                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------- |
| **ID**              | S4-TC01                                                                                     |
| **Description**     | Salesman can initiate an order for a selected customer                                      |
| **Priority**        | P0                                                                                          |
| **Pre-conditions**  | Salesman is logged in; company selected                                                     |
| **Steps**           | 1. Open customer detail<br>2. Click "New Order" button                                      |
| **Expected Result** | Order creation page opens with customer/company pre-selected. Product catalog is browsable. |

#### S4-TC02: Product Search and Selection

| Field               | Value                                                                                                                        |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | S4-TC02                                                                                                                      |
| **Description**     | Salesman can search products and add to order                                                                                |
| **Priority**        | P0                                                                                                                           |
| **Pre-conditions**  | Order creation page is open; products exist in catalog                                                                       |
| **Steps**           | 1. Type product name in search field<br>2. Select a product from results<br>3. Set quantity to 3<br>4. Click "Add to Order"  |
| **Expected Result** | Product appears in order line items with quantity 3 and correct trade price (not retail price). Line total = unit_price × 3. |

#### S4-TC03: Trade Pricing Applied

| Field               | Value                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------ |
| **ID**              | S4-TC03                                                                                    |
| **Description**     | Order uses trade pricing, not retail                                                       |
| **Priority**        | P0                                                                                         |
| **Pre-conditions**  | Product has both retail_price and trade_price; company account is verified                 |
| **Steps**           | 1. Add a product with known trade_price = $20.00 (retail = $30.00)<br>2. Set quantity to 2 |
| **Expected Result** | Line total shows $40.00 (trade price), not $60.00 (retail).                                |

#### S4-TC04: Remove Item from Order

| Field               | Value                                                                  |
| ------------------- | ---------------------------------------------------------------------- |
| **ID**              | S4-TC04                                                                |
| **Description**     | Salesman can remove a product from the order                           |
| **Priority**        | P0                                                                     |
| **Pre-conditions**  | Order has at least 2 items                                             |
| **Steps**           | 1. Click remove/delete on one item                                     |
| **Expected Result** | Item is removed. Order total recalculates. Remaining items unaffected. |

#### S4-TC05: Total Calculation with GST

| Field               | Value                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------- |
| **ID**              | S4-TC05                                                                                 |
| **Description**     | Order total correctly includes subtotal, GST (9%), and delivery fee                     |
| **Priority**        | P0                                                                                      |
| **Pre-conditions**  | Order has items with known prices                                                       |
| **Steps**           | 1. Add items totaling $100 subtotal<br>2. Review order summary                          |
| **Expected Result** | Subtotal: $100.00, GST (9%): $9.00, Delivery Fee: displayed, Total: $109.00 + delivery. |

#### S4-TC06: Submit Order Successfully

| Field               | Value                                                                                                                                                                             |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | S4-TC06                                                                                                                                                                           |
| **Description**     | Salesman submits order; it appears in database with correct attribution                                                                                                           |
| **Priority**        | P0                                                                                                                                                                                |
| **Pre-conditions**  | Order has at least one item; company has sufficient credit                                                                                                                        |
| **Steps**           | 1. Review order summary<br>2. Click "Submit Order"                                                                                                                                |
| **Expected Result** | Order created in `orders` table with `placed_by_staff_id` set to salesman's `staff_profiles.id`. Order number generated (ORD-YYYY-XXXXXX format). Success confirmation displayed. |

#### S4-TC07: Order Visible in Admin Web

| Field               | Value                                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| **ID**              | S4-TC07                                                                                                   |
| **Description**     | Submitted order appears in Admin Web orders list                                                          |
| **Priority**        | P0                                                                                                        |
| **Pre-conditions**  | Order was just submitted by salesman                                                                      |
| **Steps**           | 1. Login to Admin Web<br>2. Navigate to Orders page                                                       |
| **Expected Result** | New order appears in list with salesman attribution visible. Order details match what salesman submitted. |

#### S4-TC08: Empty Order Cannot Be Submitted

| Field               | Value                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| **ID**              | S4-TC08                                                                                              |
| **Description**     | Submit button is disabled when no items are in the order                                             |
| **Priority**        | P1                                                                                                   |
| **Pre-conditions**  | Order creation page is open; no items added                                                          |
| **Steps**           | 1. Open new order page without adding items<br>2. Attempt to click "Submit Order"                    |
| **Expected Result** | Submit button is disabled or grayed out. If clicked, validation error "Add at least one item" shown. |

#### S4-TC09: Credit Limit Warning

| Field               | Value                                                                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | S4-TC09                                                                                                                                |
| **Description**     | Warning shown when order total exceeds available credit                                                                                |
| **Priority**        | P1                                                                                                                                     |
| **Pre-conditions**  | Company has credit_limit = $10,000, current_credit = $9,500 (only $500 available)                                                      |
| **Steps**           | 1. Create order with total > $500                                                                                                      |
| **Expected Result** | Warning displayed: "Order exceeds available credit ($500.00 remaining)". Salesman can still submit (subject to admin approval policy). |

---

### 2.5 S5 — New Customer Onboarding

#### S5-TC01: Open Onboarding Form

| Field               | Value                                                                                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | S5-TC01                                                                                                                                   |
| **Description**     | Salesman can access the new customer onboarding form                                                                                      |
| **Priority**        | P0                                                                                                                                        |
| **Pre-conditions**  | Salesman is logged in                                                                                                                     |
| **Steps**           | 1. Click "New Customer" button from customer list or dashboard                                                                            |
| **Expected Result** | Onboarding form opens with fields: company name, UEN, contact name, email, phone, address, proposed credit limit, proposed payment terms. |

#### S5-TC02: Submit Valid Onboarding Request

| Field               | Value                                                                                                                                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ID**              | S5-TC02                                                                                                                                                                                                                                                |
| **Description**     | Valid onboarding request is submitted and saved                                                                                                                                                                                                        |
| **Priority**        | P0                                                                                                                                                                                                                                                     |
| **Pre-conditions**  | Salesman is logged in                                                                                                                                                                                                                                  |
| **Steps**           | 1. Fill in company name: "New Wine Bar"<br>2. Fill in UEN: "202412345B"<br>3. Fill in contact name: "John Doe"<br>4. Fill in email: "john@newwinebar.com"<br>5. Set proposed credit limit: $20,000<br>6. Set payment terms: NET30<br>7. Click "Submit" |
| **Expected Result** | Request saved to `customer_onboarding_requests` with `status = 'pending'` and `salesman_id` set. Success message displayed.                                                                                                                            |

#### S5-TC03: Required Field Validation

| Field               | Value                                                                             |
| ------------------- | --------------------------------------------------------------------------------- |
| **ID**              | S5-TC03                                                                           |
| **Description**     | Form validates required fields before submission                                  |
| **Priority**        | P0                                                                                |
| **Pre-conditions**  | Onboarding form is open                                                           |
| **Steps**           | 1. Leave company name empty<br>2. Leave contact name empty<br>3. Click "Submit"   |
| **Expected Result** | Validation errors shown for company name and contact name. Form is not submitted. |

#### S5-TC04: UEN Format Validation

| Field               | Value                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| **ID**              | S5-TC04                                                                                              |
| **Description**     | UEN field validates Singapore UEN format                                                             |
| **Priority**        | P2                                                                                                   |
| **Pre-conditions**  | Onboarding form is open                                                                              |
| **Steps**           | 1. Enter invalid UEN "ABC"<br>2. Try to submit                                                       |
| **Expected Result** | Validation warning for UEN format. (Note: UEN is optional, so form can still submit with a warning.) |

#### S5-TC05: Request Appears in Admin Web

| Field               | Value                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| **ID**              | S5-TC05                                                                                             |
| **Description**     | Submitted onboarding request is visible in Admin Web                                                |
| **Priority**        | P0                                                                                                  |
| **Pre-conditions**  | Onboarding request was just submitted                                                               |
| **Steps**           | 1. Login to Admin Web<br>2. Navigate to customer onboarding section (or notifications)              |
| **Expected Result** | New request appears with status "Pending", all submitted details visible, salesman name attributed. |

#### S5-TC06: Salesman Can See Own Requests

| Field               | Value                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | S5-TC06                                                                                                                   |
| **Description**     | Salesman can view list of their submitted onboarding requests                                                             |
| **Priority**        | P1                                                                                                                        |
| **Pre-conditions**  | Salesman has submitted at least 2 onboarding requests                                                                     |
| **Steps**           | 1. Navigate to "My Requests" or onboarding history section                                                                |
| **Expected Result** | List shows salesman's own requests with status (pending/approved/rejected). Requests from other salesmen are NOT visible. |

---

### 2.6 S6 — Delivery Confirmation (Salesman Side)

#### S6-TC01: Salesman Sees Delivery Status

| Field               | Value                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| **ID**              | S6-TC01                                                                                              |
| **Description**     | Salesman can see delivery status of orders they placed                                               |
| **Priority**        | P1                                                                                                   |
| **Pre-conditions**  | Salesman has placed an order that has been assigned to a driver                                      |
| **Steps**           | 1. Navigate to order detail for an assigned order                                                    |
| **Expected Result** | Delivery status is visible (assigned/dispatched/en_route/arrived/delivered). Handshake status shown. |

#### S6-TC02: Salesman Views Completed Handshake

| Field               | Value                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------- |
| **ID**              | S6-TC02                                                                                 |
| **Description**     | Salesman can see when both parties have confirmed delivery                              |
| **Priority**        | P1                                                                                      |
| **Pre-conditions**  | Order has a completed digital handshake                                                 |
| **Steps**           | 1. Open order detail for a delivered order                                              |
| **Expected Result** | Handshake shows "Completed" with timestamps for both customer and driver confirmations. |

---

### 2.7 S7 — Performance View

#### S7-TC01: Performance Dashboard Loads

| Field               | Value                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | S7-TC01                                                                                                                   |
| **Description**     | Performance view shows correct aggregate statistics                                                                       |
| **Priority**        | P1                                                                                                                        |
| **Pre-conditions**  | Salesman has placed at least 5 orders across 3 different companies                                                        |
| **Steps**           | 1. Navigate to "Performance" page                                                                                         |
| **Expected Result** | Dashboard shows: total orders count, total revenue (sum of order totals), active accounts (unique companies with orders). |

#### S7-TC02: Stats Accuracy

| Field               | Value                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------- |
| **ID**              | S7-TC02                                                                                 |
| **Description**     | Displayed statistics match actual database values                                       |
| **Priority**        | P1                                                                                      |
| **Pre-conditions**  | Known test data: salesman placed 5 orders totaling $2,500 across 3 companies            |
| **Steps**           | 1. Open performance view                                                                |
| **Expected Result** | Orders: 5, Revenue: $2,500.00, Active Accounts: 3. Values match database query results. |

#### S7-TC03: Date Range Filter

| Field               | Value                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | S7-TC03                                                                                                                   |
| **Description**     | Performance stats can be filtered by date range                                                                           |
| **Priority**        | P2                                                                                                                        |
| **Pre-conditions**  | Salesman has orders in multiple months                                                                                    |
| **Steps**           | 1. Open performance view<br>2. Select date range: "This Month"<br>3. Change to "Last 30 Days"<br>4. Change to "This Year" |
| **Expected Result** | Stats update to reflect only orders within the selected date range.                                                       |

#### S7-TC04: No Orders State

| Field               | Value                                                          |
| ------------------- | -------------------------------------------------------------- |
| **ID**              | S7-TC04                                                        |
| **Description**     | Performance view handles zero orders gracefully                |
| **Priority**        | P2                                                             |
| **Pre-conditions**  | New salesman with no orders placed                             |
| **Steps**           | 1. Open performance view                                       |
| **Expected Result** | All stats show 0 or appropriate empty state. No errors thrown. |

---

## 3. EasiDriver Test Cases

### 3.1 D1 — Driver Authentication

#### D1-TC01: Valid Driver Login

| Field               | Value                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| **ID**              | D1-TC01                                                                                         |
| **Description**     | Driver logs in with valid credentials and is granted access                                     |
| **Priority**        | P0                                                                                              |
| **Pre-conditions**  | Auth user exists; `staff_profiles` row with `staff_role = 'driver'`, `is_active = true`         |
| **Steps**           | 1. Navigate to EasiDriver login page<br>2. Enter valid email and password<br>3. Click "Sign In" |
| **Expected Result** | User is authenticated, redirected to delivery queue/dashboard. Driver name and zone displayed.  |

#### D1-TC02: Invalid Credentials

| Field               | Value                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------- |
| **ID**              | D1-TC02                                                                                 |
| **Description**     | Login with wrong password is rejected                                                   |
| **Priority**        | P0                                                                                      |
| **Pre-conditions**  | Valid auth user exists                                                                  |
| **Steps**           | 1. Navigate to login page<br>2. Enter valid email, wrong password<br>3. Click "Sign In" |
| **Expected Result** | Error message "Invalid email or password". No session created.                          |

#### D1-TC03: Non-Driver Role Rejected

| Field               | Value                                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| **ID**              | D1-TC03                                                                                                     |
| **Description**     | User with salesman role cannot access EasiDriver                                                            |
| **Priority**        | P0                                                                                                          |
| **Pre-conditions**  | Auth user exists; `staff_profiles` row with `staff_role = 'salesman'`                                       |
| **Steps**           | 1. Navigate to EasiDriver login page<br>2. Enter salesman's email and password<br>3. Click "Sign In"        |
| **Expected Result** | Auth succeeds but role check fails. "Access denied — driver account required" displayed. Session destroyed. |

#### D1-TC04: Customer Account Rejected

| Field               | Value                                                            |
| ------------------- | ---------------------------------------------------------------- |
| **ID**              | D1-TC04                                                          |
| **Description**     | Regular customer cannot access EasiDriver                        |
| **Priority**        | P0                                                               |
| **Pre-conditions**  | Customer auth user with no `staff_profiles` entry                |
| **Steps**           | 1. Navigate to EasiDriver login<br>2. Enter customer credentials |
| **Expected Result** | "Access denied — driver account required". Session destroyed.    |

#### D1-TC05: Deactivated Driver Rejected

| Field               | Value                                           |
| ------------------- | ----------------------------------------------- |
| **ID**              | D1-TC05                                         |
| **Description**     | Driver with `is_active = false` cannot login    |
| **Priority**        | P1                                              |
| **Pre-conditions**  | Driver account with `is_active = false`         |
| **Steps**           | 1. Attempt login with deactivated credentials   |
| **Expected Result** | "Account deactivated" error. Session destroyed. |

#### D1-TC06: Logout

| Field               | Value                                        |
| ------------------- | -------------------------------------------- |
| **ID**              | D1-TC06                                      |
| **Description**     | Driver can log out cleanly                   |
| **Priority**        | P0                                           |
| **Pre-conditions**  | Driver is logged in                          |
| **Steps**           | 1. Click logout button                       |
| **Expected Result** | Session destroyed. Redirected to login page. |

---

### 3.2 D2 — Today's Delivery Queue

#### D2-TC01: Queue Shows Today's Deliveries

| Field               | Value                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------- |
| **ID**              | D2-TC01                                                                                     |
| **Description**     | Dashboard shows only deliveries assigned for today                                          |
| **Priority**        | P0                                                                                          |
| **Pre-conditions**  | Driver has 3 assignments today and 2 from yesterday                                         |
| **Steps**           | 1. Login as driver<br>2. View delivery queue                                                |
| **Expected Result** | Only 3 today's assignments shown. Yesterday's 2 are NOT displayed (they appear in history). |

#### D2-TC02: Queue Shows Correct Order Data

| Field               | Value                                                                                                          |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| **ID**              | D2-TC02                                                                                                        |
| **Description**     | Each delivery card shows essential order information                                                           |
| **Priority**        | P0                                                                                                             |
| **Pre-conditions**  | Driver has at least 1 assignment today                                                                         |
| **Steps**           | 1. View delivery queue                                                                                         |
| **Expected Result** | Each card shows: order number, company name, delivery address, delivery zone, order total, and current status. |

#### D2-TC03: Zone Filter

| Field               | Value                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------- |
| **ID**              | D2-TC03                                                                                |
| **Description**     | Deliveries can be filtered by Singapore zone                                           |
| **Priority**        | P1                                                                                     |
| **Pre-conditions**  | Driver has assignments in North and East zones                                         |
| **Steps**           | 1. View delivery queue<br>2. Tap "North" zone filter                                   |
| **Expected Result** | Only North zone deliveries shown. East zone deliveries hidden. "All" filter shows all. |

#### D2-TC04: Empty Queue State

| Field               | Value                                                                         |
| ------------------- | ----------------------------------------------------------------------------- |
| **ID**              | D2-TC04                                                                       |
| **Description**     | Driver with no assignments sees empty state                                   |
| **Priority**        | P1                                                                            |
| **Pre-conditions**  | Driver has zero assignments for today                                         |
| **Steps**           | 1. Login and view queue                                                       |
| **Expected Result** | Empty state message: "No deliveries assigned for today" or similar. No error. |

#### D2-TC05: Real-Time New Assignment

| Field               | Value                                                                                                             |
| ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **ID**              | D2-TC05                                                                                                           |
| **Description**     | New assignment appears in queue in real-time without refresh                                                      |
| **Priority**        | P1                                                                                                                |
| **Pre-conditions**  | Driver is viewing queue; admin is about to assign a new delivery                                                  |
| **Steps**           | 1. Driver views queue (e.g., showing 2 deliveries)<br>2. Admin assigns a new delivery to this driver in Admin Web |
| **Expected Result** | New delivery card appears in driver's queue within a few seconds without manual page refresh.                     |

#### D2-TC06: Queue Sorted by Zone

| Field               | Value                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------- |
| **ID**              | D2-TC06                                                                                  |
| **Description**     | Deliveries are grouped or sorted by zone for route efficiency                            |
| **Priority**        | P2                                                                                       |
| **Pre-conditions**  | Driver has deliveries across multiple zones                                              |
| **Steps**           | 1. View unfiltered queue                                                                 |
| **Expected Result** | Deliveries are grouped by zone (North, East, South, West) or sorted for logical routing. |

---

### 3.3 D3 — Status Updates

#### D3-TC01: Transition Assigned → Dispatched

| Field               | Value                                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| **ID**              | D3-TC01                                                                                                  |
| **Description**     | Driver marks assignment as dispatched                                                                    |
| **Priority**        | P0                                                                                                       |
| **Pre-conditions**  | Assignment exists with `status = 'assigned'`                                                             |
| **Steps**           | 1. Open delivery card<br>2. Click "Start Delivery" / "Mark Dispatched"                                   |
| **Expected Result** | Status changes to "dispatched". `dispatched_at` timestamp set. UI updates to show next available action. |

#### D3-TC02: Transition Dispatched → En Route

| Field               | Value                                        |
| ------------------- | -------------------------------------------- |
| **ID**              | D3-TC02                                      |
| **Description**     | Driver marks as en route                     |
| **Priority**        | P0                                           |
| **Pre-conditions**  | Assignment with `status = 'dispatched'`      |
| **Steps**           | 1. Open delivery card<br>2. Click "En Route" |
| **Expected Result** | Status changes to "en_route". UI updates.    |

#### D3-TC03: Transition En Route → Arrived

| Field               | Value                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| **ID**              | D3-TC03                                                                                              |
| **Description**     | Driver marks as arrived at destination                                                               |
| **Priority**        | P0                                                                                                   |
| **Pre-conditions**  | Assignment with `status = 'en_route'`                                                                |
| **Steps**           | 1. Click "Arrived"                                                                                   |
| **Expected Result** | Status changes to "arrived". `arrived_at` timestamp set. Proof-of-delivery options become available. |

#### D3-TC04: Transition Arrived → Delivered

| Field               | Value                                                                                              |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| **ID**              | D3-TC04                                                                                            |
| **Description**     | Driver marks delivery as complete                                                                  |
| **Priority**        | P0                                                                                                 |
| **Pre-conditions**  | Assignment with `status = 'arrived'`; proof of delivery submitted                                  |
| **Steps**           | 1. After capturing proof of delivery<br>2. Click "Mark Delivered"                                  |
| **Expected Result** | Status changes to "delivered". `delivered_at` timestamp set. Delivery moves from queue to history. |

#### D3-TC05: Cannot Skip Status Steps

| Field               | Value                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | D3-TC05                                                                                                                                                 |
| **Description**     | Driver cannot jump from "assigned" directly to "delivered"                                                                                              |
| **Priority**        | P0                                                                                                                                                      |
| **Pre-conditions**  | Assignment with `status = 'assigned'`                                                                                                                   |
| **Steps**           | 1. Open delivery card with status "assigned"<br>2. Attempt to skip to "delivered" (only "Dispatched" button should be available)                        |
| **Expected Result** | Only the next valid status transition is available as a button. Cannot skip steps. The UI does not offer "Delivered" when current status is "assigned". |

#### D3-TC06: Status Update Persists

| Field               | Value                                                      |
| ------------------- | ---------------------------------------------------------- |
| **ID**              | D3-TC06                                                    |
| **Description**     | Status change is saved to database and persists on refresh |
| **Priority**        | P0                                                         |
| **Pre-conditions**  | Driver just changed status to "dispatched"                 |
| **Steps**           | 1. Change status to "dispatched"<br>2. Refresh the page    |
| **Expected Result** | Status still shows "dispatched". Timestamps are preserved. |

#### D3-TC07: Mark as Failed

| Field               | Value                                                                                                          |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| **ID**              | D3-TC07                                                                                                        |
| **Description**     | Driver can mark delivery as failed                                                                             |
| **Priority**        | P1                                                                                                             |
| **Pre-conditions**  | Assignment is in any active status (assigned/dispatched/en_route/arrived)                                      |
| **Steps**           | 1. Click "Report Issue" or "Failed Delivery"<br>2. Enter reason (e.g., "Customer not available")<br>3. Confirm |
| **Expected Result** | Status changes to "failed". Notes contain reason. Delivery removed from active queue.                          |

---

### 3.4 D4 — Proof of Delivery

#### D4-TC01: Capture Delivery Photo

| Field               | Value                                                                            |
| ------------------- | -------------------------------------------------------------------------------- |
| **ID**              | D4-TC01                                                                          |
| **Description**     | Driver can take a photo as proof of delivery                                     |
| **Priority**        | P0                                                                               |
| **Pre-conditions**  | Assignment status = 'arrived'; device has camera access                          |
| **Steps**           | 1. Click "Capture Proof"<br>2. Camera opens<br>3. Take photo<br>4. Confirm photo |
| **Expected Result** | Photo preview is displayed. Photo is ready for upload.                           |

#### D4-TC02: Enter Recipient Name

| Field               | Value                                                                   |
| ------------------- | ----------------------------------------------------------------------- |
| **ID**              | D4-TC02                                                                 |
| **Description**     | Driver can enter the name of the person who received the delivery       |
| **Priority**        | P0                                                                      |
| **Pre-conditions**  | Proof capture screen is open                                            |
| **Steps**           | 1. Enter recipient name: "Jane Smith"                                   |
| **Expected Result** | Recipient name field accepts input and is included in the proof record. |

#### D4-TC03: Submit Proof of Delivery

| Field               | Value                                                                                                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | D4-TC03                                                                                                                                                                 |
| **Description**     | Complete proof is uploaded and saved                                                                                                                                    |
| **Priority**        | P0                                                                                                                                                                      |
| **Pre-conditions**  | Photo captured; recipient name entered                                                                                                                                  |
| **Steps**           | 1. Review captured photo and recipient name<br>2. Click "Submit Proof"                                                                                                  |
| **Expected Result** | Photo uploaded to `delivery-proofs` storage bucket. `delivery_proofs` record created with `photo_url`, `recipient_name`, and `captured_at`. Success confirmation shown. |

#### D4-TC04: Proof Without Photo

| Field               | Value                                                             |
| ------------------- | ----------------------------------------------------------------- |
| **ID**              | D4-TC04                                                           |
| **Description**     | Attempting to submit proof without a photo shows validation error |
| **Priority**        | P1                                                                |
| **Pre-conditions**  | Proof capture screen is open; no photo taken                      |
| **Steps**           | 1. Enter recipient name but skip photo<br>2. Click "Submit Proof" |
| **Expected Result** | Validation error: "Photo is required". Proof is not submitted.    |

#### D4-TC05: Add Notes to Proof

| Field               | Value                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| **ID**              | D4-TC05                                                                                           |
| **Description**     | Driver can add optional notes to the proof                                                        |
| **Priority**        | P2                                                                                                |
| **Pre-conditions**  | Proof capture screen is open                                                                      |
| **Steps**           | 1. Capture photo<br>2. Enter recipient name<br>3. Add note: "Left at reception desk"<br>4. Submit |
| **Expected Result** | Proof saved with notes field populated.                                                           |

#### D4-TC06: Camera Permission Denied

| Field               | Value                                                                                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | D4-TC06                                                                                                                                                  |
| **Description**     | App handles camera permission denial gracefully                                                                                                          |
| **Priority**        | P1                                                                                                                                                       |
| **Pre-conditions**  | Camera permission is denied in browser/device settings                                                                                                   |
| **Steps**           | 1. Click "Capture Proof"<br>2. Browser prompts for camera permission<br>3. Deny permission                                                               |
| **Expected Result** | Friendly error message: "Camera access required for proof of delivery. Please enable in browser settings." Alternative: file upload option from gallery. |

---

### 3.5 D5 — Digital Handshake

#### D5-TC01: Driver Confirms Delivery

| Field               | Value                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **ID**              | D5-TC01                                                                                                             |
| **Description**     | Driver swipes/clicks to confirm their side of the handshake                                                         |
| **Priority**        | P0                                                                                                                  |
| **Pre-conditions**  | Order has a `digital_handshakes` record; `driver_confirmed = false`                                                 |
| **Steps**           | 1. Open delivery detail after submitting proof<br>2. Swipe or click "Confirm Delivery"                              |
| **Expected Result** | `driver_confirmed = true`, `driver_confirmed_at` = current timestamp. UI shows "Waiting for customer confirmation". |

#### D5-TC02: Both Sides Confirmed — Handshake Complete

| Field               | Value                                                                                                                               |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | D5-TC02                                                                                                                             |
| **Description**     | When driver confirms and customer has already confirmed, handshake completes                                                        |
| **Priority**        | P0                                                                                                                                  |
| **Pre-conditions**  | `customer_confirmed = true` (customer already swiped in EASI App); `driver_confirmed = false`                                       |
| **Steps**           | 1. Driver swipes "Confirm Delivery"                                                                                                 |
| **Expected Result** | `driver_confirmed = true`, `completed = true`, `completed_at` set. UI shows "Delivery Completed" with both confirmation timestamps. |

#### D5-TC03: Driver Confirms First, Customer Pending

| Field               | Value                                                                                                 |
| ------------------- | ----------------------------------------------------------------------------------------------------- |
| **ID**              | D5-TC03                                                                                               |
| **Description**     | Driver confirms first; handshake waits for customer                                                   |
| **Priority**        | P0                                                                                                    |
| **Pre-conditions**  | `customer_confirmed = false`; `driver_confirmed = false`                                              |
| **Steps**           | 1. Driver swipes "Confirm Delivery"                                                                   |
| **Expected Result** | `driver_confirmed = true`. `completed` remains `false`. UI shows "Waiting for customer confirmation". |

#### D5-TC04: Handshake Status Updates in Real-Time

| Field               | Value                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------- |
| **ID**              | D5-TC04                                                                                     |
| **Description**     | When customer confirms in EASI App, driver sees update without refresh                      |
| **Priority**        | P1                                                                                          |
| **Pre-conditions**  | Driver has confirmed; customer has NOT yet confirmed; driver is viewing the delivery detail |
| **Steps**           | 1. Customer confirms in EASI App<br>2. Observe EasiDriver delivery detail                   |
| **Expected Result** | Handshake status updates to "Completed" within seconds via Supabase Realtime.               |

#### D5-TC05: Cannot Confirm Twice

| Field               | Value                                                                          |
| ------------------- | ------------------------------------------------------------------------------ |
| **ID**              | D5-TC05                                                                        |
| **Description**     | Driver cannot re-confirm an already confirmed handshake                        |
| **Priority**        | P1                                                                             |
| **Pre-conditions**  | `driver_confirmed = true`                                                      |
| **Steps**           | 1. Open delivery detail<br>2. Attempt to swipe "Confirm" again                 |
| **Expected Result** | Confirm action is disabled or hidden. Text shows "You have already confirmed". |

---

### 3.6 D6 — Delivery History

#### D6-TC01: History Shows Past Deliveries

| Field               | Value                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | D6-TC01                                                                                                                                     |
| **Description**     | Delivery history lists completed deliveries                                                                                                 |
| **Priority**        | P0                                                                                                                                          |
| **Pre-conditions**  | Driver has completed at least 3 deliveries in the past                                                                                      |
| **Steps**           | 1. Navigate to "History" tab/page                                                                                                           |
| **Expected Result** | List shows completed deliveries sorted by date (most recent first). Each entry shows order number, company name, delivery date, and status. |

#### D6-TC02: History Excludes Active Deliveries

| Field               | Value                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------------- |
| **ID**              | D6-TC02                                                                                       |
| **Description**     | Active (non-delivered) assignments do not appear in history                                   |
| **Priority**        | P1                                                                                            |
| **Pre-conditions**  | Driver has active assignments with status != 'delivered'                                      |
| **Steps**           | 1. Navigate to history                                                                        |
| **Expected Result** | Only deliveries with status "delivered" or "failed" appear. Active assignments are NOT shown. |

#### D6-TC03: History Detail View

| Field               | Value                                                                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ID**              | D6-TC03                                                                                                                                                                        |
| **Description**     | Tapping a history entry shows delivery details                                                                                                                                 |
| **Priority**        | P1                                                                                                                                                                             |
| **Pre-conditions**  | History has entries                                                                                                                                                            |
| **Steps**           | 1. Navigate to history<br>2. Tap on a delivery entry                                                                                                                           |
| **Expected Result** | Detail view shows: order number, company, address, all timestamps (assigned, dispatched, arrived, delivered), proof of delivery (photo, recipient name), and handshake status. |

#### D6-TC04: Empty History

| Field               | Value                                               |
| ------------------- | --------------------------------------------------- |
| **ID**              | D6-TC04                                             |
| **Description**     | New driver with no past deliveries sees empty state |
| **Priority**        | P2                                                  |
| **Pre-conditions**  | Driver has zero completed deliveries                |
| **Steps**           | 1. Navigate to history                              |
| **Expected Result** | Empty state: "No delivery history yet". No error.   |

#### D6-TC05: Pagination

| Field               | Value                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------- |
| **ID**              | D6-TC05                                                                               |
| **Description**     | History loads more entries on scroll                                                  |
| **Priority**        | P2                                                                                    |
| **Pre-conditions**  | Driver has 100+ completed deliveries                                                  |
| **Steps**           | 1. Navigate to history<br>2. Scroll to bottom                                         |
| **Expected Result** | First 50 entries loaded. Scrolling to bottom triggers load of next 50. No duplicates. |

---

## 4. Cross-App Integration Test Cases

### 4.1 Full Order Lifecycle

#### INT-TC01: Salesman → Admin → Driver → Customer Complete Flow

| Field               | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | INT-TC01                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Description**     | End-to-end order flow from salesman order to customer handshake                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Priority**        | P0                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Pre-conditions**  | Salesman, admin, driver, and customer accounts all exist. Company has credit. Products exist.                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Steps**           | 1. **EasiSales:** Salesman selects customer company, adds products, submits order<br>2. **Admin Web:** Admin sees new order, assigns driver and delivery zone<br>3. **EasiDriver:** Driver sees assignment in queue<br>4. **EasiDriver:** Driver transitions: dispatched → en_route → arrived<br>5. **EasiDriver:** Driver captures proof (photo + recipient name)<br>6. **EasiDriver:** Driver confirms digital handshake<br>7. **EASI App:** Customer confirms digital handshake<br>8. Verify order status is "delivered" |
| **Expected Result** | Order flows through all stages. Each app shows correct data at each step. Final state: order delivered, handshake completed, proof stored. All timestamps populated.                                                                                                                                                                                                                                                                                                                                                        |

#### INT-TC02: Order Appears in Admin After Salesman Submission

| Field               | Value                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **ID**              | INT-TC02                                                                                                                       |
| **Description**     | Admin Web receives salesman-placed order                                                                                       |
| **Priority**        | P0                                                                                                                             |
| **Pre-conditions**  | Salesman is logged into EasiSales; Admin is logged into Admin Web                                                              |
| **Steps**           | 1. Salesman submits order on behalf of customer<br>2. Admin navigates to Orders page                                           |
| **Expected Result** | New order visible with `placed_by_staff_id` attribution. Order shows salesman name. Order details (items, totals) are correct. |

#### INT-TC03: Admin Assigns Driver → Appears in Driver Queue

| Field               | Value                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | INT-TC03                                                                                                                                                |
| **Description**     | Driver assignment by admin appears in EasiDriver                                                                                                        |
| **Priority**        | P0                                                                                                                                                      |
| **Pre-conditions**  | Order exists; driver is logged into EasiDriver                                                                                                          |
| **Steps**           | 1. Admin opens order detail in Admin Web<br>2. Admin selects driver from dropdown<br>3. Admin sets delivery zone to "North"<br>4. Admin clicks "Assign" |
| **Expected Result** | `delivery_assignments` record created. `digital_handshakes` record created. Driver's queue shows new delivery (via Realtime or refresh).                |

#### INT-TC04: Driver Status Updates Visible to Customer

| Field               | Value                                                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **ID**              | INT-TC04                                                                                                              |
| **Description**     | Customer's EASI App shows real-time delivery status                                                                   |
| **Priority**        | P1                                                                                                                    |
| **Pre-conditions**  | Customer is viewing order in EASI App; driver is updating status                                                      |
| **Steps**           | 1. Driver marks "Dispatched" in EasiDriver<br>2. Observe customer's order detail in EASI App                          |
| **Expected Result** | Customer sees status update to "Dispatched" (via Realtime subscription on `delivery_assignments` or `orders.status`). |

### 4.2 Customer Onboarding Lifecycle

#### INT-TC05: Salesman Onboards → Admin Approves → Customer Logs In

| Field               | Value                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | INT-TC05                                                                                                                                                                                                                                                                      |
| **Description**     | Full onboarding flow from salesman request to customer's first login                                                                                                                                                                                                          |
| **Priority**        | P0                                                                                                                                                                                                                                                                            |
| **Pre-conditions**  | Salesman logged into EasiSales; Admin logged into Admin Web                                                                                                                                                                                                                   |
| **Steps**           | 1. **EasiSales:** Salesman submits onboarding request for "New Wine Bar"<br>2. **Admin Web:** Admin reviews request, approves it<br>3. **Admin Web:** System creates company record, user account, permissions<br>4. **EASI App:** Customer logs in with provided credentials |
| **Expected Result** | Company "New Wine Bar" exists in `companies` table with proposed credit limit. User account created. Customer can browse products and place orders.                                                                                                                           |

#### INT-TC06: Admin Rejects Onboarding Request

| Field               | Value                                                                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | INT-TC06                                                                                                                                            |
| **Description**     | Admin rejects a salesman's onboarding request                                                                                                       |
| **Priority**        | P1                                                                                                                                                  |
| **Pre-conditions**  | Pending onboarding request exists                                                                                                                   |
| **Steps**           | 1. Admin opens onboarding request in Admin Web<br>2. Admin enters rejection reason: "Insufficient credit references"<br>3. Admin clicks "Reject"    |
| **Expected Result** | Request status → 'rejected'. `admin_notes` populated. Salesman sees "Rejected" status with reason in EasiSales. No company or user account created. |

### 4.3 Digital Handshake Cross-App

#### INT-TC07: Customer Confirms First, Then Driver

| Field               | Value                                                                                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | INT-TC07                                                                                                                                                  |
| **Description**     | Handshake completes when customer confirms first, then driver                                                                                             |
| **Priority**        | P0                                                                                                                                                        |
| **Pre-conditions**  | Order delivered; `digital_handshakes` record exists; neither confirmed                                                                                    |
| **Steps**           | 1. **EASI App:** Customer swipes to confirm<br>2. Verify: `customer_confirmed = true`, `completed = false`<br>3. **EasiDriver:** Driver swipes to confirm |
| **Expected Result** | After step 3: `driver_confirmed = true`, `completed = true`, `completed_at` set. Both apps show "Completed".                                              |

#### INT-TC08: Driver Confirms First, Then Customer

| Field               | Value                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | INT-TC08                                                                                                                                                |
| **Description**     | Handshake completes when driver confirms first, then customer                                                                                           |
| **Priority**        | P0                                                                                                                                                      |
| **Pre-conditions**  | Same as INT-TC07                                                                                                                                        |
| **Steps**           | 1. **EasiDriver:** Driver swipes to confirm<br>2. Verify: `driver_confirmed = true`, `completed = false`<br>3. **EASI App:** Customer swipes to confirm |
| **Expected Result** | After step 3: `customer_confirmed = true`, `completed = true`, `completed_at` set. Both apps show "Completed".                                          |

---

## 5. Edge Cases and Error Scenarios

### 5.1 Network Failures

#### ERR-TC01: Network Failure During Status Update

| Field               | Value                                                                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | ERR-TC01                                                                                                                                                            |
| **Description**     | Driver loses connectivity while updating delivery status                                                                                                            |
| **Priority**        | P0                                                                                                                                                                  |
| **Pre-conditions**  | Driver is about to change status; network is about to drop                                                                                                          |
| **Steps**           | 1. Driver is online, viewing delivery with status "en_route"<br>2. Simulate network disconnection (airplane mode or DevTools offline)<br>3. Driver clicks "Arrived" |
| **Expected Result** | Error message: "Unable to update status — check your connection and try again". Previous status preserved. No data corruption. Retry button available.              |

#### ERR-TC02: Network Failure During Photo Upload

| Field               | Value                                                                                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | ERR-TC02                                                                                                                                  |
| **Description**     | Upload fails for delivery proof photo                                                                                                     |
| **Priority**        | P0                                                                                                                                        |
| **Pre-conditions**  | Driver captured photo; about to upload                                                                                                    |
| **Steps**           | 1. Capture photo<br>2. Disconnect network<br>3. Click "Submit Proof"                                                                      |
| **Expected Result** | Error message: "Photo upload failed — please check your connection". Photo is retained in local state (not lost). Retry button available. |

#### ERR-TC03: Network Recovery After Failure

| Field               | Value                                                                            |
| ------------------- | -------------------------------------------------------------------------------- |
| **ID**              | ERR-TC03                                                                         |
| **Description**     | Retrying a failed operation after network recovery succeeds                      |
| **Priority**        | P1                                                                               |
| **Pre-conditions**  | A status update or photo upload previously failed due to network                 |
| **Steps**           | 1. Reconnect to network<br>2. Click "Retry" on the failed operation              |
| **Expected Result** | Operation completes successfully. Data is correct. No duplicate records created. |

### 5.2 Concurrent Access

#### ERR-TC04: Two Drivers Assigned Same Order

| Field               | Value                                                                                                                                                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | ERR-TC04                                                                                                                                                                                                                              |
| **Description**     | Admin accidentally assigns the same order to two different drivers                                                                                                                                                                    |
| **Priority**        | P1                                                                                                                                                                                                                                    |
| **Pre-conditions**  | Order exists; two drivers exist                                                                                                                                                                                                       |
| **Steps**           | 1. Admin assigns order to Driver A<br>2. Admin (or another admin) assigns same order to Driver B                                                                                                                                      |
| **Expected Result** | Either: (a) second assignment creates a new `delivery_assignments` row (both drivers see it), or (b) system prevents duplicate assignment with error "Order already assigned to Driver A — reassign?". The preferred behavior is (b). |

#### ERR-TC05: Simultaneous Handshake Confirmations

| Field               | Value                                                                                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | ERR-TC05                                                                                                                                                    |
| **Description**     | Customer and driver confirm handshake at the exact same time                                                                                                |
| **Priority**        | P2                                                                                                                                                          |
| **Pre-conditions**  | Both confirmations are `false`; both users are about to confirm                                                                                             |
| **Steps**           | 1. Customer and driver both swipe "Confirm" within 1 second of each other                                                                                   |
| **Expected Result** | Both `customer_confirmed` and `driver_confirmed` are `true`. `completed = true`. No race condition causes data loss. Only one `completed_at` timestamp set. |

### 5.3 Session Management

#### ERR-TC06: Session Expiry Mid-Operation

| Field               | Value                                                                                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | ERR-TC06                                                                                                                                                    |
| **Description**     | JWT expires while driver is submitting proof                                                                                                                |
| **Priority**        | P1                                                                                                                                                          |
| **Pre-conditions**  | Driver's JWT is about to expire (near the end of its 3600s lifetime)                                                                                        |
| **Steps**           | 1. Driver fills out proof of delivery form<br>2. JWT expires before submission<br>3. Driver clicks "Submit"                                                 |
| **Expected Result** | Supabase auto-refreshes the token. Submission succeeds transparently. If auto-refresh fails, user is prompted to re-login and their form data is preserved. |

#### ERR-TC07: Using App After Being Deactivated

| Field               | Value                                                                                                             |
| ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **ID**              | ERR-TC07                                                                                                          |
| **Description**     | Admin deactivates driver while driver has active session                                                          |
| **Priority**        | P2                                                                                                                |
| **Pre-conditions**  | Driver is logged in; admin sets `is_active = false`                                                               |
| **Steps**           | 1. Driver attempts to update delivery status<br>2. RLS policy rejects the query (staff_profiles check fails)      |
| **Expected Result** | Driver receives an error. On next API call or page navigation, the app detects inactive status and forces logout. |

### 5.4 Data Validation Edge Cases

#### ERR-TC08: Large Photo Upload

| Field               | Value                                                                                                                                                                       |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | ERR-TC08                                                                                                                                                                    |
| **Description**     | Driver uploads a very large photo (>5 MB)                                                                                                                                   |
| **Priority**        | P1                                                                                                                                                                          |
| **Pre-conditions**  | Camera captures high-resolution photo exceeding 5 MB                                                                                                                        |
| **Steps**           | 1. Capture high-res photo<br>2. Attempt upload                                                                                                                              |
| **Expected Result** | Either: (a) client-side image compression reduces to under 5 MB before upload, or (b) clear error message: "Photo too large (max 5 MB). Please retake at lower resolution." |

#### ERR-TC09: Order Placed for Suspended Company

| Field               | Value                                                                                                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | ERR-TC09                                                                                                                                                              |
| **Description**     | Salesman tries to place order for a company with status 'suspended'                                                                                                   |
| **Priority**        | P1                                                                                                                                                                    |
| **Pre-conditions**  | Company exists with `status = 'suspended'`                                                                                                                            |
| **Steps**           | 1. Salesman navigates to company detail<br>2. Clicks "New Order"                                                                                                      |
| **Expected Result** | Either: (a) "New Order" button is disabled with tooltip "Company is suspended", or (b) validation error on submission: "Cannot place orders for suspended companies". |

#### ERR-TC10: Duplicate UEN in Onboarding

| Field               | Value                                                                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | ERR-TC10                                                                                                                           |
| **Description**     | Salesman submits onboarding request with UEN that already exists                                                                   |
| **Priority**        | P2                                                                                                                                 |
| **Pre-conditions**  | Company with UEN "201234567A" already exists in `companies` table                                                                  |
| **Steps**           | 1. Open onboarding form<br>2. Enter UEN "201234567A"<br>3. Submit                                                                  |
| **Expected Result** | Warning: "A company with this UEN already exists — did you mean [The Winery]?" Request can still be submitted (admin will review). |

### 5.5 UI/UX Edge Cases

#### ERR-TC11: Driver With No Assignments for a Week

| Field               | Value                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------- |
| **ID**              | ERR-TC11                                                                               |
| **Description**     | Driver logs in daily but has no assignments                                            |
| **Priority**        | P2                                                                                     |
| **Pre-conditions**  | Driver account exists; no delivery_assignments for this driver                         |
| **Steps**           | 1. Login each day for 7 days                                                           |
| **Expected Result** | Empty state is consistent. No stale data from previous days. History remains accurate. |

#### ERR-TC12: Salesman Searches for Product That's Out of Stock

| Field               | Value                                                                                                            |
| ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **ID**              | ERR-TC12                                                                                                         |
| **Description**     | Salesman finds product in catalog but stock = 0                                                                  |
| **Priority**        | P1                                                                                                               |
| **Pre-conditions**  | Product exists with stock_quantity = 0                                                                           |
| **Steps**           | 1. Search for product<br>2. Attempt to add to order                                                              |
| **Expected Result** | Product shown with "Out of Stock" badge. "Add to Order" button disabled. Salesman can still see product details. |

#### ERR-TC13: Multiple Browser Tabs

| Field               | Value                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------- |
| **ID**              | ERR-TC13                                                                                |
| **Description**     | Driver opens EasiDriver in multiple tabs                                                |
| **Priority**        | P2                                                                                      |
| **Pre-conditions**  | Driver is logged in                                                                     |
| **Steps**           | 1. Open EasiDriver in Tab 1<br>2. Open same URL in Tab 2<br>3. Update status in Tab 1   |
| **Expected Result** | Tab 2 receives the update via Realtime subscription. No conflicting state between tabs. |

#### ERR-TC14: Back Button During Order Submission

| Field               | Value                                                                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | ERR-TC14                                                                                                                                                                                    |
| **Description**     | Salesman hits browser back button while order is being submitted                                                                                                                            |
| **Priority**        | P1                                                                                                                                                                                          |
| **Pre-conditions**  | Salesman has filled out order and clicked "Submit"                                                                                                                                          |
| **Steps**           | 1. Click "Submit Order"<br>2. Immediately press browser back button                                                                                                                         |
| **Expected Result** | Either: (a) navigation is blocked during submission ("Order is being submitted, please wait"), or (b) order still submits in background and is not duplicated. No duplicate orders created. |

#### ERR-TC15: Extremely Long Company Name in Onboarding

| Field               | Value                                                                                                                                                                |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | ERR-TC15                                                                                                                                                             |
| **Description**     | Salesman enters a very long company name (500+ characters)                                                                                                           |
| **Priority**        | P2                                                                                                                                                                   |
| **Pre-conditions**  | Onboarding form is open                                                                                                                                              |
| **Steps**           | 1. Enter 500-character company name<br>2. Submit                                                                                                                     |
| **Expected Result** | Either: (a) client-side character limit prevents entry beyond 255 chars, or (b) database accepts it (TEXT type has no limit) and UI truncates display with ellipsis. |

---

## Appendix A: Test Data Requirements

### Minimum Seed Data for Beta Testing

| Entity                   | Count | Details                                                     |
| ------------------------ | ----- | ----------------------------------------------------------- |
| **Staff (Salesman)**     | 3     | Different territories                                       |
| **Staff (Driver)**       | 3     | Different delivery zones                                    |
| **Companies**            | 10    | Mix of active, suspended, pending; various credit limits    |
| **Products**             | 50    | Various categories, prices, stock levels; some out of stock |
| **Users (Customers)**    | 15    | Mix of individual and company users                         |
| **Orders**               | 20    | Various statuses, some placed by staff, some by customers   |
| **Delivery Assignments** | 10    | Various statuses across all 3 drivers                       |
| **Digital Handshakes**   | 5     | Mix of pending, partial, and completed                      |
| **Onboarding Requests**  | 5     | Mix of pending, approved, rejected                          |

### Test Account Credentials (Staging Only)

| Role       | Email                  | Notes                           |
| ---------- | ---------------------- | ------------------------------- |
| Salesman 1 | salesman1@epico.sg     | Territory: Central              |
| Salesman 2 | salesman2@epico.sg     | Territory: East                 |
| Salesman 3 | salesman3@epico.sg     | Deactivated (is_active = false) |
| Driver 1   | driver1@epico.sg       | Zone: North                     |
| Driver 2   | driver2@epico.sg       | Zone: East                      |
| Driver 3   | driver3@epico.sg       | Deactivated                     |
| Admin      | admin@epico.sg         | Full admin access               |
| Customer   | buyer@thewinery.com.sg | Company user                    |

## Appendix B: Test Case Summary

| App         | Feature            | P0     | P1     | P2     | Total  |
| ----------- | ------------------ | ------ | ------ | ------ | ------ |
| EasiSales   | S1 Auth            | 4      | 2      | 0      | 7      |
| EasiSales   | S2 Customer List   | 1      | 2      | 0      | 5      |
| EasiSales   | S3 Customer Detail | 2      | 0      | 1      | 4      |
| EasiSales   | S4 Order on Behalf | 5      | 2      | 0      | 9      |
| EasiSales   | S5 Onboarding      | 3      | 1      | 1      | 6      |
| EasiSales   | S6 Delivery Status | 0      | 2      | 0      | 2      |
| EasiSales   | S7 Performance     | 0      | 2      | 2      | 4      |
| EasiDriver  | D1 Auth            | 3      | 1      | 0      | 6      |
| EasiDriver  | D2 Queue           | 2      | 2      | 1      | 6      |
| EasiDriver  | D3 Status          | 5      | 1      | 0      | 7      |
| EasiDriver  | D4 Proof           | 2      | 2      | 1      | 6      |
| EasiDriver  | D5 Handshake       | 3      | 1      | 0      | 5      |
| EasiDriver  | D6 History         | 1      | 2      | 2      | 5      |
| Integration | Cross-App          | 5      | 2      | 0      | 8      |
| Edge Cases  | Error Scenarios    | 2      | 6      | 6      | 15     |
| **Total**   |                    | **38** | **28** | **14** | **95** |

**Beta release gate:** All 38 P0 test cases must pass.

---

_End of QA Test Specifications_
