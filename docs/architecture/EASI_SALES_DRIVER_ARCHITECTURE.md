# EASI Sales & Driver Architecture Document

**Version:** 1.0
**Date:** 2026-03-06
**Author:** EASI Engineering
**Status:** Approved for Beta Development

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Tech Stack Decisions](#2-tech-stack-decisions)
3. [Authentication & Authorization](#3-authentication--authorization)
4. [Database Schema (New Tables)](#4-database-schema-new-tables)
5. [API Contracts](#5-api-contracts)
6. [Cross-App Workflows](#6-cross-app-workflows)
7. [Security Considerations](#7-security-considerations)
8. [Deployment Strategy](#8-deployment-strategy)
9. [Future Considerations](#9-future-considerations)

---

## 1. System Overview

### 1.1 Ecosystem Topology

```
                          +-----------------------+
                          |    SUPABASE CLOUD      |
                          |  (Shared PostgreSQL)   |
                          |                        |
                          |  Auth · Storage · RLS  |
                          |  Realtime · Edge Fns   |
                          +-----------+------------+
                                      |
           +--------+--------+--------+--------+--------+
           |        |        |        |        |        |
           v        v        v        v        v        v
      +--------+ +------+ +-------+ +--------+ +--------+
      | EASI   | |Admin | |Easi   | |Easi    | |EASI    |
      | App    | |Web   | |Sales  | |Driver  | |Bridge  |
      +--------+ +------+ +-------+ +--------+ +--------+
      |React   | |Vite  | |Vite   | |Vite    | |C# .NET |
      |Native  | |React | |React  | |React   | |4.8 Win |
      |Expo 54 | |TW 4  | |TW 4   | |TW 4    | |Service |
      +--------+ +------+ +-------+ +--------+ +--------+
      Customer   EPICO     EPICO     EPICO      AutoCount
      facing     admin     salesmen  drivers     sync
      (mobile)   (desktop) (tablet/  (mobile/    (server)
                           mobile)   tablet)
```

### 1.2 Component Responsibilities

| Component  | Users           | Primary Purpose                                   | Platform          |
| ---------- | --------------- | ------------------------------------------------- | ----------------- |
| EASI App   | B2B/B2C buyers  | Browse catalog, place orders, track delivery      | iOS/Android       |
| Admin Web  | EPICO ops staff | Manage products, orders, customers, invoices      | Desktop web       |
| EasiSales  | EPICO salesmen  | CRM, order-on-behalf, onboard customers           | Tablet/mobile web |
| EasiDriver | EPICO drivers   | Delivery queue, status updates, proof of delivery | Mobile web/PWA    |
| EASIBridge | Automated       | Sync debtors from AutoCount → Supabase            | Windows server    |

### 1.3 Data Flow Summary

```
  Customer places order          Salesman places order on behalf
        |                                  |
        v                                  v
  +----------+                      +----------+
  | EASI App |                      |EasiSales |
  +----+-----+                      +----+-----+
       |                                  |
       |   INSERT orders + order_items    |   INSERT orders (placed_by_staff_id set)
       +---------------+  +--------------+
                        |  |
                        v  v
                   +-----------+
                   | SUPABASE  |
                   |  orders   |
                   +-----+-----+
                         |
          Realtime subscription / Admin query
          +--------+----------+
          |        |          |
          v        v          v
     +--------+ +------+ +--------+
     |Admin   | |Easi  | |Easi    |
     |Web     | |Sales | |Driver  |
     +--------+ +------+ +--------+
     Assign     See own   See assigned
     driver     orders    deliveries
                          |
                          v
                   Update delivery_assignments status
                   Upload delivery_proofs
                   Complete digital_handshakes
                          |
                          v
                   +-----------+
                   | EASI App  |  (customer confirms handshake)
                   +-----------+
```

---

## 2. Tech Stack Decisions

### 2.1 Why Vite + React + Tailwind CSS 4

| Factor                   | Decision Rationale                                                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Consistency**          | Admin Web already uses Vite 7 + React 19 + Tailwind 4. Same build pipeline, same component patterns, same developer mental model.                 |
| **Speed**                | Vite's HMR is sub-100ms. A salesman in the field or a driver on a delivery route gets instant feedback during development/testing.                |
| **Dependency alignment** | All three web apps share `@supabase/supabase-js ^2.86`, `react-router-dom ^7`, `lucide-react` for icons. Potential for a shared UI package later. |
| **Bundle size**          | Tailwind 4's JIT produces tiny CSS. Vite's tree-shaking keeps JS bundles under 200 KB gzipped for these focused apps.                             |
| **Team familiarity**     | Admin Web is already built and running. The team doesn't need to learn a new framework.                                                           |

### 2.2 Why Web Apps Instead of Native Mobile (for Beta)

| Factor                      | Decision Rationale                                                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Time to market**          | Beta target is 4-6 weeks. Native builds require app store review, provisioning profiles, and device management. Web apps ship instantly.          |
| **No app store dependency** | EPICO staff are internal users. Distribution via URL is simpler than MDM or TestFlight.                                                           |
| **PWA capability**          | EasiDriver benefits from install-to-home-screen, offline caching (service worker), and camera access via `navigator.mediaDevices`.                |
| **Upgrade path**            | Post-beta, the React component logic ports cleanly to React Native if native features (GPS background tracking, push notifications) are required. |
| **Device flexibility**      | Salesmen may use tablets in meetings; drivers use phones in vans. Responsive web handles both without separate builds.                            |

### 2.3 Shared Supabase Backend

**Benefits:**

- Single source of truth for orders, products, companies, and users
- One auth system — staff, customers, and admins all use `auth.users`
- Real-time subscriptions work cross-app (driver status update appears instantly in customer's EASI App)
- Single set of RLS policies governs data access regardless of which client queries

**Risks & Mitigations:**

| Risk                          | Mitigation                                                                                          |
| ----------------------------- | --------------------------------------------------------------------------------------------------- |
| RLS complexity with 5 clients | Strict policy per table; integration tests that verify each role's access                           |
| Schema coupling               | New tables are additive; no existing table structures changed (only new columns on `orders`)        |
| Rate limiting                 | Supabase Pro plan provides 1000 req/s; internal apps have low concurrent user counts (~10-30 staff) |
| Credential leakage            | Each app uses its own `.env` with the anon key; service role key is **never** shipped to any client |

---

## 3. Authentication & Authorization

### 3.1 Auth Flow

All five apps use Supabase Auth with email/password. The flow diverges at role resolution:

```
  User enters credentials
        |
        v
  supabase.auth.signInWithPassword()
        |
        v
  Session returned (JWT with user_id)
        |
        +-------> EASI App: Query `users` table → resolve account_type, company_id
        |
        +-------> Admin Web: Query `users` table → verify role = 'admin' or 'superadmin'
        |
        +-------> EasiSales: Query `staff_profiles` → verify staff_role = 'salesman'
        |
        +-------> EasiDriver: Query `staff_profiles` → verify staff_role = 'driver'
```

### 3.2 The `staff_profiles` Table

This table is the gatekeeper for EasiSales and EasiDriver. It references `auth.users(id)` and stores:

| Column          | Purpose                                                           |
| --------------- | ----------------------------------------------------------------- |
| `user_id`       | FK to `auth.users` — the login identity                           |
| `staff_role`    | `'salesman'` or `'driver'` — determines which app they can access |
| `employee_id`   | EPICO's internal employee number                                  |
| `territory`     | Sales territory (for salesmen)                                    |
| `delivery_zone` | Default zone: north/south/east/west (for drivers)                 |
| `is_active`     | Soft disable without deleting the auth account                    |

### 3.3 Role Gating Logic

**EasiSales login:**

```
1. signInWithPassword(email, password)
2. SELECT * FROM staff_profiles WHERE user_id = auth.uid()
3. IF no row OR staff_role != 'salesman' OR is_active = false
     → sign out, show "Access denied — salesman account required"
4. ELSE → proceed to salesman dashboard
```

**EasiDriver login:**

```
1. signInWithPassword(email, password)
2. SELECT * FROM staff_profiles WHERE user_id = auth.uid()
3. IF no row OR staff_role != 'driver' OR is_active = false
     → sign out, show "Access denied — driver account required"
4. ELSE → proceed to driver dashboard
```

### 3.4 RLS Policy Strategy

| Table                          | Salesman Access                             | Driver Access                     | Customer Access  | Admin/Service Role |
| ------------------------------ | ------------------------------------------- | --------------------------------- | ---------------- | ------------------ |
| `staff_profiles`               | Read own                                    | Read own                          | None             | Full CRUD          |
| `companies`                    | Read all (for customer list)                | None                              | Read own company | Full CRUD          |
| `orders`                       | Read/write where `placed_by_staff_id` = own | Read via `delivery_assignments`   | Read own         | Full CRUD          |
| `delivery_assignments`         | None                                        | Read/update own                   | None             | Full CRUD          |
| `delivery_proofs`              | None                                        | Insert/read own                   | None             | Full CRUD          |
| `digital_handshakes`           | Read (for own orders)                       | Read/update (for assigned orders) | Read/update own  | Full CRUD          |
| `customer_onboarding_requests` | Read/insert own                             | None                              | None             | Full CRUD          |
| `products`                     | Read all                                    | None                              | Read all         | Full CRUD          |

### 3.5 Session Management

- JWT tokens auto-refresh via `supabase.auth.onAuthStateChange`
- Session persisted to `localStorage` (web apps)
- Idle timeout: 30 minutes of inactivity → prompt re-login
- Token refresh interval: Supabase default (3600s JWT, auto-refresh at 50% expiry)
- Each app stores its session independently — logging out of EasiSales does not affect EasiDriver

---

## 4. Database Schema (New Tables)

### 4.1 Entity Relationship Diagram

```
                         +------------------+
                         |   auth.users     |
                         |------------------|
                         | id (PK)          |
                         | email            |
                         | ...              |
                         +--------+---------+
                                  |
                  +---------------+---------------+
                  |                               |
                  v                               v
         +----------------+              +---------------+
         | staff_profiles |              |    users      |
         |----------------|              |---------------|
         | id (PK)        |              | id (PK)       |
         | user_id (FK)   |---+          | email         |
         | staff_role     |   |          | account_type  |
         | employee_id    |   |          | company_id    |--+
         | full_name      |   |          +-------+-------+  |
         | territory      |   |                  |          |
         | delivery_zone  |   |                  |          v
         | is_active      |   |                  |   +------------+
         +---+---+--------+   |                  |   | companies  |
             |   |             |                  |   |------------|
             |   |             |                  |   | id (PK)    |
    +--------+   +--------+   |                  |   | name       |
    |                     |   |                  |   | uen        |
    v                     v   |                  |   | credit_*   |
+--------------------+  +----+---------------+  |   +------------+
| customer_onboarding|  | delivery_           |  |
| _requests          |  | assignments         |  |
|--------------------|  |---------------------|  |
| id (PK)            |  | id (PK)             |  |
| salesman_id (FK)   |  | order_id (FK)       |--+---+
| company_name       |  | driver_id (FK)      |  |   |
| uen                |  | delivery_zone       |  |   |
| contact_*          |  | status              |  |   |
| proposed_credit_*  |  | assigned_at         |  |   |
| status             |  | dispatched_at       |  |   |
| reviewed_by        |  | arrived_at          |  |   |
+--------------------+  | delivered_at        |  |   |
                         +---+--------+--------+  |   |
                             |        |            |   |
                             v        |            |   |
                   +-----------------+|            |   |
                   | delivery_proofs ||            |   |
                   |-----------------|+            |   |
                   | id (PK)         |             |   |
                   | delivery_       |             |   |
                   |  assignment_id  |             |   |
                   | photo_url       |             |   |
                   | signature_url   |             |   |
                   | recipient_name  |             |   |
                   +-----------------+             |   |
                                                   |   |
                              +--------------------+   |
                              v                        |
                    +-------------------+              |
                    |     orders        |<-------------+
                    |-------------------|
                    | id (PK)           |
                    | order_number      |
                    | user_id (FK)      |
                    | company_id (FK)   |
                    | placed_by_staff_id|  <-- NEW
                    | delivery_zone     |  <-- NEW
                    | assigned_driver_id|  <-- NEW
                    | status            |
                    | total             |
                    +--------+----------+
                             |
                             v
                    +-------------------+
                    |digital_handshakes |
                    |-------------------|
                    | id (PK)           |
                    | order_id (FK, UQ) |
                    | customer_confirmed|
                    | driver_confirmed  |
                    | completed         |
                    | completed_at      |
                    +-------------------+
```

### 4.2 Table Descriptions

#### `staff_profiles`

EPICO internal staff accounts. Each row links an `auth.users` login to a staff role.

| Column          | Type        | Constraints                                 | Description                     |
| --------------- | ----------- | ------------------------------------------- | ------------------------------- |
| `id`            | UUID        | PK, default `gen_random_uuid()`             | Staff profile identifier        |
| `user_id`       | UUID        | FK → `auth.users(id)`, UNIQUE, NOT NULL     | Login identity                  |
| `staff_role`    | TEXT        | CHECK `IN ('salesman', 'driver')`, NOT NULL | Role gate                       |
| `employee_id`   | TEXT        | Nullable                                    | EPICO employee number           |
| `full_name`     | TEXT        | NOT NULL                                    | Display name                    |
| `phone`         | TEXT        | Nullable                                    | Contact number                  |
| `email`         | TEXT        | Nullable                                    | Work email                      |
| `territory`     | TEXT        | Nullable                                    | Sales territory (salesmen)      |
| `delivery_zone` | TEXT        | Nullable                                    | Default delivery zone (drivers) |
| `is_active`     | BOOLEAN     | Default `true`                              | Active flag                     |
| `created_at`    | TIMESTAMPTZ | Default `now()`                             | —                               |
| `updated_at`    | TIMESTAMPTZ | Default `now()`, auto-trigger               | —                               |

#### `delivery_assignments`

Maps an order to a driver with a status pipeline tracking the delivery lifecycle.

| Column          | Type        | Constraints                                                                                          | Description                    |
| --------------- | ----------- | ---------------------------------------------------------------------------------------------------- | ------------------------------ |
| `id`            | UUID        | PK                                                                                                   | Assignment identifier          |
| `order_id`      | UUID        | FK → `orders(id)`, NOT NULL                                                                          | The order being delivered      |
| `driver_id`     | UUID        | FK → `staff_profiles(id)`, NOT NULL                                                                  | Assigned driver                |
| `delivery_zone` | TEXT        | CHECK `IN ('north','south','east','west')`                                                           | Singapore delivery zone        |
| `status`        | TEXT        | CHECK `IN ('assigned','dispatched','en_route','arrived','delivered','failed')`, default `'assigned'` | Pipeline status                |
| `assigned_at`   | TIMESTAMPTZ | Default `now()`                                                                                      | When admin assigned the driver |
| `dispatched_at` | TIMESTAMPTZ | Nullable                                                                                             | When driver marked dispatched  |
| `arrived_at`    | TIMESTAMPTZ | Nullable                                                                                             | When driver marked arrived     |
| `delivered_at`  | TIMESTAMPTZ | Nullable                                                                                             | When delivery completed        |
| `notes`         | TEXT        | Nullable                                                                                             | Driver or admin notes          |
| `created_at`    | TIMESTAMPTZ | Default `now()`                                                                                      | —                              |
| `updated_at`    | TIMESTAMPTZ | Default `now()`, auto-trigger                                                                        | —                              |

**Status pipeline (sequential, cannot skip):**

```
assigned → dispatched → en_route → arrived → delivered
                                            ↘ failed
```

#### `delivery_proofs`

Photo, signature, and metadata captured at the point of delivery.

| Column                   | Type        | Constraints                               | Description                              |
| ------------------------ | ----------- | ----------------------------------------- | ---------------------------------------- |
| `id`                     | UUID        | PK                                        | Proof identifier                         |
| `delivery_assignment_id` | UUID        | FK → `delivery_assignments(id)`, NOT NULL | Parent assignment                        |
| `photo_url`              | TEXT        | Nullable                                  | Supabase Storage URL for delivery photo  |
| `signature_url`          | TEXT        | Nullable                                  | Supabase Storage URL for signature image |
| `recipient_name`         | TEXT        | Nullable                                  | Name of person who received the delivery |
| `notes`                  | TEXT        | Nullable                                  | Additional notes                         |
| `captured_at`            | TIMESTAMPTZ | Default `now()`                           | When the proof was captured on-device    |
| `created_at`             | TIMESTAMPTZ | Default `now()`                           | —                                        |

#### `digital_handshakes`

Two-sided delivery confirmation. Both the customer (via EASI App) and the driver (via EasiDriver) must independently confirm to complete the handshake.

| Column                  | Type        | Constraints               | Description                      |
| ----------------------- | ----------- | ------------------------- | -------------------------------- |
| `id`                    | UUID        | PK                        | Handshake identifier             |
| `order_id`              | UUID        | FK → `orders(id)`, UNIQUE | One handshake per order          |
| `customer_confirmed`    | BOOLEAN     | Default `false`           | Customer side                    |
| `customer_confirmed_at` | TIMESTAMPTZ | Nullable                  | When customer swiped             |
| `driver_confirmed`      | BOOLEAN     | Default `false`           | Driver side                      |
| `driver_confirmed_at`   | TIMESTAMPTZ | Nullable                  | When driver swiped               |
| `completed`             | BOOLEAN     | Default `false`           | Both sides confirmed             |
| `completed_at`          | TIMESTAMPTZ | Nullable                  | When both confirmations received |
| `created_at`            | TIMESTAMPTZ | Default `now()`           | —                                |

**Completion logic (handled in app or via Supabase trigger):**

```
IF customer_confirmed = true AND driver_confirmed = true
  THEN completed = true, completed_at = now()
```

#### `customer_onboarding_requests`

Salesman-initiated request to onboard a new B2B customer.

| Column                   | Type          | Constraints                                                       | Description            |
| ------------------------ | ------------- | ----------------------------------------------------------------- | ---------------------- |
| `id`                     | UUID          | PK                                                                | Request identifier     |
| `salesman_id`            | UUID          | FK → `staff_profiles(id)`, NOT NULL                               | Submitting salesman    |
| `company_name`           | TEXT          | NOT NULL                                                          | Proposed company name  |
| `uen`                    | TEXT          | Nullable                                                          | Singapore UEN          |
| `contact_name`           | TEXT          | NOT NULL                                                          | Primary contact        |
| `contact_email`          | TEXT          | Nullable                                                          | Contact email          |
| `contact_phone`          | TEXT          | Nullable                                                          | Contact phone          |
| `address`                | TEXT          | Nullable                                                          | Business address       |
| `proposed_credit_limit`  | DECIMAL(12,2) | Nullable                                                          | Suggested credit limit |
| `proposed_payment_terms` | TEXT          | CHECK `IN ('CBD','COD','NET7','NET14','NET30','NET45','NET60')`   | Suggested terms        |
| `proposed_pricing_tier`  | INTEGER       | CHECK `BETWEEN 1 AND 5`                                           | Pricing tier 1-5       |
| `status`                 | TEXT          | CHECK `IN ('pending','approved','rejected')`, default `'pending'` | Review status          |
| `admin_notes`            | TEXT          | Nullable                                                          | Admin review notes     |
| `reviewed_by`            | UUID          | FK → `auth.users(id)`, Nullable                                   | Admin who reviewed     |
| `reviewed_at`            | TIMESTAMPTZ   | Nullable                                                          | Review timestamp       |
| `created_at`             | TIMESTAMPTZ   | Default `now()`                                                   | —                      |
| `updated_at`             | TIMESTAMPTZ   | Default `now()`, auto-trigger                                     | —                      |

#### New Columns on `orders`

| Column               | Type                            | Description                                                 |
| -------------------- | ------------------------------- | ----------------------------------------------------------- |
| `placed_by_staff_id` | UUID, FK → `staff_profiles(id)` | Set when a salesman places an order on behalf of a customer |
| `delivery_zone`      | TEXT                            | Singapore zone for delivery routing                         |
| `assigned_driver_id` | UUID, FK → `staff_profiles(id)` | Driver assigned by admin                                    |

### 4.3 Index Strategy

All indexes are chosen to accelerate the most frequent queries per app:

| Index                                          | Table                          | Columns       | Justification                    |
| ---------------------------------------------- | ------------------------------ | ------------- | -------------------------------- |
| `idx_staff_profiles_user_id`                   | `staff_profiles`               | `user_id`     | Auth lookup on every login       |
| `idx_staff_profiles_staff_role`                | `staff_profiles`               | `staff_role`  | Filter salesmen vs drivers       |
| `idx_delivery_assignments_driver_id`           | `delivery_assignments`         | `driver_id`   | Driver's queue lookup            |
| `idx_delivery_assignments_order_id`            | `delivery_assignments`         | `order_id`    | Join with orders                 |
| `idx_delivery_assignments_status`              | `delivery_assignments`         | `status`      | Filter active deliveries         |
| `idx_customer_onboarding_requests_salesman_id` | `customer_onboarding_requests` | `salesman_id` | Salesman's own requests          |
| `idx_customer_onboarding_requests_status`      | `customer_onboarding_requests` | `status`      | Admin filtering pending requests |

**Future indexes to add if needed:**

- `delivery_assignments(delivery_zone, status)` — composite for zone-filtered active deliveries
- `orders(placed_by_staff_id)` — salesman's order history
- `orders(assigned_driver_id)` — driver assignment lookups

---

## 5. API Contracts

### 5.1 Key Supabase Queries — EasiSales

#### S1: Salesman Auth

```sql
-- After signInWithPassword, verify role
SELECT * FROM staff_profiles
WHERE user_id = auth.uid() AND staff_role = 'salesman' AND is_active = true;
```

#### S2: Customer List

```sql
-- Browse all B2B companies with search
SELECT c.*, u.name as primary_contact_name
FROM companies c
LEFT JOIN users u ON u.company_id = c.id AND u.role = 'superadmin'
WHERE c.name ILIKE '%search_term%' OR c.uen ILIKE '%search_term%'
ORDER BY c.name ASC
LIMIT 50 OFFSET 0;
```

#### S3: Customer Detail

```sql
-- Company profile with financial summary
SELECT c.*,
  c.credit_limit,
  c.current_credit,
  (c.credit_limit - c.current_credit) as available_credit
FROM companies c WHERE c.id = :company_id;

-- Recent orders for this company
SELECT * FROM orders
WHERE company_id = :company_id
ORDER BY created_at DESC LIMIT 20;
```

#### S4: Order on Behalf

```sql
-- Insert order with staff attribution
INSERT INTO orders (
  order_number, user_id, company_id, status, order_type,
  subtotal, gst, delivery_fee, total, delivery_address,
  payment_method, payment_status, placed_by_staff_id, delivery_zone
) VALUES (
  :order_number, :customer_user_id, :company_id, 'pending', 'company',
  :subtotal, :gst, :delivery_fee, :total, :delivery_address,
  :payment_terms, 'paid', :salesman_staff_id, :zone
);

-- Insert order items
INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
VALUES (:order_id, :product_id, :name, :qty, :price, :line_total);
```

#### S5: Customer Onboarding

```sql
-- Submit onboarding request
INSERT INTO customer_onboarding_requests (
  salesman_id, company_name, uen, contact_name, contact_email,
  contact_phone, address, proposed_credit_limit, proposed_payment_terms
) VALUES (:salesman_id, :name, :uen, :contact, :email, :phone, :addr, :credit, :terms);
```

#### S7: Performance View

```sql
-- Salesman's order stats
SELECT
  COUNT(*) as total_orders,
  SUM(total) as total_revenue,
  COUNT(DISTINCT company_id) as active_accounts
FROM orders
WHERE placed_by_staff_id = :staff_id
  AND created_at >= :period_start;
```

### 5.2 Key Supabase Queries — EasiDriver

#### D1: Driver Auth

```sql
SELECT * FROM staff_profiles
WHERE user_id = auth.uid() AND staff_role = 'driver' AND is_active = true;
```

#### D2: Today's Delivery Queue

```sql
SELECT da.*, o.order_number, o.delivery_address, o.total,
       c.name as company_name, u.name as customer_name
FROM delivery_assignments da
JOIN orders o ON da.order_id = o.id
LEFT JOIN companies c ON o.company_id = c.id
LEFT JOIN users u ON o.user_id = u.id
WHERE da.driver_id = :driver_staff_id
  AND da.status != 'delivered'
  AND da.assigned_at::date = CURRENT_DATE
ORDER BY
  CASE da.delivery_zone
    WHEN 'north' THEN 1 WHEN 'east' THEN 2
    WHEN 'south' THEN 3 WHEN 'west' THEN 4
  END,
  da.assigned_at ASC;
```

#### D3: Status Update

```sql
-- Transition status (app enforces valid transitions)
UPDATE delivery_assignments
SET status = :new_status,
    dispatched_at = CASE WHEN :new_status = 'dispatched' THEN now() ELSE dispatched_at END,
    arrived_at = CASE WHEN :new_status = 'arrived' THEN now() ELSE arrived_at END,
    delivered_at = CASE WHEN :new_status = 'delivered' THEN now() ELSE delivered_at END
WHERE id = :assignment_id AND driver_id = :driver_staff_id;
```

#### D4: Proof of Delivery

```sql
-- After uploading photo/signature to Storage
INSERT INTO delivery_proofs (
  delivery_assignment_id, photo_url, signature_url, recipient_name, notes
) VALUES (:assignment_id, :photo_url, :sig_url, :recipient, :notes);
```

#### D5: Digital Handshake (Driver Side)

```sql
UPDATE digital_handshakes
SET driver_confirmed = true, driver_confirmed_at = now(),
    completed = CASE WHEN customer_confirmed = true THEN true ELSE false END,
    completed_at = CASE WHEN customer_confirmed = true THEN now() ELSE null END
WHERE order_id = :order_id;
```

#### D6: Delivery History

```sql
SELECT da.*, o.order_number, o.total, o.delivery_address,
       dp.photo_url, dp.recipient_name
FROM delivery_assignments da
JOIN orders o ON da.order_id = o.id
LEFT JOIN delivery_proofs dp ON dp.delivery_assignment_id = da.id
WHERE da.driver_id = :driver_staff_id AND da.status = 'delivered'
ORDER BY da.delivered_at DESC
LIMIT 50 OFFSET :offset;
```

### 5.3 Real-time Subscriptions

| Subscriber | Channel                        | Filter                           | Purpose                                 |
| ---------- | ------------------------------ | -------------------------------- | --------------------------------------- |
| EasiDriver | `delivery_assignments`         | `driver_id = own`                | New assignment appears instantly        |
| EASI App   | `digital_handshakes`           | `order_id IN own_orders`         | Customer sees handshake status          |
| Admin Web  | `customer_onboarding_requests` | `status = 'pending'`             | Notification of new onboarding requests |
| Admin Web  | `orders`                       | `placed_by_staff_id IS NOT NULL` | Track salesman-placed orders            |
| EasiSales  | `orders`                       | `placed_by_staff_id = own`       | Salesman sees order status updates      |

**Supabase Realtime setup:**

```typescript
const channel = supabase
  .channel('driver-assignments')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'delivery_assignments',
      filter: `driver_id=eq.${driverStaffId}`,
    },
    payload => handleAssignmentChange(payload)
  )
  .subscribe();
```

### 5.4 Storage Buckets

| Bucket                      | Purpose                              | Access                                                          | Max Size      |
| --------------------------- | ------------------------------------ | --------------------------------------------------------------- | ------------- |
| `delivery-proofs` (NEW)     | Delivery photos and signature images | Drivers: upload; Admins: read; Customers: read own order proofs | 5 MB per file |
| `product-images` (existing) | Product catalog images               | Public read                                                     | 5 MB          |
| `profile-images` (existing) | User avatars                         | Authenticated read/write own                                    | 2 MB          |

---

## 6. Cross-App Workflows

### 6.1 Order-on-Behalf Flow

This is the primary EasiSales workflow. A salesman visits a customer, takes an order, and submits it.

```
Step  Actor         Action                                    System Effect
────  ────────────  ────────────────────────────────────────  ─────────────────────────
 1    Salesman      Opens EasiSales → selects customer        Query companies table
 2    Salesman      Browses product catalog                   Query products table
 3    Salesman      Adds items to cart                        Client-side state
 4    Salesman      Reviews totals (trade pricing + GST)      pricing.ts calculations
 5    Salesman      Submits order                             INSERT orders + order_items
                                                              placed_by_staff_id = salesman
 6    Admin Web     Sees new order (realtime)                 Realtime subscription
 7    Admin         Assigns driver + sets delivery_zone       INSERT delivery_assignments
                                                              UPDATE orders.assigned_driver_id
 8    EasiDriver    Sees new assignment (realtime)            Realtime subscription
 9    Driver        Updates status: dispatched → en_route     UPDATE delivery_assignments
10    Driver        Arrives, captures proof of delivery       INSERT delivery_proofs
                                                              Upload photo to storage
11    Driver        Swipes to confirm delivery                UPDATE digital_handshakes
                                                              driver_confirmed = true
12    Customer      Receives notification in EASI App         Push notification / in-app
13    Customer      Swipes to confirm receipt                 UPDATE digital_handshakes
                                                              customer_confirmed = true
14    System        Both confirmed → handshake complete       completed = true
                                                              Order status → 'delivered'
```

### 6.2 Digital Handshake Flow

The handshake is order-independent — either party can confirm first.

```
                    +-------------------+
                    | digital_handshakes|
                    | order_id (unique) |
                    +-------------------+
                             |
              +--------------+--------------+
              |                             |
     EasiDriver (Driver)            EASI App (Customer)
              |                             |
     Swipe right to confirm         Swipe right to confirm
              |                             |
     driver_confirmed = true        customer_confirmed = true
     driver_confirmed_at = now()    customer_confirmed_at = now()
              |                             |
              +--------------+--------------+
                             |
                    Both true?
                     /     \
                   Yes      No
                    |        |
              completed=true  Wait for
              completed_at    other party
              Order → delivered
```

**Key design decisions:**

- The `digital_handshakes` row is created when the delivery assignment is created (by Admin Web or automatically)
- Either party can confirm first — there's no required ordering
- The `completed` flag is set by the app that performs the second confirmation (checking if the other side is already `true`)
- A Supabase database trigger is recommended post-beta to atomically set `completed` and update the order status

### 6.3 New Customer Onboarding Flow

```
Step  Actor         Action                                    System Effect
────  ────────────  ────────────────────────────────────────  ─────────────────────────
 1    Salesman      Opens "New Customer" form in EasiSales    —
 2    Salesman      Fills company name, UEN, contact info     Client-side validation
 3    Salesman      Proposes credit limit and payment terms   —
 4    Salesman      Submits request                           INSERT customer_onboarding_requests
                                                              status = 'pending'
 5    Admin Web     Notification: new onboarding request      Realtime subscription
 6    Admin         Reviews request details                   Query customer_onboarding_requests
 7a   Admin         Approves                                  UPDATE status = 'approved'
                                                              INSERT companies (new company)
                                                              INSERT users (primary contact)
                                                              INSERT user_permissions
 7b   Admin         Rejects (with notes)                      UPDATE status = 'rejected'
                                                              admin_notes = reason
 8    Salesman      Sees updated status in EasiSales          Query/realtime
 9    Customer      (If approved) Receives credentials        Email with login details
10    Customer      Logs into EASI App                        Normal auth flow
```

---

## 7. Security Considerations

### 7.1 Row-Level Security (RLS)

All new tables have RLS enabled. Policy summary:

| Policy Pattern                    | Implementation                                                                    |
| --------------------------------- | --------------------------------------------------------------------------------- |
| **Staff reads own profile**       | `WHERE user_id = auth.uid()`                                                      |
| **Driver reads own assignments**  | `WHERE driver_id IN (SELECT id FROM staff_profiles WHERE user_id = auth.uid())`   |
| **Salesman reads own onboarding** | `WHERE salesman_id IN (SELECT id FROM staff_profiles WHERE user_id = auth.uid())` |
| **Service role bypasses**         | `WHERE auth.role() = 'service_role'` for admin operations                         |
| **Cross-table reads**             | Handshakes readable by order owner OR assigned driver                             |

### 7.2 Role Verification on Login

- Staff role is verified immediately after authentication, before any data is displayed
- If `staff_profiles` returns no row or wrong role, the session is destroyed and the user is signed out
- The `is_active` flag allows instant revocation without touching `auth.users`
- Admin Web must be updated to manage `staff_profiles` (create/edit/deactivate staff)

### 7.3 Client-Side Security

| Concern                   | Mitigation                                                                                                      |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Anon key in client bundle | Expected — anon key only grants access through RLS policies                                                     |
| Service role key          | **Never** shipped to any client app; only used server-side (Edge Functions, EASIBridge)                         |
| Environment variables     | Each app has its own `.env` with only `SUPABASE_URL` and `SUPABASE_ANON_KEY`                                    |
| Sensitive data            | Trade pricing, credit limits, and payment terms are gated by RLS — a customer cannot see another company's data |

### 7.4 CORS and API Security

- Supabase automatically handles CORS for configured domains
- For beta/development: `localhost:5173` (EasiSales), `localhost:5174` (EasiDriver), `localhost:5175` (Admin Web)
- For production: configure allowed origins in Supabase Dashboard → API Settings
- All Supabase requests use HTTPS with the `apikey` header
- Rate limiting is handled at the Supabase infrastructure level

### 7.5 Data Validation

| Layer    | Validation                                                           |
| -------- | -------------------------------------------------------------------- |
| Database | CHECK constraints on enums (`staff_role`, `status`, `payment_terms`) |
| Database | FK constraints prevent orphaned records                              |
| Client   | Form validation before submission (Zod or manual)                    |
| RLS      | Prevents unauthorized writes even if client validation is bypassed   |

---

## 8. Deployment Strategy

### 8.1 Independent Builds

Each web app builds independently with Vite:

```
easi-sales/          admin-web/          easi-driver/
├── src/             ├── src/            ├── src/
├── .env             ├── .env            ├── .env
├── vite.config.ts   ├── vite.config.ts  ├── vite.config.ts
├── package.json     ├── package.json    ├── package.json
└── dist/            └── dist/           └── dist/
    (static output)      (static output)     (static output)
```

**Build commands:**

```bash
cd easi-sales && npm run build    # → easi-sales/dist/
cd easi-driver && npm run build   # → easi-driver/dist/
cd admin-web && npm run build     # → admin-web/dist/
```

### 8.2 Hosting Options

| Option                           | Setup                                                 | Best For              |
| -------------------------------- | ----------------------------------------------------- | --------------------- |
| **Separate subdomains**          | `sales.easi.sg`, `driver.easi.sg`, `admin.easi.sg`    | Production            |
| **Same domain, different paths** | `easi.sg/sales/`, `easi.sg/driver/`, `easi.sg/admin/` | Simplified SSL        |
| **Separate ports (dev)**         | `:5173`, `:5174`, `:5175`                             | Local development     |
| **Vercel/Netlify**               | Each app as a separate project                        | Quick beta deployment |

### 8.3 Environment Variables Per App

All three web apps need:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

EasiDriver additionally needs:

```env
VITE_STORAGE_BUCKET=delivery-proofs
```

### 8.4 PWA Consideration for EasiDriver

EasiDriver is the strongest PWA candidate because drivers:

- Work in areas with spotty connectivity
- Need camera access (proof of delivery photos)
- Benefit from install-to-home-screen (quick access from van)

**PWA requirements:**

- `vite-plugin-pwa` for service worker generation
- Manifest with app name, icons, theme color
- Cache strategy: network-first for API calls, cache-first for static assets
- Offline queue for status updates (sync when back online)

### 8.5 CI/CD Pipeline (Recommended)

```
push to main
    |
    ├── easi-sales/ changed?  → build + deploy to sales.easi.sg
    ├── easi-driver/ changed? → build + deploy to driver.easi.sg
    ├── admin-web/ changed?   → build + deploy to admin.easi.sg
    └── supabase/ changed?    → run migrations via supabase db push
```

---

## 9. Future Considerations

### 9.1 Native Mobile Versions (Post-Beta)

- EasiDriver could be ported to React Native/Expo for GPS background tracking, push notifications, and offline-first capabilities
- EasiSales may remain web-only if salesmen primarily use tablets
- Shared service layer (Supabase queries) can be extracted into a common package used by both web and native

### 9.2 Real-Time Delivery Tracking

- Use Supabase Realtime channels for live driver location broadcasting
- Driver sends lat/lng every 30 seconds via a Realtime channel
- Customer's EASI App subscribes to the channel for their active order
- Display on Google Maps (already integrated in EASI App)
- Privacy: channel is scoped to active deliveries only

### 9.3 Offline Support for Drivers

- IndexedDB (via `idb` library) for queuing status updates offline
- Service worker intercepts failed network requests and retries when back online
- Delivery photos stored in IndexedDB as blobs, uploaded when connectivity returns
- Conflict resolution: server timestamp wins for status transitions

### 9.4 Push Notifications

- Currently, EASI App uses in-app notifications via Supabase `notifications` table
- Post-beta: integrate with Expo Push Notifications for EASI App
- For web apps (EasiSales, EasiDriver): Web Push API with service workers
- Key notification triggers:
  - New delivery assignment → driver
  - Delivery status update → customer
  - New onboarding request → admin
  - Order placed on behalf → customer confirmation

### 9.5 AutoCount Integration Extension

- EASIBridge currently syncs debtors (companies) from AutoCount → Supabase
- Future: sync orders from Supabase → AutoCount as invoices
- Future: sync product catalog and pricing from AutoCount → Supabase
- Salesman-placed orders (`placed_by_staff_id IS NOT NULL`) should be flagged for AutoCount sync

### 9.6 Analytics and Reporting

- Salesman performance dashboards (orders, revenue, conversion rates)
- Driver efficiency metrics (deliveries per day, average time per stop)
- Delivery zone heat maps
- Customer acquisition funnel (onboarding requests → approved → first order)

---

## Appendix A: Project Directory Structure (Planned)

```
easiapp_1.0/
├── app/                    # EASI App (React Native/Expo)
├── admin-web/              # Admin Web (Vite + React + Tailwind)
├── easi-sales/             # EasiSales (NEW)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   ├── Customers/
│   │   │   ├── Orders/
│   │   │   ├── Onboarding/
│   │   │   ├── Performance/
│   │   │   ├── Layout/
│   │   │   └── UI/
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── CustomerList.tsx
│   │   │   ├── CustomerDetail.tsx
│   │   │   ├── NewOrder.tsx
│   │   │   ├── NewCustomer.tsx
│   │   │   └── Performance.tsx
│   │   ├── lib/
│   │   │   ├── supabase.ts
│   │   │   └── formatters.ts
│   │   ├── types/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── .env
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── easi-driver/            # EasiDriver (NEW)
│   ├── public/
│   │   └── manifest.json   # PWA manifest
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   ├── Queue/
│   │   │   ├── Delivery/
│   │   │   ├── Proof/
│   │   │   ├── Handshake/
│   │   │   ├── History/
│   │   │   ├── Layout/
│   │   │   └── UI/
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── DeliveryDetail.tsx
│   │   │   ├── ProofCapture.tsx
│   │   │   └── History.tsx
│   │   ├── lib/
│   │   │   ├── supabase.ts
│   │   │   └── formatters.ts
│   │   ├── types/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── .env
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── bridge/                 # EASIBridge (C# .NET)
├── supabase/               # Shared migrations
├── docs/
│   ├── architecture/       # This document
│   └── testing/            # Test specifications
└── .mcp.json               # MCP server config
```

## Appendix B: Shared Dependencies Across Web Apps

| Package                 | admin-web | easi-sales | easi-driver | Notes               |
| ----------------------- | --------- | ---------- | ----------- | ------------------- |
| `react`                 | ^19.2     | ^19.2      | ^19.2       | UI library          |
| `react-dom`             | ^19.2     | ^19.2      | ^19.2       | Web rendering       |
| `react-router-dom`      | ^7.10     | ^7.10      | ^7.10       | Routing             |
| `@supabase/supabase-js` | ^2.86     | ^2.86      | ^2.86       | Backend client      |
| `tailwindcss`           | ^4.1      | ^4.1       | ^4.1        | Styling             |
| `lucide-react`          | ^0.556    | ^0.556     | ^0.556      | Icons               |
| `clsx`                  | ^2.1      | ^2.1       | ^2.1        | Conditional classes |
| `vite`                  | ^7.2      | ^7.2       | ^7.2        | Build tool          |
| `typescript`            | ~5.9      | ~5.9       | ~5.9        | Type safety         |

---

_End of Architecture Document_
