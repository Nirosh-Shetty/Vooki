'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'brand' | 'influencer' | 'manager';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Handle redirects at the top level with a single useEffect
  useEffect(() => {
    if (isLoading) {
      return;
    }

    // Not authenticated - redirect to sign in
    if (!user) {
      router.push('/signin');
      return;
    }

    // Check role if specified
    if (requiredRole && user.role !== requiredRole) {
      const redirectPath =
        user.role === 'brand'
          ? '/brand/dashboard'
          : user.role === 'manager'
            ? '/manager/dashboard'
            : '/influencer/dashboard';
      router.push(redirectPath);
    }
  }, [user, isLoading, requiredRole, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  // Not authenticated or wrong role - show nothing while redirecting
  if (!user || (requiredRole && user.role !== requiredRole)) {
    return null;
  }

  // Render protected content
  return <>{children}</>;
}
