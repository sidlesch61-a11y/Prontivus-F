"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Shield, TestTube } from "lucide-react";
import { ROUTE_CONFIGS } from "@/lib/route-protection";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessRoute } from "@/lib/route-protection";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * Route Protection Tester Component
 * Tests route protection for all protected routes
 */
export function RouteProtectionTester() {
  const { user } = useAuth();
  const router = useRouter();
  const [testResults, setTestResults] = React.useState<Record<string, any>>({});
  const [isTesting, setIsTesting] = React.useState(false);

  const testRoute = async (route: string) => {
    const result = canAccessRoute(route, user);
    setTestResults(prev => ({ ...prev, [route]: result }));
    return result;
  };

  const testAllRoutes = async () => {
    setIsTesting(true);
    const results: Record<string, any> = {};

    for (const config of ROUTE_CONFIGS) {
      results[config.path] = await testRoute(config.path);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setIsTesting(false);
    const allowedCount = Object.values(results).filter((r: any) => r.allowed).length;
    toast.success(`Teste concluído: ${allowedCount}/${ROUTE_CONFIGS.length} rotas acessíveis`);
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Route Protection Tester</CardTitle>
          <CardDescription>Por favor, faça login para testar</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const allowedCount = Object.values(testResults).filter((r: any) => r?.allowed).length;
  const deniedCount = Object.values(testResults).filter((r: any) => !r?.allowed).length;

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Route Protection Tester
        </CardTitle>
        <CardDescription className="text-xs">
          Test route protection for all protected routes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm font-medium">Total: {ROUTE_CONFIGS.length} routes</div>
            <div className="flex gap-2 text-xs">
              <Badge variant="outline" className="text-green-600">
                Allowed: {allowedCount}
              </Badge>
              <Badge variant="outline" className="text-red-600">
                Denied: {deniedCount}
              </Badge>
            </div>
          </div>
          <Button
            size="sm"
            onClick={testAllRoutes}
            disabled={isTesting}
          >
            {isTesting ? 'Testing...' : 'Test All Routes'}
          </Button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {ROUTE_CONFIGS.map((config) => {
            const result = testResults[config.path];
            return (
              <div
                key={config.path}
                className="flex items-center justify-between p-3 bg-white rounded border"
              >
                <div className="flex items-center gap-3 flex-1">
                  {result ? (
                    result.allowed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )
                  ) : (
                    <TestTube className="h-5 w-5 text-gray-400" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-sm">{config.path}</div>
                    {result && !result.allowed && (
                      <div className="text-xs text-gray-600">
                        Reason: {result.reason} → {result.redirectTo}
                      </div>
                    )}
                  </div>
                  <Badge variant="outline">
                    {config.roleNames?.join(', ') || 'Any'}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => testRoute(config.path)}
                  disabled={isTesting}
                  className="h-8 text-xs"
                >
                  Test
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

