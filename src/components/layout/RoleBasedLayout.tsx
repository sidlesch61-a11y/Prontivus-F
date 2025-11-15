"use client";

import * as React from "react";
import { useRequireAuth } from "@/contexts";
import { useRouter } from "next/navigation";
import { Navigation } from "./Navigation";
import { Breadcrumbs } from "./Breadcrumbs";
import { AppHeader } from "@/components/app-header";
import { NavigationErrorBoundary } from "./NavigationErrorBoundary";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface RoleBasedLayoutProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  allowedRoleIds?: number[];
  allowedRoleNames?: string[];
  fallbackRoute?: string;
  roleColors?: {
    sidebar?: string;
    accent?: string;
  };
}

export function RoleBasedLayout({
  children,
  allowedRoles = [],
  allowedRoleIds = [],
  allowedRoleNames = [],
  fallbackRoute = "/dashboard",
  roleColors = {
    sidebar: "bg-blue-700",
    accent: "text-blue-700",
  },
}: RoleBasedLayoutProps) {
  const { user, isLoading } = useRequireAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if (!isLoading && user) {
      // Check role-based access
      let authorized = false;

      // Check by role enum
      if (allowedRoles.length > 0) {
        authorized = allowedRoles.includes(user.role);
      }

      // Check by role_id
      if (!authorized && allowedRoleIds.length > 0 && user.role_id) {
        authorized = allowedRoleIds.includes(user.role_id);
      }

      // Check by role_name
      if (!authorized && allowedRoleNames.length > 0 && user.role_name) {
        authorized = allowedRoleNames.includes(user.role_name);
      }

      // If no restrictions specified, allow all authenticated users
      if (allowedRoles.length === 0 && allowedRoleIds.length === 0 && allowedRoleNames.length === 0) {
        authorized = true;
      }

      setIsAuthorized(authorized);

      if (!authorized) {
        toast.error("Acesso negado. Você não tem permissão para acessar esta área.");
        router.push(fallbackRoute);
      }
    }
  }, [user, isLoading, allowedRoles, allowedRoleIds, allowedRoleNames, fallbackRoute, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  if (isAuthorized === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg border border-blue-200">
          <div className="mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-6">
            Você não tem permissão para acessar esta área.
          </p>
          <button
            onClick={() => router.push(fallbackRoute)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <NavigationErrorBoundary>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-blue-50 to-cyan-50">
        <Navigation />
        <main className="flex-1 flex flex-col lg:ml-[240px] transition-all duration-300">
          <AppHeader />
          <div className="px-4 lg:px-6 pt-4">
            <Breadcrumbs />
          </div>
          <div className="flex-1 p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </NavigationErrorBoundary>
  );
}

