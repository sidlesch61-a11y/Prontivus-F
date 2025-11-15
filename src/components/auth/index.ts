/**
 * Auth Components
 * Centralized exports for authentication-related components
 */

export { ProtectedRoute } from './ProtectedRoute';
export {
  SuperAdminRoute,
  AdminClinicaRoute,
  MedicoRoute,
  SecretariaRoute,
  PacienteRoute,
} from './ProtectedRoute';

export type { ProtectedRouteProps } from './ProtectedRoute';

