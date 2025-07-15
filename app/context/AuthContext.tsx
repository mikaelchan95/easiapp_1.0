import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabaseAuthService, AuthState } from '../services/supabaseAuthService';
import { User, UserPermissions, Company } from '../types/user';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface AuthContextType extends AuthState {
  signUp: (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    accountType: 'individual' | 'company';
    companyName?: string;
    companyUen?: string;
  }) => Promise<{ user: SupabaseUser | null; error: any }>;
  
  signIn: (data: {
    email: string;
    password: string;
  }) => Promise<{ user: SupabaseUser | null; error: any }>;
  
  signOut: () => Promise<{ error: any }>;
  
  resetPassword: (email: string) => Promise<{ error: any }>;
  
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  
  updateProfile: (updates: Partial<User>) => Promise<{ error: any }>;
  
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    profile: null,
    company: null,
    permissions: null
  });

  useEffect(() => {
    const unsubscribe = supabaseAuthService.onAuthStateChange((state) => {
      setAuthState(state);
    });

    return unsubscribe;
  }, []);

  const signUp = async (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    accountType: 'individual' | 'company';
    companyName?: string;
    companyUen?: string;
  }) => {
    return await supabaseAuthService.signUp(data);
  };

  const signIn = async (data: {
    email: string;
    password: string;
  }) => {
    return await supabaseAuthService.signIn(data);
  };

  const signOut = async () => {
    return await supabaseAuthService.signOut();
  };

  const resetPassword = async (email: string) => {
    return await supabaseAuthService.resetPassword(email);
  };

  const updatePassword = async (newPassword: string) => {
    return await supabaseAuthService.updatePassword(newPassword);
  };

  const updateProfile = async (updates: Partial<User>) => {
    return await supabaseAuthService.updateProfile(updates);
  };

  const refreshUserData = async () => {
    // This will trigger a re-load of user data
    if (authState.user) {
      const { data: { session } } = await supabaseAuthService.getAuthState().session 
        ? { data: { session: supabaseAuthService.getAuthState().session } }
        : { data: { session: null } };
      // The auth service will handle the refresh automatically
    }
  };

  const contextValue: AuthContextType = {
    ...authState,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshUserData
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;