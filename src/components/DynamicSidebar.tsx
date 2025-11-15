"use client";

import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AppSidebar } from "@/components/app-sidebar";
import { SuperAdminSidebar } from "@/components/super-admin/SuperAdminSidebar";
import { AdminClinicaSidebar } from "@/components/admin/AdminClinicaSidebar";
import { SecretarySidebar } from "@/components/secretaria/SecretarySidebar";
import { DoctorSidebar } from "@/components/medico/DoctorSidebar";
import { PacienteSidebar } from "@/components/paciente/PacienteSidebar";

/**
 * DynamicSidebar Component
 * Renders the correct sidebar based on the logged-in user's role
 */
export function DynamicSidebar() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  // Determine user role based on role_id, role_name, or legacy role enum
  const getUserRole = (): string | null => {
    // Priority 1: Check role_name (from menu system)
    if (user.role_name) {
      return user.role_name;
    }

    // Priority 2: Check role_id (from menu system)
    if (user.role_id) {
      // Map role_id to role name
      const roleIdMap: Record<number, string> = {
        1: "SuperAdmin",
        2: "AdminClinica",
        3: "Medico",
        4: "Secretaria",
        5: "Paciente",
      };
      return roleIdMap[user.role_id] || null;
    }

    // Priority 3: Fallback to legacy role enum
    const roleEnumMap: Record<string, string> = {
      admin: "SuperAdmin", // Default admin to SuperAdmin
      secretary: "Secretaria",
      doctor: "Medico",
      patient: "Paciente",
    };
    return roleEnumMap[user.role] || null;
  };

  const role = getUserRole();

  // Debug logging (remove in production if needed)
  if (process.env.NODE_ENV === 'development') {
    console.log('DynamicSidebar - User role detection:', {
      role_name: user.role_name,
      role_id: user.role_id,
      role_enum: user.role,
      detected_role: role,
    });
  }

  // Render appropriate sidebar based on role
  switch (role) {
    case "SuperAdmin":
      return <SuperAdminSidebar />;

    case "AdminClinica":
      return <AdminClinicaSidebar />;

    case "Secretaria":
      return <SecretarySidebar />;

    case "Medico":
      return <DoctorSidebar />;

    case "Paciente":
      // Always use PacienteSidebar for patients - don't fall back to AppSidebar
      return <PacienteSidebar />;

    default:
      // For patients, if role detection fails, still try to use PacienteSidebar
      // if the legacy role enum is "patient"
      if (user.role === 'patient') {
        console.warn('Role detection failed but user.role is "patient", using PacienteSidebar');
        return <PacienteSidebar />;
      }
      
      // Fallback to AppSidebar for unknown roles or when role cannot be determined
      // AppSidebar will try to load menu from API
      console.warn(`Unknown role: ${role}, falling back to AppSidebar`, {
        user_role: user.role,
        role_id: user.role_id,
        role_name: user.role_name,
      });
      return <AppSidebar />;
  }
}

