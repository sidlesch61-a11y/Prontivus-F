"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, AlertCircle, Copy, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessRoute } from "@/lib/route-protection";
import { getUserMenu } from "@/lib/menu-api";
import { toast } from "sonner";

/**
 * Permission Debug Panel
 * For development/testing purposes only
 * Displays current user permissions and allows testing route access
 */
export function PermissionDebugPanel() {
  const { user } = useAuth();
  const [testRoute, setTestRoute] = React.useState("");
  const [testResult, setTestResult] = React.useState<any>(null);
  const [userPermissions, setUserPermissions] = React.useState<string[]>([]);
  const [menuStructure, setMenuStructure] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  React.useEffect(() => {
    loadPermissions();
  }, [user]);

  const loadPermissions = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const menuData = await getUserMenu();
      setMenuStructure(menuData);

      // Extract permissions from menu structure
      const permissions: string[] = [];
      if (menuData.groups) {
        menuData.groups.forEach((group: any) => {
          if (group.items) {
            group.items.forEach((item: any) => {
              if (item.permissions_required) {
                permissions.push(...item.permissions_required);
              }
            });
          }
        });
      }

      setUserPermissions([...new Set(permissions)]);
    } catch (error) {
      console.error('Error loading permissions:', error);
      toast.error('Failed to load permissions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestRoute = () => {
    if (!testRoute) return;

    const result = canAccessRoute(testRoute, user);
    setTestResult(result);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (!user) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-sm">Permission Debug Panel</CardTitle>
          <CardDescription className="text-xs">
            Please log in to view permissions
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Permission Debug Panel (Dev Only)
        </CardTitle>
        <CardDescription className="text-xs">
          View and test user permissions and route access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Info */}
        <div className="space-y-2">
          <Label className="text-xs">User Information</Label>
          <div className="p-3 bg-white rounded-lg border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Role ID:</span>
              <Badge variant="outline">{user.role_id || 'N/A'}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Role Name:</span>
              <Badge variant="outline">{user.role_name || 'N/A'}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Role Enum:</span>
              <Badge variant="outline">{user.role || 'N/A'}</Badge>
            </div>
          </div>
        </div>

        {/* Permissions List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Permissions ({userPermissions.length})</Label>
            <Button
              size="sm"
              variant="ghost"
              onClick={loadPermissions}
              className="h-6 text-xs"
              disabled={isLoading}
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          {isLoading ? (
            <div className="p-3 bg-white rounded-lg border text-xs text-gray-600">
              Loading permissions...
            </div>
          ) : userPermissions.length > 0 ? (
            <div className="p-3 bg-white rounded-lg border max-h-32 overflow-y-auto">
              <div className="flex flex-wrap gap-1">
                {userPermissions.map((permission, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {permission}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-white rounded-lg border text-xs text-gray-600">
              No permissions found
            </div>
          )}
        </div>

        {/* Route Testing */}
        <div className="space-y-2">
          <Label className="text-xs">Test Route Access</Label>
          <div className="flex gap-2">
            <Input
              placeholder="/admin/configuracoes/clinica"
              value={testRoute}
              onChange={(e) => setTestRoute(e.target.value)}
              className="h-8 text-xs"
            />
            <Button
              size="sm"
              onClick={handleTestRoute}
              className="h-8 text-xs"
              disabled={!testRoute}
            >
              Test
            </Button>
          </div>
          {testResult && (
            <div className={`p-3 rounded-lg border ${
              testResult.allowed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {testResult.allowed ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-xs font-medium">
                  {testResult.allowed ? 'Access Granted' : 'Access Denied'}
                </span>
              </div>
              {testResult.reason && (
                <p className="text-xs text-gray-600 mb-1">
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
        </div>

        {/* Menu Structure */}
        {menuStructure && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Menu Structure</Label>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(JSON.stringify(menuStructure, null, 2))}
                className="h-6 text-xs"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <div className="p-3 bg-white rounded-lg border max-h-40 overflow-y-auto">
              <pre className="text-xs text-gray-600">
                {JSON.stringify(menuStructure, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <div className="pt-2 border-t">
          <p className="text-xs text-gray-600">
            💡 This panel shows real-time permission data for the current user.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

