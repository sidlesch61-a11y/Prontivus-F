"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AccessDenied } from "@/components/layout/AccessDenied";
import { ShieldAlert, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function ForbiddenPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const error = searchParams.get('error');

  const getErrorMessage = () => {
    switch (error) {
      case 'access_denied':
        return 'Você não tem permissão para acessar esta área.';
      case 'insufficient_role':
        return 'Seu perfil não possui acesso a esta área.';
      case 'missing_permissions':
        return 'Você não possui as permissões necessárias para acessar esta área.';
      default:
        return 'Acesso negado. Entre em contato com o administrador se você acredita que deveria ter acesso.';
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <ShieldAlert className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl">403 - Acesso Negado</CardTitle>
          <CardDescription className="text-center mt-2">
            {getErrorMessage()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {from && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Tentativa de acesso:</strong> {from}
              </p>
            </div>
          )}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-800">
              Se você acredita que deveria ter acesso a esta área, entre em contato com o administrador do sistema.
            </p>
          </div>
          <div className="flex gap-3">
            {from && (
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            )}
            <Button
              onClick={() => router.push('/dashboard')}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Home className="h-4 w-4 mr-2" />
              Ir para Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ForbiddenPage() {
  return (
    <React.Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <ForbiddenPageContent />
    </React.Suspense>
  );
}

