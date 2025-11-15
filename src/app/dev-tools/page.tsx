"use client";

import * as React from "react";
import { RoleSimulator } from "@/components/dev/RoleSimulator";
import { RouteAccessTester } from "@/components/dev/RouteAccessTester";
import { RoleSwitcher } from "@/components/dev/RoleSwitcher";
import { PermissionDebugPanel } from "@/components/dev/PermissionDebugPanel";
import { MenuStructureVisualizer } from "@/components/dev/MenuStructureVisualizer";
import { TestUserLogin } from "@/components/dev/TestUserLogin";
import { MenuItemTester } from "@/components/qa/MenuItemTester";
import { RouteProtectionTester } from "@/components/qa/RouteProtectionTester";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, TestTube, Shield, Menu, Key, LogIn } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Development Tools Page
 * Only accessible in development mode
 * Provides comprehensive testing tools for role-based menu system
 */
export default function DevToolsPage() {
  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            This page is only available in development mode.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <TestTube className="h-8 w-8 text-blue-600" />
          Development Tools
        </h1>
        <p className="text-gray-600">
          Comprehensive testing tools for role-based menu system and route protection.
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Development Only</AlertTitle>
        <AlertDescription>
          These tools are only available in development mode and will not be visible in production.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="login" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="login" className="flex items-center gap-2">
            <LogIn className="h-4 w-4" />
            Login
          </TabsTrigger>
          <TabsTrigger value="role-switcher" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Role Switcher
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="menu" className="flex items-center gap-2">
            <Menu className="h-4 w-4" />
            Menu Structure
          </TabsTrigger>
          <TabsTrigger value="routes" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Route Testing
          </TabsTrigger>
          <TabsTrigger value="menu-test" className="flex items-center gap-2">
            <Menu className="h-4 w-4" />
            Menu Test
          </TabsTrigger>
          <TabsTrigger value="route-test" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Route Test
          </TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="space-y-4">
          <TestUserLogin />
        </TabsContent>

        <TabsContent value="role-switcher" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <RoleSwitcher />
            <RoleSimulator />
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <PermissionDebugPanel />
        </TabsContent>

        <TabsContent value="menu" className="space-y-4">
          <MenuStructureVisualizer />
        </TabsContent>

        <TabsContent value="routes" className="space-y-4">
          <RouteAccessTester />
        </TabsContent>

        <TabsContent value="menu-test" className="space-y-4">
          <MenuItemTester />
        </TabsContent>

        <TabsContent value="route-test" className="space-y-4">
          <RouteProtectionTester />
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Testing Guide</CardTitle>
          <CardDescription>
            How to use the development tools for comprehensive testing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">1. Role Switching</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>Use Role Switcher to quickly switch between different user roles</li>
              <li>Role Simulator allows testing with specific role configurations</li>
              <li>Changes persist until reset or page reload</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">2. Permission Testing</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>View all permissions assigned to the current user</li>
              <li>Test route access for specific paths</li>
              <li>Debug permission issues in real-time</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">3. Menu Structure</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>Visualize the complete menu structure for the current user</li>
              <li>See which items are visible based on role and permissions</li>
              <li>Export menu structure for documentation</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">4. Route Testing</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>Test access to specific routes</li>
              <li>Verify role-based route protection</li>
              <li>Check redirect behavior for unauthorized access</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
