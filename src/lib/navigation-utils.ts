/**
 * Navigation utilities
 * Helper functions for navigation and route management
 */

export interface RoutePermission {
  route: string;
  permissions: string[];
  roles?: string[];
}

/**
 * Check if user has permission to access a route
 */
export function canAccessRoute(
  route: string,
  userPermissions: string[],
  userRole?: string,
  routePermissions?: RoutePermission[]
): boolean {
  // If no route permissions defined, allow access
  if (!routePermissions || routePermissions.length === 0) {
    return true;
  }

  const routePermission = routePermissions.find(rp => rp.route === route);
  if (!routePermission) {
    return true; // Route not restricted
  }

  // Check role-based access
  if (routePermission.roles && routePermission.roles.length > 0) {
    if (!userRole || !routePermission.roles.includes(userRole)) {
      return false;
    }
  }

  // Check permission-based access
  if (routePermission.permissions && routePermission.permissions.length > 0) {
    const hasAllPermissions = routePermission.permissions.every(permission =>
      userPermissions.includes(permission)
    );
    if (!hasAllPermissions) {
      return false;
    }
  }

  return true;
}

/**
 * Filter menu items based on user permissions
 */
export function filterMenuByPermissions<T extends { permissions?: string[]; route: string }>(
  items: T[],
  userPermissions: string[]
): T[] {
  return items.filter(item => {
    if (!item.permissions || item.permissions.length === 0) {
      return true; // No permissions required
    }
    return item.permissions.every(permission => userPermissions.includes(permission));
  });
}

/**
 * Get route metadata for breadcrumbs
 */
export function getRouteMetadata(route: string): { label: string; icon?: string } {
  const routeMap: Record<string, { label: string; icon?: string }> = {
    "/": { label: "Início", icon: "home" },
    "/dashboard": { label: "Dashboard", icon: "layout-grid" },
    "/paciente": { label: "Paciente", icon: "user-round" },
    "/medico": { label: "Médico", icon: "stethoscope" },
    "/secretaria": { label: "Secretária", icon: "clipboard-list" },
    "/admin": { label: "Administração", icon: "shield-check" },
    "/super-admin": { label: "Super Admin", icon: "shield-check" },
  };

  // Try exact match first
  if (routeMap[route]) {
    return routeMap[route];
  }

  // Try to match by prefix
  const matchedRoute = Object.keys(routeMap).find(key => route.startsWith(key));
  if (matchedRoute) {
    return routeMap[matchedRoute];
  }

  // Default: convert route to readable label
  const label = route
    .split("/")
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" → ");

  return { label };
}

/**
 * Check if route is external
 */
export function isExternalRoute(route: string): boolean {
  return route.startsWith("http://") || route.startsWith("https://");
}

/**
 * Normalize route path
 */
export function normalizeRoute(route: string): string {
  // Remove trailing slash
  let normalized = route.replace(/\/$/, "");
  
  // Ensure leading slash
  if (!normalized.startsWith("/")) {
    normalized = "/" + normalized;
  }

  return normalized;
}

