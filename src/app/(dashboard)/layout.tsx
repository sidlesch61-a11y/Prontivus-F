"use client";

import React from "react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout allows all authenticated users
  // Specific role restrictions can be added via allowedRoles, allowedRoleIds, or allowedRoleNames
  return (
    <RoleBasedLayout>
      {children}
    </RoleBasedLayout>
  );
}
