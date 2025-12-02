"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Check if this is the painel (TV display) page - skip sidebar/header for full screen
  const isPainelPage = pathname?.includes('/secretaria/painel') || pathname === '/secretaria/painel';
  
  // For painel page, render without any layout wrapper (full screen TV display)
  if (isPainelPage) {
    return <>{children}</>;
  }
  
  // This layout allows all authenticated users
  // Specific role restrictions can be added via allowedRoles, allowedRoleIds, or allowedRoleNames
  return (
    <RoleBasedLayout>
      {children}
    </RoleBasedLayout>
  );
}
