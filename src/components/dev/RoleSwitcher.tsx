"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ROLES } from "@/lib/route-protection";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw, User, Shield, Stethoscope, ClipboardList, UserRound } from "lucide-react";

/**
 * Role Switcher Component
 * For development/testing purposes only
 * Allows switching between different user roles for testing
 */
export function RoleSwitcher() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = React.useState<string>("");
  const [isSimulating, setIsSimulating] = React.useState(false);

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  React.useEffect(() => {
    // Check if there's a simulated role in localStorage
    const simulated = localStorage.getItem('dev_simulated_role');
    if (simulated) {
      try {
        const roleData = JSON.parse(simulated);
        setSelectedRole(roleData.role_name || '');
        setIsSimulating(true);
      } catch {
        // Invalid data
      }
    }
  }, []);

  const roleOptions = [
    { id: 1, name: 'SuperAdmin', icon: Shield, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { id: 2, name: 'AdminClinica', icon: Shield, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { id: 3, name: 'Medico', icon: Stethoscope, color: 'text-green-600', bgColor: 'bg-green-100' },
    { id: 4, name: 'Secretaria', icon: ClipboardList, color: 'text-teal-600', bgColor: 'bg-teal-100' },
    { id: 5, name: 'Paciente', icon: UserRound, color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
  ];

  const handleRoleSwitch = (roleName: string) => {
    const role = roleOptions.find(r => r.name === roleName);
    if (!role) return;

    // Store simulated role
    const roleData = {
      role_id: role.id,
      role_name: role.name,
      role: role.name === 'SuperAdmin' || role.name === 'AdminClinica' ? 'admin' :
            role.name === 'Medico' ? 'doctor' :
            role.name === 'Secretaria' ? 'secretary' : 'patient',
    };

    localStorage.setItem('dev_simulated_role', JSON.stringify(roleData));
    setSelectedRole(roleName);
    setIsSimulating(true);
    toast.success(`Switched to ${roleName} role`);
    
    // Reload to apply changes
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleReset = () => {
    localStorage.removeItem('dev_simulated_role');
    setSelectedRole('');
    setIsSimulating(false);
    toast.success('Role simulation reset');
    
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const getRoleIcon = (roleName: string) => {
    const role = roleOptions.find(r => r.name === roleName);
    return role?.icon || User;
  };

  const getRoleColor = (roleName: string) => {
    const role = roleOptions.find(r => r.name === roleName);
    return role?.color || 'text-gray-600';
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Role Switcher (Dev Only)
        </CardTitle>
        <CardDescription className="text-xs">
          Switch between user roles for testing navigation and permissions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs">Current User</Label>
          <div className="flex items-center gap-2 p-2 bg-white rounded-lg border">
            <Badge variant="outline" className="text-xs">
              {user?.role_name || user?.role || 'N/A'}
            </Badge>
            <span className="text-xs text-gray-600">
              ID: {user?.role_id || 'N/A'}
            </span>
          </div>
        </div>

        {isSimulating && (
          <div className="space-y-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Simulating: {selectedRole}
                </Badge>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
                className="h-6 text-xs"
              >
                Reset
              </Button>
            </div>
            <p className="text-xs text-yellow-700">
              ⚠️ Role simulation is active. Navigation and permissions are based on simulated role.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-xs">Switch to Role</Label>
          <div className="grid grid-cols-2 gap-2">
            {roleOptions.map((role) => {
              const Icon = role.icon;
              const isActive = selectedRole === role.name;
              
              return (
                <Button
                  key={role.id}
                  size="sm"
                  variant={isActive ? "default" : "outline"}
                  onClick={() => handleRoleSwitch(role.name)}
                  className={`h-auto py-2 flex flex-col items-center gap-1 ${isActive ? role.bgColor : ''}`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? role.color : 'text-gray-600'}`} />
                  <span className="text-xs">{role.name}</span>
                </Button>
              );
            })}
          </div>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-gray-600">
            💡 Tip: After switching roles, the page will reload to apply changes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

