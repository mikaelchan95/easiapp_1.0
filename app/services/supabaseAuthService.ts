import { supabase } from '../../utils/supabase';
import { AuthError, AuthResponse, User as SupabaseUser, Session } from '@supabase/supabase-js';
import { User, UserPermissions, Company } from '../types/user';

export interface AuthState {
  user: SupabaseUser | null;
  session: Session | null;
  loading: boolean;
  profile: User | null;
  company: Company | null;
  permissions: UserPermissions | null;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  accountType: 'individual' | 'company';
  companyName?: string;
  companyUen?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

class SupabaseAuthService {
  private authStateListeners: ((state: AuthState) => void)[] = [];
  private currentAuthState: AuthState = {
    user: null,
    session: null,
    loading: true,
    profile: null,
    company: null,
    permissions: null
  };

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Get initial session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      await this.handleAuthStateChange(session);
    } else {
      this.currentAuthState.loading = false;
      this.notifyListeners();
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          await this.handleAuthStateChange(session);
          break;
        case 'SIGNED_OUT':
          this.currentAuthState = {
            user: null,
            session: null,
            loading: false,
            profile: null,
            company: null,
            permissions: null
          };
          this.notifyListeners();
          break;
        case 'PASSWORD_RECOVERY':
          // Handle password recovery
          break;
        case 'USER_UPDATED':
          // Handle user metadata updates
          if (session) {
            await this.handleAuthStateChange(session);
          }
          break;
      }
    });
  }

  private async handleAuthStateChange(session: Session | null) {
    if (!session) {
      this.currentAuthState = {
        user: null,
        session: null,
        loading: false,
        profile: null,
        company: null,
        permissions: null
      };
      this.notifyListeners();
      return;
    }

    this.currentAuthState.user = session.user;
    this.currentAuthState.session = session;
    this.currentAuthState.loading = true;
    this.notifyListeners();

    try {
      // Load user profile
      const profile = await this.loadUserProfile(session.user.id);
      this.currentAuthState.profile = profile;

      // Load company and permissions if user is company user
      if (profile?.accountType === 'company' && profile.companyId) {
        const [company, permissions] = await Promise.all([
          this.loadCompanyData(profile.companyId),
          this.loadUserPermissions(session.user.id)
        ]);
        this.currentAuthState.company = company;
        this.currentAuthState.permissions = permissions;
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      this.currentAuthState.loading = false;
      this.notifyListeners();
    }
  }

  private async loadUserProfile(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        accountType: data.account_type,
        companyId: data.company_id,
        role: data.role,
        profileImage: data.profile_image,
        walletBalance: data.wallet_balance,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  }

  private async loadCompanyData(companyId: string): Promise<Company | null> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (error) {
        console.error('Error loading company data:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        companyName: data.company_name,
        uen: data.uen,
        address: data.address,
        phone: data.phone,
        email: data.email,
        creditLimit: data.credit_limit,
        currentCredit: data.credit_limit - data.credit_used,
        paymentTerms: data.payment_terms,
        approvalSettings: {
          requireApproval: data.require_approval,
          approvalThreshold: data.approval_threshold,
          autoApproveBelow: data.auto_approve_below,
          multiLevelApproval: data.multi_level_approval
        },
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error loading company data:', error);
      return null;
    }
  }

  private async loadUserPermissions(userId: string): Promise<UserPermissions | null> {
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If no permissions found, create default permissions for the user
        if (error.code === 'PGRST116') {
          console.log('No permissions found for user, creating default permissions:', userId);
          return await this.createDefaultPermissions(userId);
        }
        console.error('Error loading user permissions:', error);
        return null;
      }

      return {
        canCreateOrders: data.can_create_orders,
        canApproveOrders: data.can_approve_orders,
        canViewAllOrders: data.can_view_all_orders,
        orderLimit: data.order_limit,
        canManageUsers: data.can_manage_users,
        canInviteUsers: data.can_invite_users,
        canSetPermissions: data.can_set_permissions,
        canEditCompanyInfo: data.can_edit_company_info,
        canManageBilling: data.can_manage_billing,
        canViewReports: data.can_view_reports,
        canViewTradePrice: data.can_view_trade_price,
        canAccessExclusiveProducts: data.can_access_exclusive_products
      };
    } catch (error) {
      console.error('Error loading user permissions:', error);
      return null;
    }
  }

  private async createDefaultPermissions(userId: string): Promise<UserPermissions | null> {
    try {
      // Get user profile to determine permission level
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('account_type, role, company_id')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error fetching user for default permissions:', userError);
        return null;
      }

      // Determine default permissions based on user type and role
      let defaultPermissions: any = {
        user_id: userId,
        can_create_orders: true,
        can_approve_orders: false,
        can_view_all_orders: false,
        order_limit: null,
        can_manage_users: false,
        can_invite_users: false,
        can_set_permissions: false,
        can_edit_company_info: false,
        can_manage_billing: false,
        can_view_reports: false,
        can_view_trade_price: false,
        can_access_exclusive_products: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // If company user, give more permissions based on role
      if (userData.account_type === 'company') {
        const role = userData.role || 'member';
        
        switch (role) {
          case 'superadmin':
          case 'admin':
            defaultPermissions = {
              ...defaultPermissions,
              can_approve_orders: true,
              can_view_all_orders: true,
              can_manage_users: true,
              can_invite_users: true,
              can_set_permissions: true,
              can_edit_company_info: true,
              can_manage_billing: true,
              can_view_reports: true,
              can_view_trade_price: true,
              can_access_exclusive_products: true
            };
            break;
          case 'manager':
            defaultPermissions = {
              ...defaultPermissions,
              can_approve_orders: true,
              can_view_all_orders: true,
              can_manage_users: true,
              can_invite_users: true,
              can_view_reports: true,
              can_view_trade_price: true,
              can_access_exclusive_products: true
            };
            break;
          case 'approver':
            defaultPermissions = {
              ...defaultPermissions,
              can_approve_orders: true,
              can_view_all_orders: true,
              can_view_trade_price: true
            };
            break;
          default: // staff or member
            defaultPermissions = {
              ...defaultPermissions,
              can_view_trade_price: true
            };
        }
      }

      // Insert default permissions
      const { data, error } = await supabase
        .from('user_permissions')
        .insert(defaultPermissions)
        .select()
        .single();

      if (error) {
        console.error('Error creating default permissions:', error);
        return null;
      }

      console.log('Created default permissions for user:', userId);

      return {
        canCreateOrders: data.can_create_orders,
        canApproveOrders: data.can_approve_orders,
        canViewAllOrders: data.can_view_all_orders,
        orderLimit: data.order_limit,
        canManageUsers: data.can_manage_users,
        canInviteUsers: data.can_invite_users,
        canSetPermissions: data.can_set_permissions,
        canEditCompanyInfo: data.can_edit_company_info,
        canManageBilling: data.can_manage_billing,
        canViewReports: data.can_view_reports,
        canViewTradePrice: data.can_view_trade_price,
        canAccessExclusiveProducts: data.can_access_exclusive_products
      };
    } catch (error) {
      console.error('Error creating default permissions:', error);
      return null;
    }
  }

  private notifyListeners() {
    this.authStateListeners.forEach(listener => listener(this.currentAuthState));
  }

  // Public methods
  getAuthState(): AuthState {
    return this.currentAuthState;
  }

  onAuthStateChange(callback: (state: AuthState) => void): () => void {
    this.authStateListeners.push(callback);
    
    // Immediately call with current state
    callback(this.currentAuthState);
    
    // Return unsubscribe function
    return () => {
      this.authStateListeners = this.authStateListeners.filter(listener => listener !== callback);
    };
  }

  async signUp(data: SignUpData): Promise<{ user: SupabaseUser | null; error: AuthError | null }> {
    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            phone: data.phone,
            account_type: data.accountType,
            company_name: data.companyName,
            company_uen: data.companyUen
          }
        }
      });

      if (authError) {
        return { user: null, error: authError };
      }

      // If signup successful, create user profile
      if (authData.user) {
        await this.createUserProfile(authData.user, data);
      }

      return { user: authData.user, error: null };
    } catch (error) {
      return { user: null, error: error as AuthError };
    }
  }

  async signIn(data: SignInData): Promise<{ user: SupabaseUser | null; error: AuthError | null }> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      return { user: authData.user, error: authError };
    } catch (error) {
      return { user: null, error: error as AuthError };
    }
  }

  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  async updateProfile(updates: Partial<User>): Promise<{ error: Error | null }> {
    try {
      if (!this.currentAuthState.user) {
        throw new Error('No authenticated user');
      }

      const { error } = await supabase
        .from('users')
        .update({
          name: updates.name,
          phone: updates.phone,
          profile_image: updates.profileImage,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.currentAuthState.user.id);

      if (error) {
        throw error;
      }

      // Reload user profile
      const updatedProfile = await this.loadUserProfile(this.currentAuthState.user.id);
      this.currentAuthState.profile = updatedProfile;
      this.notifyListeners();

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  private async createUserProfile(user: SupabaseUser, data: SignUpData): Promise<void> {
    try {
      // Create user profile
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          account_type: data.accountType,
          wallet_balance: data.accountType === 'individual' ? 0 : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (userError) {
        throw userError;
      }

      // If company user, create company
      if (data.accountType === 'company' && data.companyName) {
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .insert({
            name: data.companyName,
            company_name: data.companyName,
            uen: data.companyUen,
            status: 'pending_verification',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (companyError) {
          throw companyError;
        }

        // Update user with company ID
        await supabase
          .from('users')
          .update({
            company_id: companyData.id,
            role: 'superadmin'
          })
          .eq('id', user.id);

        // Create user permissions
        await supabase
          .from('user_permissions')
          .insert({
            user_id: user.id,
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
            role: 'admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  // Utility methods
  get user(): SupabaseUser | null {
    return this.currentAuthState.user;
  }

  get session(): Session | null {
    return this.currentAuthState.session;
  }

  get profile(): User | null {
    return this.currentAuthState.profile;
  }

  get company(): Company | null {
    return this.currentAuthState.company;
  }

  get permissions(): UserPermissions | null {
    return this.currentAuthState.permissions;
  }

  get isAuthenticated(): boolean {
    return !!this.currentAuthState.user;
  }

  get isLoading(): boolean {
    return this.currentAuthState.loading;
  }
}

// Export singleton instance
export const supabaseAuthService = new SupabaseAuthService();
export default supabaseAuthService;