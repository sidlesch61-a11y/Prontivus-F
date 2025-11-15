/**
 * Menu API service
 * Fetches dynamic menu structure from backend based on user role
 */
import { api } from './api';

export interface MenuItem {
  id: number;
  name: string;
  route: string;
  icon?: string;
  order_index: number;
  description?: string;
  badge?: string;
  is_external?: boolean;
  permissions_required?: string[];
}

export interface MenuGroup {
  id: number;
  name: string;
  description?: string;
  order_index: number;
  icon?: string;
  items: MenuItem[];
}

export interface MenuStructure {
  groups: MenuGroup[];
}

/**
 * Fetch menu structure for the current authenticated user
 */
export async function getUserMenu(): Promise<MenuStructure> {
  try {
    const response = await api.get<MenuStructure>('/api/menu/user');
    return response;
  } catch (error) {
    console.error('Failed to fetch user menu:', error);
    // Return empty menu structure on error
    return { groups: [] };
  }
}

/**
 * Fetch menu structure for a specific role (admin only)
 */
export async function getMenuByRole(roleName: string): Promise<MenuStructure> {
  try {
    const response = await api.get<MenuStructure>(`/api/menu/${roleName}`);
    return response;
  } catch (error) {
    console.error(`Failed to fetch menu for role ${roleName}:`, error);
    return { groups: [] };
  }
}

/**
 * Check if user has permission for a menu item
 */
export function hasMenuItemPermission(
  item: MenuItem,
  userPermissions: string[]
): boolean {
  if (!item.permissions_required || item.permissions_required.length === 0) {
    return true; // No permissions required
  }
  
  return item.permissions_required.every(permission =>
    userPermissions.includes(permission)
  );
}

/**
 * Filter menu items by user permissions
 */
export function filterMenuByPermissions(
  menuStructure: MenuStructure,
  userPermissions: string[]
): MenuStructure {
  return {
    groups: menuStructure.groups.map(group => ({
      ...group,
      items: group.items.filter(item =>
        hasMenuItemPermission(item, userPermissions)
      ),
    })).filter(group => group.items.length > 0), // Remove empty groups
  };
}
