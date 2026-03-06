import { Navigate } from 'react-router-dom';
import type { StaffProfile } from '../types';

interface ProtectedRouteProps {
  driver: StaffProfile | null;
  children: React.ReactNode;
}

export function ProtectedRoute({ driver, children }: ProtectedRouteProps) {
  if (!driver) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
