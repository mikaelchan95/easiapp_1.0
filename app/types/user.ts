// User and Company Type Definitions

export type AccountType = 'individual' | 'company';

// Points-related types
export interface UserCompanyPoints {
  id: string;
  userId: string;
  companyId: string;
  pointsBalance: number;
  lifetimePoints: number;
  pointsEarned: number;
  pointsRedeemed: number;
  pointsRank: number;
  lifetimeRank: number;
  createdAt: string;
  updatedAt: string;
}

export interface PointsTransaction {
  id: string;
  userId: string;
  companyId: string | null;
  transactionType:
    | 'earned_purchase'
    | 'redeemed_voucher'
    | 'points_transfer_in'
    | 'points_transfer_out'
    | 'earned_bonus'
    | 'expired'
    | 'adjusted';
  pointsAmount: number;
  pointsBalanceBefore: number;
  pointsBalanceAfter: number;
  metadata: Record<string, any>;
  createdAt: string;
}

export type CompanyUserRole =
  | 'superadmin' // Full access, can manage company settings and users
  | 'manager' // Can approve orders, manage team members
  | 'approver' // Can only approve/reject orders
  | 'staff'; // Can create orders, view their own history

export type OrderApprovalStatus =
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'auto_approved';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  accountType: AccountType;
  companyId?: string; // For company users
  role?: CompanyUserRole; // For company users
  permissions?: UserPermissions;
  profileImage?: string;
  walletBalance?: number; // For individual users
  points?: number; // Reward points for both individual and company users
  createdAt: string;
  lastLogin?: string;
}

export interface Company {
  id: string;
  name: string;
  companyName: string; // Legal entity name
  uen: string; // Unique Entity Number
  address: string;
  phone?: string;
  email?: string;
  logo?: string;

  // Billing & Credit
  creditLimit?: number;
  currentCredit?: number;
  paymentTerms?: 'COD' | 'NET7' | 'NET30' | 'NET60';

  // Points & Rewards
  totalPoints?: number;
  pointsEarnedThisMonth?: number;
  pointsRedeemedThisMonth?: number;
  lifetimePointsEarned?: number;
  tierLevel?: 'Bronze' | 'Silver' | 'Gold';

  // Order Settings
  approvalSettings: {
    requireApproval: boolean;
    approvalThreshold?: number; // Orders above this amount need approval
    multiLevelApproval?: boolean; // Require multiple approvers
    autoApproveBelow?: number; // Auto-approve orders below this amount
  };

  // Company Status
  status: 'active' | 'suspended' | 'pending_verification';
  verifiedAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface UserPermissions {
  // Order Permissions
  canCreateOrders: boolean;
  canApproveOrders: boolean;
  canViewAllOrders: boolean; // View company-wide orders
  orderLimit?: number; // Max order value without approval

  // User Management
  canManageUsers: boolean;
  canInviteUsers: boolean;
  canSetPermissions: boolean;

  // Company Settings
  canEditCompanyInfo: boolean;
  canManageBilling: boolean;
  canViewReports: boolean;

  // Product Access
  canViewTradePrice: boolean;
  canAccessExclusiveProducts: boolean;
}

export interface CompanyUser extends User {
  accountType: 'company';
  companyId: string;
  role: CompanyUserRole;
  department?: string;
  position?: string;
  permissions: UserPermissions;
  joinedCompanyAt: string;
}

export interface IndividualUser extends User {
  accountType: 'individual';
  memberSince: string;
  totalOrders: number;
  totalSpent: number;
}

// Order approval related types - Updated to match Supabase schema
export interface OrderApproval {
  id: string;
  orderId: string;
  userId: string;
  userName: string;
  role: CompanyUserRole;
  action: 'approved' | 'rejected' | 'pending';
  timestamp: string;
  comments?: string;
}

// Legacy approval record type for backward compatibility
export interface ApprovalRecord {
  userId: string;
  userName: string;
  role: CompanyUserRole;
  action: 'approved' | 'rejected' | 'pending';
  timestamp?: string;
  comments?: string;
}

// Legacy order approval type for backward compatibility
export interface LegacyOrderApproval {
  orderId: string;
  requestedBy: string;
  requestedAt: string;
  status: OrderApprovalStatus;
  approvers: ApprovalRecord[];
  orderTotal: number;
  orderSummary: string;
  notes?: string;
}

// Helper type guards
export const isCompanyUser = (user: User): user is CompanyUser => {
  return user.accountType === 'company';
};

export const isIndividualUser = (user: User): user is IndividualUser => {
  return user.accountType === 'individual';
};

// Default permissions by role
export const getDefaultPermissionsByRole = (
  role: CompanyUserRole
): UserPermissions => {
  switch (role) {
    case 'superadmin':
      return {
        canCreateOrders: true,
        canApproveOrders: true,
        canViewAllOrders: true,
        canManageUsers: true,
        canInviteUsers: true,
        canSetPermissions: true,
        canEditCompanyInfo: true,
        canManageBilling: true,
        canViewReports: true,
        canViewTradePrice: true,
        canAccessExclusiveProducts: true,
      };

    case 'manager':
      return {
        canCreateOrders: true,
        canApproveOrders: true,
        canViewAllOrders: true,
        canManageUsers: true,
        canInviteUsers: true,
        canSetPermissions: false,
        canEditCompanyInfo: false,
        canManageBilling: false,
        canViewReports: true,
        canViewTradePrice: true,
        canAccessExclusiveProducts: true,
      };

    case 'approver':
      return {
        canCreateOrders: false,
        canApproveOrders: true,
        canViewAllOrders: true,
        canManageUsers: false,
        canInviteUsers: false,
        canSetPermissions: false,
        canEditCompanyInfo: false,
        canManageBilling: false,
        canViewReports: false,
        canViewTradePrice: true,
        canAccessExclusiveProducts: false,
      };

    case 'staff':
      return {
        canCreateOrders: true,
        canApproveOrders: false,
        canViewAllOrders: false,
        orderLimit: 5000, // Default limit for staff
        canManageUsers: false,
        canInviteUsers: false,
        canSetPermissions: false,
        canEditCompanyInfo: false,
        canManageBilling: false,
        canViewReports: false,
        canViewTradePrice: true,
        canAccessExclusiveProducts: false,
      };
  }
};
