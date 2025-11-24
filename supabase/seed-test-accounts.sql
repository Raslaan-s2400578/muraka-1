-- ========================================
-- SEED TEST ACCOUNTS
-- ========================================
-- Run this in Supabase SQL Editor to create all test accounts
--
-- Accounts to create:
-- - 1 Admin
-- - 2 Managers
-- - 5 Staff
-- - 10 Guests (total 18 accounts)
--
-- All passwords are: Password@123
-- ========================================

-- ========================================
-- ADMIN (1 account)
-- ========================================

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@muraka.dev',
  crypt('Password@123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"System Administrator","phone":"+1-555-0001"}'
) ON CONFLICT DO NOTHING;

-- Create profile for admin
INSERT INTO public.profiles (
  id,
  full_name,
  phone,
  role,
  created_at,
  updated_at
)
SELECT
  id,
  'System Administrator',
  '+1-555-0001',
  'admin',
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'admin@muraka.dev'
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- MANAGERS (2 accounts)
-- ========================================

-- Manager 1
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'manager1@muraka.dev',
  crypt('Password@123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Ahmed Hassan","phone":"+1-555-0002"}'
) ON CONFLICT DO NOTHING;

INSERT INTO public.profiles (
  id,
  full_name,
  phone,
  role,
  created_at,
  updated_at
)
SELECT
  id,
  'Ahmed Hassan',
  '+1-555-0002',
  'manager',
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'manager1@muraka.dev'
ON CONFLICT (id) DO NOTHING;

-- Manager 2
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'manager2@muraka.dev',
  crypt('Password@123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Fatima Ahmed","phone":"+1-555-0003"}'
) ON CONFLICT DO NOTHING;

INSERT INTO public.profiles (
  id,
  full_name,
  phone,
  role,
  created_at,
  updated_at
)
SELECT
  id,
  'Fatima Ahmed',
  '+1-555-0003',
  'manager',
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'manager2@muraka.dev'
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- STAFF (5 accounts)
-- ========================================

-- Staff 1
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'staff1@muraka.dev', crypt('Password@123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Mohammed Hassan","phone":"+1-555-0101"}') ON CONFLICT DO NOTHING;
INSERT INTO public.profiles (id, full_name, phone, role, created_at, updated_at)
SELECT id, 'Mohammed Hassan', '+1-555-0101', 'staff', NOW(), NOW() FROM auth.users WHERE email = 'staff1@muraka.dev' ON CONFLICT (id) DO NOTHING;

-- Staff 2
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'staff2@muraka.dev', crypt('Password@123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Aisha Ahmed","phone":"+1-555-0102"}') ON CONFLICT DO NOTHING;
INSERT INTO public.profiles (id, full_name, phone, role, created_at, updated_at)
SELECT id, 'Aisha Ahmed', '+1-555-0102', 'staff', NOW(), NOW() FROM auth.users WHERE email = 'staff2@muraka.dev' ON CONFLICT (id) DO NOTHING;

-- Staff 3
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'staff3@muraka.dev', crypt('Password@123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Hassan Omar","phone":"+1-555-0103"}') ON CONFLICT DO NOTHING;
INSERT INTO public.profiles (id, full_name, phone, role, created_at, updated_at)
SELECT id, 'Hassan Omar', '+1-555-0103', 'staff', NOW(), NOW() FROM auth.users WHERE email = 'staff3@muraka.dev' ON CONFLICT (id) DO NOTHING;

-- Staff 4
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'staff4@muraka.dev', crypt('Password@123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Layla Ibrahim","phone":"+1-555-0104"}') ON CONFLICT DO NOTHING;
INSERT INTO public.profiles (id, full_name, phone, role, created_at, updated_at)
SELECT id, 'Layla Ibrahim', '+1-555-0104', 'staff', NOW(), NOW() FROM auth.users WHERE email = 'staff4@muraka.dev' ON CONFLICT (id) DO NOTHING;

-- Staff 5
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'staff5@muraka.dev', crypt('Password@123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Omar Khalil","phone":"+1-555-0105"}') ON CONFLICT DO NOTHING;
INSERT INTO public.profiles (id, full_name, phone, role, created_at, updated_at)
SELECT id, 'Omar Khalil', '+1-555-0105', 'staff', NOW(), NOW() FROM auth.users WHERE email = 'staff5@muraka.dev' ON CONFLICT (id) DO NOTHING;

-- ========================================
-- GUESTS (10 accounts)
-- ========================================

-- Guest 1
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'guest1@muraka.dev', crypt('Password@123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ali Mohammed","phone":"+1-555-0201"}') ON CONFLICT DO NOTHING;
INSERT INTO public.profiles (id, full_name, phone, role, created_at, updated_at)
SELECT id, 'Ali Mohammed', '+1-555-0201', 'guest', NOW(), NOW() FROM auth.users WHERE email = 'guest1@muraka.dev' ON CONFLICT (id) DO NOTHING;

-- Guest 2
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'guest2@muraka.dev', crypt('Password@123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sara Abdullah","phone":"+1-555-0202"}') ON CONFLICT DO NOTHING;
INSERT INTO public.profiles (id, full_name, phone, role, created_at, updated_at)
SELECT id, 'Sara Abdullah', '+1-555-0202', 'guest', NOW(), NOW() FROM auth.users WHERE email = 'guest2@muraka.dev' ON CONFLICT (id) DO NOTHING;

-- Guest 3
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'guest3@muraka.dev', crypt('Password@123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Noor Hassan","phone":"+1-555-0203"}') ON CONFLICT DO NOTHING;
INSERT INTO public.profiles (id, full_name, phone, role, created_at, updated_at)
SELECT id, 'Noor Hassan', '+1-555-0203', 'guest', NOW(), NOW() FROM auth.users WHERE email = 'guest3@muraka.dev' ON CONFLICT (id) DO NOTHING;

-- Guest 4
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'guest4@muraka.dev', crypt('Password@123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Zainab Ahmed","phone":"+1-555-0204"}') ON CONFLICT DO NOTHING;
INSERT INTO public.profiles (id, full_name, phone, role, created_at, updated_at)
SELECT id, 'Zainab Ahmed', '+1-555-0204', 'guest', NOW(), NOW() FROM auth.users WHERE email = 'guest4@muraka.dev' ON CONFLICT (id) DO NOTHING;

-- Guest 5
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'guest5@muraka.dev', crypt('Password@123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Karim Ibrahim","phone":"+1-555-0205"}') ON CONFLICT DO NOTHING;
INSERT INTO public.profiles (id, full_name, phone, role, created_at, updated_at)
SELECT id, 'Karim Ibrahim', '+1-555-0205', 'guest', NOW(), NOW() FROM auth.users WHERE email = 'guest5@muraka.dev' ON CONFLICT (id) DO NOTHING;

-- Guest 6
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'guest6@muraka.dev', crypt('Password@123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dina Saleh","phone":"+1-555-0206"}') ON CONFLICT DO NOTHING;
INSERT INTO public.profiles (id, full_name, phone, role, created_at, updated_at)
SELECT id, 'Dina Saleh', '+1-555-0206', 'guest', NOW(), NOW() FROM auth.users WHERE email = 'guest6@muraka.dev' ON CONFLICT (id) DO NOTHING;

-- Guest 7
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'guest7@muraka.dev', crypt('Password@123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Rashid Ahmed","phone":"+1-555-0207"}') ON CONFLICT DO NOTHING;
INSERT INTO public.profiles (id, full_name, phone, role, created_at, updated_at)
SELECT id, 'Rashid Ahmed', '+1-555-0207', 'guest', NOW(), NOW() FROM auth.users WHERE email = 'guest7@muraka.dev' ON CONFLICT (id) DO NOTHING;

-- Guest 8
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'guest8@muraka.dev', crypt('Password@123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Hana Ibrahim","phone":"+1-555-0208"}') ON CONFLICT DO NOTHING;
INSERT INTO public.profiles (id, full_name, phone, role, created_at, updated_at)
SELECT id, 'Hana Ibrahim', '+1-555-0208', 'guest', NOW(), NOW() FROM auth.users WHERE email = 'guest8@muraka.dev' ON CONFLICT (id) DO NOTHING;

-- Guest 9
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'guest9@muraka.dev', crypt('Password@123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Tariq Hassan","phone":"+1-555-0209"}') ON CONFLICT DO NOTHING;
INSERT INTO public.profiles (id, full_name, phone, role, created_at, updated_at)
SELECT id, 'Tariq Hassan', '+1-555-0209', 'guest', NOW(), NOW() FROM auth.users WHERE email = 'guest9@muraka.dev' ON CONFLICT (id) DO NOTHING;

-- Guest 10
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'guest10@muraka.dev', crypt('Password@123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Leila Ahmed","phone":"+1-555-0210"}') ON CONFLICT DO NOTHING;
INSERT INTO public.profiles (id, full_name, phone, role, created_at, updated_at)
SELECT id, 'Leila Ahmed', '+1-555-0210', 'guest', NOW(), NOW() FROM auth.users WHERE email = 'guest10@muraka.dev' ON CONFLICT (id) DO NOTHING;

-- ========================================
-- VERIFICATION
-- ========================================

-- Count total users created
SELECT 'Total Users Created:' as stat, COUNT(*) as count FROM auth.users;

-- Count by role
SELECT 'Admin Count:' as stat, COUNT(*) as count FROM public.profiles WHERE role = 'admin'
UNION ALL
SELECT 'Manager Count:', COUNT(*) FROM public.profiles WHERE role = 'manager'
UNION ALL
SELECT 'Staff Count:', COUNT(*) FROM public.profiles WHERE role = 'staff'
UNION ALL
SELECT 'Guest Count:', COUNT(*) FROM public.profiles WHERE role = 'guest';

-- Show all users
SELECT 'All Users:' as note;
SELECT auth.users.email, public.profiles.full_name, public.profiles.role FROM auth.users
JOIN public.profiles ON auth.users.id = public.profiles.id
ORDER BY public.profiles.role DESC, public.profiles.full_name;
