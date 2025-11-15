"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Folder, File, Copy, RefreshCw } from "lucide-react";
import { getUserMenu, MenuGroup, MenuItem } from "@/lib/menu-api";
import { getIconFromName } from "@/lib/icon-mapper";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Menu Structure Visualizer
 * For development/testing purposes only
 * Visualizes the current user's menu structure
 */
export function MenuStructureVisualizer() {
  const { user } = useAuth();
  const [menuStructure, setMenuStructure] = React.useState<MenuGroup[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [expandedGroups, setExpandedGroups] = React.useState<Record<number, boolean>>({});

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  React.useEffect(() => {
    loadMenu();
  }, [user]);

  const loadMenu = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const menuData = await getUserMenu();
      if (menuData.groups) {
        setMenuStructure(menuData.groups);
        // Expand all groups by default
        const expanded: Record<number, boolean> = {};
        menuData.groups.forEach((group: MenuGroup) => {
          expanded[group.id] = true;
        });
        setExpandedGroups(expanded);
      }
    } catch (error) {
      console.error('Error loading menu:', error);
      toast.error('Failed to load menu structure');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleGroup = (groupId: number) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const copyMenuStructure = () => {
    navigator.clipboard.writeText(JSON.stringify(menuStructure, null, 2));
    toast.success('Menu structure copied to clipboard');
  };

  if (!user) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-sm">Menu Structure Visualizer</CardTitle>
          <CardDescription className="text-xs">
            Please log in to view menu structure
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Folder className="h-4 w-4" />
          Menu Structure Visualizer (Dev Only)
        </CardTitle>
        <CardDescription className="text-xs">
          Visualize the current user's menu structure and navigation items
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {menuStructure.length} Groups, {menuStructure.reduce((acc, g) => acc + g.items.length, 0)} Items
          </Badge>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={loadMenu}
              className="h-6 text-xs"
              disabled={isLoading}
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={copyMenuStructure}
              className="h-6 text-xs"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-4 text-center text-xs text-gray-600">
            Loading menu structure...
          </div>
        ) : menuStructure.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-600">
            No menu items found
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {menuStructure.map((group: MenuGroup) => {
              const isExpanded = expandedGroups[group.id] ?? false;
              const GroupIcon = group.icon ? getIconFromName(group.icon) : Folder;

              return (
                <div key={group.id} className="border rounded-lg bg-white">
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {GroupIcon && <GroupIcon className="h-4 w-4 text-gray-600" />}
                      <span className="text-sm font-medium">{group.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {group.items.length}
                      </Badge>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t bg-gray-50">
                      {group.items.length === 0 ? (
                        <div className="p-3 text-xs text-gray-500 text-center">
                          No items in this group
                        </div>
                      ) : (
                        group.items.map((item: MenuItem) => {
                          const ItemIcon = item.icon ? getIconFromName(item.icon) : File;

                          return (
                            <div
                              key={item.id}
                              className="p-3 border-b last:border-b-0 hover:bg-white transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                {ItemIcon && <ItemIcon className="h-3 w-3 text-gray-500" />}
                                <span className="text-xs flex-1">{item.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {item.route}
                                </Badge>
                              </div>
                              {item.permissions_required && item.permissions_required.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {item.permissions_required.map((perm, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {perm}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-2 border-t">
          <p className="text-xs text-gray-600">
            💡 This visualizer shows the menu structure as seen by the current user.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

