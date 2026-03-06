# Master To-Do List

Central backlog for the EASI ecosystem. Sourced from the feature spec (EASI APP.pdf, 36pp), the beta roadmap (easi-spec.pdf, 8pp), prior session notes, and the tech debt audit.

**Beta target:** Mid-April 2026 (~5.5 weeks from early March)
**Dev approach:** Agentic engineering (AI agent dev team + human oversight)

---

## How to read this document

- Items prefixed **E** = EASI App (customer mobile app)
- Items prefixed **W** = Web Management (admin portal)
- Items prefixed **S** = EasiSales (salesman app) — NEW, FROM SCRATCH
- Items prefixed **D** = EasiDriver (driver app) — NEW, FROM SCRATCH
- Items prefixed **AC** = Autocount integration (EASIBridge)
- Items prefixed **ST** = Stripe integration (cross-app)
- Items prefixed **A** = Architecture / tooling
- Items prefixed **B** = Existing bugs (business logic)
- Items prefixed **U** = Existing bugs (UI/UX)
- Items prefixed **P** = Post-beta / deferred

Statuses: `Pending` | `In Progress` | `Done` | `Blocked` | `Deferred`

---

## Current state summary

| App / Module             | State                                                             | Remaining effort (spec estimate) |
| ------------------------ | ----------------------------------------------------------------- | -------------------------------- |
| EASI App (Customer)      | ~65% of MVP functional                                            | ~2 weeks                         |
| Web Management (Admin)   | Existing `admin-web/` with basic CRUD                             | ~2–2.5 weeks to full MVP         |
| **EasiSales (Salesman)** | **Greenfield**                                                    | **~1.5–2 weeks**                 |
| **EasiDriver (Driver)**  | **Greenfield**                                                    | **~1–1.5 weeks**                 |
| Autocount Integration    | One-way debtor sync done; product sync & order export not started | ~2 weeks                         |
| Stripe                   | Scaffolded but not wired                                          | ~1–1.5 weeks                     |

---

## EASI App (Customer) — Remaining Beta Work

What's already functional: Auth, biometrics, product catalog, search, cart, multi-step checkout, order processing/tracking/history, company profiles, team management, billing dashboard, invoices, partial payments, rewards/loyalty, location picker, wishlist, notifications, profile management.

### E1) Stripe checkout (CBD flow)

- **Status:** Pending
- **Priority:** Critical (beta)
- **Estimate:** 2–3 days
- **Spec ref:** EASI APP.pdf §5.1, §5.6; easi-spec.pdf §3.1

Wire Stripe Payment Intent into checkout. Handle success/failure states. CBD = Cash Before Delivery: payment must be received before order dispatches. For Term = 0 days, Stripe payment required before order confirmation.

### E2) Credit terms checkout

- **Status:** Pending
- **Priority:** Critical (beta)
- **Estimate:** 2–3 days
- **Spec ref:** EASI APP.pdf §5.3, §6.5; easi-spec.pdf §3.1

Order on credit if (Outstanding + New Order) <= Credit Limit. Block and force Stripe payment if exceeded. Overdue beyond threshold = auto-credit hold. Credit limits are dollar-value based, not bottle-count.

### E3) Approval workflow (Bartender → Manager)

- **Status:** Pending
- **Priority:** Critical (beta)
- **Estimate:** 3–4 days
- **Spec ref:** EASI APP.pdf §3.1, §3.2; easi-spec.pdf §3.1

Push notification to manager for pending orders. Manager can approve, reject, edit, or send back with comments. Pre-authorized bartenders bypass approval. Configurable per outlet.

### E4) PDF invoice generation

- **Status:** Pending
- **Priority:** High (beta)
- **Estimate:** 2 days
- **Spec ref:** EASI APP.pdf §5.5, §8; easi-spec.pdf §3.1

EPICO-branded invoices. Downloadable from order history. Digital and hard copies must be identical. Auto-generated upon order completion. Distribution: email, in-app, optionally WhatsApp (WhatsApp deferred post-beta).

### E5) Out-of-stock "Notify Me"

- **Status:** Pending
- **Priority:** Medium (beta)
- **Estimate:** 1 day
- **Spec ref:** EASI APP.pdf §7.1; easi-spec.pdf §3.1

Simple flag + notification trigger when item is back in stock. No restock dates shown to customers. Show alternative product suggestions (curated, not auto-generated).

### E6) Customer-specific pricing display

- **Status:** Pending
- **Priority:** High (beta)
- **Estimate:** 1–2 days
- **Spec ref:** EASI APP.pdf §13.3, §21; easi-spec.pdf §3.1

Pull customer's pricing tier from Supabase. For beta: manual entry until Autocount pricing sync is live. 5-tier system (Tier 1 = premium/highest discount through Tier 5 = volume/lowest margin). Existing customers: pricing from Autocount is source of truth. New customers: salesperson-agreed pricing, locked for up to 1 year.

### E7) Credit control pop-up (fallback)

- **Status:** Pending
- **Priority:** Medium (beta)
- **Estimate:** 0.5 days
- **Spec ref:** EASI APP.pdf §9.2 footnote; easi-spec.pdf §3.1

If full Autocount sync is not available: show "Your order has been submitted but final confirmation is subject to credit control checks."

### E8) Push notifications (Expo + FCM/APNs)

- **Status:** Pending
- **Priority:** High (beta)
- **Estimate:** 2–3 days
- **Spec ref:** EASI APP.pdf §10.2, §13.1; easi-spec.pdf §3.1

Connect Expo Push + FCM/APNs. Order status updates: confirmed → packed → dispatched → en route → arrived → completed. Promotional notifications: new products, flash sales, restock alerts, payment reminders.

### E9) Stock visibility rules

- **Status:** Pending
- **Priority:** Medium
- **Spec ref:** EASI APP.pdf §7.1

Stock levels NOT displayed to customers or bartenders. Customers only see "Available" / "Out of stock". Backend manages bonded vs duty-paid internally.

### E10) Digital handshake (customer side)

- **Status:** Pending
- **Priority:** High (beta)
- **Estimate:** 1 day
- **Spec ref:** EASI APP.pdf §5.4, §10.2

Customer swipes in EASI app to confirm delivery. Pairs with driver swipe in EasiDriver. Both confirmations required for wallet/payment transaction to complete.

### E11) Overdue notifications & enforcement

- **Status:** Pending
- **Priority:** Medium
- **Spec ref:** EASI APP.pdf §6.6

0–30 days: automated reminder. 31–60 days: escalation to finance. 60+ days: account hold + management notification. Automated alert rules per tier.

### E12) Duplicate order detection

- **Status:** Pending
- **Priority:** Low
- **Spec ref:** EASI APP.pdf §11

Warning prompt if customer submits an order that closely matches a recent one.

---

## Web Management (Admin Portal)

Existing `admin-web/` has: dashboard stats, product CRUD, categories, customers, companies, orders, invoices, rewards, notifications, settings, content management. Below are gaps vs the beta MVP spec.

### W1) Admin auth + RBAC hardening

- **Status:** Pending
- **Priority:** High (beta)
- **Estimate:** 1 day
- **Spec ref:** easi-spec.pdf §3.2

Supabase auth with role checks: Super Admin, Finance, Sales. Restrict views/actions by role.

### W2) Order management — driver assignment

- **Status:** Pending
- **Priority:** Critical (beta)
- **Estimate:** 2–3 days
- **Spec ref:** easi-spec.pdf §3.2

View incoming orders, update status pipeline, assign orders to drivers (links to EasiDriver). Real-time notification for salesman-placed orders.

### W3) Customer management — credit & tier controls

- **Status:** Pending
- **Priority:** High (beta)
- **Estimate:** 2–3 days
- **Spec ref:** EASI APP.pdf §6.1–6.4; easi-spec.pdf §3.2

View/edit profiles, set credit limits (admin-only), assign payment method (CBD/COD/Credit), assign payment terms (7/14/30/45/60), assign pricing tier (1–5), credit rating (A/B/C/D). Salesperson can propose credit limit; admin finalizes after due diligence.

### W4) Invoice management enhancements

- **Status:** Pending
- **Priority:** High (beta)
- **Estimate:** 2 days
- **Spec ref:** easi-spec.pdf §3.2

Generate EPICO-branded PDF invoices, send via email, mark as paid. Link to Stripe payment status.

### W5) Basic credit / risk dashboard

- **Status:** Pending
- **Priority:** High (beta)
- **Estimate:** 2–3 days
- **Spec ref:** EASI APP.pdf §14; easi-spec.pdf §3.2

Outstanding and overdue by customer, exposure by age bracket (0–30, 31–60, 60+), credit rating distribution, customer health score, threshold breach alerts. Dashboard users: Finance Manager, CFO, Sales Leadership.

### W6) Promotion management

- **Status:** Pending
- **Priority:** Medium (beta)
- **Estimate:** 2 days
- **Spec ref:** EASI APP.pdf §13.2; easi-spec.pdf §3.2

Create/edit promotions: limited-time discounts, volume incentives ("buy 5 get 1"), bundle deals, seasonal campaigns. Discount rules engine.

### W7) Notification broadcast

- **Status:** Pending
- **Priority:** Medium (beta)
- **Estimate:** 1 day
- **Spec ref:** easi-spec.pdf §3.2

Send push/email to customer segments from admin portal.

---

## EasiSales (Salesman App) — MVP FROM SCRATCH

**This is a major new project.** Separate Expo app (iOS and Android) sharing the Supabase backend, types, and service layer with the EASI app. Total estimated effort: ~1.5–2 weeks.

Spec ref: EASI APP.pdf §22; easi-spec.pdf §3.3

### S1) Salesman auth

- **Status:** Pending
- **Priority:** Critical (beta)
- **Estimate:** 0.5 days

EPICO staff login, role-gated. Separate from customer auth flow.

### S2) Customer list + search

- **Status:** Pending
- **Priority:** Critical (beta)
- **Estimate:** 1–2 days

Browse B2B accounts, filter by name/zone/status, search.

### S3) Customer detail view

- **Status:** Pending
- **Priority:** Critical (beta)
- **Estimate:** 1–2 days

Order history, outstanding balance, credit status, payment terms, pricing tier, assigned salesperson.

### S4) Order on behalf of customer

- **Status:** Pending
- **Priority:** Critical (beta)
- **Estimate:** 3–4 days

Select customer account → pick products (with customer-specific pricing) → submit order. **Dual push:** order simultaneously pushed to Autocount AND Admin Web Dashboard. Admin receives real-time notification. Order uses customer's assigned pricing (Autocount pricing for existing, salesperson-agreed for new). All salesman-placed orders logged with salesperson ID for audit trail.

### S5) New customer onboarding

- **Status:** Pending
- **Priority:** High (beta)
- **Estimate:** 2–3 days

Onboarding form: company info, UEN, contact, delivery address. Credit proposal: salesperson proposes credit limit (e.g. SGD 5,000) → admin notification → admin conducts due diligence → admin sets final limit. Set initial pricing (salesperson-agreed prices, valid up to 1 year). Set payment method (CBD/COD/Credit) and terms.

### S6) Delivery confirmation swipe (salesman side)

- **Status:** Pending
- **Priority:** High (beta)
- **Estimate:** 1 day

Digital handshake: salesman/delivery person swipes on Salesman App. Pairs with customer swipe in EASI App. Both required for wallet transaction to complete.

### S7) Own performance view

- **Status:** Pending
- **Priority:** Medium (beta)
- **Estimate:** 1–2 days

Basic sales metrics: orders placed, revenue, number of active accounts. Commission placeholder for post-beta.

---

## EasiDriver (Driver App) — MVP FROM SCRATCH

**This is a major new project.** Simplest of the new apps. Shared Supabase backend. Total estimated effort: ~1–1.5 weeks.

Spec ref: EASI APP.pdf §10; easi-spec.pdf §3.4

### D1) Driver auth

- **Status:** Pending
- **Priority:** Critical (beta)
- **Estimate:** 0.5 days

EPICO staff login, role-gated.

### D2) Today's delivery queue

- **Status:** Pending
- **Priority:** Critical (beta)
- **Estimate:** 1–2 days

List of assigned deliveries, sorted by geographic zone (North/South/East/West Singapore). Orders placed before cutoff (typically 2 PM) are same-day.

### D3) Status updates

- **Status:** Pending
- **Priority:** Critical (beta)
- **Estimate:** 1 day

Tap to update: dispatched → en route → arrived → delivered. Each transition triggers push notification to customer. Driver ETA shown to customer when dispatched.

### D4) Proof of delivery

- **Status:** Pending
- **Priority:** Critical (beta)
- **Estimate:** 1–2 days

Photo capture + customer signature + timestamp. Stored as delivery record.

### D5) Digital handshake (driver side)

- **Status:** Pending
- **Priority:** Critical (beta)
- **Estimate:** 1 day

Driver swipes to confirm delivery. Pairs with customer EASI swipe (E10). Both required for transaction completion. COD flow: delivery confirmed → trigger Stripe payment link.

### D6) Delivery history

- **Status:** Pending
- **Priority:** Medium (beta)
- **Estimate:** 0.5 days

Past deliveries list with status and timestamps.

---

## Autocount Integration (EASIBridge)

Current state: One-way debtor sync done (401 debtors). Service running on Epico server. See `docs/setup/todo.md` for detailed phase history.

Spec ref: EASI APP.pdf §9; easi-spec.pdf §3.5

### AC1) Harden debtor sync (data quality)

- **Status:** Pending
- **Priority:** High
- **Spec ref:** docs/setup/todo.md §3a

Empty CompanyName fallback, special character sanitization, payment_terms mapping gaps (NET14/45/90), credit_limit precision, phone length, duplicate company dedup, sync table retention policy, network resilience.

### AC2) One-way product/SKU sync

- **Status:** Pending
- **Priority:** Critical (beta)
- **Estimate:** 2–3 days
- **Spec ref:** easi-spec.pdf §3.5

Pull SKUs + pricing from Autocount into Supabase (batch job). Includes vintage, case size, category. Source of truth for existing customer pricing.

### AC3) Order export (EASI → Autocount)

- **Status:** Pending
- **Priority:** Critical (beta)
- **Estimate:** 3–4 days
- **Spec ref:** easi-spec.pdf §3.5; EASI APP.pdf §9.2

Push EASI orders to Autocount via async queue. Autocount validates credit limit, generates invoice, updates AR. EASI reflects invoice status in customer dashboard. Includes salesman-placed orders (dual push from S4).

### AC4) Build posting contract and state machine

- **Status:** Pending
- **Priority:** High
- **Spec ref:** docs/setup/todo.md §4

Trigger conditions: `invoice_ready`, `payment_recorded`. Status flow: pending → posting → posted/failed → manual_review. Retry rules for transient vs business errors. Queue table with single-worker lock.

### AC5) AR Invoice posting

- **Status:** Pending
- **Priority:** High
- **Spec ref:** docs/setup/todo.md §5

Transform app order to Autocount AR Invoice format. Call AutoCount SDK (ARAP module). Idempotency via unique external keys.

### AC6) AR Payment posting

- **Status:** Pending
- **Priority:** High
- **Spec ref:** docs/setup/todo.md §6

Link payments to posted invoices. Handle partial payments, overpayments. Same state machine as AC5.

### AC7) Fallback UX (credit check pending)

- **Status:** Pending (scoped, not wired)
- **Priority:** Medium (beta)
- **Spec ref:** EASI APP.pdf §9.2 footnote

Pop-up when Autocount sync unavailable. Same as E7 — single implementation, shared across flows.

---

## Stripe Integration (Cross-App)

Spec ref: EASI APP.pdf §5.6; easi-spec.pdf §3.6

### ST1) Payment Intent (CBD)

- **Status:** Pending
- **Priority:** Critical (beta)
- **Estimate:** 1–2 days

Create + confirm Stripe Payment Intent in EASI checkout. Visa/Mastercard/Amex, Apple Pay, Google Pay, PayNow (via Stripe), international cards.

### ST2) Webhook handler

- **Status:** Pending
- **Priority:** Critical (beta)
- **Estimate:** 1–2 days

Supabase Edge Function for payment events. Auto-reconciliation via webhook. Stripe fee tracking.

### ST3) Auto invoice update

- **Status:** Pending
- **Priority:** High (beta)
- **Estimate:** 1 day

Webhook → mark invoice paid. Update payment status in EASI and Autocount.

### ST4) COD trigger from EasiDriver

- **Status:** Pending
- **Priority:** High (beta)
- **Estimate:** 1–2 days

Driver confirms delivery (D5) → trigger Stripe payment link to customer. Payment upon delivery confirmation.

### ST5) Payment link for overdue invoices

- **Status:** Pending
- **Priority:** Medium (beta)
- **Estimate:** 1 day

Generate Stripe payment link from Web Management for overdue invoices.

### ST6) Apple Pay / Google Pay

- **Status:** Pending
- **Priority:** Medium (beta)
- **Estimate:** 1 day

Stripe config (mostly configuration, not code).

---

## Architecture / Platform / Tooling

### A1) Fix `admin-web/apply_migration.js` to use current Supabase Management API

- **Status:** Pending
- **Priority:** High
- **Owner:** Unassigned
- **Created:** 2026-02-19

#### Issue

- The migration helper script currently posts to deprecated endpoint:
  - `POST /v1/projects/{ref}/query`
- Current Supabase Management API SQL endpoint is:
  - `POST /v1/projects/{ref}/database/query`
- Result: script returns `404 Not Found`, so SQL cannot be applied from this helper.

#### Acceptance criteria

- Running `node admin-web/apply_migration.js` with valid env vars executes SQL successfully.
- Script receives HTTP `201` and no longer returns `Cannot POST /v1/projects/<ref>/query`.
- A sample idempotent SQL file runs without manual dashboard intervention.

### A2) Remove hardcoded secrets from codebase

- **Status:** Pending
- **Priority:** High
- **Created:** 2026-02-19
- **Tracking doc:** `docs/SECRETS_AND_PROJECT_TODO.txt`

Previous project owner's Supabase refs, JWT tokens, and credentials remain in several files. Full checklist in the tracking doc. Must be cleaned before any public or shared deployment.

### A3) Unify dual Supabase client

- **Status:** Pending
- **Priority:** High
- **Source:** Code review (prior session)

Two separate Supabase clients (`utils/supabase.ts` and `app/config/supabase.ts`) with different options. Risk of session desync. Consolidate to a single client module.

### A4) Resolve dual auth systems (AuthContext vs AppContext)

- **Status:** Pending
- **Priority:** High
- **Source:** Code review (prior session)

AuthContext and AppContext both manage "who is logged in" with different sources of truth. Clarify single owner for auth state.

### A5) Tech debt — see `docs/tech-debt.md`

- **Status:** Pending (ongoing)
- **Priority:** Medium

Key items: `jest.config.js` typo (`moduleNameMapping`), 58 files over 500 lines, dead location components, 150+ console.logs, unused dependencies, unused services. Full audit in the tech debt doc.

---

## Existing Bugs — Business Logic

### B1) Mobile app logout button no-op

- **Status:** Pending
- **Priority:** High
- **Created:** 2026-02-20

Tapping logout does nothing. No handler logs emitted. Likely press event not reaching handler. Blocks account switching.

### B2) Duplicate "Add to cart" confirmation popups

- **Status:** Pending
- **Priority:** Medium
- **Created:** 2026-02-20

Single tap triggers two confirmation popups. Likely duplicated listeners or dispatch.

### B3) Cart button no-op from Product Details page

- **Status:** Pending
- **Priority:** High
- **Created:** 2026-02-20

Cart button does not work from Product Details screen. Inconsistent with other entry points.

---

## Existing Bugs — UI / UX

### U1) Non-functional search bar

- **Status:** Pending
- **Priority:** Medium
- **Created:** 2026-02-20

Search bar visible but does not produce results.

### U2) Images/assets not loading

- **Status:** Pending
- **Priority:** High
- **Created:** 2026-02-20

Product/profile/media assets fail to load or render inconsistently.

### U3) Profile picture functionality issues

- **Status:** Pending
- **Priority:** Medium
- **Created:** 2026-02-20

Profile picture update/display incomplete or broken.

### U4) Support center crashes

- **Status:** Pending
- **Priority:** High
- **Created:** 2026-02-20

Live chat button does nothing. "Browse by topic" buttons crash the app.

### U5) In-app email support

- **Status:** Pending
- **Priority:** Medium
- **Created:** 2026-02-20

Currently redirects to external mail app. Product decision needed (external vs in-app).

### U6) FAQ "Helpful" button no-op

- **Status:** Pending
- **Priority:** Low
- **Created:** 2026-02-20

Thumbs-up action does nothing.

---

## Deferred Post-Beta

These are explicitly out of scope for beta per easi-spec.pdf §4. Track here for future planning.

| ID  | Feature                                            | Reason for deferral                                   |
| --- | -------------------------------------------------- | ----------------------------------------------------- |
| P1  | AI Sommelier chatbot                               | Nice-to-have, not core flow (est. 1–2 weeks)          |
| P2  | FAQ Chatbot                                        | Manual support fine for beta                          |
| P3  | Blogs & Newsletters                                | Marketing, not ops                                    |
| P4  | Resource Centre (PDFs, tasting notes, tech sheets) | Content upload, not blocking transactions             |
| P5  | Digital Wallet (top-up, balance)                   | Credit terms + Stripe covers beta                     |
| P6  | WhatsApp invoice distribution                      | Email + in-app enough for beta                        |
| P7  | Route optimization (driver)                        | Zone sorting sufficient for beta                      |
| P8  | Offline mode (salesman)                            | Singapore has good connectivity                       |
| P9  | Full reporting suite (BI dashboards)               | Basic credit dashboard covers beta (est. 2–3 weeks)   |
| P10 | PDPA consent flows                                 | Add before public launch, not beta                    |
| P11 | HS code / customs tracking                         | Back-office, not customer-facing                      |
| P12 | Financing module (installments)                    | Phase 2 feature                                       |
| P13 | Full Autocount bidirectional sync                  | One-way batch + manual fine for beta (est. 4–6 weeks) |
| P14 | Reconciliation & alerting                          | Daily reconciliation, discrepancy alerts (post-beta)  |
| P15 | MFA for admin accounts                             | Security hardening for production                     |
| P16 | Barcode/SKU validation for warehouse picking       | Warehouse ops, not customer-facing                    |

---

## Beta Timeline (from spec)

```
Week 1–2:  EASI App finish + Stripe integration
Week 1–3:  Web Management MVP
Week 2–3:  EasiSales MVP (from scratch)
Week 2–3:  EasiDriver MVP (from scratch)
Week 2–4:  Autocount one-way sync
Week 4:    Integration testing (all apps → same Supabase backend)
Week 5:    Bug fixes, edge cases, UX polish
Week 5.5:  Beta deploy to test users
```

All tracks run in parallel — they share the Supabase backend but are independent codebases.

---

## Modular Dev Effort Quick Reference

| Module                                      | Effort   |
| ------------------------------------------- | -------- |
| Stripe checkout (any single app)            | 2–3 days |
| PDF invoice generation                      | 1–2 days |
| Approval workflow (bartender → manager)     | 3–4 days |
| Full admin CRUD (products/orders/customers) | 1 week   |
| New Expo app with auth + shared backend     | 2–3 days |
| Order-on-behalf flow (salesman)             | 3–4 days |
| Driver delivery queue + proof of delivery   | 3–4 days |
| Autocount one-way sync (per entity)         | 2–3 days |
| Credit control enforcement logic            | 2–3 days |
| Push notifications (Expo + FCM)             | 2–3 days |
| Digital handshake (dual-swipe)              | 1–2 days |
| New customer onboarding form                | 2–3 days |
| Promo/discount engine                       | 2–3 days |
| Risk/credit dashboard                       | 2–3 days |
