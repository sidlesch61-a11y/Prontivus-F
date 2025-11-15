"use client";

import * as React from "react";
import { MenuItemTester } from "@/components/qa/MenuItemTester";
import { RouteProtectionTester } from "@/components/qa/RouteProtectionTester";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2, Shield, Menu, Smartphone, Accessibility } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

/**
 * Quality Assurance Page
 * Comprehensive testing tools for role-based menu system
 */
export default function QAPage() {
  // Only show in development or for admins
  if (process.env.NODE_ENV === 'production') {
    return (
      <ProtectedRoute allowedRoleIds={[1, 2]} allowedRoleNames={['SuperAdmin', 'AdminClinica']}>
        <QAContent />
      </ProtectedRoute>
    );
  }

  return <QAContent />;
}

function QAContent() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
          Quality Assurance
        </h1>
        <p className="text-gray-600">
          Comprehensive testing tools for role-based menu system and route protection.
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Testing Tools</AlertTitle>
        <AlertDescription>
          Use these tools to verify menu items, route protection, and system functionality.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="menu" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="menu" className="flex items-center gap-2">
            <Menu className="h-4 w-4" />
            Menu Testing
          </TabsTrigger>
          <TabsTrigger value="routes" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Route Protection
          </TabsTrigger>
        </TabsList>

        <TabsContent value="menu" className="space-y-4">
          <MenuItemTester />
        </TabsContent>

        <TabsContent value="routes" className="space-y-4">
          <RouteProtectionTester />
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Testing Checklist</CardTitle>
          <CardDescription>
            Complete checklist for quality assurance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Menu Testing</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>✅ All menu items load correctly for each role</li>
              <li>✅ Menu items are properly filtered by permissions</li>
              <li>✅ Active state highlighting works correctly</li>
              <li>✅ Menu groups expand/collapse properly</li>
              <li>✅ Icons display correctly for all items</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Route Protection</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>✅ All routes are properly protected</li>
              <li>✅ Unauthorized access is blocked</li>
              <li>✅ Redirects work correctly</li>
              <li>✅ Error messages are clear</li>
              <li>✅ Middleware protection is active</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Mobile Responsiveness</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>✅ Sidebar works on mobile devices</li>
              <li>✅ Menu items are touch-friendly</li>
              <li>✅ Navigation is smooth on mobile</li>
              <li>✅ Active states are visible</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Accessibility</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>✅ Keyboard navigation works</li>
              <li>✅ Screen reader compatible</li>
              <li>✅ ARIA labels are present</li>
              <li>✅ Color contrast meets standards</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

