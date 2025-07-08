// Mock data for companies and users - Updated to match Supabase UUIDs

import { Company, CompanyUser, IndividualUser, OrderApproval, getDefaultPermissionsByRole } from '../types/user';

// Mock Companies - Using actual Supabase UUIDs
export const mockCompanies: Company[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'The Winery Tapas Bar',
    companyName: 'THE ORGANIC WINERY PTE. LTD.',
    uen: '201816133N',
    address: '30 Victoria Street #B1-05 Chijmes, Singapore 187996',
    phone: '+65 6338 9685',
    email: 'orders@thewinery.com.sg',
    logo: 'https://example.com/winery-logo.png',
    
    creditLimit: 50000,
    currentCredit: 35000,
    paymentTerms: 'NET30',
    
    approvalSettings: {
      requireApproval: true,
      approvalThreshold: 5000,
      multiLevelApproval: false,
      autoApproveBelow: 1000,
    },
    
    status: 'active',
    verifiedAt: '2023-01-15T08:00:00Z',
    createdAt: '2023-01-10T08:00:00Z',
    updatedAt: '2024-01-01T08:00:00Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Marina Bay Restaurant Group',
    companyName: 'MARINA BAY F&B PTE. LTD.',
    uen: '202012345G',
    address: '1 Marina Boulevard #01-01, Singapore 018989',
    phone: '+65 6888 8888',
    email: 'procurement@marinabaygroup.sg',
    
    creditLimit: 100000,
    currentCredit: 45000,
    paymentTerms: 'NET60',
    
    approvalSettings: {
      requireApproval: true,
      approvalThreshold: 10000,
      multiLevelApproval: true,
      autoApproveBelow: 2000,
    },
    
    status: 'active',
    verifiedAt: '2022-06-01T08:00:00Z',
    createdAt: '2022-05-15T08:00:00Z',
    updatedAt: '2024-01-01T08:00:00Z',
  },
];

// Mock Company Users - Using actual Supabase UUIDs
export const mockCompanyUsers: CompanyUser[] = [
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Mikael Chan',
    email: 'mikael@thewinery.com.sg',
    phone: '+65 96998961',
    accountType: 'company',
    companyId: '11111111-1111-1111-1111-111111111111',
    role: 'superadmin',
    position: 'Manager',
    department: 'Operations',
    permissions: getDefaultPermissionsByRole('superadmin'),
    profileImage: 'https://example.com/mikael-avatar.jpg',
    createdAt: '2023-01-10T08:00:00Z',
    joinedCompanyAt: '2023-01-10T08:00:00Z',
    lastLogin: '2024-01-20T14:30:00Z',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Sarah Lim',
    email: 'sarah@thewinery.com.sg',
    phone: '+65 91234567',
    accountType: 'company',
    companyId: '11111111-1111-1111-1111-111111111111',
    role: 'manager',
    position: 'Bar Manager',
    department: 'Bar Operations',
    permissions: getDefaultPermissionsByRole('manager'),
    createdAt: '2023-03-15T08:00:00Z',
    joinedCompanyAt: '2023-03-15T08:00:00Z',
    lastLogin: '2024-01-19T18:00:00Z',
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'John Tan',
    email: 'john@thewinery.com.sg',
    phone: '+65 98765432',
    accountType: 'company',
    companyId: '11111111-1111-1111-1111-111111111111',
    role: 'staff',
    position: 'Bartender',
    department: 'Bar Operations',
    permissions: {
      ...getDefaultPermissionsByRole('staff'),
      orderLimit: 3000, // Custom limit for this staff member
    },
    createdAt: '2023-06-01T08:00:00Z',
    joinedCompanyAt: '2023-06-01T08:00:00Z',
    lastLogin: '2024-01-20T10:00:00Z',
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    name: 'David Wong',
    email: 'david@marinabaygroup.sg',
    phone: '+65 92223333',
    accountType: 'company',
    companyId: '22222222-2222-2222-2222-222222222222',
    role: 'superadmin',
    position: 'Group Purchasing Manager',
    department: 'Procurement',
    permissions: getDefaultPermissionsByRole('superadmin'),
    createdAt: '2022-05-15T08:00:00Z',
    joinedCompanyAt: '2022-05-15T08:00:00Z',
    lastLogin: '2024-01-20T09:00:00Z',
  },
];

// Mock Individual Users - Using actual Supabase UUIDs
export const mockIndividualUsers: IndividualUser[] = [
  {
    id: '77777777-7777-7777-7777-777777777777',
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '+65 8123 4567',
    accountType: 'individual',
    memberSince: 'March 2023',
    totalOrders: 12,
    totalSpent: 3450.50,
    profileImage: 'https://example.com/jane-avatar.jpg',
    createdAt: '2023-03-01T08:00:00Z',
    lastLogin: '2024-01-20T15:00:00Z',
  },
  {
    id: '88888888-8888-8888-8888-888888888888',
    name: 'Alex Chen',
    email: 'alex.chen@gmail.com',
    phone: '+65 9876 5432',
    accountType: 'individual',
    memberSince: 'January 2024',
    totalOrders: 3,
    totalSpent: 890.00,
    createdAt: '2024-01-05T08:00:00Z',
    lastLogin: '2024-01-18T20:00:00Z',
  },
];

// Mock Order Approvals
export const mockOrderApprovals: OrderApproval[] = [
  {
    id: 'approval-1',
    orderId: 'order-123',
    userId: '33333333-3333-3333-3333-333333333333',
    userName: 'Mikael Chan',
    role: 'superadmin',
    action: 'pending',
    timestamp: '2024-01-20T09:00:00Z',
    comments: 'Awaiting approval for large order',
  },
  {
    id: 'approval-2',
    orderId: 'order-124',
    userId: '44444444-4444-4444-4444-444444444444',
    userName: 'Sarah Lim',
    role: 'manager',
    action: 'approved',
    timestamp: '2024-01-19T16:30:00Z',
    comments: 'Approved for regular stock replenishment',
  },
];

// Helper function to get company by ID
export const getCompanyById = (companyId: string): Company | undefined => {
  return mockCompanies.find(company => company.id === companyId);
};

// Helper function to get users by company
export const getUsersByCompany = (companyId: string): CompanyUser[] => {
  return mockCompanyUsers.filter(user => user.companyId === companyId);
};

// Helper function to get pending approvals for a user
export const getPendingApprovalsForUser = (userId: string): OrderApproval[] => {
  return mockOrderApprovals.filter(approval => 
    approval.userId === userId && approval.action === 'pending'
  );
};

// Current logged in user (for demo) - Using actual Supabase UUID
export const currentUser: CompanyUser = mockCompanyUsers[0]; // Mikael Chan

// All users combined
export const allUsers = [...mockCompanyUsers, ...mockIndividualUsers];

// Export for easy access
export {
  mockCompanies as companies,
  mockCompanyUsers as companyUsers,
  mockIndividualUsers as individualUsers,
  mockOrderApprovals as orderApprovals,
}; 