import { supabase, supabaseAdmin } from '../../utils/supabase';
import { createClient } from '@supabase/supabase-js';
import {
  User,
  Company,
  CompanyUser,
  IndividualUser,
  UserPermissions,
  CompanyUserRole,
  isCompanyUser,
} from '../types/user';
import { LocationSuggestion } from '../types/location';
import { Product } from '../utils/pricing';

// Helper function to generate Supabase Storage URL
const getSupabaseStorageUrl = (bucket: string, path: string): string => {
  return `https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/${bucket}/${path}`;
};

// Helper function to convert date strings to ISO format
const convertToISODate = (dateString: string): string => {
  try {
    // Handle different date formats
    if (dateString.includes(',')) {
      // Format like "Friday, July 11" - add current year if missing
      const currentYear = new Date().getFullYear();
      const parts = dateString.split(',').map(s => s.trim());

      if (parts.length === 2) {
        // "Friday, July 11" -> "July 11, 2025"
        const monthDay = parts[1].trim();
        const dateWithYear = `${monthDay}, ${currentYear}`;

        // Try a more explicit parsing approach
        const date = new Date(dateWithYear);
        if (!isNaN(date.getTime()) && date.getFullYear() === currentYear) {
          const isoDate = date.toISOString().split('T')[0];
          return isoDate;
        }
      }
    }

    // Try to parse as-is
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const isoDate = date.toISOString().split('T')[0];
      return isoDate;
    }

    // Fallback to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const fallbackDate = tomorrow.toISOString().split('T')[0];
    return fallbackDate;
  } catch (error) {
    // Fallback to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
};

// Order types
export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status:
    | 'pending'
    | 'confirmed'
    | 'preparing'
    | 'ready'
    | 'out_for_delivery'
    | 'delivered'
    | 'cancelled'
    | 'returned';
  total: number;
  items: OrderItem[];
  deliveryAddress: string;
  estimatedDelivery?: string;
}

// Database types that match our Supabase schema
interface DatabaseUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  account_type: 'individual' | 'company';
  company_id?: string;
  role?: CompanyUserRole;
  department?: string;
  position?: string;
  joined_company_at?: string;
  member_since?: string;
  total_orders?: number;
  total_spent?: number;
  profile_image?: string;
  wallet_balance?: number;
  points?: number;
  created_at: string;
  last_login?: string;
  updated_at: string;
}

interface DatabaseCompany {
  id: string;
  name: string;
  company_name: string;
  uen: string;
  address: string;
  phone?: string;
  email?: string;
  logo?: string;
  credit_limit?: number;
  current_credit?: number;
  payment_terms?: 'COD' | 'NET7' | 'NET30' | 'NET60';
  total_points?: number;
  points_earned_this_month?: number;
  points_redeemed_this_month?: number;
  require_approval?: boolean;
  approval_threshold?: number;
  multi_level_approval?: boolean;
  auto_approve_below?: number;
  status: 'active' | 'suspended' | 'pending_verification';
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

interface DatabaseUserPermissions {
  id: string;
  user_id: string;
  can_create_orders: boolean;
  can_approve_orders: boolean;
  can_view_all_orders: boolean;
  order_limit?: number;
  can_manage_users: boolean;
  can_invite_users: boolean;
  can_set_permissions: boolean;
  can_edit_company_info: boolean;
  can_manage_billing: boolean;
  can_view_reports: boolean;
  can_view_trade_price: boolean;
  can_access_exclusive_products: boolean;
  created_at: string;
  updated_at: string;
}

// Transformation functions
const transformDatabaseUserToUser = (
  dbUser: DatabaseUser,
  permissions?: DatabaseUserPermissions
): User => {
  const baseUser = {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    phone: dbUser.phone || '',
    accountType: dbUser.account_type,
    profileImage: dbUser.profile_image,
    walletBalance: dbUser.wallet_balance || 0,
    points: dbUser.points || 0,
    createdAt: dbUser.created_at,
    lastLogin: dbUser.last_login,
  };

  if (dbUser.account_type === 'company' && dbUser.company_id && dbUser.role) {
    const companyUser: CompanyUser = {
      ...baseUser,
      accountType: 'company',
      companyId: dbUser.company_id,
      role: dbUser.role,
      department: dbUser.department,
      position: dbUser.position,
      permissions: permissions
        ? transformDatabasePermissionsToPermissions(permissions)
        : {
            canCreateOrders: false,
            canApproveOrders: false,
            canViewAllOrders: false,
            canManageUsers: false,
            canInviteUsers: false,
            canSetPermissions: false,
            canEditCompanyInfo: false,
            canManageBilling: false,
            canViewReports: false,
            canViewTradePrice: false,
            canAccessExclusiveProducts: false,
          },
      joinedCompanyAt: dbUser.joined_company_at || dbUser.created_at,
    };
    return companyUser;
  } else {
    const individualUser: IndividualUser = {
      ...baseUser,
      accountType: 'individual',
      memberSince: dbUser.member_since || 'Unknown',
      totalOrders: dbUser.total_orders || 0,
      totalSpent: dbUser.total_spent || 0,
    };
    return individualUser;
  }
};

const transformDatabasePermissionsToPermissions = (
  dbPermissions: DatabaseUserPermissions
): UserPermissions => ({
  canCreateOrders: dbPermissions.can_create_orders,
  canApproveOrders: dbPermissions.can_approve_orders,
  canViewAllOrders: dbPermissions.can_view_all_orders,
  orderLimit: dbPermissions.order_limit,
  canManageUsers: dbPermissions.can_manage_users,
  canInviteUsers: dbPermissions.can_invite_users,
  canSetPermissions: dbPermissions.can_set_permissions,
  canEditCompanyInfo: dbPermissions.can_edit_company_info,
  canManageBilling: dbPermissions.can_manage_billing,
  canViewReports: dbPermissions.can_view_reports,
  canViewTradePrice: dbPermissions.can_view_trade_price,
  canAccessExclusiveProducts: dbPermissions.can_access_exclusive_products,
});

const transformDatabaseCompanyToCompany = (
  dbCompany: DatabaseCompany
): Company => ({
  id: dbCompany.id,
  name: dbCompany.name,
  companyName: dbCompany.company_name,
  uen: dbCompany.uen,
  address: dbCompany.address,
  phone: dbCompany.phone,
  email: dbCompany.email,
  logo: dbCompany.logo,
  creditLimit: dbCompany.credit_limit,
  currentCredit: dbCompany.current_credit,
  paymentTerms: dbCompany.payment_terms,
  totalPoints: dbCompany.total_points,
  pointsEarnedThisMonth: dbCompany.points_earned_this_month,
  pointsRedeemedThisMonth: dbCompany.points_redeemed_this_month,
  approvalSettings: {
    requireApproval: dbCompany.require_approval || false,
    approvalThreshold: dbCompany.approval_threshold,
    multiLevelApproval: dbCompany.multi_level_approval || false,
    autoApproveBelow: dbCompany.auto_approve_below,
  },
  status: dbCompany.status,
  verifiedAt: dbCompany.verified_at,
  createdAt: dbCompany.created_at,
  updatedAt: dbCompany.updated_at,
});

// Service functions
export const supabaseService = {
  // Expose the supabase client for direct access
  supabase,
  supabaseAdmin,

  // User operations
  async getCurrentUser(): Promise<User | null> {
    try {
      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        // Don't log "Auth session missing" as an error - it's normal when not signed in
        if (!error.message?.includes('Auth session missing')) {
          console.error('Error getting current auth user:', error);
        }
        return null;
      }

      if (!authUser) return null;

      const { data: dbUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (userError) throw userError;
      if (!dbUser) return null;

      // Get permissions if it's a company user
      let permissions: DatabaseUserPermissions | undefined;
      if (dbUser.account_type === 'company') {
        const { data: dbPermissions, error: permissionsError } = await supabase
          .from('user_permissions')
          .select('*')
          .eq('user_id', dbUser.id)
          .maybeSingle();

        if (!permissionsError && dbPermissions) {
          permissions = dbPermissions;
        }
      }

      return transformDatabaseUserToUser(dbUser, permissions);
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  },

  async getUserById(userId: string): Promise<User | null> {
    try {
      // Try with admin client first (bypasses RLS issues)
      try {
        const { data: adminUser, error: adminError } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (!adminError && adminUser) {
          // Get permissions for company users
          let permissions: DatabaseUserPermissions | undefined;
          if (adminUser.account_type === 'company') {
            const { data: dbPermissions } = await supabaseAdmin
              .from('user_permissions')
              .select('*')
              .eq('user_id', adminUser.id)
              .maybeSingle();

            if (dbPermissions) {
              permissions = dbPermissions;
            }
          }

          return transformDatabaseUserToUser(adminUser, permissions);
        }
      } catch (adminError) {
        // Admin query failed, will fallback to regular query
      }

      // Fallback to regular client with generous timeout
      const queryPromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error('Database query timeout after 15 seconds')),
          15000
        );
      });

      let { data: dbUser, error: userError } = (await Promise.race([
        queryPromise,
        timeoutPromise,
      ])) as any;

      if (userError) {
        console.error('❌ Supabase user query error:', userError);
        throw userError;
      }
      if (!dbUser) {
        // Try to find by email if this is Mikael's ID
        if (
          userId === '654ae924-3d69-40e2-83dc-1141aa3e4081' ||
          userId === '33333333-3333-3333-3333-333333333333'
        ) {
          const { data: emailUser, error: emailError } = await supabase
            .from('users')
            .select('*')
            .eq('email', 'mikael@thewinery.com.sg')
            .maybeSingle();

          if (!emailError && emailUser) {
            dbUser = emailUser;
          } else {
            return null;
          }
        } else {
          return null;
        }
      }

      // Get permissions if it's a company user
      let permissions: DatabaseUserPermissions | undefined;
      if (dbUser.account_type === 'company') {
        const { data: dbPermissions, error: permissionsError } = await supabase
          .from('user_permissions')
          .select('*')
          .eq('user_id', dbUser.id)
          .maybeSingle();

        if (!permissionsError && dbPermissions) {
          permissions = dbPermissions;
        }
      }

      const transformedUser = transformDatabaseUserToUser(dbUser, permissions);

      return transformedUser;
    } catch (error) {
      console.error('❌ Error in getUserById:', error);
      return null;
    }
  },

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      // Add timeout to prevent hanging
      const queryPromise = supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () =>
            reject(new Error('Database email query timeout after 5 seconds')),
          5000
        );
      });

      const { data: dbUser, error: userError } = (await Promise.race([
        queryPromise,
        timeoutPromise,
      ])) as any;

      if (userError) {
        console.error('❌ Supabase user email query error:', userError);
        throw userError;
      }
      if (!dbUser) {
        return null;
      }

      // Get permissions if it's a company user
      let permissions: DatabaseUserPermissions | undefined;
      if (dbUser.account_type === 'company') {
        const { data: dbPermissions, error: permissionsError } = await supabase
          .from('user_permissions')
          .select('*')
          .eq('user_id', dbUser.id)
          .maybeSingle();

        if (!permissionsError && dbPermissions) {
          permissions = dbPermissions;
        }
      }

      const transformedUser = transformDatabaseUserToUser(dbUser, permissions);

      return transformedUser;
    } catch (error) {
      console.error('❌ Error in getUserByEmail:', error);
      return null;
    }
  },

  async updateUser(
    userId: string,
    updates: Partial<User>
  ): Promise<User | null> {
    try {
      // Prepare database updates
      const dbUpdates: Partial<DatabaseUser> = {
        name: updates.name,
        email: updates.email,
        phone: updates.phone,
        profile_image: updates.profileImage,
        points: updates.points,
        updated_at: new Date().toISOString(),
      };

      // Update user
      const { data: dbUser, error: userError } = await supabase
        .from('users')
        .update(dbUpdates)
        .eq('id', userId)
        .select()
        .maybeSingle();

      if (userError) throw userError;

      // Update permissions if provided and user is a company user
      if (updates.accountType === 'company' && updates.permissions) {
        const permissionUpdates = {
          can_create_orders: updates.permissions.canCreateOrders,
          can_approve_orders: updates.permissions.canApproveOrders,
          can_view_all_orders: updates.permissions.canViewAllOrders,
          order_limit: updates.permissions.orderLimit,
          can_manage_users: updates.permissions.canManageUsers,
          can_invite_users: updates.permissions.canInviteUsers,
          can_set_permissions: updates.permissions.canSetPermissions,
          can_edit_company_info: updates.permissions.canEditCompanyInfo,
          can_manage_billing: updates.permissions.canManageBilling,
          can_view_reports: updates.permissions.canViewReports,
          can_view_trade_price: updates.permissions.canViewTradePrice,
          can_access_exclusive_products:
            updates.permissions.canAccessExclusiveProducts,
          updated_at: new Date().toISOString(),
        };

        await supabase
          .from('user_permissions')
          .update(permissionUpdates)
          .eq('user_id', userId);
      }

      return this.getUserById(userId);
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  },

  // Company operations
  async getCompanyById(companyId: string): Promise<Company | null> {
    try {
      const { data: dbCompany, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .maybeSingle();

      if (error) throw error;
      if (!dbCompany) return null;

      return transformDatabaseCompanyToCompany(dbCompany);
    } catch (error) {
      console.error('Error fetching company:', error);
      return null;
    }
  },

  async getCompanyTeamMembers(companyId: string): Promise<CompanyUser[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(
          `
          *,
          user_permissions (*)
        `
        )
        .eq('company_id', companyId)
        .eq('account_type', 'company');

      if (error) {
        console.error('Error fetching team members:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Transform each user to CompanyUser format
      const teamMembers: CompanyUser[] = [];
      for (const dbUser of data) {
        try {
          const permissions = dbUser.user_permissions?.[0];
          const transformedUser = transformDatabaseUserToUser(
            dbUser,
            permissions
          );
          if (transformedUser && transformedUser.accountType === 'company') {
            teamMembers.push(transformedUser as CompanyUser);
          }
        } catch (transformError) {
          console.error('Error transforming team member:', transformError);
          console.error('Raw dbUser data:', dbUser);
        }
      }

      return teamMembers;
    } catch (error) {
      console.error('Error in getCompanyTeamMembers:', error);
      return [];
    }
  },

  async updateCompany(
    companyId: string,
    updates: Partial<Company>
  ): Promise<Company | null> {
    try {
      const dbUpdates: Partial<DatabaseCompany> = {
        name: updates.name,
        company_name: updates.companyName,
        uen: updates.uen,
        address: updates.address,
        phone: updates.phone,
        email: updates.email,
        logo: updates.logo,
        credit_limit: updates.creditLimit,
        current_credit: updates.currentCredit,
        payment_terms: updates.paymentTerms,
        require_approval: updates.approvalSettings?.requireApproval,
        approval_threshold: updates.approvalSettings?.approvalThreshold,
        multi_level_approval: updates.approvalSettings?.multiLevelApproval,
        auto_approve_below: updates.approvalSettings?.autoApproveBelow,
        status: updates.status,
        updated_at: new Date().toISOString(),
      };

      const { data: dbCompany, error } = await supabase
        .from('companies')
        .update(dbUpdates)
        .eq('id', companyId)
        .select()
        .maybeSingle();

      if (error) throw error;

      return transformDatabaseCompanyToCompany(dbCompany);
    } catch (error) {
      console.error('Error updating company:', error);
      return null;
    }
  },

  async updateCompanyStats(
    companyId: string,
    stats: { totalOrders?: number; totalSpent?: number; pointsEarned?: number }
  ): Promise<boolean> {
    try {
      // Get current company data
      const { data: currentCompany, error: fetchError } = await supabase
        .from('companies')
        .select('current_credit, credit_limit')
        .eq('id', companyId)
        .single();

      if (fetchError || !currentCompany) {
        console.error('Error fetching company for stats update:', fetchError);
        return false;
      }

      // Calculate new credit (deduct purchase amount from available credit)
      const currentCredit = currentCompany.current_credit || 0;
      const newCredit = currentCredit - (stats.totalSpent || 0);

      // Update company with new credit balance
      const { error: updateError } = await supabase
        .from('companies')
        .update({
          current_credit: newCredit,
          updated_at: new Date().toISOString(),
        })
        .eq('id', companyId);

      if (updateError) {
        console.error('Error updating company credit:', updateError);
        return false;
      }

      // TODO: In a full implementation, you'd also:
      // 1. Add a company_rewards table to track points/rewards
      // 2. Add a company_purchases table to track all staff purchases
      // 3. Update company tier based on total spending

      return true;
    } catch (error) {
      console.error('Error updating company stats:', error);
      return false;
    }
  },

  async getCompanyUsers(companyId: string): Promise<CompanyUser[]> {
    try {
      const { data: dbUsers, error: usersError } = await supabase
        .from('users')
        .select(
          `
          *,
          user_permissions (*)
        `
        )
        .eq('company_id', companyId)
        .eq('account_type', 'company');

      if (usersError) throw usersError;

      return dbUsers.map(dbUser => {
        const permissions = dbUser.user_permissions?.[0];
        return transformDatabaseUserToUser(dbUser, permissions) as CompanyUser;
      });
    } catch (error) {
      console.error('Error fetching company users:', error);
      return [];
    }
  },

  // Check current authentication status
  async getCurrentAuthUser(): Promise<any> {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        // Don't log "Auth session missing" as an error - it's normal when not signed in
        if (!error.message?.includes('Auth session missing')) {
          console.error('Error getting current auth user:', error);
        }
        return null;
      }

      return user;
    } catch (error) {
      // Don't log auth session missing errors
      if (!error.message?.includes('Auth session missing')) {
        console.error('Error getting current auth user:', error);
      }
      return null;
    }
  },

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentAuthUser();
    return user !== null;
  },

  // Authentication operations
  async signUp(
    email: string,
    password: string,
    userData: Partial<User>
  ): Promise<User | null> {
    try {
      console.log(
        '🔐 Starting signup process for:',
        email,
        'as',
        userData.accountType
      );

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name || '',
            account_type: userData.accountType || 'individual',
            phone: userData.phone || '',
            role: userData.role || null,
          },
        },
      });

      if (authError) {
        console.error('❌ Auth signup error:', authError);
        throw authError;
      }
      if (!authData.user) {
        console.error('❌ No user returned from auth signup');
        return null;
      }

      console.log('✅ Auth user created:', authData.user.id);

      // Handle company account creation
      if (userData.accountType === 'company') {
        console.log('🏢 Creating company account for first user (admin)');

        // Generate company ID - simple UUID generator for React Native
        const companyId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });

        // Create company record first
        const companyData: Partial<DatabaseCompany> = {
          id: companyId,
          name: `${userData.name}'s Company`, // Default name, can be updated later
          company_name: `${userData.name}'s Company`,
          uen: '', // Will be filled during company setup
          address: '',
          phone: userData.phone,
          email: email,
          status: 'pending_verification',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: companyError } = await supabase
          .from('companies')
          .insert([companyData]);

        if (companyError) {
          console.error('❌ Error creating company:', companyError);
          throw companyError;
        }

        console.log('✅ Company created:', companyId);

        // Create user profile with company admin role
        const userProfileData: Partial<DatabaseUser> = {
          id: authData.user.id,
          name: userData.name || '',
          email: email,
          phone: userData.phone || '',
          account_type: 'company',
          company_id: companyId,
          role: 'admin', // First user is always admin
          department: 'Management',
          position: 'Company Administrator',
          joined_company_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: userError } = await supabase
          .from('users')
          .insert([userProfileData]);

        if (userError) {
          console.error('❌ Error creating user profile:', userError);
          throw userError;
        }

        console.log('✅ Company admin user profile created');

        // Create admin permissions
        const permissionsData: Partial<DatabaseUserPermissions> = {
          user_id: authData.user.id,
          can_create_orders: true,
          can_approve_orders: true,
          can_view_all_orders: true,
          can_manage_users: true,
          can_invite_users: true,
          can_set_permissions: true,
          can_edit_company_info: true,
          can_manage_billing: true,
          can_view_reports: true,
          can_view_trade_price: true,
          can_access_exclusive_products: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: permissionsError } = await supabase
          .from('user_permissions')
          .insert([permissionsData]);

        if (permissionsError) {
          console.error(
            '❌ Error creating admin permissions:',
            permissionsError
          );
          throw permissionsError;
        }

        console.log('✅ Admin permissions created');
      } else {
        // Individual account
        console.log('👤 Creating individual account');

        const userProfileData: Partial<DatabaseUser> = {
          id: authData.user.id,
          name: userData.name || '',
          email: email,
          phone: userData.phone || '',
          account_type: 'individual',
          member_since: new Date().toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          }),
          total_orders: 0,
          total_spent: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: userError } = await supabase
          .from('users')
          .insert([userProfileData]);

        if (userError) {
          console.error(
            '❌ Error creating individual user profile:',
            userError
          );
          throw userError;
        }

        console.log('✅ Individual user profile created');
      }

      return this.getUserById(authData.user.id);
    } catch (error) {
      console.error('❌ Error signing up user:', error);
      return null;
    }
  },

  // Sign up with company invitation
  async signUpWithCompanyInvite(
    email: string,
    password: string,
    inviteData: {
      companyId: string;
      role: CompanyUserRole;
      department?: string;
      position?: string;
      name: string;
    }
  ): Promise<User | null> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: inviteData.name,
            account_type: 'company',
            company_id: inviteData.companyId,
            role: inviteData.role,
            department: inviteData.department,
            position: inviteData.position,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) return null;

      return this.getUserById(authData.user.id);
    } catch (error) {
      console.error('Error signing up user with company invite:', error);
      return null;
    }
  },

  async signIn(email: string, password: string): Promise<User | null> {
    try {
      console.log('🔐 Attempting Supabase Auth sign in for:', email);

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        console.error('❌ Supabase auth error:', authError);
        throw authError;
      }
      if (!authData.user) {
        console.error('❌ No user returned from auth');
        return null;
      }

      console.log('✅ Supabase Auth successful for:', authData.user.id);

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', authData.user.id);

      console.log('✅ Last login updated');

      const user = await this.getUserById(authData.user.id);
      console.log('✅ User profile loaded:', user?.name);

      return user;
    } catch (error) {
      console.error('❌ Error signing in user:', error);
      throw error; // Re-throw to let calling code handle it
    }
  },

  // Password reset
  async resetPassword(email: string): Promise<boolean> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'easiapp://reset-password', // Deep link for mobile app
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  },

  // Update password
  async updatePassword(newPassword: string): Promise<boolean> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating password:', error);
      return false;
    }
  },

  // Social sign in (Google, Apple, etc.)
  async signInWithProvider(
    provider: 'google' | 'apple' | 'github'
  ): Promise<any> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: 'easiapp://auth/callback', // Deep link for mobile app
        },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error);
      return null;
    }
  },

  async signOut(): Promise<boolean> {
    try {
      console.log('🔄 Starting Supabase auth signOut...');

      // Try global scope first for complete sign out
      try {
        const { error } = await supabase.auth.signOut({ scope: 'global' });
        if (error) throw error;
        console.log('✅ Global signOut successful');
        return true;
      } catch (globalError) {
        console.log('⚠️ Global signOut failed, trying local:', globalError);

        // Fallback to local scope
        const { error } = await supabase.auth.signOut({ scope: 'local' });
        if (error) throw error;
        console.log('✅ Local signOut successful');
        return true;
      }
    } catch (error) {
      console.error('❌ Error in signOut service:', error);
      return false;
    }
  },

  // Utility functions
  async uploadProfileImage(
    userId: string,
    imageFile: File | Blob,
    fileName?: string
  ): Promise<string | null> {
    try {
      const fileExt = fileName?.split('.').pop() || 'jpg';
      const uniqueFileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `profile-images/${uniqueFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('profile-images').getPublicUrl(filePath);

      // Update user profile with new image URL
      await this.updateUser(userId, {
        profileImage: publicUrl,
      } as Partial<User>);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      return null;
    }
  },

  // Products operations
  async getProducts(filters?: {
    category?: string;
    featured?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Product[]> {
    try {
      let query = supabase.from('products').select('*');

      // Don't add is_active filter since the column doesn't exist in the current database
      // When the database is properly set up, uncomment: query = query.eq('is_active', true);

      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      if (filters?.featured) {
        query = query.eq('is_featured', true);
      }

      if (filters?.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(
          filters.offset,
          filters.offset + (filters.limit || 50) - 1
        );
      }

      query = query.order('created_at', { ascending: false });

      const { data: products, error } = await query;

      if (error) throw error;

      // Transform database products to app Product format
      return products.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.retail_price,
        originalPrice: p.original_price,
        category: p.category,
        imageUrl: p.image_url
          ? p.image_url.startsWith('http')
            ? p.image_url
            : getSupabaseStorageUrl('product-images', p.image_url)
          : null,
        retailPrice: p.retail_price,
        tradePrice: p.trade_price,
        rating: p.rating,
        volume: p.volume,
        alcoholContent: p.alcohol_content,
        countryOfOrigin: p.country_of_origin,
        isLimited: p.is_limited,
        isFeatured: p.is_featured,
        sku: p.sku,
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  async getProductById(productId: string): Promise<Product | null> {
    try {
      let query = supabase.from('products').select('*').eq('id', productId);

      // Don't add is_active filter since the column doesn't exist in the current database
      // When the database is properly set up, uncomment: query = query.eq('is_active', true);

      const { data: product, error } = await query.maybeSingle();

      if (error) throw error;
      if (!product) return null;

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.retail_price,
        originalPrice: product.original_price,
        category: product.category,
        imageUrl: product.image_url,
        retailPrice: product.retail_price,
        tradePrice: product.trade_price,
        rating: product.rating,
        volume: product.volume,
        alcoholContent: product.alcohol_content,
        countryOfOrigin: product.country_of_origin,
        isLimited: product.is_limited,
        isFeatured: product.is_featured,
        sku: product.sku,
      };
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  },

  // Team Management operations
  async inviteTeamMember(
    companyId: string,
    email: string,
    role: CompanyUserRole,
    department?: string,
    position?: string
  ): Promise<CompanyUser | null> {
    try {
      console.log('🔍 Inviting team member:', {
        companyId,
        email,
        role,
        department,
        position,
      });

      // In a real app, you'd send an email invitation and create a pending user
      // For now, we'll create the user directly
      const newUserId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });

      const dbUser: Partial<DatabaseUser> = {
        id: newUserId,
        name: email.split('@')[0], // Temporary name from email
        email,
        account_type: 'company',
        company_id: companyId,
        role,
        department,
        position,
        joined_company_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('📊 Inserting user data:', dbUser);

      const { data: insertedUser, error: userError } = await supabase
        .from('users')
        .insert([dbUser])
        .select()
        .maybeSingle();

      if (userError) {
        console.error('❌ Error inserting user:', userError);
        throw userError;
      }

      console.log('✅ Successfully inserted user:', insertedUser);

      const newMember = (await this.getUserById(newUserId)) as CompanyUser;
      console.log('✅ Retrieved new member:', newMember);

      return newMember;
    } catch (error) {
      console.error('❌ Error inviting team member:', error);
      return null;
    }
  },

  async updateTeamMember(
    userId: string,
    updates: {
      name?: string;
      email?: string;
      role?: CompanyUserRole;
      department?: string;
      position?: string;
      permissions?: Partial<UserPermissions>;
    }
  ): Promise<CompanyUser | null> {
    try {
      // Update user basic info
      const userUpdates: Partial<DatabaseUser> = {
        name: updates.name,
        email: updates.email,
        role: updates.role,
        department: updates.department,
        position: updates.position,
        updated_at: new Date().toISOString(),
      };

      const { error: userError } = await supabase
        .from('users')
        .update(userUpdates)
        .eq('id', userId);

      if (userError) throw userError;

      // Update permissions if provided
      if (updates.permissions) {
        const permissionUpdates = {
          can_create_orders: updates.permissions.canCreateOrders,
          can_approve_orders: updates.permissions.canApproveOrders,
          can_view_all_orders: updates.permissions.canViewAllOrders,
          order_limit: updates.permissions.orderLimit,
          can_manage_users: updates.permissions.canManageUsers,
          can_invite_users: updates.permissions.canInviteUsers,
          can_set_permissions: updates.permissions.canSetPermissions,
          can_edit_company_info: updates.permissions.canEditCompanyInfo,
          can_manage_billing: updates.permissions.canManageBilling,
          can_view_reports: updates.permissions.canViewReports,
          can_view_trade_price: updates.permissions.canViewTradePrice,
          can_access_exclusive_products:
            updates.permissions.canAccessExclusiveProducts,
          updated_at: new Date().toISOString(),
        };

        const { error: permissionsError } = await supabase
          .from('user_permissions')
          .update(permissionUpdates)
          .eq('user_id', userId);

        if (permissionsError) throw permissionsError;
      }

      return this.getUserById(userId) as Promise<CompanyUser>;
    } catch (error) {
      console.error('Error updating team member:', error);
      return null;
    }
  },

  async removeTeamMember(userId: string): Promise<boolean> {
    try {
      console.log('🗑️ Removing team member:', userId);

      const { data, error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)
        .select();

      if (error) {
        console.error('❌ Error removing team member:', error);
        throw error;
      }

      console.log('✅ Successfully removed team member:', data);

      // Check if any rows were actually deleted
      if (!data || data.length === 0) {
        console.warn(
          '⚠️ No rows were deleted - this might be due to RLS policies or the user not existing'
        );
        throw new Error(
          'No rows were deleted. User may not exist or you may not have permission to delete this user.'
        );
      }

      return true;
    } catch (error) {
      console.error('❌ Error removing team member:', error);
      return false;
    }
  },

  async getTeamMembersByCompany(companyId: string): Promise<CompanyUser[]> {
    try {
      console.log('🔍 Fetching team members for company:', companyId);

      const { data: dbUsers, error: usersError } = await supabase
        .from('users')
        .select(
          `
          *,
          user_permissions (*)
        `
        )
        .eq('company_id', companyId)
        .eq('account_type', 'company')
        .order('created_at', { ascending: true });

      if (usersError) {
        console.error('❌ Error fetching team members:', usersError);
        throw usersError;
      }

      console.log(
        '📊 Raw team members from DB:',
        dbUsers?.length || 0,
        'users'
      );

      const transformedUsers = dbUsers.map(dbUser => {
        const permissions = dbUser.user_permissions?.[0];
        const transformed = transformDatabaseUserToUser(
          dbUser,
          permissions
        ) as CompanyUser;
        console.log('🔄 Transformed user:', transformed.name, transformed.id);
        return transformed;
      });

      console.log('✅ Returning', transformedUsers.length, 'team members');
      return transformedUsers;
    } catch (error) {
      console.error('❌ Error fetching team members:', error);
      return [];
    }
  },

  // Demo authentication method for testing
  async demoAuthentication(
    userType: 'individual' | 'company_admin' | 'company_staff' = 'individual'
  ): Promise<User | null> {
    try {
      console.log('🎭 Demo authentication for user type:', userType);

      // Create a demo user based on type
      let demoUser: User;

      if (userType === 'individual') {
        demoUser = {
          id: 'demo-individual-user',
          name: 'Demo Individual User',
          email: 'demo@individual.com',
          phone: '+65 9123 4567',
          accountType: 'individual',
          profileImage: null,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          memberSince: 'January 2024',
          totalOrders: 5,
          totalSpent: 1250.5,
        } as IndividualUser;
      } else {
        demoUser = {
          id:
            userType === 'company_admin'
              ? 'demo-company-admin'
              : 'demo-company-staff',
          name:
            userType === 'company_admin'
              ? 'Demo Company Admin'
              : 'Demo Company Staff',
          email:
            userType === 'company_admin'
              ? 'admin@company.com'
              : 'staff@company.com',
          phone: '+65 9123 4567',
          accountType: 'company',
          companyId: '11111111-1111-1111-1111-111111111111',
          role: userType === 'company_admin' ? 'admin' : 'staff',
          department: 'Operations',
          position: userType === 'company_admin' ? 'Admin' : 'Staff Member',
          permissions: {
            canCreateOrders: true,
            canApproveOrders: userType === 'company_admin',
            canViewAllOrders: userType === 'company_admin',
            canManageUsers: userType === 'company_admin',
            canInviteUsers: userType === 'company_admin',
            canSetPermissions: userType === 'company_admin',
            canEditCompanyInfo: userType === 'company_admin',
            canManageBilling: userType === 'company_admin',
            canViewReports: userType === 'company_admin',
            canViewTradePrice: true,
            canAccessExclusiveProducts: true,
            orderLimit: userType === 'company_admin' ? undefined : 5000,
          },
          joinedCompanyAt: new Date().toISOString(),
          profileImage: null,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        } as CompanyUser;
      }

      console.log('✅ Demo authentication successful:', demoUser);
      return demoUser;
    } catch (error) {
      console.error('❌ Demo authentication failed:', error);
      return null;
    }
  },

  // Real-time subscriptions using Supabase Realtime
  subscribeToUserChanges(
    userId: string,
    callback: (user: User | null) => void
  ) {
    console.log('🔔 Setting up user changes subscription for:', userId);
    return supabase
      .channel(`user-changes-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`,
        },
        async payload => {
          console.log('👤 User data changed:', payload);
          const user = await this.getUserById(userId);
          callback(user);
        }
      )
      .subscribe(status => {
        console.log('🔔 User subscription status:', status);
      });
  },

  subscribeToCompanyChanges(
    companyId: string,
    callback: (company: Company | null) => void
  ) {
    console.log('🔔 Setting up company changes subscription for:', companyId);
    return supabase
      .channel(`company-changes-${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'companies',
          filter: `id=eq.${companyId}`,
        },
        async payload => {
          console.log('🏢 Company data changed:', payload);
          const company = await this.getCompanyById(companyId);
          callback(company);
        }
      )
      .subscribe(status => {
        console.log('🔔 Company subscription status:', status);
      });
  },

  // Real-time order subscriptions
  subscribeToUserOrders(userId: string, callback: (orders: Order[]) => void) {
    console.log('🔔 Setting up orders subscription for user:', userId);
    return supabase
      .channel(`orders-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${userId}`,
        },
        async payload => {
          console.log('📦 Order data changed:', payload);
          const orders = await this.getUserOrders(userId);
          callback(orders);
        }
      )
      .subscribe(status => {
        console.log('🔔 Orders subscription status:', status);
      });
  },

  // Real-time order status updates
  subscribeToOrderStatusChanges(
    orderId: string,
    callback: (order: Order | null) => void
  ) {
    console.log('🔔 Setting up order status subscription for:', orderId);
    return supabase
      .channel(`order-status-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        async payload => {
          console.log('📦 Order status changed:', payload);
          const order = await this.getOrderById(orderId);
          callback(order);
        }
      )
      .subscribe(status => {
        console.log('🔔 Order status subscription status:', status);
      });
  },

  // Subscribe to all order changes for real-time updates
  subscribeToAllOrderChanges(callback: (payload: any) => void) {
    console.log('🔔 Setting up global order changes subscription');
    return supabase
      .channel('all-order-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        payload => {
          console.log('📦 Global order change:', payload);
          callback(payload);
        }
      )
      .subscribe(status => {
        console.log('🔔 Global orders subscription status:', status);
      });
  },

  // Upload profile image from React Native URI
  async uploadProfileImageFromUri(
    userId: string,
    imageUri: string,
    fileName?: string
  ): Promise<string | null> {
    try {
      console.log('📸 Starting profile image upload for user:', userId);

      // Create a unique file name
      const fileExt = fileName?.split('.').pop() || 'jpg';
      const uniqueFileName = `${userId}-${Date.now()}.${fileExt}`;

      // Read the image file as array buffer for React Native
      const response = await fetch(imageUri);
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      console.log('📁 Image data created, size:', uint8Array.length, 'bytes');

      // Create service role client for storage upload (bypasses RLS)
      const serviceRoleClient = createClient(
        'https://vqxnkxaeriizizfmqvua.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeG5reGFlcmlpeml6Zm1xdnVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjAwMzM4MiwiZXhwIjoyMDY3NTc5MzgyfQ.y7sQCIqVduJ7Le3IkEGR-wSoOhppjRjqsC6GvEJAZEw',
        {
          auth: { autoRefreshToken: false, persistSession: false },
        }
      );

      const storageClient = serviceRoleClient.storage;

      const { data, error } = await storageClient
        .from('profile-images')
        .upload(uniqueFileName, uint8Array, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg',
        });

      if (error) {
        console.error('❌ Upload error:', error);

        // If bucket doesn't exist, provide helpful error message
        if (error.message.includes('Bucket not found')) {
          console.error(
            '💡 The profile-images bucket needs to be created in Supabase Dashboard'
          );
          console.error(
            '   Go to Storage > Create Bucket > Name: profile-images > Public: true'
          );
        }

        throw error;
      }

      console.log('✅ Upload successful:', data.path);

      // Get the public URL
      const {
        data: { publicUrl },
      } = serviceRoleClient.storage
        .from('profile-images')
        .getPublicUrl(uniqueFileName);

      console.log('🔗 Public URL generated:', publicUrl);
      console.log('🔗 File name uploaded:', uniqueFileName);

      // Test if the URL is accessible
      try {
        const testResponse = await fetch(publicUrl, { method: 'HEAD' });
        console.log(
          '🔗 URL accessibility test:',
          testResponse.status,
          testResponse.statusText
        );
      } catch (urlError) {
        console.error('❌ URL not accessible:', urlError);
      }

      // Update user profile with new image URL in database
      await this.updateUser(userId, {
        profileImage: publicUrl,
      } as Partial<User>);

      return publicUrl;
    } catch (error) {
      console.error('❌ Error uploading profile image:', error);
      return null;
    }
  },

  // Seed company data to Supabase
  async seedCompanyData(company: Company): Promise<boolean> {
    try {
      console.log('🌱 Seeding company data to Supabase:', company.name);

      // Transform company data to database format
      const companyData: Partial<DatabaseCompany> = {
        id: company.id,
        name: company.name,
        company_name: company.companyName,
        uen: company.uen,
        address: company.address,
        phone: company.phone,
        email: company.email,
        logo: company.logo,
        credit_limit: company.creditLimit,
        current_credit: company.currentCredit,
        payment_terms: company.paymentTerms,
        require_approval: company.approvalSettings?.requireApproval,
        approval_threshold: company.approvalSettings?.approvalThreshold,
        multi_level_approval: company.approvalSettings?.multiLevelApproval,
        auto_approve_below: company.approvalSettings?.autoApproveBelow,
        status: company.status,
        verified_at: company.verifiedAt,
        created_at: company.createdAt,
        updated_at: company.updatedAt,
      };

      // Insert or update company
      const { error } = await supabase
        .from('companies')
        .upsert([companyData], { onConflict: 'id' });

      if (error) {
        console.error('❌ Error seeding company:', error);
        return false;
      }

      console.log('✅ Company seeded successfully:', company.name);
      return true;
    } catch (error) {
      console.error('❌ Error seeding company data:', error);
      return false;
    }
  },

  // Seed user data to Supabase
  async seedUserData(user: User): Promise<boolean> {
    try {
      console.log('🌱 Seeding user data to Supabase:', user.name);

      // Transform user data to database format
      const userData: Partial<DatabaseUser> = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        account_type: user.accountType,
        company_id: user.companyId,
        role: isCompanyUser(user) ? user.role : undefined,
        department: isCompanyUser(user) ? user.department : undefined,
        position: isCompanyUser(user) ? user.position : undefined,
        joined_company_at: isCompanyUser(user)
          ? user.joinedCompanyAt
          : undefined,
        member_since:
          user.accountType === 'individual'
            ? (user as any).memberSince
            : undefined,
        total_orders: user.totalOrders,
        total_spent: user.totalSpent,
        profile_image: user.profileImage,
        created_at: user.createdAt,
        last_login: user.lastLogin,
        updated_at: new Date().toISOString(),
      };

      // Insert or update user
      const { error: userError } = await supabase
        .from('users')
        .upsert([userData], { onConflict: 'id' });

      if (userError) {
        console.error('❌ Error seeding user:', userError);
        return false;
      }

      // If company user, also seed permissions
      if (isCompanyUser(user) && user.permissions) {
        const permissionsData = {
          user_id: user.id,
          can_place_orders: user.permissions.canPlaceOrders,
          can_view_analytics: user.permissions.canViewAnalytics,
          can_manage_team: user.permissions.canManageTeam,
          can_approve_orders: user.permissions.canApproveOrders,
          can_view_trade_price: user.permissions.canViewTradePrice,
          can_access_exclusive_products:
            user.permissions.canAccessExclusiveProducts,
          order_limit: user.permissions.orderLimit,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: permError } = await supabase
          .from('user_permissions')
          .upsert([permissionsData], { onConflict: 'user_id' });

        if (permError) {
          console.error('❌ Error seeding user permissions:', permError);
          return false;
        }
      }

      console.log('✅ User seeded successfully:', user.name);
      return true;
    } catch (error) {
      console.error('❌ Error seeding user data:', error);
      return false;
    }
  },

  // Seed all mock data
  async seedMockData(): Promise<boolean> {
    console.log('❌ Mock data seeding disabled - use live authentication only');
    return false;
  },

  // Award points for completed orders
  async awardPointsForOrder(
    userId: string,
    orderTotal: number,
    orderId: string
  ): Promise<{ currentPoints: number; lifetimePoints: number; pointsEarned: number } | null> {
    try {
      // Calculate points earned (2 points per dollar)
      const pointsEarned = Math.floor(orderTotal * 2);

      console.log(`🎯 Awarding ${pointsEarned} points for order ${orderId}`);

      // Get current user points
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('points, lifetime_points')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        console.error('❌ Error fetching user for points update:', userError);
        return;
      }

      const newPoints = (user.points || 0) + pointsEarned;
      const newLifetimePoints = (user.lifetime_points || 0) + pointsEarned;

      // Update user points
      const { error: updateError } = await supabase
        .from('users')
        .update({
          points: newPoints,
          lifetime_points: newLifetimePoints,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        console.error('❌ Error updating user points:', updateError);
        return;
      }

      // Log the points transaction to audit trail
      // TODO: Create points_audit table in database migration
      // const { error: auditError } = await supabase.from('points_audit').insert([
      //   {
      //     user_id: userId,
      //     company_id: null, // Individual order
      //     transaction_type: 'earned_purchase',
      //     points_amount: pointsEarned,
      //     points_balance_before: user.points || 0,
      //     points_balance_after: newPoints,
      //     reference_id: orderId,
      //     reference_type: 'order',
      //     description: `Points earned from order purchase ($${orderTotal})`,
      //     metadata: {
      //       order_total: orderTotal,
      //       points_earned: pointsEarned,
      //       rate: '2 points per dollar',
      //     },
      //     created_at: new Date().toISOString(),
      //   },
      // ]);

      // if (auditError) {
      //   console.error('❌ Error logging points audit:', auditError);
      // }

      console.log(
        `✅ Points awarded: ${pointsEarned} points (${user.points || 0} → ${newPoints})`
      );

      // Return the updated points so the caller can update the AppContext
      return {
        currentPoints: newPoints,
        lifetimePoints: newLifetimePoints,
        pointsEarned: pointsEarned,
      };
    } catch (error) {
      console.error('❌ Error awarding points:', error);
      return null;
    }
  },

  // Order operations
  async createOrder(orderData: {
    userId: string;
    companyId?: string;
    items: any[];
    deliveryAddress: string;
    deliverySlot?: any;
    paymentMethod?: any;
    subtotal: number;
    gst: number;
    deliveryFee: number;
    total: number;
  }): Promise<{ 
    orderId: string; 
    orderNumber: string; 
    pointsAwarded: { currentPoints: number; lifetimePoints: number; pointsEarned: number } | null 
  } | null> {
    try {
      console.log('🛒 Creating order for user:', orderData.userId);

      // Check if user is authenticated
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ User not authenticated - cannot create order');
        throw new Error('Authentication required to create orders');
      }

      console.log('✅ User authenticated, creating order...');
      console.log('📋 Order data received:', JSON.stringify(orderData, null, 2));

      // Generate order number
      const currentYear = new Date().getFullYear();
      const orderNumber = `ORD-${currentYear}-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`;

      // Determine payment method and status based on order type
      let paymentMethod = 'credit_card';
      let paymentStatus = 'pending';
      let isCompanyCredit = false;

      // Check if this is a company credit order (company paying with credit terms)
      if (
        orderData.companyId &&
        orderData.paymentMethod &&
        ['COD', 'NET7', 'NET30', 'NET60'].includes(orderData.paymentMethod.type)
      ) {
        // Company credit order - use company's payment terms
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('payment_terms')
          .eq('id', orderData.companyId)
          .single();

        if (company && !companyError) {
          paymentMethod =
            orderData.paymentMethod.type || company.payment_terms || 'NET30';
          paymentStatus = 'paid'; // Company orders are automatically "paid" via credit
          isCompanyCredit = true;
          console.log(
            `🏢 Company credit order - using payment terms: ${paymentMethod}`
          );
        }
      } else {
        // Individual order or company user paying with personal payment method
        paymentMethod = orderData.paymentMethod?.type || 'credit_card';
        paymentStatus = 'pending';
        isCompanyCredit = false;
        console.log(
          `👤 Individual/personal payment - using payment method: ${paymentMethod}`
        );
      }

      // Create order
      const orderInsert = {
        user_id: session.user.id, // Use authenticated user's ID instead of passed userId
        company_id: orderData.companyId || null,
        order_number: orderNumber,
        status: 'pending',
        order_type: orderData.companyId ? 'company' : 'standard',
        subtotal: orderData.subtotal,
        gst: orderData.gst,
        delivery_fee: orderData.deliveryFee,
        total: orderData.total,
        currency: 'SGD',
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        approval_status: orderData.companyId ? 'pending' : 'not_required',
        delivery_address: JSON.stringify(orderData.deliveryAddress), // Store as JSONB
        delivery_date: orderData.deliverySlot?.date
          ? convertToISODate(orderData.deliverySlot.date)
          : null,
        delivery_time_slot: orderData.deliverySlot?.timeSlot || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('📝 Order insert data:', JSON.stringify(orderInsert, null, 2));

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderInsert])
        .select()
        .single();

      if (orderError || !order) {
        console.error('❌ Error creating order:', orderError);
        throw orderError || new Error('Order creation failed - no data returned');
      }

      console.log('✅ Order created:', order.id);

      // Create order items
      const orderItems = await Promise.all(
        orderData.items.map(async (item, index) => {
        console.log(`🔍 Processing item ${index + 1}:`, JSON.stringify(item, null, 2));
        
        // Handle both UUID and string IDs - convert mock IDs to real UUIDs
        let productId = item.product_id || item.product?.id;
        
        if (!productId) {
          console.error('❌ Missing product ID for item:', item);
          throw new Error(`Missing product ID for item at index ${index}`);
        }

        // If it's a simple string like "1", "2", etc., map to actual database UUIDs
        if (typeof productId === 'string' && productId.match(/^\d+$/)) {
          // Map mock product IDs to actual database product UUIDs
          const mockToUuidMap = {
            '1': 'f60fc98b-6a76-4a66-9f65-b9b2078644d4', // Dom Pérignon 2013
            '2': '6e8c2c74-5e70-415a-ad1e-f5a886cc13c0', // Macallan 12 Year Old Double Cask
            '3': '821e7427-e162-4fd3-ba5a-bf5faa1f72ce', // Macallan 18 Year Old Sherry Cask
            '4': 'aadf1d9c-f54c-43ed-8597-acde2da9725d', // Macallan 25 Year Old Sherry Oak
            '5': 'd43c8b9c-5da6-4fb5-9aa1-deea7a74181c', // Macallan 30 Year Old Sherry Cask
            '6': '3eb60cd7-b720-4e4c-92d2-f22e59044896', // Château Margaux 2015
            '7': '5a072d32-2d9b-4533-8172-f749713d172d', // Hennessy Paradis
            '8': '06c5452a-0376-444d-a141-0f65f9b4fa19', // Johnnie Walker Blue Label
          };

          productId =
            mockToUuidMap[productId] || 'f60fc98b-6a76-4a66-9f65-b9b2078644d4';
          console.log(
            `🔄 Mapped mock product ID ${item.product_id || item.product?.id} to UUID ${productId} (${item.product_name || item.product?.name})`
          );
        }

        // Fetch product details from database if not provided
        let productName = item.product_name || item.product?.name;
        let unitPrice = item.unit_price || item.product?.tradePrice || item.product?.retailPrice || item.product?.price;
        let imageUrl = item.product?.image || item.product?.imageUrl;

        if (!productName || !unitPrice) {
          console.log(`🔍 Fetching product details for ID: ${productId}`);
          const { data: product, error: productError } = await supabase
            .from('products')
            .select('name, retail_price, trade_price, image_url')
            .eq('id', productId)
            .single();

          if (product && !productError) {
            productName = productName || product.name;
            unitPrice = unitPrice || product.retail_price;
            imageUrl = imageUrl || product.image_url;
            console.log(`✅ Product details fetched: ${product.name} - $${product.retail_price}`);
          } else {
            console.error(`❌ Failed to fetch product details for ID: ${productId}`, productError);
            throw new Error(`Failed to fetch product details for ID: ${productId}`);
          }
        }

        return {
          order_id: order.id,
          product_id: productId,
          product_name: productName,
          quantity: item.quantity,
          unit_price: unitPrice,
          total_price: item.total_price || (item.quantity * unitPrice),
          product_image_url: imageUrl,
          created_at: new Date().toISOString(),
        };
      })
      );

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('❌ Error creating order items:', itemsError);
        throw itemsError;
      }

      console.log('✅ Order items created');

      // For company credit orders, deduct the order amount from available credit
      if (isCompanyCredit && paymentStatus === 'paid') {
        console.log(
          '💳 Deducting order amount from available company credit...'
        );

        const { data: company, error: creditError } = await supabase
          .from('companies')
          .select('current_credit, credit_limit')
          .eq('id', orderData.companyId)
          .single();

        if (company && !creditError) {
          // current_credit represents available credit (credit_limit - credit_used)
          const newAvailableCredit = company.current_credit - orderData.total;

          const { error: updateError } = await supabase
            .from('companies')
            .update({ current_credit: newAvailableCredit })
            .eq('id', orderData.companyId);

          if (updateError) {
            console.error('❌ Error updating company credit:', updateError);
          } else {
            console.log(
              `💰 Company available credit updated: $${company.current_credit} → $${newAvailableCredit}`
            );

            // Warn if credit limit is exceeded
            if (newAvailableCredit < 0) {
              console.log(
                `⚠️  Company is over credit limit by $${Math.abs(newAvailableCredit)}`
              );
            }
          }
        }
      }

      // Award points for individual orders when payment is confirmed
      let pointsAwarded = null;
      if (!isCompanyCredit && paymentStatus === 'pending') {
        // For individual orders, award points immediately (simulating instant payment processing)
        console.log('🎯 Awarding points for individual order...');
        pointsAwarded = await this.awardPointsForOrder(
          session.user.id,
          orderData.total,
          order.id
        );
      }

      // Status history is automatically created by database trigger
      // No need to manually create it here

      console.log('✅ Order created successfully:', orderNumber);
      return { 
        orderId: order.id, 
        orderNumber, 
        pointsAwarded 
      };
    } catch (error) {
      console.error('❌ Error creating order:', error);
      return null;
    }
  },

  async getUserOrders(userId: string, limit?: number): Promise<Order[]> {
    try {
      console.log('📋 Fetching orders for user:', userId);

      let query = supabase
        .from('orders')
        .select(
          `
          *,
          order_items (
            product_id,
            product_name,
            quantity,
            unit_price,
            total_price,
            product_image_url
          )
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data: orders, error } = await query;

      if (error) {
        console.error('❌ Error fetching orders:', error);
        throw error;
      }

      console.log('📋 Found', orders?.length || 0, 'orders');

      return (
        orders?.map(order => ({
          id: order.id,
          orderNumber: order.order_number,
          date: order.created_at.split('T')[0],
          status: order.status,
          total: order.total,
          items: order.order_items.map(item => ({
            id: item.product_id,
            name: item.product_name,
            quantity: item.quantity,
            price: item.unit_price,
            image: item.product_image_url,
          })),
          deliveryAddress:
            typeof order.delivery_address === 'string'
              ? order.delivery_address
              : JSON.stringify(order.delivery_address),
          estimatedDelivery: order.delivery_date,
        })) || []
      );
    } catch (error) {
      console.error('❌ Error fetching user orders:', error);
      return [];
    }
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      console.log('📋 Fetching order:', orderId);

      // Check if orderId is a UUID or order number
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          orderId
        );

      const { data: order, error } = await supabase
        .from('orders')
        .select(
          `
          *,
          order_items (
            product_id,
            product_name,
            quantity,
            unit_price,
            total_price,
            product_image_url
          )
        `
        )
        .eq(isUuid ? 'id' : 'order_number', orderId)
        .single();

      if (error) {
        console.error('❌ Error fetching order:', error);
        throw error;
      }

      if (!order) return null;

      return {
        id: order.id,
        orderNumber: order.order_number,
        date: order.created_at.split('T')[0],
        status: order.status,
        total: order.total,
        items: order.order_items.map(item => ({
          id: item.product_id,
          name: item.product_name,
          quantity: item.quantity,
          price: item.unit_price,
          image: item.product_image_url,
        })),
        deliveryAddress:
          typeof order.delivery_address === 'string'
            ? order.delivery_address
            : JSON.stringify(order.delivery_address),
        estimatedDelivery: order.delivery_date,
      };
    } catch (error) {
      console.error('❌ Error fetching order:', error);
      return null;
    }
  },

  async getRecentOrders(userId: string, limit: number = 3): Promise<Order[]> {
    return this.getUserOrders(userId, limit);
  },

  async getOrdersByStatus(userId: string, status: string): Promise<Order[]> {
    try {
      console.log('📋 Fetching orders by status:', status, 'for user:', userId);

      const { data: orders, error } = await supabase
        .from('orders')
        .select(
          `
          *,
          order_items (
            product_id,
            product_name,
            quantity,
            unit_price,
            total_price,
            product_image_url
          )
        `
        )
        .eq('user_id', userId)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching orders by status:', error);
        throw error;
      }

      return (
        orders?.map(order => ({
          id: order.id,
          orderNumber: order.order_number,
          date: order.created_at.split('T')[0],
          status: order.status,
          total: order.total,
          items: order.order_items.map(item => ({
            id: item.product_id,
            name: item.product_name,
            quantity: item.quantity,
            price: item.unit_price,
            image: item.product_image_url,
          })),
          deliveryAddress:
            typeof order.delivery_address === 'string'
              ? order.delivery_address
              : JSON.stringify(order.delivery_address),
          estimatedDelivery: order.delivery_date,
        })) || []
      );
    } catch (error) {
      console.error('❌ Error fetching orders by status:', error);
      return [];
    }
  },

  async searchOrders(userId: string, query: string): Promise<Order[]> {
    try {
      console.log('🔍 Searching orders for user:', userId, 'query:', query);

      const { data: orders, error } = await supabase
        .from('orders')
        .select(
          `
          *,
          order_items (
            product_id,
            product_name,
            quantity,
            unit_price,
            total_price,
            product_image_url
          )
        `
        )
        .eq('user_id', userId)
        .or(`order_number.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error searching orders:', error);
        throw error;
      }

      return (
        orders?.map(order => ({
          id: order.id,
          orderNumber: order.order_number,
          date: order.created_at.split('T')[0],
          status: order.status,
          total: order.total,
          items: order.order_items.map(item => ({
            id: item.product_id,
            name: item.product_name,
            quantity: item.quantity,
            price: item.unit_price,
            image: item.product_image_url,
          })),
          deliveryAddress:
            typeof order.delivery_address === 'string'
              ? order.delivery_address
              : JSON.stringify(order.delivery_address),
          estimatedDelivery: order.delivery_date,
        })) || []
      );
    } catch (error) {
      console.error('❌ Error searching orders:', error);
      return [];
    }
  },

  // Utility function to update order status (for testing real-time updates)
  async updateOrderStatus(
    orderId: string,
    newStatus: 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled'
  ): Promise<boolean> {
    try {
      console.log('📦 Updating order status:', orderId, 'to', newStatus);

      const { error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) {
        console.error('❌ Error updating order status:', error);
        return false;
      }

      // Status history is automatically created by database trigger
      // No need to manually create it here

      console.log('✅ Order status updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Error updating order status:', error);
      return false;
    }
  },

  // Test function to simulate order progression (for demo purposes)
  async simulateOrderProgression(orderId: string): Promise<void> {
    console.log('🎭 Simulating order progression for:', orderId);

    // Get the order details to check delivery slot
    const { data: order, error } = await supabase
      .from('orders')
      .select('delivery_date, delivery_time_slot, created_at')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      console.error('❌ Could not get order details for progression:', error);
      return;
    }

    const now = new Date();
    const deliveryDate = new Date(order.delivery_date);
    const isToday = deliveryDate.toDateString() === now.toDateString();

    // Parse delivery time slot (e.g., "12pm - 3pm")
    const timeSlot = order.delivery_time_slot;
    const [startTime, endTime] = timeSlot.split(' - ');

    // Calculate realistic timing based on delivery slot
    let preparingDelay, outForDeliveryDelay, deliveredDelay;

    if (isToday) {
      // For same-day delivery, use realistic timing
      preparingDelay = 2 * 60 * 1000; // 2 minutes to start preparing
      outForDeliveryDelay = 15 * 60 * 1000; // 15 minutes before delivery window

      // Calculate when the delivery window starts
      const deliveryWindowStart = this.parseTimeSlot(startTime);
      const deliveryWindowEnd = this.parseTimeSlot(endTime);

      // Schedule delivery for middle of the window
      const deliveryTime = new Date(deliveryDate);
      deliveryTime.setHours(
        Math.floor(
          (deliveryWindowStart.getHours() + deliveryWindowEnd.getHours()) / 2
        )
      );

      const timeToDelivery = deliveryTime.getTime() - now.getTime();
      deliveredDelay = Math.max(timeToDelivery, 20 * 60 * 1000); // At least 20 minutes
    } else {
      // For next-day delivery, use demo timing
      preparingDelay = 5 * 60 * 1000; // 5 minutes
      outForDeliveryDelay = 30 * 60 * 1000; // 30 minutes
      deliveredDelay = 60 * 60 * 1000; // 1 hour (for demo)
    }

    console.log(
      `📅 Order ${orderId} scheduled for delivery on ${deliveryDate.toDateString()} at ${timeSlot}`
    );
    console.log(
      `⏰ Preparing in ${preparingDelay / 1000}s, Out for delivery in ${outForDeliveryDelay / 1000}s, Delivered in ${deliveredDelay / 1000}s`
    );

    // Schedule status updates
    setTimeout(
      () => this.updateOrderStatus(orderId, 'preparing'),
      preparingDelay
    );
    setTimeout(
      () => this.updateOrderStatus(orderId, 'out_for_delivery'),
      outForDeliveryDelay
    );
    setTimeout(
      () => this.updateOrderStatus(orderId, 'delivered'),
      deliveredDelay
    );
  },

  // Helper function to parse time slot
  parseTimeSlot(timeStr: string): Date {
    const today = new Date();
    const time = timeStr.toLowerCase();

    let hours = 0;
    if (time.includes('am')) {
      hours = parseInt(time.replace('am', ''));
      if (hours === 12) hours = 0; // 12am = 0 hours
    } else if (time.includes('pm')) {
      hours = parseInt(time.replace('pm', ''));
      if (hours !== 12) hours += 12; // Convert to 24-hour format
    }

    const result = new Date(today);
    result.setHours(hours, 0, 0, 0);
    return result;
  },

  // Test functions for real-time data updates
  async testUserDataUpdate(userId: string): Promise<boolean> {
    try {
      console.log('🧪 Testing real-time user data update for:', userId);

      const { error } = await supabase
        .from('users')
        .update({
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ Error updating user data:', error);
        return false;
      }

      console.log(
        '✅ User data updated - real-time listeners should be triggered'
      );
      return true;
    } catch (error) {
      console.error('❌ Error testing user data update:', error);
      return false;
    }
  },

  async testCompanyDataUpdate(companyId: string): Promise<boolean> {
    try {
      console.log('🧪 Testing real-time company data update for:', companyId);

      const { error } = await supabase
        .from('companies')
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq('id', companyId);

      if (error) {
        console.error('❌ Error updating company data:', error);
        return false;
      }

      console.log(
        '✅ Company data updated - real-time listeners should be triggered'
      );
      return true;
    } catch (error) {
      console.error('❌ Error testing company data update:', error);
      return false;
    }
  },

  // Helper to trigger real-time demo
  async triggerRealTimeDemo(userId: string, companyId?: string): Promise<void> {
    console.log('🎭 Starting real-time demo...');

    // Update user data every 10 seconds
    setTimeout(() => this.testUserDataUpdate(userId), 3000);
    setTimeout(() => this.testUserDataUpdate(userId), 13000);

    // Update company data if available
    if (companyId) {
      setTimeout(() => this.testCompanyDataUpdate(companyId), 7000);
      setTimeout(() => this.testCompanyDataUpdate(companyId), 17000);
    }

    console.log('🎭 Real-time demo scheduled - watch for updates!');
  },

  // Location management functions
  async saveUserLocation(
    userId: string,
    location: LocationSuggestion,
    isCurrent: boolean = false
  ): Promise<boolean> {
    try {
      // Validate that we have valid coordinates
      if (
        !location.coordinate ||
        location.coordinate.latitude === 0 ||
        location.coordinate.longitude === 0
      ) {
        return false;
      }

      // Generate a unique location ID if not provided
      const locationId =
        location.id ||
        `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const locationData = {
        user_id: userId,
        location_id: locationId,
        title: location.title,
        subtitle: location.subtitle || '',
        location_type: 'recent', // Force to 'recent' for location history
        latitude: Number(location.coordinate?.latitude || 0),
        longitude: Number(location.coordinate?.longitude || 0),
        address:
          location.formattedAddress || location.subtitle || location.title,
        is_current: isCurrent,
        last_used_at: new Date().toISOString(),
        usage_count: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Check if this location already exists for the user
      const { data: existingLocation, error: checkError } = await supabase
        .from('user_locations')
        .select('usage_count, id')
        .eq('user_id', userId)
        .eq('location_id', locationId)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error checking existing location:', checkError);
      }

      // If it exists, increment usage count
      if (existingLocation) {
        locationData.usage_count = existingLocation.usage_count + 1;
      }

      const { data: savedData, error } = await supabaseAdmin
        .from('user_locations')
        .upsert([locationData], {
          onConflict: 'user_id,location_id',
          ignoreDuplicates: false,
        })
        .select();

      if (error) {
        console.error('❌ Error saving location:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Error saving location:', error);
      return false;
    }
  },

  async getCurrentUserLocation(
    userId: string
  ): Promise<LocationSuggestion | null> {
    try {
      const { data: location, error } = await supabase
        .from('user_locations')
        .select('*')
        .eq('user_id', userId)
        .eq('is_current', true)
        .maybeSingle();

      if (error) {
        console.error('❌ Error getting current location:', error);
        return null;
      }

      if (!location) {
        return null;
      }

      return {
        id: location.location_id,
        title: location.title,
        subtitle: location.subtitle,
        type: location.location_type as 'suggestion' | 'recent' | 'favorite',
        coordinate: {
          latitude: parseFloat(location.latitude),
          longitude: parseFloat(location.longitude),
        },
      };
    } catch (error) {
      console.error('❌ Error getting current location:', error);
      return null;
    }
  },

  async getUserLocationHistory(
    userId: string,
    limit: number = 10
  ): Promise<LocationSuggestion[]> {
    try {
      console.log('📍 Getting location history for user:', userId);

      const { data: locations, error } = await supabase
        .from('user_locations')
        .select('*')
        .eq('user_id', userId)
        .eq('location_type', 'recent') // Only get recent locations for history
        .order('last_used_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error getting location history:', error);
        return [];
      }

      console.log('📍 Raw location data from database:', locations);

      if (!locations || locations.length === 0) {
        console.log('📍 No location history found for user');
        return [];
      }

      const formattedLocations = locations.map(location => ({
        id: location.location_id,
        title: location.title,
        subtitle: location.subtitle || location.address || '',
        type: (location.location_type || 'recent') as
          | 'suggestion'
          | 'recent'
          | 'favorite',
        coordinate: {
          latitude: parseFloat(location.latitude.toString()),
          longitude: parseFloat(location.longitude.toString()),
        },
        formattedAddress: location.address,
      }));

      console.log('📍 Formatted location history:', formattedLocations);
      return formattedLocations;
    } catch (error) {
      console.error('❌ Error getting location history:', error);
      return [];
    }
  },

  async getUserFavoriteLocations(
    userId: string
  ): Promise<LocationSuggestion[]> {
    try {
      console.log('📍 Getting favorite locations for user:', userId);

      const { data: locations, error } = await supabase
        .from('user_locations')
        .select('*')
        .eq('user_id', userId)
        .eq('is_favorite', true)
        .order('title', { ascending: true });

      if (error) {
        console.error('❌ Error getting favorite locations:', error);
        return [];
      }

      return locations.map(location => ({
        id: location.location_id,
        title: location.title,
        subtitle: location.subtitle,
        type: 'favorite' as const,
        coordinate: {
          latitude: parseFloat(location.latitude),
          longitude: parseFloat(location.longitude),
        },
      }));
    } catch (error) {
      console.error('❌ Error getting favorite locations:', error);
      return [];
    }
  },

  async toggleLocationFavorite(
    userId: string,
    locationId: string
  ): Promise<boolean> {
    try {
      console.log('📍 Toggling favorite for location:', locationId);

      // First get the current favorite status
      const { data: location, error: getError } = await supabase
        .from('user_locations')
        .select('is_favorite')
        .eq('user_id', userId)
        .eq('location_id', locationId)
        .maybeSingle();

      if (getError) {
        console.error('❌ Error getting location:', getError);
        return false;
      }

      if (!location) {
        console.log('⚠️ Location not found');
        return false;
      }

      // Toggle the favorite status
      const { error: updateError } = await supabaseAdmin
        .from('user_locations')
        .update({
          is_favorite: !location.is_favorite,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('location_id', locationId);

      if (updateError) {
        console.error('❌ Error toggling favorite:', updateError);
        return false;
      }

      console.log('✅ Location favorite toggled successfully');
      return true;
    } catch (error) {
      console.error('❌ Error toggling location favorite:', error);
      return false;
    }
  },

  async setCurrentLocation(
    userId: string,
    locationId: string
  ): Promise<boolean> {
    try {
      // Optimized: Use single transaction to update both in one operation
      const { error } = await supabaseAdmin.rpc('set_user_current_location', {
        user_id: userId,
        location_id: locationId,
      });

      if (error) {
        // Fallback to original method if RPC doesn't exist
        await supabaseAdmin
          .from('user_locations')
          .update({ is_current: false, updated_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('is_current', true);

        const { error: updateError } = await supabaseAdmin
          .from('user_locations')
          .update({
            is_current: true,
            last_used_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .eq('location_id', locationId);

        if (updateError) {
          console.error('❌ Error setting current location:', updateError);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('❌ Error setting current location:', error);
      return false;
    }
  },

  // Real-time location subscriptions - returns all user locations
  subscribeToUserLocationChanges(
    userId: string,
    callback: (locations: any[]) => void
  ) {
    return supabase
      .channel(`location-changes-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_locations',
          filter: `user_id=eq.${userId}`,
        },
        async payload => {
          // Only process actual database changes, not heartbeats
          if (
            payload.eventType &&
            ['INSERT', 'UPDATE', 'DELETE'].includes(payload.eventType)
          ) {
            try {
              const { data: locations, error } = await supabase
                .from('user_locations')
                .select('*')
                .eq('user_id', userId)
                .order('last_used_at', { ascending: false });

              if (error) {
                console.error('❌ Error fetching updated locations:', error);
                callback([]);
                return;
              }

              callback(locations || []);
            } catch (error) {
              console.error(
                '❌ Error in location subscription callback:',
                error
              );
              callback([]);
            }
          }
        }
      )
      .subscribe();
  },

  // Seed default locations for a user
  async seedDefaultLocations(userId: string): Promise<boolean> {
    try {
      console.log('📍 Seeding default locations for user:', userId);

      const defaultLocations = [
        {
          user_id: userId,
          location_id: 'marina-bay',
          title: 'Marina Bay',
          subtitle: 'Marina Bay, Singapore',
          location_type: 'suggestion',
          latitude: 1.2834,
          longitude: 103.8607,
          is_current: true, // Set as default current location
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          user_id: userId,
          location_id: 'orchard-road',
          title: 'Orchard Road',
          subtitle: 'Orchard Road, Singapore',
          location_type: 'suggestion',
          latitude: 1.3048,
          longitude: 103.8318,
          is_current: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          user_id: userId,
          location_id: 'clarke-quay',
          title: 'Clarke Quay',
          subtitle: 'Clarke Quay, Singapore',
          location_type: 'suggestion',
          latitude: 1.2886,
          longitude: 103.8467,
          is_current: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const { error } = await supabaseAdmin
        .from('user_locations')
        .upsert(defaultLocations, { onConflict: 'user_id,location_id' });

      if (error) {
        console.error('❌ Error seeding default locations:', error);
        return false;
      }

      console.log('✅ Default locations seeded successfully');
      return true;
    } catch (error) {
      console.error('❌ Error seeding default locations:', error);
      return false;
    }
  },

  // Subscribe to order updates for real-time tracking
  subscribeToOrderUpdates(orderId: string, callback: (order: any) => void) {
    try {
      const subscription = supabase
        .channel('order-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${orderId}`,
          },
          payload => {
            console.log('📦 Order update received:', payload);
            // Fetch the complete order data and call callback
            this.getOrderById(orderId).then(order => {
              if (order) {
                callback(order);
              }
            });
          }
        )
        .subscribe();

      return subscription;
    } catch (error) {
      console.error('Error subscribing to order updates:', error);
      return null;
    }
  },
};

export default supabaseService;
