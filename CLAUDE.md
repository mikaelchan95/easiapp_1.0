# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server
npm start              # Start Expo development server (with cache cleared)
npm run start:clean    # Start with cache cleared
npm run dev            # Alias for start:clean

# Platform-specific development
npm run ios            # Run on iOS simulator
npm run android        # Run on Android emulator
npm run web            # Run in web browser

# Build commands
npm run build          # Build for web and run tests
npm run build:web      # Build web version only
npm run build:android  # Build Android APK
npm run build:ios      # Build iOS IPA

# Testing
npm test               # Run all tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report
npm run test:ci        # Run tests in CI mode (no watch)
npm run test:integration # Run integration tests only
npm run test:unit      # Run unit tests only

# Code quality
npm run lint           # Check for linting errors
npm run lint:fix       # Fix linting errors automatically
npm run prettier       # Check code formatting
npm run prettier:fix   # Format code automatically
npm run type-check     # Run TypeScript type checking
npm run quality        # Run all quality checks (lint + prettier + type-check)

# Deploy to web
npm run deploy         # Export and deploy to EAS

# Admin Web (admin-web/)
cd admin-web && npm run dev    # Start admin dashboard dev server (Vite)
cd admin-web && npm run build  # Build admin dashboard for production

# Supabase CLI commands (always use CLI for database operations)
npx supabase login                                    # Connect CLI to Supabase account
npx supabase init                                     # Initialize local project
npx supabase link --project-ref <project-ref>         # Link to remote project
npx supabase start                                    # Start local development environment
npx supabase db push                                  # Apply migrations to remote database
npx supabase db pull                                  # Pull schema changes from remote
npx supabase db diff                                  # Check schema differences
npx supabase db reset                                 # Reset local database
npx supabase db push --dry-run                        # Preview pending migrations
npx supabase migration list                           # List all migrations
npx supabase migration new <name>                     # Create new migration file
npx supabase gen types typescript --local             # Generate TypeScript types
npx supabase functions deploy                         # Deploy Edge Functions
npx supabase functions new <name>                     # Create new Edge Function
npx supabase secrets list                             # List environment secrets
npx supabase secrets set KEY=value                    # Set environment secret

# Migration workflow
# Set SUPABASE_DB_PASSWORD in .env, then:
SUPABASE_DB_PASSWORD="$SUPABASE_DB_PASSWORD" npx supabase db push
# For conflicts: use "IF NOT EXISTS" / "ON CONFLICT ... DO NOTHING"
# For complex conflicts: run SQL manually in Supabase Dashboard → SQL Editor
```

## Architecture Overview

### Tech Stack

- **React Native 0.81 + Expo 54** — Mobile app framework
- **React 19.1** — UI library
- **TypeScript 5.9** — Type-safe JavaScript
- **Supabase** — Backend-as-a-Service (PostgreSQL, Auth, Real-time, Storage)
- **React Navigation 7** — Stack and tab navigation (not Expo Router)
- **Google Maps API** — Location services (Singapore-focused)
- **Stripe** — Payment processing (via MCP and Edge Functions)
- **Admin Web (Vite + React 19 + Tailwind 4)** — Admin dashboard
- **EASIBridge (.NET 4.8 Windows Service)** — AutoCount accounting integration

### Project Structure

```
easiapp_1.0/
├── App.tsx                     # Root entry, provider hierarchy, navigation
├── package.json                # Dependencies and scripts
├── app.json                    # Expo configuration
├── tsconfig.json               # TypeScript config (extends expo/tsconfig.base)
├── jest.config.js              # Jest test configuration
├── jest.setup.js               # Jest setup file
├── .eslintrc.js                # ESLint config
├── .prettierrc                 # Prettier config
├── .env.example                # Environment variable template
├── .mcp.json                   # MCP server configuration
├── admin-web/                  # Admin dashboard (Vite/React/Tailwind)
├── bridge/                     # EASIBridge (C#/.NET AutoCount sync)
├── android/                    # Android native project
├── ios/                        # iOS native project
├── docs/                       # Documentation
├── supabase/                   # Supabase migrations (51 files)
├── .cursor/rules/              # Cursor IDE rules (3 files)
└── app/                        # Main mobile app source
    ├── components/             # Feature-organized UI components (16 subdirs)
    │   ├── Activities/         # Order history, reviews, support, wishlist
    │   ├── Auth/               # Sign in, sign up, forgot password
    │   ├── Billing/            # Credit payments, invoices, billing dashboard
    │   ├── Cart/               # Cart items, empty state, suggested addons
    │   ├── Chat/               # Customer support chat
    │   ├── Checkout/           # Multi-step checkout, order tracking
    │   │   └── sections/       # Checkout section components
    │   ├── Home/               # Dashboard, banners, balance cards, past orders
    │   ├── Layout/             # Mobile header
    │   ├── Location/           # Location picker (Uber-style), maps, saved addresses
    │   ├── Navigation/         # Permission guards
    │   ├── Notifications/      # Notification items and filters
    │   ├── Products/           # Product catalog, search, detail, smart search
    │   ├── Profile/            # User/company profiles, team management, settings
    │   ├── Rewards/            # Loyalty system, vouchers, referrals, analytics
    │   ├── Settings/           # Biometric settings
    │   └── UI/                 # Reusable: buttons, animations, toasts, cards, etc.
    ├── config/                 # Configuration
    │   ├── supabase.ts         # Supabase client init with AsyncStorage auth
    │   └── googleMaps.ts       # Google Maps config (Singapore region, monochrome)
    ├── context/                # React Context providers (7 files)
    │   ├── AppContext.tsx       # Global state: user, company, products, cart, locations, settings
    │   ├── AuthContext.tsx      # Auth state: session, profile, company, permissions
    │   ├── CartNotificationContext.tsx  # Cart add-to-cart toast notifications
    │   ├── CheckoutContext.tsx  # Checkout flow state with AsyncStorage persistence
    │   ├── NotificationContext.tsx     # In-app notifications, real-time updates
    │   ├── RewardsContext.tsx   # Loyalty points, tiers, vouchers, redemption
    │   └── TransitionContext.tsx       # Shared animation transitions
    ├── database/               # SQL reference files
    │   ├── schema.sql          # Base schema (companies, users, permissions)
    │   └── seed.sql            # Seed data (companies, users, permissions)
    ├── hooks/                  # Custom React hooks
    │   ├── useCheckoutNavigation.ts  # Multi-step checkout flow navigation
    │   ├── useCompanyPoints.ts       # Company points summary, tier, history
    │   ├── useDeliveryLocation.ts    # Delivery location with saved addresses
    │   └── usePurchaseAchievement.ts # Purchase achievement UI and rewards calc
    ├── screens/                # Standalone screens
    │   ├── CompanyInvoicesScreen.tsx      # Company invoice list with filters
    │   ├── NotificationSettingsScreen.tsx # Notification preferences
    │   └── NotificationsScreen.tsx        # Notification list with filters
    ├── services/               # API integration and business logic (16 files)
    │   ├── auditService.ts              # Audit trail and event logging
    │   ├── biometricService.ts          # Face ID/Touch ID authentication
    │   ├── companyBillingService.ts      # Company billing, invoices, payments
    │   ├── enhancedBillingService.ts     # Advanced billing features and analytics
    │   ├── googleMapsService.ts         # Google Maps API, geocoding, places
    │   ├── mcpStripeService.ts          # Stripe via MCP/Edge Functions
    │   ├── mcpSupabaseService.ts        # MCP-based Supabase operations
    │   ├── notificationService.ts       # Push and in-app notifications
    │   ├── pointsService.ts             # Points, rewards catalog, vouchers
    │   ├── productsService.ts           # Product catalog CRUD and search
    │   ├── realTimePaymentService.ts    # Real-time payment subscriptions
    │   ├── storageService.ts            # Supabase Storage (image upload/download)
    │   ├── supabaseAuthService.ts       # Auth flows (sign up/in/out, password reset)
    │   ├── supabaseService.ts           # Main Supabase client (users, orders, etc.)
    │   ├── synchronousBalanceService.ts # Atomic balance updates via RPC
    │   └── wishlistService.ts           # Wishlist CRUD
    ├── types/                  # TypeScript type definitions
    │   ├── checkout.ts         # DeliveryAddress, DeliverySlot, PaymentMethod, OrderSummary
    │   ├── location.ts         # LocationCoordinate, SavedAddress, component props
    │   ├── navigation.ts       # MainTabParamList, RootStackParamList (all screen params)
    │   ├── notification.ts     # NotificationType, NotificationData, NotificationSettings
    │   └── user.ts             # User, Company, UserPermissions, CompanyUserRole, helpers
    ├── utils/                  # Shared utilities (9 files)
    │   ├── animations.ts       # Animation configs (fade, slide, spring, pulse, shake)
    │   ├── authMutex.ts        # Serialize auth operations (async-mutex)
    │   ├── checkoutValidation.ts  # Address, email, card, phone validation
    │   ├── formatting.ts       # Number, currency, percentage formatting helpers
    │   ├── haptics.ts          # iOS haptic feedback patterns
    │   ├── imageUtils.ts       # Supabase Storage URLs, product image mapping
    │   ├── pricing.ts          # Retail/trade pricing, GST, cart totals, delivery fees
    │   ├── testSupabaseIntegration.ts  # Supabase integration test helpers
    │   └── theme.ts            # Design system: COLORS, SHADOWS, SPACING, TYPOGRAPHY
    └── assets/                 # Static assets (icons, splash, brand logos)
```

### Navigation Architecture

Navigation is configured in `App.tsx` using React Navigation (not Expo Router file-based routing, despite `expo-router` being in dependencies).

**Provider hierarchy (outermost to innermost):**

```
ErrorBoundary → GestureHandlerRootView → AuthProvider → AppProvider →
RewardsProvider → NotificationProvider → CheckoutProvider →
CartNotificationProvider → TransitionProvider → AppContent
```

**Main tabs:** Home, Products, Cart, Rewards, Profile

**Stack screens include:** ProductDetail, SmartSearch, Checkout, UnifiedCheckout, OrderSuccess, OrderTracking, OrderProcessing, OrderConfirmation, OrderHistory, Wishlist, Reviews, Support, Rewards, VoucherTracking, RewardsFAQ, ReferralScreen, InviteFriends, AchievementsScreen, MilestonesScreen, RewardsAnalytics, LocationPickerScreen, UberStyleLocationScreen, DeliveryLocationScreen, SavedLocations, CompanyProfile, TeamManagement, Settings, Notifications, NotificationSettings, CheckoutAddress/Delivery/Payment/Review, BillingDashboard, CreditPayment, BillingSettings, InvoiceGeneration, InvoiceViewer

### Key Design Patterns

**Context-based state management** — 7 context providers handle global state, auth, cart notifications, checkout flow, notifications, rewards/loyalty, and animation transitions. State persists to AsyncStorage for cart, location, and checkout data.

**Service layer** — 16 stateless service modules organized by domain. Services export functions (not classes), use Promises, and handle error logging. State lives in Context providers, not services.

**Theme system** (`app/utils/theme.ts`) — Monochrome design with `hsl(0, 0%, 100%)` for cards, `hsl(0, 0%, 98%)` for backgrounds, black text and buttons. Consistent typography scale, shadow system, and spacing constants.

**Dual pricing** (`app/utils/pricing.ts`) — Retail vs trade pricing based on user type, with GST calculation, stock validation, and delivery fee computation.

## Admin Web Dashboard (`admin-web/`)

Standalone admin panel for managing the EASI platform.

**Tech stack:** React 19.2, Vite 7, TypeScript, Tailwind CSS 4, React Router 7, Supabase, Lucide React, jsPDF, PapaParse

**Features:**

- **Dashboard** — Overview statistics
- **Products** — CRUD, CSV import, image upload
- **Categories** — Category management
- **Customers** — Individual customer management, points history, vouchers
- **Companies** — B2B company management, employees
- **Orders** — Order management and details
- **Invoices** — Individual and company invoices
- **Rewards** — Reward catalog, vouchers, missing points reports
- **Notifications** — Templates, sending, history, analytics
- **Settings** — General, admin management, notification preferences
- **Content** — Content management

**Running:** `cd admin-web && npm run dev`

## EASIBridge (`bridge/`)

Windows Service that syncs data between AutoCount Accounting and Supabase.

**Tech stack:** C# / .NET Framework 4.8, AutoCount Accounting 2.1 SDK (via reflection)

**Purpose:** One-way sync of debtors from AutoCount → Supabase `companies` table. Writes to `sync_jobs` and `sync_errors` tables for tracking. Runs as a Windows Service with configurable sync interval (default 60 min).

**Config:** `App.config` contains AutoCount DB connection, Supabase URL/service key, sync interval.

**Related migrations:** `20260305100000_create_sync_infrastructure.sql`, `20260305110000_fix_debtor_code_constraint.sql`

## Supabase Configuration

**Project details (secrets):** Store in `.env` — never commit. Use `.env.example` as a template.

- `EXPO_PUBLIC_SUPABASE_URL` — Project URL (required)
- `EXPO_PUBLIC_SUPABASE_KEY` — Anon key (required)
- `SUPABASE_SERVICE_KEY` — Service role key (admin operations)
- `SUPABASE_DB_PASSWORD` — For CLI `db push`
- `SUPABASE_ACCESS_TOKEN` — For Supabase CLI/tooling
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` — Google Maps
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Stripe client key
- `STRIPE_SECRET_KEY` — Stripe secret key
- `EXPO_PUBLIC_EAS_PROJECT_ID` — EAS Build / push notifications
- `GITHUB_TOKEN` — GitHub MCP / tooling

### Database Schema (51 migrations)

**Core tables:**

- `companies` — Business profiles with UEN, credit_limit, credit_used, payment_terms, autocount_debtor_code
- `users` — User accounts with account_type ('individual' | 'company'), company_id, role
- `user_permissions` — Granular role-based permissions (can_create_orders, can_approve_orders, etc.)
- `products` — Product catalog with promo pricing, size options, variants, categories
- `categories` — Product categories

**Orders system:**

- `orders` — Main orders with user/company relationships, approval workflow, order number (ORD-YYYY-XXXXXX)
- `order_items` — Line items with product details and pricing
- `order_approvals` — Multi-level approval tracking
- `order_status_history` — Audit trail of status changes

**Billing system:**

- `invoices` — Invoice records
- `invoice_payments` — Payment records with trigger to update invoice status
- `balance_updates` — Balance change tracking
- RPC functions: `update_company_balance_atomic`, `get_company_balance_summary`, `get_company_balance_locked`

**Points and rewards:**

- Points system with lifetime_points_earned tracking
- Redemption system with reward catalog
- Company voucher sharing
- Audit logging for points transactions

**Notifications:**

- `notifications` — In-app notification system

**Locations:**

- `user_locations` — Saved delivery addresses with RLS

**Sync infrastructure (AutoCount Bridge):**

- `sync_jobs` — Sync job tracking
- `sync_errors` — Sync error logging

**Storage buckets:**

- `profile-images` — User profile pictures
- `product-images` — Product catalog images

**Valid order statuses:** 'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled', 'returned'

### Business Logic

**Payment system:**

- Company orders use credit terms (COD, NET7, NET30, NET60) as payment method
- Individual orders use traditional methods (credit_card, debit_card, paypal, etc.)
- Company orders auto-marked as 'paid' using company credit
- Credit logic: available credit = credit_limit - credit_used

**Tier system:**

- Tiers based on lifetime points earned (total accumulated), not current balance
- Thresholds: Bronze (0–49,999), Silver (50,000–199,999), Gold (200,000+)
- Redemptions do NOT affect tier status
- Points earned: 2 points per $1 spent

**B2B capabilities:**

- Company profiles with UEN, credit limits, payment terms
- Team management with roles: Admin, Manager, Member, Viewer
- Multi-level order approval workflows
- Trade pricing for verified company users

**Location management:**

- Uber-style location picker with Google Maps
- Singapore-focused with delivery zones
- Monochrome map styling
- Saved locations with AsyncStorage persistence

## Code Quality Rules

### Cursor Rules (`.cursor/rules/`)

- **refactor.mdc** — Refactor files approaching or exceeding 500 lines
- **color-scheme.mdc** — Strict monochrome design system (white cards on light gray frame, black text/buttons)
- **troubleshoot-rule.mdc** — Fix root causes not symptoms; keep summaries detailed

### Linting & Formatting

- **ESLint:** `@typescript-eslint/parser`, env: node + es6 + react-native, rules: no-unused-vars (warn)
- **Prettier:** Single quotes, semicolons, trailing commas (es5), 80 char width, 2-space tabs
- **Husky + lint-staged:** Pre-commit runs ESLint fix + Prettier on TS/TSX; Prettier on JS/JSX/JSON/MD

### Testing

- **Framework:** Jest 29 with React Native preset
- **Environment:** jsdom, 30s timeout
- **Test location:** `app/**/__tests__/**/*.{ts,tsx}` or `app/**/*.{test,spec}.{ts,tsx}`
- **Coverage thresholds:** 70% for branches, functions, lines, and statements
- **Module alias:** `@/` maps to `app/` directory
- **Setup:** `npm run prepare` initializes Husky hooks (runs automatically after `npm install`)

## MCP Server Integration

**Configuration:** `.mcp.json` in project root

| Server   | Package                         | Purpose                                          |
| -------- | ------------------------------- | ------------------------------------------------ |
| Supabase | `@supabase/mcp-server-supabase` | Database operations, migrations, type generation |
| Stripe   | `@stripe/mcp`                   | Payment processing integration                   |
| GitHub   | `@edjl/github-mcp`              | Repository management                            |

Services in `app/services/mcpStripeService.ts` and `app/services/mcpSupabaseService.ts` provide typed interfaces to MCP functionality.

## Quick Reference

### Common Development Tasks

**Adding a new feature:**

1. Create feature components in `app/components/<Feature>/`
2. Add service functions in `app/services/<feature>Service.ts`
3. Add TypeScript types in `app/types/`
4. Add custom hooks in `app/hooks/` if needed
5. Update Context providers if global state is needed
6. Add navigation screen params to `app/types/navigation.ts`
7. Register screens in `App.tsx`
8. Keep files under 500 lines (refactor rule)
9. Follow monochrome color scheme

**Database schema changes:**

1. Create migration: `npx supabase migration new <name>`
2. Write SQL in generated file in `supabase/migrations/`
3. Apply: set `SUPABASE_DB_PASSWORD` in `.env`, then `npx supabase db push`
4. Generate types: `npx supabase gen types typescript --local`
5. For conflicts: use `IF NOT EXISTS` / `ON CONFLICT ... DO NOTHING`
6. For complex conflicts: run SQL manually in Supabase Dashboard → SQL Editor

**Debugging authentication issues:**

- Check RLS policies in Supabase dashboard
- Verify user exists in `auth.users` table
- Check `users` table has matching record
- For company users, verify `user_permissions` entry
- Auth operations are serialized via `authMutex` (async-mutex)

### Key Architecture Decisions

- Feature-based component organization over type-based structure
- Context providers for global state instead of Redux/Zustand
- React Navigation (imperative) over Expo Router (file-based)
- AsyncStorage for cart, location, and checkout persistence
- Monochrome design system with strict HSL color values
- Dual pricing system (retail/trade) with GST calculation
- Role-based permissions with company hierarchy support
- Supabase RPC functions for atomic balance operations
- One-way AutoCount → Supabase sync via EASIBridge Windows Service
- Separate admin-web dashboard (Vite + React) sharing the same Supabase backend
