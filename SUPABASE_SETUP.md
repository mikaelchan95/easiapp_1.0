# Supabase Integration Setup Guide

## Overview

This guide walks through setting up Supabase for profile management in the EASI app, including user authentication, profile data, and company management.

## Database Setup

### 1. Create Tables

Run the schema creation script in your Supabase SQL editor:

```sql
-- Copy and run the contents of app/database/schema.sql
```

This creates:
- `companies` table for business accounts
- `users` table for both individual and company users
- `user_permissions` table for role-based access control
- `order_approvals` table for approval workflows
- Necessary indexes and triggers
- Row Level Security (RLS) policies

### 2. Seed Data

After creating the tables, run the seed script:

```sql
-- Copy and run the contents of app/database/seed.sql
```

This populates the database with:
- 2 sample companies (The Winery Tapas Bar, Marina Bay Restaurant Group)
- 6 sample users (4 company users, 2 individual users)
- Appropriate permissions for each user role

### 3. Storage Setup (Optional)

If you want to enable profile image uploads:

1. Go to Storage in your Supabase dashboard
2. Create a new bucket called `profile-images`
3. Set it to public
4. Configure RLS policies for the bucket

## Authentication Setup

### 1. Enable Email Auth

In your Supabase dashboard:
1. Go to Authentication > Settings
2. Ensure "Enable email confirmations" is configured as needed
3. Configure email templates if desired

### 2. Create Test Users

You can create users directly in Supabase or use the seed data:

**Test Accounts:**
- Email: `mikael@thewinery.com.sg` (Company Superadmin)
- Email: `sarah@thewinery.com.sg` (Company Manager)
- Email: `jane@example.com` (Individual User)

## App Configuration

The app is already configured with:

### 1. Supabase Client
- Configuration in `app/config/supabase.ts`
- URL: `https://vqxnkxaeriizizfmqvua.supabase.co`
- Anon key: Provided in the configuration

### 2. Service Layer
- Complete service layer in `app/services/supabaseService.ts`
- Handles all CRUD operations
- Transforms database types to app types
- Includes real-time subscriptions

### 3. Context Integration
- Updated `AppContext` with Supabase methods
- Authentication functions (`signIn`, `signOut`)
- Profile update functions (`updateUserProfile`, `updateCompanyProfile`)
- Automatic data loading on app start

## Features Implemented

### ✅ User Authentication
- Sign in with email/password
- Automatic session management
- Sign out functionality

### ✅ Profile Management
- User profile display and updates
- Company profile display and updates
- Role-based permissions
- Team management interface

### ✅ Data Synchronization
- Real-time updates via Supabase subscriptions
- Fallback to mock data for development
- Proper error handling

### ✅ Security
- Row Level Security (RLS) policies
- Role-based access control
- Secure authentication flow

## Usage Examples

### Sign In
```typescript
const { signIn } = useContext(AppContext);
const user = await signIn('mikael@thewinery.com.sg', 'password');
```

### Update Profile
```typescript
const { updateUserProfile } = useContext(AppContext);
const success = await updateUserProfile({ name: 'New Name' });
```

### Update Company
```typescript
const { updateCompanyProfile } = useContext(AppContext);
const success = await updateCompanyProfile({ name: 'New Company Name' });
```

## Testing

### 1. Authentication Flow
1. Use the AuthScreen component (created but not integrated into navigation)
2. Try signing in with test credentials
3. Verify user data loads correctly

### 2. Profile Updates
1. Navigate to Profile screen
2. Check that user and company data displays
3. Test sign out functionality

### 3. Permissions
1. Sign in as different user types
2. Verify role-based menu items appear/disappear
3. Test company management features

## Development vs Production

### Current State (Development)
- Falls back to mock data if Supabase is unavailable
- Uses provided Supabase instance
- All features work with both mock and real data

### Production Considerations
1. **Environment Variables**: Move Supabase credentials to environment variables
2. **Error Handling**: Implement proper error boundaries
3. **Offline Support**: Add offline data caching
4. **Performance**: Implement data pagination for large datasets

## Troubleshooting

### Common Issues

1. **RLS Policies**: If you get permission errors, check that RLS policies are correctly configured
2. **Authentication**: Ensure users exist in both Supabase Auth and your users table
3. **Data Types**: Verify enum types match between database and TypeScript interfaces

### Debug Steps

1. Check Supabase logs in the dashboard
2. Use browser developer tools to inspect network requests
3. Enable console logging in the service layer
4. Verify database constraints and triggers

## Next Steps

1. **Integrate AuthScreen**: Add authentication screen to navigation flow
2. **Enhanced Security**: Implement additional security measures
3. **Real-time Features**: Add more real-time collaboration features
4. **File Uploads**: Implement profile image upload functionality
5. **Advanced Permissions**: Add more granular permission controls

## Database Schema Summary

```
companies
├── id (uuid, primary key)
├── name (text)
├── company_name (text)
├── uen (text, unique)
├── address (text)
├── credit_limit (decimal)
├── current_credit (decimal)
├── payment_terms (enum)
├── approval_settings (various boolean/decimal fields)
└── status (enum)

users
├── id (uuid, primary key)
├── name (text)
├── email (text, unique)
├── account_type (enum: individual, company)
├── company_id (uuid, foreign key)
├── role (enum: superadmin, manager, approver, staff)
├── department (text)
├── position (text)
└── various other fields

user_permissions
├── id (uuid, primary key)
├── user_id (uuid, foreign key)
└── permission flags (various boolean fields)
```

The integration is complete and ready for testing! 