/**
 * Hotel Management System - Muraka
 * 
 * @student Aminath Yaula Yaarid - S2400576
 * @student Hawwa Saha Nasih - S2400566
 * @student Milyaaf Abdul Sattar - S2300565
 * @student Mohamed Raslaan Najeeb - S2400578
 * 
 * Module: UFCF8S-30-2 Advanced Software Development
 * Institution: UWE Bristol
 */

/**
 * Test Users for Muraka Hotels Application
 *
 * This file contains test user credentials for different roles.
 * Use these accounts for testing authentication and role-based access.
 *
 * All accounts use: Password@123
 *
 * For the complete list of 18 seeded accounts, see:
 * - TEST_ACCOUNTS_CREDENTIALS.md (detailed list)
 * - SEED_ACCOUNTS_QUICK_START.txt (quick reference)
 * - supabase/seed-test-accounts.sql (SQL to seed all)
 */

// Sample test users for quick reference
export const TEST_USERS = {
  guest: {
    email: 'guest1@muraka.dev',
    password: 'Password@123',
    fullName: 'Ali Guest',
    phone: '+1-555-0201',
    role: 'guest',
    description: 'Regular guest user - can book hotels and view their bookings'
  },
  staff: {
    email: 'staff1@muraka.dev',
    password: 'Password@123',
    fullName: 'Mohammed Staff',
    phone: '+1-555-0101',
    role: 'staff',
    description: 'Hotel staff member - can manage bookings and guest information'
  },
  manager: {
    email: 'manager1@muraka.dev',
    password: 'Password@123',
    fullName: 'Ahmed Manager',
    phone: '+1-555-0002',
    role: 'manager',
    description: 'Hotel manager - can manage staff, bookings, and reports'
  },
  admin: {
    email: 'admin@muraka.dev',
    password: 'Password@123',
    fullName: 'System Administrator',
    phone: '+1-555-0001',
    role: 'admin',
    description: 'System admin - full access to all features and user management'
  }
}

/**
 * Helper function to get test user by role
 * @param role - The user role ('guest' | 'staff' | 'manager' | 'admin')
 * @returns Test user object with credentials and metadata
 */
export function getTestUser(role: keyof typeof TEST_USERS) {
  return TEST_USERS[role]
}

/**
 * Helper function to get all test users
 * @returns Array of all test users
 */
export function getAllTestUsers() {
  return Object.values(TEST_USERS)
}
