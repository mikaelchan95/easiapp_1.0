# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server
npm start              # Start Expo development server
npm run start:clean    # Start with cache cleared
npm run dev           # Alias for start:clean

# Platform-specific development
npm run ios           # Run on iOS simulator
npm run android       # Run on Android emulator
npm run web          # Run in web browser

# Build commands
npm run build        # Build for web and run tests
npm run build:web    # Build web version only
npm run build:android # Build Android APK
npm run build:ios    # Build iOS IPA

# Testing
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run test:ci      # Run tests in CI mode (no watch)
npm run test:integration # Run integration tests only
npm run test:unit    # Run unit tests only

# Code quality
npm run lint         # Check for linting errors
npm run lint:fix     # Fix linting errors automatically
npm run prettier     # Check code formatting
npm run prettier:fix # Format code automatically
npm run type-check   # Run TypeScript type checking
npm run quality      # Run all quality checks (lint + prettier + type-check)

# Deploy to web
npm run deploy       # Export and deploy to EAS

# Supabase CLI commands (always use CLI for database operations)
# Reference: https://supabase.com/docs/reference/cli/introduction

# Authentication & Setup
npx supabase login                    # Connect CLI to Supabase account
npx supabase init                     # Initialize local project
npx supabase link --project-ref vqxnkxaeriizizfmqvua # Link to remote project
npx supabase start                    # Start local development environment

# Database Operations
npx supabase db push                  # Apply migrations to remote database
npx supabase db pull                  # Pull schema changes from remote
npx supabase db diff                  # Check schema differences
npx supabase db reset                 # Reset local database
npx supabase migration new <name>     # Create new migration file
npx supabase gen types typescript --local # Generate TypeScript types

# Migration Workflow (Step-by-Step Process)
# 1. Initialize and link project (one-time setup)
npx supabase init                     # Initialize local project
npx supabase link --project-ref vqxnkxaeriizizfmqvua # Link to remote project

# 2. Check migration status
npx supabase db push --dry-run        # See what migrations would be applied
npx supabase migration list           # List all migrations

# 3. Apply migrations with password
SUPABASE_DB_PASSWORD="5Cptmjut1!5gg5ocw" npx supabase db push

# 4. Handle conflicts in migrations
# - Use "IF NOT EXISTS" for CREATE statements
# - Use "ON CONFLICT ... DO NOTHING" for INSERT statements
# - Fix user IDs to match actual database (e.g., 2a163380-6934-4f19-b2ff-f6a15081cfe2)
# - Check valid constraint values (e.g., order status must be in allowed list)

# 5. For complex migrations with conflicts, use manual SQL approach:
# - Create consolidated SQL file with conflict handling
# - Copy to Supabase Dashboard → SQL Editor
# - Run manually to bypass CLI conflicts

# Storage Management
npx supabase storage list-buckets     # List storage buckets
npx supabase storage create-bucket <name> # Create storage bucket

# Functions & Deployment
npx supabase functions deploy         # Deploy Edge Functions
npx supabase functions new <name>     # Create new Edge Function

# Secret Management
npx supabase secrets list             # List environment secrets
npx supabase secrets set KEY=value    # Set environment secret
```

## Supabase Configuration

**Project Details:**

- Project URL: `https://vqxnkxaeriizizfmqvua.supabase.co`
- Project Ref: `vqxnkxaeriizizfmqvua`
- Database Password: `5Cptmjut1!5gg5ocw`
- Service Role API Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeG5reGFlcmlpeml6Zm1xdnVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjAwMzM4MiwiZXhwIjoyMDY3NTc5MzgyfQ.y7sQCIqVduJ7Le3IkEGR-wSoOhppjRjqsC6GvEJAZEw`

**Storage Buckets:**

- `profile-images` - For user profile pictures (automatically created via migrations)
- `product-images` - For product catalog images (contains existing product images)

**Orders System:**

- `orders` - Main orders table with user/company relationships and approval workflow
- `order_items` - Order line items with product details and pricing
- `order_approvals` - Multi-level approval tracking for company orders
- `order_status_history` - Complete audit trail of order status changes
- Automated order number generation: `ORD-YYYY-XXXXXX` format
- Row-level security policies for user/company access control
- Sample data seeded for Mikael (3 individual orders)

**Important:**

- Always use Supabase CLI for database operations when possible
- For complex migrations with conflicts, use manual SQL approach via Supabase Dashboard
- All storage buckets and policies are created via migrations
- All seeding is handled via Node.js scripts (never manual)

**Migration Troubleshooting:**

- Project is linked to remote: `vqxnkxaeriizizfmqvua`
- Database password: `5Cptmjut1!5gg5ocw`
- Real user ID: `2a163380-6934-4f19-b2ff-f6a15081cfe2` (not 33333333-3333-3333-3333-333333333333)
- Valid order statuses: 'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled', 'returned'
- When CLI fails due to conflicts, create manual SQL file and run in Supabase Dashboard

**Common Issues Fixed:**

- **Company RLS Policy**: Fixed faulty Row Level Security policy on companies table
- **Audit System**: Applied manual migration for points logging and audit trails
- **Points Persistence**: Rewards points now save to database and persist across app reloads
- **Payment System**: Fixed payment types for company orders to use credit terms (NET30, NET60, etc.)
- **Tier System**: Fixed tier upgrades to use lifetime points earned, not current balance or spending

**Payment System:**

- Company orders use credit terms (COD, NET7, NET30, NET60) as payment method
- Individual orders use traditional payment methods (credit_card, debit_card, paypal, etc.)
- Company orders are automatically marked as 'paid' since they use company credit
- Database constraints ensure proper payment method validation
- Migration `20250711180000_fix_payment_methods.sql` implements payment validation

**Credit System:**

- Company credit logic: `current_credit = credit_limit - credit_used`
- `current_credit` represents available credit (can be negative if over limit)
- Order creation automatically deducts from available credit
- Credit balance shown in app represents available credit, not used credit

**Tier System:**

- Tiers based on **lifetime points earned** (total accumulated), not current balance
- Tier thresholds: Bronze (0-49,999), Silver (50,000-199,999), Gold (200,000+)
- Redemptions do NOT affect tier status (tier persists based on total earned)
- Progress widget shows points needed to next tier, not dollars
- Company at Gold tier with 291,119 lifetime points earned

## Code Quality Rules

### Cursor Rules (.cursor/rules/)

- **Refactor Rule**: Files must be refactored if they approach or exceed 500 lines
- **Color Scheme Rule**: Strict monochrome design system enforcement
  - Canvas/Cards: `hsl(0, 0%, 100%)` (pure white)
  - Frame/Backdrop: `hsl(0, 0%, 98%)` (very light gray)
  - Text: `hsl(0, 0%, 0%)` (black) and `hsl(0, 0%, 30%)` (dark gray)
  - Interactive: `hsl(0, 0%, 0%)` (black) backgrounds with white text
  - Shadows: Light `0 1px 3px rgba(0,0,0,0.04)`, Medium `0 4px 6px rgba(0,0,0,0.08)`

### Project Organization

- Root folder cleaned of development scripts and temporary files
- Documentation consolidated under `docs/` directory
- Clean separation between source code and build artifacts

## Supabase Management

- Always use CLI to update Supabase, and remember all the credentials

## Architecture Overview

### Tech Stack

- **React Native + Expo 53** - Mobile app framework with development platform
- **TypeScript** - Type-safe JavaScript throughout the codebase
- **Supabase** - Backend-as-a-Service (PostgreSQL, Auth, Real-time subscriptions)
- **Google Maps API** - Location services and mapping
- **React Navigation 7** - Stack and tab navigation

### App Structure

```
app/
├── components/        # Feature-organized UI components
│   ├── Activities/    # Order history, reviews, support, wishlist
│   ├── Auth/         # Authentication screens and flows
│   ├── Billing/      # Credit payment and billing dashboard
│   ├── Cart/         # Shopping cart functionality
│   ├── Chat/         # Customer support chat interface
│   ├── Checkout/     # Multi-step checkout process
│   ├── Home/         # Dashboard and home screen
│   ├── Layout/       # Screen layout wrappers and containers
│   ├── Location/     # Uber-style location picker and management
│   ├── Navigation/   # Bottom tabs and navigation components
│   ├── Products/     # Product catalog, search, and details
│   ├── Profile/      # User/company profiles and team management
│   ├── Rewards/      # Loyalty system and voucher tracking
│   ├── Settings/     # App settings and preferences
│   └── UI/           # Reusable components (buttons, animations, etc.)
├── context/          # React Context providers for global state
│   ├── AppContext.tsx           # Global app state, user auth, cart
│   ├── AuthContext.tsx          # Authentication state
│   ├── CartNotificationContext.tsx  # Cart feedback notifications
│   ├── CheckoutContext.tsx      # Checkout flow state
│   ├── RewardsContext.tsx       # Loyalty points and vouchers
│   └── TransitionContext.tsx    # Navigation transitions
├── services/         # API integration and business logic
│   ├── auditService.ts          # Audit trail logging
│   ├── biometricService.ts      # Face ID/Touch ID authentication
│   ├── companyBillingService.ts # Company billing operations
│   ├── enhancedBillingService.ts # Advanced billing features
│   ├── googleMapsService.ts     # Google Maps API integration
│   ├── mcpStripeService.ts      # MCP Stripe integration
│   ├── mcpSupabaseService.ts    # MCP Supabase integration
│   ├── notificationService.ts   # Push notifications
│   ├── pointsService.ts         # Loyalty points calculation
│   ├── productsService.ts       # Product catalog operations
│   ├── realTimePaymentService.ts # Real-time payment processing
│   ├── storageService.ts        # AsyncStorage wrapper
│   ├── supabaseAuthService.ts   # Authentication service
│   ├── supabaseService.ts       # Main Supabase client
│   ├── synchronousBalanceService.ts # Synchronous balance updates
│   └── wishlistService.ts       # Wishlist management
├── types/           # TypeScript type definitions
│   ├── checkout.ts  # Checkout-related types
│   ├── location.ts  # Location and address types
│   ├── navigation.ts # Navigation types
│   ├── notification.ts # Notification types
│   └── user.ts      # User and company types
├── utils/           # Shared utilities
│   ├── theme.ts     # Design system theme constants
│   ├── animations.ts # Reusable animation configurations
│   └── pricing.ts   # Pricing calculations and validations
└── data/            # Mock data for development
    ├── mockProducts.ts # Product catalog
    └── mockUsers.ts   # User accounts
```

### Key Design Patterns

#### Context-Based State Management

- `AppContext.tsx` - Global app state, user auth, cart management
- `RewardsContext.tsx` - Loyalty points and voucher tracking
- `CartNotificationContext.tsx` - Cart feedback notifications
- State persistence with AsyncStorage for cart and location

#### Theme System (`app/utils/theme.ts`)

- Monochrome design: pure whites on light gray backgrounds
- Strict color palette: `hsl(0, 0%, 100%)` for cards, `hsl(0, 0%, 98%)` for backgrounds
- Black text and interactive elements following workspace design rules
- Consistent typography scale with semantic naming (h1-h6, body, caption, etc.)
- Shadow system with light/medium/large variants

#### Pricing & User Roles (`app/utils/pricing.ts`)

- Dual pricing: retail vs trade pricing based on user type
- Stock validation with quantity limits
- Company users with permissions-based access to trade pricing

#### Service Layer Architecture

Services are organized by domain and provide centralized business logic:

- **Authentication Services**: `supabaseAuthService.ts` handles auth flows, `biometricService.ts` for Face ID/Touch ID
- **Data Services**: `supabaseService.ts` (main client), `mcpSupabaseService.ts` (MCP integration)
- **Business Logic**: `pointsService.ts`, `productsService.ts`, `wishlistService.ts`
- **Payment Services**: `realTimePaymentService.ts`, `synchronousBalanceService.ts`, `companyBillingService.ts`
- **Infrastructure Services**: `storageService.ts` (AsyncStorage), `notificationService.ts`, `auditService.ts`
- **External Integrations**: `googleMapsService.ts`, `mcpStripeService.ts`

**Service Pattern:**

- Services export functions, not classes
- All async operations use Promise-based API
- Services handle error logging and recovery
- Services are stateless; state lives in Context providers

### Business Logic

#### B2B Capabilities

- Company profiles with UEN, credit limits, payment terms
- Team management with role-based permissions (Admin, Manager, Member, Viewer)
- Multi-level approval workflows for orders
- Trade pricing access for verified company users

#### Location Management

- Uber-style location picker with recent locations and favorites
- Google Maps integration with monochrome styling
- Location persistence and management across app sections

#### E-commerce Features

- Product catalog with advanced search and filtering
- Smart cart with quantity validation and stock checking
- Multi-step checkout with delivery scheduling
- Order tracking and history

### Supabase Integration (`app/services/supabaseService.ts`)

#### Database Schema

- `users` table with account_type ('individual' | 'company')
- `companies` table with business information and approval settings
- `user_permissions` table for granular access control
- Row-level security (RLS) policies for data isolation

#### Key Service Methods

- User authentication and profile management
- Company data and team member management
- Real-time subscriptions for user/company changes
- Demo authentication method for development

### Development Guidelines

#### File Organization

- Components grouped by feature area, not by type
- Avoid files over 500 lines (refactor rule in `.cursor/rules/refactor.mdc`)
- Use TypeScript interfaces from `app/types/` for consistency

#### Styling Standards

- Follow workspace color scheme rules in `.cursor/rules/color-scheme.mdc`
- Use theme constants from `app/utils/theme.ts` instead of hardcoded values
- Maintain monochrome aesthetic with generous spacing

#### State Management

- Use Context providers for global state
- Validate business rules in reducers (stock limits, permissions)
- Persist critical data (cart, location) with AsyncStorage

### Testing & Quality

- **Testing Framework**: Jest with React Native preset
- **Test Location**: `app/**/__tests__/**/*.{ts,tsx}` or `app/**/*.{test,spec}.{ts,tsx}`
- **Coverage Thresholds**: 70% for branches, functions, lines, and statements
- **Test Types**: Unit tests, integration tests, and manual UI/UX validation
- **Module Aliasing**: `@/` maps to `app/` directory in tests
- **Test Environment**: jsdom with 30-second timeout for async operations

### Special Considerations

- Google Maps API key configured for both iOS and Android in `app.json`
- Location permissions required for delivery functionality
- Supabase RLS policies enforce data security for B2B features
- Offline-first design with graceful fallbacks to mock data

### Mock Data & Development

- `app/data/mockProducts.ts` - Product catalog with dual pricing
- `app/data/mockUsers.ts` - User accounts (individual & company) with roles
- Demo authentication available in `supabaseService.ts` for development
- Mock data includes B2B features like company profiles, team management, and permissions

### Key Architecture Decisions

- Feature-based component organization over type-based structure
- Context providers for global state instead of Redux/Zustand
- AsyncStorage for cart and location persistence
- Monochrome design system with strict HSL color values
- Dual pricing system (retail/trade) with GST calculation
- Role-based permissions with company hierarchy support

## MCP Server Integration

This project uses MCP (Model Context Protocol) servers for enhanced development capabilities:

**Configured Servers:**

- **Supabase MCP** (`@supabase/mcp-server-supabase`): Database operations, migrations, and type generation
- **Stripe MCP** (`@stripe/mcp`): Payment processing integration
- **GitHub MCP** (`@edjl/github-mcp`): Repository management and CI/CD

**Configuration File:** `.mcp.json` in project root

**Usage:**

- MCP servers enable AI-assisted database management and payment operations
- Services in `app/services/mcp*.ts` provide typed interfaces to MCP functionality
- Real-time database operations benefit from MCP's enhanced query capabilities

## Pre-commit Hooks

The project uses Husky for Git hooks and lint-staged for pre-commit validation:

**Pre-commit Actions:**

- TypeScript/TSX files: ESLint fix + Prettier format
- JS/JSX/JSON/MD files: Prettier format
- Automatic code quality enforcement before commits

**Setup:**

```bash
npm run prepare  # Initialize Husky hooks (runs automatically after npm install)
```

## Quick Reference

### Important File Locations

- **Environment Config**: `.env` (not in repo), see `.env.example` for template
- **App Config**: `app.json` - Expo configuration including bundle IDs and API keys
- **TypeScript Config**: `tsconfig.json` - TypeScript compiler settings
- **Jest Config**: `jest.config.js` and `jest.setup.js` - Testing configuration
- **Supabase Migrations**: `supabase/migrations/` - Database schema changes
- **Cursor Rules**: `.cursor/rules/` - Code quality and style enforcement

### Common Development Tasks

**Adding a new feature:**

1. Create feature-specific components in `app/components/<Feature>/`
2. Add service functions in `app/services/<feature>Service.ts`
3. Add TypeScript types in `app/types/`
4. Update Context providers if global state is needed
5. Keep files under 500 lines (refactor rule)
6. Follow monochrome color scheme (see `.cursor/rules/color-scheme.mdc`)

**Database schema changes:**

1. Create migration: `npx supabase migration new <name>`
2. Write SQL in generated file in `supabase/migrations/`
3. Apply migration: `SUPABASE_DB_PASSWORD="5Cptmjut1!5gg5ocw" npx supabase db push`
4. Generate types: `npx supabase gen types typescript --local`

**Debugging authentication issues:**

- Check RLS policies in Supabase dashboard
- Verify user exists in `auth.users` table
- Check `users` table has matching record
- For company users, verify `user_permissions` table entry

### Environment Variables

**Required for Development:**

```bash
EXPO_PUBLIC_SUPABASE_URL=https://vqxnkxaeriizizfmqvua.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=<anon_key>
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=<google_maps_key>
```

**Optional for Full Features:**

```bash
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=<stripe_key>
STRIPE_SECRET_KEY=<stripe_secret>
SUPABASE_SERVICE_KEY=<service_role_key>
SUPABASE_ACCESS_TOKEN=<access_token>
GITHUB_TOKEN=<github_token>
```
