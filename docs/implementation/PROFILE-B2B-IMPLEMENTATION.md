# B2B Profile System Implementation

## Overview

This document outlines the implementation of a comprehensive B2B (business-to-business) profile system that supports both individual users and company accounts with multi-user management, role-based permissions, and order approval workflows.

## Key Features

### 1. Dual Account Types
- **Individual Users**: Regular consumers with personal accounts
- **Company Users**: Employees of registered businesses with trade accounts

### 2. Company Structure
- Legal entity information (UEN, company name, address)
- Credit limits and payment terms (NET30, NET60)
- Order approval workflows
- Multi-level approval thresholds

### 3. User Roles & Permissions

#### Role Hierarchy
1. **Superadmin**
   - Full company management access
   - Can manage users, billing, and company settings
   - Can approve any order value

2. **Manager**
   - Can approve orders and manage team members
   - Access to reports and team management
   - Cannot modify company settings

3. **Approver**
   - Can only approve/reject orders
   - View company-wide order history
   - No management permissions

4. **Staff**
   - Can create orders up to their limit
   - View only their own order history
   - Basic trade pricing access

### 4. Order Approval Workflow
- Configurable approval thresholds
- Auto-approval for orders below threshold
- Multi-level approval for large orders
- Real-time notifications for pending approvals

## Implementation Details

### Type Definitions (`app/types/user.ts`)

```typescript
export interface Company {
  id: string;
  name: string;
  companyName: string;      // Legal entity name
  uen: string;              // Unique Entity Number
  address: string;
  
  // Billing & Credit
  creditLimit?: number;
  currentCredit?: number;
  paymentTerms?: 'COD' | 'NET7' | 'NET30' | 'NET60';
  
  // Order Settings
  approvalSettings: {
    requireApproval: boolean;
    approvalThreshold?: number;
    multiLevelApproval?: boolean;
    autoApproveBelow?: number;
  };
  
  status: 'active' | 'suspended' | 'pending_verification';
}

export interface CompanyUser extends User {
  accountType: 'company';
  companyId: string;
  role: CompanyUserRole;
  department?: string;
  position?: string;
  permissions: UserPermissions;
}
```

### Mock Data Structure

The system includes comprehensive mock data demonstrating:

1. **The Winery Tapas Bar** (Company 1)
   - Mikael Chan (Superadmin/Manager)
   - Sarah Lim (Manager/Bar Manager)
   - John Tan (Staff/Bartender)

2. **Marina Bay Restaurant Group** (Company 2)
   - David Wong (Superadmin/Group Purchasing Manager)

### UI Components

#### 1. Enhanced Profile Screen
- Dynamic rendering based on user type
- Company section for business users
- Role-based menu items
- Permission-aware features

#### 2. Company Profile Screen
- Company information display
- Credit utilization visualization
- Order approval settings
- Billing information

#### 3. Team Management Screen
- Team member list with roles
- Permission indicators
- Invite new members
- Edit member permissions

## User Experience Flow

### For Company Superadmins
1. View company profile with credit status
2. Manage team members and permissions
3. Configure approval workflows
4. Access company-wide reports

### For Managers
1. Approve pending orders
2. View team performance
3. Access order history
4. Manage subordinate staff

### For Staff
1. Create orders within limits
2. Submit for approval when needed
3. Track personal order history
4. View trade pricing

## Benefits

### For Businesses
- **Centralized Control**: Manage all company purchases
- **Credit Management**: Track and control spending
- **Approval Workflows**: Ensure proper authorization
- **Team Management**: Organize purchasing by department

### For the Platform
- **B2B Revenue**: Capture business customers
- **Higher Order Values**: Business orders typically larger
- **Customer Retention**: Companies less likely to switch
- **Data Insights**: Understand business purchasing patterns

## Future Enhancements

1. **Advanced Reporting**
   - Spending analytics by department
   - Purchase pattern insights
   - Budget tracking and alerts

2. **Integration Features**
   - ERP system connections
   - Accounting software sync
   - API for custom integrations

3. **Enhanced Workflows**
   - Custom approval chains
   - Budget allocations
   - Recurring order templates

4. **Mobile Optimizations**
   - Quick approval actions
   - Push notifications
   - Offline order drafts

## Technical Considerations

### State Management
- Company data stored in AppContext
- User permissions checked at component level
- Real-time updates for approvals

### Security
- Role-based access control
- Permission validation
- Audit trails for actions

### Performance
- Lazy loading for large teams
- Cached permission checks
- Optimized list rendering

## Testing Checklist

- [ ] Individual user profile display
- [ ] Company user profile with role badge
- [ ] Company stats and credit display
- [ ] Team management access control
- [ ] Invite team member flow
- [ ] Role-based menu visibility
- [ ] Navigation to company screens
- [ ] Permission-based features
- [ ] Mock data consistency
- [ ] Responsive design

## Conclusion

This B2B profile system provides a robust foundation for serving business customers while maintaining support for individual users. The flexible permission system and approval workflows enable businesses of all sizes to manage their purchasing effectively through the app. 