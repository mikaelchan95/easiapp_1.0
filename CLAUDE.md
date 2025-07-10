# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server
npm start

# Platform-specific development
npm run ios     # iOS simulator
npm run android # Android emulator  
npm run web     # Web browser

# Deploy to web
npm run deploy  # Export and deploy to EAS
```

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
│   ├── Cart/         # Shopping cart and checkout flow
│   ├── Checkout/     # Multi-step checkout process
│   ├── Home/         # Home screen with featured content
│   ├── Location/     # Uber-style location picker and management
│   ├── Products/     # Product catalog, search, and details
│   ├── Profile/      # User/company profiles and team management
│   ├── Rewards/      # Loyalty system and voucher tracking
│   └── UI/           # Reusable components (buttons, animations, etc.)
├── context/          # React Context providers for global state
├── services/         # API integration (Supabase, Google Maps)
├── types/           # TypeScript type definitions
└── utils/           # Shared utilities (theme, animations, pricing)
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
- No formal test framework configured - check README for testing approach
- Manual validation through comprehensive UI/UX testing (see `docs/testing/`)
- Location and checkout flow testing documented in `docs/testing/`

### Special Considerations
- Google Maps API key configured for both iOS and Android in `app.json`
- Location permissions required for delivery functionality
- Supabase RLS policies enforce data security for B2B features
- Offline-first design with graceful fallbacks to mock data