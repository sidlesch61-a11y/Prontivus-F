/**
 * Test Users Configuration
 * Predefined test users for each role for development and testing
 */

export interface TestUser {
  id: number;
  username: string;
  email: string;
  password: string;
  role_id: number;
  role_name: string;
  role: 'admin' | 'secretary' | 'doctor' | 'patient';
  first_name: string;
  last_name: string;
  clinic_id: number;
}

/**
 * Test users for each role
 * These should match users created in the backend seed data
 */
export const TEST_USERS: Record<string, TestUser> = {
  superadmin: {
    id: 1,
    username: 'superadmin',
    email: 'superadmin@prontivus.com',
    password: 'SuperAdmin123!',
    role_id: 1,
    role_name: 'SuperAdmin',
    role: 'admin',
    first_name: 'Super',
    last_name: 'Admin',
    clinic_id: 1,
  },
  adminclinica: {
    id: 2,
    username: 'adminclinica',
    email: 'admin@prontivus.com',
    password: 'Admin123!',
    role_id: 2,
    role_name: 'AdminClinica',
    role: 'admin',
    first_name: 'Admin',
    last_name: 'Clinica',
    clinic_id: 1,
  },
  medico: {
    id: 3,
    username: 'medico',
    email: 'medico@prontivus.com',
    password: 'Medico123!',
    role_id: 3,
    role_name: 'Medico',
    role: 'doctor',
    first_name: 'Dr.',
    last_name: 'Medico',
    clinic_id: 1,
  },
  secretaria: {
    id: 4,
    username: 'secretaria',
    email: 'secretaria@prontivus.com',
    password: 'Secretaria123!',
    role_id: 4,
    role_name: 'Secretaria',
    role: 'secretary',
    first_name: 'Secretaria',
    last_name: 'Test',
    clinic_id: 1,
  },
  paciente: {
    id: 5,
    username: 'paciente',
    email: 'patient@prontivus.com',
    password: 'Patient123!',
    role_id: 5,
    role_name: 'Paciente',
    role: 'patient',
    first_name: 'Paciente',
    last_name: 'Test',
    clinic_id: 1,
  },
};

/**
 * Get test user by role name
 */
export function getTestUser(roleName: string): TestUser | undefined {
  const key = roleName.toLowerCase().replace(/\s+/g, '');
  return TEST_USERS[key];
}

/**
 * Get all test users
 */
export function getAllTestUsers(): TestUser[] {
  return Object.values(TEST_USERS);
}

/**
 * Get test user credentials for login
 */
export function getTestUserCredentials(roleName: string): { username: string; password: string } | undefined {
  const user = getTestUser(roleName);
  if (!user) return undefined;
  
  return {
    username: user.username,
    password: user.password,
  };
}

