"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { canAccessRoute, ROUTE_CONFIGS } from "@/lib/route-protection";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Route Access Tester Component
 * For development/testing purposes only
 * Tests route access for different user roles
 */
export function RouteAccessTester() {
  const { user } = useAuth();
  const [testRoute, setTestRoute] = React.useState("");
  const [testResult, setTestResult] = React.useState<{
    allowed: boolean;
    reason?: string;
    redirectTo?: string;
  } | null>(null);

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const handleTest = () => {
    if (!testRoute) {
      return;
    }

    const result = canAccessRoute(testRoute, user);
    setTestResult(result);
  };

  const testWithRole = (roleId: number, roleName: string, roleEnum: string) => {
    const mockUser = {
      role_id: roleId,
      role_name: roleName,
      role: roleEnum,
      permissions: [],
    };

    if (!testRoute) {
      return;
    }

    const result = canAccessRoute(testRoute, mockUser);
    setTestResult(result);
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-sm">🧪 Route Access Tester (Dev Only)</CardTitle>
        <CardDescription className="text-xs">
          Test route access for different user roles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            placeholder="/admin/configuracoes/clinica"
            value={testRoute}
            onChange={(e) => setTestRoute(e.target.value)}
            className="h-8 text-xs"
          />
          <Button
            size="sm"
            onClick={handleTest}
            className="w-full h-8 text-xs"
            disabled={!testRoute}
          >
            Test with Current User
          </Button>
        </div>

        {testResult && (
          <div className="space-y-2 p-3 bg-white rounded-lg border">
            <div className="flex items-center gap-2">
              {testResult.allowed ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-xs font-medium">
                {testResult.allowed ? "Access Granted" : "Access Denied"}
              </span>
            </div>
            {testResult.reason && (
              <p className="text-xs text-gray-600">
                Reason: {testResult.reason}
              </p>
            )}
            {testResult.redirectTo && (
              <p className="text-xs text-gray-600">
                Redirect to: {testResult.redirectTo}
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-medium">Test with Role:</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => testWithRole(1, 'SuperAdmin', 'admin')}
              className="h-8 text-xs"
              disabled={!testRoute}
            >
              SuperAdmin
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => testWithRole(2, 'AdminClinica', 'admin')}
              className="h-8 text-xs"
              disabled={!testRoute}
            >
              AdminClinica
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => testWithRole(3, 'Medico', 'doctor')}
              className="h-8 text-xs"
              disabled={!testRoute}
            >
              Medico
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => testWithRole(4, 'Secretaria', 'secretary')}
              className="h-8 text-xs"
              disabled={!testRoute}
            >
              Secretaria
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => testWithRole(5, 'Paciente', 'patient')}
              className="h-8 text-xs"
              disabled={!testRoute}
            >
              Paciente
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium">Protected Routes:</p>
          <div className="space-y-1">
            {ROUTE_CONFIGS.map((config) => (
              <div key={config.path} className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className="text-xs">
                  {config.path}
                </Badge>
                <span className="text-gray-600">
                  {config.roleNames?.join(', ') || 'Any'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-blue-700">
          ⚠️ This component is only visible in development mode.
        </p>
      </CardContent>
    </Card>
  );
}

