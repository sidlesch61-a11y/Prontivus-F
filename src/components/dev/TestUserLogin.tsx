"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TEST_USERS, getTestUser } from "@/lib/test-users";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogIn, User, Shield, Stethoscope, ClipboardList, UserRound } from "lucide-react";

/**
 * Test User Login Component
 * For development/testing purposes only
 * Provides quick login for test users of each role
 */
export function TestUserLogin() {
  const { login, user } = useAuth();
  const router = useRouter();
  const [isLoggingIn, setIsLoggingIn] = React.useState<string | null>(null);

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const roleIcons = {
    SuperAdmin: Shield,
    AdminClinica: Shield,
    Medico: Stethoscope,
    Secretaria: ClipboardList,
    Paciente: UserRound,
  };

  const handleQuickLogin = async (roleName: string) => {
    const testUser = getTestUser(roleName);
    if (!testUser) {
      toast.error(`Test user for ${roleName} not found`);
      return;
    }

    setIsLoggingIn(roleName);
    try {
      await login({
        username_or_email: testUser.username,
        password: testUser.password,
      });

      toast.success(`Logged in as ${testUser.role_name}`);
      
      // Redirect to role-appropriate dashboard
      const roleRoutes: Record<string, string> = {
        'SuperAdmin': '/super-admin',
        'AdminClinica': '/admin',
        'Medico': '/medico',
        'Secretaria': '/secretaria',
        'Paciente': '/paciente',
      };

      const redirectRoute = roleRoutes[testUser.role_name] || '/dashboard';
      router.push(redirectRoute);
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error?.message || `Failed to login as ${roleName}`);
    } finally {
      setIsLoggingIn(null);
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <LogIn className="h-4 w-4" />
          Test User Login (Dev Only)
        </CardTitle>
        <CardDescription className="text-xs">
          Quick login for test users of each role
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {user && (
          <div className="p-3 bg-white rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Currently logged in as: {user.role_name || user.role}
                </Badge>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-medium">Quick Login</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(TEST_USERS).map((testUser) => {
              const Icon = roleIcons[testUser.role_name as keyof typeof roleIcons] || User;
              const isLoggingInRole = isLoggingIn === testUser.role_name;
              const isCurrentUser = user?.role_name === testUser.role_name;

              return (
                <Button
                  key={testUser.id}
                  size="sm"
                  variant={isCurrentUser ? "default" : "outline"}
                  onClick={() => handleQuickLogin(testUser.role_name)}
                  disabled={isLoggingInRole || isCurrentUser}
                  className="h-auto py-2 flex flex-col items-center gap-1"
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">{testUser.role_name}</span>
                  {isLoggingInRole && (
                    <span className="text-xs text-gray-500">Logging in...</span>
                  )}
                  {isCurrentUser && (
                    <span className="text-xs text-gray-500">Current</span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-gray-600">
            💡 These are test users. In production, use the regular login page.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

