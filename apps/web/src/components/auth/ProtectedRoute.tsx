'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ 
  children, 
  fallback,
  redirectTo = '/crm',
  allowedRoles 
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect during loading
    if (isLoading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      console.log('🔒 Not authenticated, redirecting to login...');
      router.replace(redirectTo);
      return;
    }

    // Check role permissions if specified
    if (allowedRoles && allowedRoles.length > 0 && user) {
      if (!allowedRoles.includes(user.role)) {
        console.log(`🚫 Access denied. Required roles: ${allowedRoles.join(', ')}, User role: ${user.role}`);
        // Redirect to dashboard or show access denied
        router.replace('/crm/dashboard');
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, router, redirectTo, allowedRoles]);

  // Show loading spinner during auth check
  if (isLoading) {
    return fallback || (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '2rem', 
            marginBottom: '1rem',
            animation: 'spin 1s linear infinite'
          }}>
            ⏳
          </div>
          <p style={{ color: '#6b7280' }}>Checking authentication...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Don't render if role check fails
  if (allowedRoles && allowedRoles.length > 0 && user) {
    if (!allowedRoles.includes(user.role)) {
      return (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
            <h2 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>Access Denied</h2>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              You don't have permission to access this page.
            </p>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Required roles: {allowedRoles.join(', ')} | Your role: {user.role}
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}

// Convenience wrapper for admin-only pages
export function AdminOnlyRoute({ children, ...props }: Omit<ProtectedRouteProps, 'allowedRoles'>) {
  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'OFFICE_ADMIN']} {...props}>
      {children}
    </ProtectedRoute>
  );
}

// Convenience wrapper for manager+ pages
export function ManagerOnlyRoute({ children, ...props }: Omit<ProtectedRouteProps, 'allowedRoles'>) {
  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'OFFICE_ADMIN', 'MANAGER']} {...props}>
      {children}
    </ProtectedRoute>
  );
}

// Convenience wrapper for authenticated pages (any role)
export function AuthenticatedRoute({ children, ...props }: Omit<ProtectedRouteProps, 'allowedRoles'>) {
  return (
    <ProtectedRoute {...props}>
      {children}
    </ProtectedRoute>
  );
}
