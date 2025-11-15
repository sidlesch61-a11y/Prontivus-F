/**
 * Route Protection Utilities
 * Helper functions for route access control
 */

export interface RouteConfig {
  path: string;
  roleIds?: number[];
  roleNames?: string[];
  roleEnums?: string[];
  permissions?: string[];
  redirectTo?: string;
}

/**
 * Role definitions
 */
export const ROLES = {
  SUPER_ADMIN: {
    id: 1,
    name: 'SuperAdmin',
    enum: 'admin',
    routes: ['/super-admin'],
  },
  ADMIN_CLINICA: {
    id: 2,
    name: 'AdminClinica',
    enum: 'admin',
    routes: ['/admin'],
  },
  MEDICO: {
    id: 3,
    name: 'Medico',
    enum: 'doctor',
    routes: ['/medico'],
  },
  SECRETARIA: {
    id: 4,
    name: 'Secretaria',
    enum: 'secretary',
    routes: ['/secretaria'],
  },
  PACIENTE: {
    id: 5,
    name: 'Paciente',
    enum: 'patient',
    routes: ['/paciente'],
  },
} as const;

/**
 * Route protection configuration
 */
export const ROUTE_CONFIGS: RouteConfig[] = [
  {
    path: '/super-admin',
    roleIds: [ROLES.SUPER_ADMIN.id],
    roleNames: [ROLES.SUPER_ADMIN.name],
    roleEnums: [ROLES.SUPER_ADMIN.enum],
    redirectTo: '/dashboard',
  },
  {
    path: '/admin',
    roleIds: [ROLES.ADMIN_CLINICA.id],
    roleNames: [ROLES.ADMIN_CLINICA.name],
    roleEnums: [ROLES.ADMIN_CLINICA.enum],
    redirectTo: '/dashboard',
  },
  {
    path: '/medico',
    roleIds: [ROLES.MEDICO.id],
    roleNames: [ROLES.MEDICO.name],
    roleEnums: [ROLES.MEDICO.enum],
    redirectTo: '/dashboard',
  },
  {
    path: '/secretaria',
    roleIds: [ROLES.SECRETARIA.id],
    roleNames: [ROLES.SECRETARIA.name],
    roleEnums: [ROLES.SECRETARIA.enum],
    redirectTo: '/dashboard',
  },
  {
    path: '/paciente',
    roleIds: [ROLES.PACIENTE.id],
    roleNames: [ROLES.PACIENTE.name],
    roleEnums: [ROLES.PACIENTE.enum],
    redirectTo: '/dashboard',
  },
];

/**
 * Check if user has access to a route
 */
export function canAccessRoute(
  pathname: string,
  user: {
    role_id?: number;
    role_name?: string;
    role?: string;
    permissions?: string[];
  } | null
): { allowed: boolean; reason?: string; redirectTo?: string } {
  if (!user) {
    return { allowed: false, reason: 'not_authenticated', redirectTo: '/login' };
  }

  // Find matching route configuration
  const routeConfig = ROUTE_CONFIGS.find(config =>
    pathname.startsWith(config.path)
  );

  // If no specific config, allow authenticated users
  if (!routeConfig) {
    return { allowed: true };
  }

  // Check role_id
  if (routeConfig.roleIds && user.role_id) {
    if (routeConfig.roleIds.includes(user.role_id)) {
      return { allowed: true };
    }
  }

  // Check role_name
  if (routeConfig.roleNames && user.role_name) {
    if (routeConfig.roleNames.includes(user.role_name)) {
      return { allowed: true };
    }
  }

  // Check role enum
  if (routeConfig.roleEnums && user.role) {
    if (routeConfig.roleEnums.includes(user.role)) {
      return { allowed: true };
    }
  }

  // Check permissions
  if (routeConfig.permissions && user.permissions) {
    const hasAllPermissions = routeConfig.permissions.every(permission =>
      user.permissions?.includes(permission)
    );
    if (!hasAllPermissions) {
      return {
        allowed: false,
        reason: 'missing_permissions',
        redirectTo: routeConfig.redirectTo || '/dashboard',
      };
    }
  }

  return {
    allowed: false,
    reason: 'insufficient_role',
    redirectTo: routeConfig.redirectTo || '/dashboard',
  };
}

/**
 * Get role-appropriate landing page
 */
export function getRoleLandingPage(user: {
  role_id?: number;
  role_name?: string;
  role?: string;
} | null): string {
  if (!user) {
    return '/login';
  }

  // Check by role_id
  if (user.role_id) {
    switch (user.role_id) {
      case ROLES.SUPER_ADMIN.id:
        return '/super-admin';
      case ROLES.ADMIN_CLINICA.id:
        return '/admin';
      case ROLES.MEDICO.id:
        return '/medico';
      case ROLES.SECRETARIA.id:
        return '/secretaria';
      case ROLES.PACIENTE.id:
        return '/paciente';
      default:
        return '/dashboard';
    }
  }

  // Check by role_name
  if (user.role_name) {
    switch (user.role_name) {
      case ROLES.SUPER_ADMIN.name:
        return '/super-admin';
      case ROLES.ADMIN_CLINICA.name:
        return '/admin';
      case ROLES.MEDICO.name:
        return '/medico';
      case ROLES.SECRETARIA.name:
        return '/secretaria';
      case ROLES.PACIENTE.name:
        return '/paciente';
      default:
        return '/dashboard';
    }
  }

  return '/dashboard';
}

/**
 * Check if route requires authentication
 */
export function requiresAuth(pathname: string): boolean {
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
  ];

  return !publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
}

