import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING } from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';

export type Permission =
  | 'view_billing'
  | 'manage_billing'
  | 'view_orders'
  | 'create_orders'
  | 'approve_orders'
  | 'manage_team'
  | 'view_analytics'
  | 'admin_access'
  | 'company_settings';

export type UserRole = 'admin' | 'manager' | 'member' | 'viewer';

interface PermissionGuardProps {
  children: ReactNode;
  requiredPermissions?: Permission[];
  requiredRole?: UserRole;
  requireCompany?: boolean;
  fallback?: ReactNode;
  showFallback?: boolean;
}

// Define role hierarchy and permissions
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'view_billing',
    'manage_billing',
    'view_orders',
    'create_orders',
    'approve_orders',
    'manage_team',
    'view_analytics',
    'admin_access',
    'company_settings',
  ],
  manager: [
    'view_billing',
    'view_orders',
    'create_orders',
    'approve_orders',
    'view_analytics',
    'company_settings',
  ],
  member: ['view_orders', 'create_orders', 'view_analytics', 'view_billing'],
  viewer: ['view_orders', 'view_analytics'],
};

const DefaultFallback = ({ message }: { message: string }) => (
  <View style={styles.fallbackContainer}>
    <Ionicons name="lock-closed" size={48} color={COLORS.textSecondary} />
    <Text style={styles.fallbackTitle}>Access Restricted</Text>
    <Text style={styles.fallbackMessage}>{message}</Text>
  </View>
);

export default function PermissionGuard({
  children,
  requiredPermissions = [],
  requiredRole,
  requireCompany = false,
  fallback,
  showFallback = true,
}: PermissionGuardProps) {
  const { profile: user, company, permissions: userPermissions, loading } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackMessage}>Loading...</Text>
      </View>
    );
  }

  // Check if user is authenticated
  if (!user) {
    if (!showFallback) return null;
    return (
      fallback || (
        <DefaultFallback message="Please sign in to access this feature." />
      )
    );
  }

  // Check if company is required
  if (requireCompany && (!company || user.accountType !== 'company')) {
    if (!showFallback) return null;
    const message = !company 
      ? "Company data not loaded. Please try refreshing the app."
      : "This feature is only available to company accounts.";
    return (
      fallback || (
        <DefaultFallback message={message} />
      )
    );
  }

  // Get user's role from permissions or default to 'member'
  const userRole = (userPermissions?.role as UserRole) || 'member';

  // Check role requirement
  if (requiredRole) {
    const roleHierarchy: Record<UserRole, number> = {
      viewer: 1,
      member: 2,
      manager: 3,
      admin: 4,
    };

    const userRoleLevel = roleHierarchy[userRole] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

    if (userRoleLevel < requiredRoleLevel) {
      if (!showFallback) return null;
      return (
        fallback || (
          <DefaultFallback
            message={`This feature requires ${requiredRole} role or higher.`}
          />
        )
      );
    }
  }

  // Check specific permissions
  if (requiredPermissions.length > 0) {
    const userPermissionList = ROLE_PERMISSIONS[userRole] || [];
    const hasAllPermissions = requiredPermissions.every(permission =>
      userPermissionList.includes(permission)
    );

    if (!hasAllPermissions) {
      if (!showFallback) return null;
      const missingPermissions = requiredPermissions.filter(
        permission => !userPermissionList.includes(permission)
      );
      return (
        fallback || (
          <DefaultFallback
            message={`Missing required permissions: ${missingPermissions.join(', ')}`}
          />
        )
      );
    }
  }

  // All checks passed, render children
  return <>{children}</>;
}

// Helper hook to check permissions programmatically
export function usePermissions() {
  const { profile: user, company, permissions: userPermissions } = useAuth();

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;

    const userRole = (userPermissions?.role as UserRole) || 'member';
    const userPermissionList = ROLE_PERMISSIONS[userRole] || [];

    return userPermissionList.includes(permission);
  };

  const hasRole = (role: UserRole): boolean => {
    if (!user) return false;

    const userRole = (userPermissions?.role as UserRole) || 'member';
    const roleHierarchy: Record<UserRole, number> = {
      viewer: 1,
      member: 2,
      manager: 3,
      admin: 4,
    };

    const userRoleLevel = roleHierarchy[userRole] || 0;
    const requiredRoleLevel = roleHierarchy[role] || 0;

    return userRoleLevel >= requiredRoleLevel;
  };

  const isCompanyUser = (): boolean => {
    return user?.accountType === 'company' && !!company;
  };

  return {
    hasPermission,
    hasRole,
    isCompanyUser,
    userRole: (userPermissions?.role as UserRole) || 'member',
    user,
    company,
  };
}

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  fallbackTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  fallbackMessage: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
