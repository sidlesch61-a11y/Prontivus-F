"use client";

import React from "react";
import { useRequireAuth } from "@/contexts";

export default function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useRequireAuth();

  // Minimal auth check - just ensure user is logged in
  // The page itself will handle any additional checks
  if (isLoading) {
    return null; // Will show loading in the page
  }

  if (!user) {
    return null; // Will redirect to login
  }

  // Return children without any layout wrapper (no sidebar, no header)
  // This is a full-screen TV display
  return <>{children}</>;
}

