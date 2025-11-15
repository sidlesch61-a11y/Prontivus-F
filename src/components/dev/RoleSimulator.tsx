"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ROLES } from "@/lib/route-protection";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Role Simulator Component
 * For development/testing purposes only
 * Allows simulating different user roles
 */
export function RoleSimulator() {
  const { user } = useAuth();
  const [simulatedRole, setSimulatedRole] = React.useState<string | null>(null);

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const handleSimulate = (roleId: number) => {
    const role = Object.values(ROLES).find(r => r.id === roleId);
    if (role) {
      // Store simulated role in localStorage
      localStorage.setItem('dev_simulated_role', JSON.stringify({
        role_id: role.id,
        role_name: role.name,
        role: role.enum,
      }));
      setSimulatedRole(role.name);
      window.location.reload();
    }
  };

  const handleReset = () => {
    localStorage.removeItem('dev_simulated_role');
    setSimulatedRole(null);
    window.location.reload();
  };

  const simulatedRoleData = React.useMemo(() => {
    try {
      const stored = localStorage.getItem('dev_simulated_role');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      return null;
    }
    return null;
  }, []);

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-sm">🔧 Role Simulator (Dev Only)</CardTitle>
        <CardDescription className="text-xs">
          Simulate different user roles for testing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-medium">Current User:</p>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline">
              ID: {user?.role_id || 'N/A'}
            </Badge>
            <Badge variant="outline">
              Name: {user?.role_name || 'N/A'}
            </Badge>
            <Badge variant="outline">
              Enum: {user?.role || 'N/A'}
            </Badge>
          </div>
        </div>

        {simulatedRoleData && (
          <div className="space-y-2">
            <p className="text-xs font-medium">Simulated Role:</p>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary">
                {simulatedRoleData.role_name}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
                className="h-6 text-xs"
              >
                Reset
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-medium">Simulate Role:</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(ROLES).map((role) => (
              <Button
                key={role.id}
                size="sm"
                variant="outline"
                onClick={() => handleSimulate(role.id)}
                className="h-8 text-xs"
                disabled={simulatedRoleData?.role_id === role.id}
              >
                {role.name}
              </Button>
            ))}
          </div>
        </div>

        <p className="text-xs text-yellow-700">
          ⚠️ This component is only visible in development mode.
        </p>
      </CardContent>
    </Card>
  );
}

