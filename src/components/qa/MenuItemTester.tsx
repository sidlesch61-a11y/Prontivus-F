"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, TestTube } from "lucide-react";
import { getUserMenu, MenuGroup, MenuItem } from "@/lib/menu-api";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * Menu Item Tester Component
 * Tests all menu items for the current user role
 */
export function MenuItemTester() {
  const { user } = useAuth();
  const router = useRouter();
  const [menuGroups, setMenuGroups] = React.useState<MenuGroup[]>([]);
  const [testResults, setTestResults] = React.useState<Record<number, 'pending' | 'success' | 'error'>>({});
  const [isTesting, setIsTesting] = React.useState(false);

  React.useEffect(() => {
    loadMenu();
  }, [user]);

  const loadMenu = async () => {
    if (!user) return;

    try {
      const menuData = await getUserMenu();
      if (menuData.groups) {
        setMenuGroups(menuData.groups);
      }
    } catch (error) {
      console.error('Error loading menu:', error);
    }
  };

  const testMenuItem = async (item: MenuItem) => {
    try {
      router.push(item.route);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTestResults(prev => ({ ...prev, [item.id]: 'success' }));
      return true;
    } catch (error) {
      setTestResults(prev => ({ ...prev, [item.id]: 'error' }));
      return false;
    }
  };

  const testAllItems = async () => {
    setIsTesting(true);
    const results: Record<number, 'pending' | 'success' | 'error'> = {};

    for (const group of menuGroups) {
      for (const item of group.items) {
        results[item.id] = 'pending';
        setTestResults({ ...results });
        
        const success = await testMenuItem(item);
        results[item.id] = success ? 'success' : 'error';
        setTestResults({ ...results });
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setIsTesting(false);
    const successCount = Object.values(results).filter(r => r === 'success').length;
    const totalCount = Object.keys(results).length;
    toast.success(`Teste concluído: ${successCount}/${totalCount} itens testados`);
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Menu Item Tester</CardTitle>
          <CardDescription>Por favor, faça login para testar</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const totalItems = menuGroups.reduce((acc, group) => acc + group.items.length, 0);
  const successCount = Object.values(testResults).filter(r => r === 'success').length;
  const errorCount = Object.values(testResults).filter(r => r === 'error').length;
  const pendingCount = Object.values(testResults).filter(r => r === 'pending').length;

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <TestTube className="h-4 w-4" />
          Menu Item Tester
        </CardTitle>
        <CardDescription className="text-xs">
          Test all menu items for current user role
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm font-medium">Total: {totalItems} items</div>
            <div className="flex gap-2 text-xs">
              <Badge variant="outline" className="text-green-600">
                Success: {successCount}
              </Badge>
              <Badge variant="outline" className="text-red-600">
                Error: {errorCount}
              </Badge>
              <Badge variant="outline" className="text-yellow-600">
                Pending: {pendingCount}
              </Badge>
            </div>
          </div>
          <Button
            size="sm"
            onClick={testAllItems}
            disabled={isTesting || totalItems === 0}
          >
            {isTesting ? 'Testing...' : 'Test All Items'}
          </Button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {menuGroups.map((group) => (
            <div key={group.id} className="space-y-1">
              <div className="text-xs font-semibold text-gray-700 uppercase">
                {group.name}
              </div>
              {group.items.map((item) => {
                const status = testResults[item.id] || 'pending';
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 bg-white rounded border text-xs"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      {status === 'error' && <XCircle className="h-4 w-4 text-red-600" />}
                      {status === 'pending' && <AlertCircle className="h-4 w-4 text-gray-400" />}
                      <span className="flex-1">{item.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {item.route}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => testMenuItem(item)}
                      disabled={isTesting}
                      className="h-6 text-xs"
                    >
                      Test
                    </Button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

