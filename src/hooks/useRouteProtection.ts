"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessRoute, getRoleLandingPage } from "@/lib/route-protection";

interface RouteProtectionResult {
  isAuthorized: boolean;
  isLoading: boolean;
  reason?: string;
  redirectTo?: string;
}

/**
 * Hook for route protection
 * Checks if current user has access to current route
 */
export function useRouteProtection(): RouteProtectionResult {
  const { user, isLoading: authLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reason, setReason] = useState<string | undefined>();
  const [redirectTo, setRedirectTo] = useState<string | undefined>();

  useEffect(() => {
    if (authLoading) {
      return;
    }

    const checkAccess = () => {
      const accessResult = canAccessRoute(pathname, user);

      setIsAuthorized(accessResult.allowed);
      setReason(accessResult.reason);
      setRedirectTo(accessResult.redirectTo);
      setIsLoading(false);

      // Auto-redirect if not authorized
      if (!accessResult.allowed && accessResult.redirectTo) {
        const redirectUrl = new URL(accessResult.redirectTo, window.location.origin);
        redirectUrl.searchParams.set('error', accessResult.reason || 'access_denied');
        redirectUrl.searchParams.set('from', pathname);
        router.push(redirectUrl.toString());
      }
    };

    checkAccess();
  }, [pathname, user, authLoading, router]);

  return {
    isAuthorized: isAuthorized ?? false,
    isLoading: isLoading || authLoading,
    reason,
    redirectTo,
  };
}

/**
 * Hook to get role-appropriate landing page
 */
export function useRoleLandingPage(): string {
  const { user } = useAuth();
  return getRoleLandingPage(user);
}

