"use client";

import React, { useEffect } from "react";
import { DoctorSidebar } from "@/components/medico/DoctorSidebar";
import { AppHeader } from "@/components/app-header";
import { useRequireAuth } from "@/contexts";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useRequireAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      // Check if user is Doctor
      // Doctor role should be "doctor" with role_name "Medico" or role_id pointing to Medico
      const isDoctor = 
        user.role === 'doctor' && 
        (user.role_id === 3 || // Medico role_id from seed data
         user.role_name === 'Medico');
      
      if (!isDoctor) {
        toast.error("Acesso negado. Apenas médicos podem acessar esta área.");
        router.push("/dashboard");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-green-700 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  // Check if user is Doctor
  const isDoctor = 
    user.role === 'doctor' && 
    (user.role_id === 3 || user.role_name === 'Medico');

  if (!isDoctor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg border border-green-200">
          <div className="mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-6">
            Você não tem permissão para acessar a área médica.
            Apenas médicos podem acessar esta seção.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-green-50 to-emerald-50">
      <DoctorSidebar />
      <main className="flex-1 flex flex-col lg:ml-[240px] transition-all duration-300">
        <AppHeader />
        <div className="flex-1 p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

