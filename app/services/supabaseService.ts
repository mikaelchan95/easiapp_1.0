import { supabase } from '../config/supabase';
import { 
  User, 
  Company, 
  CompanyUser, 
  IndividualUser, 
  UserPermissions, 
  CompanyUserRole,
  isCompanyUser 
} from '../types/user';

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
      permissions: permissions ? transformDatabasePermissionsToPermissions(permissions) : {
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

const transformDatabasePermissionsToPermissions = (dbPermissions: DatabaseUserPermissions): UserPermissions => ({
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

const transformDatabaseCompanyToCompany = (dbCompany: DatabaseCompany): Company => ({
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
  // User operations
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return null;

      const { data: dbUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userError) throw userError;
      if (!dbUser) return null;

      // Get permissions if it's a company user
      let permissions: DatabaseUserPermissions | undefined;
      if (dbUser.account_type === 'company') {
        const { data: dbPermissions, error: permissionsError } = await supabase
          .from('user_permissions')
          .select('*')
          .eq('user_id', dbUser.id)
          .single();

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
      console.log('🔍 Supabase getUserById called with:', userId);
      
      const { data: dbUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('📊 Supabase query result:', { dbUser, userError });

      if (userError) {
        console.error('❌ Supabase user query error:', userError);
        throw userError;
      }
      if (!dbUser) {
        console.log('⚠️ No user found in Supabase for ID:', userId);
        return null;
      }

      console.log('✅ Found user in Supabase:', dbUser);

      // Get permissions if it's a company user
      let permissions: DatabaseUserPermissions | undefined;
      if (dbUser.account_type === 'company') {
        console.log('🔍 Fetching permissions for company user...');
        const { data: dbPermissions, error: permissionsError } = await supabase
          .from('user_permissions')
          .select('*')
          .eq('user_id', dbUser.id)
          .single();

        console.log('📊 Permissions query result:', { dbPermissions, permissionsError });

        if (!permissionsError && dbPermissions) {
          permissions = dbPermissions;
          console.log('✅ Found permissions:', permissions);
        } else {
          console.log('⚠️ No permissions found or error:', permissionsError);
        }
      }

      const transformedUser = transformDatabaseUserToUser(dbUser, permissions);
      console.log('🔄 Transformed user:', transformedUser);
      
      return transformedUser;
    } catch (error) {
      console.error('❌ Error in getUserById:', error);
      return null;
    }
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    try {
      // Prepare database updates
      const dbUpdates: Partial<DatabaseUser> = {
        name: updates.name,
        email: updates.email,
        phone: updates.phone,
        profile_image: updates.profileImage,
        updated_at: new Date().toISOString(),
      };

      // Update user
      const { data: dbUser, error: userError } = await supabase
        .from('users')
        .update(dbUpdates)
        .eq('id', userId)
        .select()
        .single();

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
          can_access_exclusive_products: updates.permissions.canAccessExclusiveProducts,
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
        .single();

      if (error) throw error;
      if (!dbCompany) return null;

      return transformDatabaseCompanyToCompany(dbCompany);
    } catch (error) {
      console.error('Error fetching company:', error);
      return null;
    }
  },

  async updateCompany(companyId: string, updates: Partial<Company>): Promise<Company | null> {
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
        .single();

      if (error) throw error;

      return transformDatabaseCompanyToCompany(dbCompany);
    } catch (error) {
      console.error('Error updating company:', error);
      return null;
    }
  },

  async getCompanyUsers(companyId: string): Promise<CompanyUser[]> {
    try {
      const { data: dbUsers, error: usersError } = await supabase
        .from('users')
        .select(`
          *,
          user_permissions (*)
        `)
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

  // Demo authentication method - simulates proper auth for development
  async authenticateForDemo(userId: string): Promise<boolean> {
    try {
      console.log('🔐 Setting up demo authentication for user:', userId);
      
      // Check if we're already authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('✅ Already authenticated with user:', session.user.id);
        return true;
      }
      
      // For development/demo purposes, we'll sign in the user with a demo email/password
      // This creates a real auth session that RLS policies can use
      const demoEmail = 'mikael@thewinery.com.sg';
      const demoPassword = 'demo123';
      
      console.log('🔑 Attempting demo authentication...');
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      if (authError) {
        console.log('ℹ️ Demo sign-in result:', authError.message);
        
        // Handle specific error cases
        if (authError.message.includes('For security purposes')) {
          console.log('⏱️ Rate limited, skipping auth setup for now');
          return true; // Continue with demo data
        }
        
        if (authError.message.includes('Invalid login credentials') || 
            authError.message.includes('Email not confirmed')) {
          console.log('ℹ️ Demo user not ready, continuing with mock data');
          return true; // Continue with demo data
        }
        
        // For any other auth error, just continue with demo data
        console.log('ℹ️ Auth not available, using demo data');
        return true;
      }
      
      if (authData.user) {
        console.log('✅ Demo authentication successful, user ID:', authData.user.id);
        return true;
      }
      
      // If we get here, something unexpected happened, but continue anyway
      console.log('ℹ️ Unexpected auth state, continuing with demo data');
      return true;
      
    } catch (error) {
      console.log('ℹ️ Demo authentication skipped:', error?.message || 'Unknown error');
      // For demo purposes, we'll always continue
      console.log('✅ Continuing with demo data (auth not required for demo)');
      return true;
    }
  },

  // Authentication operations
  async signUp(email: string, password: string, userData: Partial<User>): Promise<User | null> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) return null;

      // Create user profile
      const dbUser: Partial<DatabaseUser> = {
        id: authData.user.id,
        name: userData.name || '',
        email: userData.email || email,
        phone: userData.phone,
        account_type: userData.accountType || 'individual',
        profile_image: userData.profileImage,
      };

                    // Add company-specific fields if it's a company user
        if (userData.accountType === 'company') {
         const companyUserData = userData as Partial<CompanyUser>;
         dbUser.company_id = companyUserData.companyId;
         dbUser.role = companyUserData.role;
         dbUser.department = companyUserData.department;
         dbUser.position = companyUserData.position;
        dbUser.joined_company_at = new Date().toISOString();
      } else {
        dbUser.member_since = new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long' 
        });
        dbUser.total_orders = 0;
        dbUser.total_spent = 0;
      }

      const { error: profileError } = await supabase
        .from('users')
        .insert([dbUser]);

      if (profileError) throw profileError;

      return this.getUserById(authData.user.id);
    } catch (error) {
      console.error('Error signing up user:', error);
      return null;
    }
  },

  async signIn(email: string, password: string): Promise<User | null> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) return null;

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', authData.user.id);

      return this.getUserById(authData.user.id);
    } catch (error) {
      console.error('Error signing in user:', error);
      return null;
    }
  },

  async signOut(): Promise<boolean> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error signing out:', error);
      return false;
    }
  },

  // Utility functions
  async uploadProfileImage(userId: string, imageFile: File): Promise<string | null> {
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      const filePath = `profile-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading profile image:', error);
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
      console.log('🔍 Inviting team member:', { companyId, email, role, department, position });
      
      // In a real app, you'd send an email invitation and create a pending user
      // For now, we'll create the user directly
      const newUserId = crypto.randomUUID();
      
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
        .single();

      if (userError) {
        console.error('❌ Error inserting user:', userError);
        throw userError;
      }

      console.log('✅ Successfully inserted user:', insertedUser);

      const newMember = await this.getUserById(newUserId) as CompanyUser;
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
          can_access_exclusive_products: updates.permissions.canAccessExclusiveProducts,
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
        console.warn('⚠️ No rows were deleted - this might be due to RLS policies or the user not existing');
        throw new Error('No rows were deleted. User may not exist or you may not have permission to delete this user.');
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
        .select(`
          *,
          user_permissions (*)
        `)
        .eq('company_id', companyId)
        .eq('account_type', 'company')
        .order('created_at', { ascending: true });

      if (usersError) {
        console.error('❌ Error fetching team members:', usersError);
        throw usersError;
      }

      console.log('📊 Raw team members from DB:', dbUsers?.length || 0, 'users');

      const transformedUsers = dbUsers.map(dbUser => {
        const permissions = dbUser.user_permissions?.[0];
        const transformed = transformDatabaseUserToUser(dbUser, permissions) as CompanyUser;
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

  // Real-time subscriptions
  subscribeToUserChanges(userId: string, callback: (user: User | null) => void) {
    return supabase
      .channel(`user-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`,
        },
        async () => {
          const user = await this.getUserById(userId);
          callback(user);
        }
      )
      .subscribe();
  },

  subscribeToCompanyChanges(companyId: string, callback: (company: Company | null) => void) {
    return supabase
      .channel(`company-${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'companies',
          filter: `id=eq.${companyId}`,
        },
        async () => {
          const company = await this.getCompanyById(companyId);
          callback(company);
        }
      )
      .subscribe();
  },
}; 