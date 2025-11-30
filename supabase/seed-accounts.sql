-- ========================================
-- SEED TEST ACCOUNTS - UPDATED
-- ========================================
-- Run this in Supabase SQL Editor to create all test accounts
--
-- Accounts to create:
-- - 1 Admin
-- - 2 Managers
-- - 5 Staff
-- - 10 Guests (total 18 accounts)
--
-- All passwords are: Welcome@123
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
  crypt('Welcome@123', gen_salt('bf')),
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
) SELECT
  id,
  'System Administrator',
  '+1-555-0001',
  'admin',
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'admin@muraka.dev'
ON CONFLICT DO NOTHING;

-- ========================================
-- MANAGERS (2 accounts)
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
) VALUES
(
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'ahmed.manager@muraka.dev',
  crypt('Welcome@123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Ahmed Hassan","phone":"+1-555-0011"}'
),
(
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'fatima.manager@muraka.dev',
  crypt('Welcome@123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Fatima Ahmed","phone":"+1-555-0012"}'
)
ON CONFLICT DO NOTHING;

-- Create profiles for managers
INSERT INTO public.profiles (
  id,
  full_name,
  phone,
  role,
  created_at,
  updated_at
) SELECT
  id,
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'phone',
  'manager',
  NOW(),
  NOW()
FROM auth.users
WHERE email IN ('ahmed.manager@muraka.dev', 'fatima.manager@muraka.dev')
ON CONFLICT DO NOTHING;

-- ========================================
-- STAFF (5 accounts)
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
) VALUES
(
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'mohammed.staff@muraka.dev',
  crypt('Welcome@123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Mohammed Hassan","phone":"+1-555-0021"}'
),
(
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'aisha.staff@muraka.dev',
  crypt('Welcome@123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Aisha Ahmed","phone":"+1-555-0022"}'
),
(
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'hassan.staff@muraka.dev',
  crypt('Welcome@123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Hassan Omar","phone":"+1-555-0023"}'
),
(
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'layla.staff@muraka.dev',
  crypt('Welcome@123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Layla Ibrahim","phone":"+1-555-0024"}'
),
(
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'omar.staff@muraka.dev',
  crypt('Welcome@123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Omar Khalil","phone":"+1-555-0025"}'
)
ON CONFLICT DO NOTHING;

-- Create profiles for staff
INSERT INTO public.profiles (
  id,
  full_name,
  phone,
  role,
  created_at,
  updated_at
) SELECT
  id,
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'phone',
  'staff',
  NOW(),
  NOW()
FROM auth.users
WHERE email IN (
  'mohammed.staff@muraka.dev',
  'aisha.staff@muraka.dev',
  'hassan.staff@muraka.dev',
  'layla.staff@muraka.dev',
  'omar.staff@muraka.dev'
)
ON CONFLICT DO NOTHING;

-- ========================================
-- GUESTS (10 accounts)
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
) VALUES
(
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'ali@muraka.dev',
  crypt('Welcome@123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Ali Mohammed","phone":"+1-555-0031"}'
),
(
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'sara@muraka.dev',
  crypt('Welcome@123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Sara Abdullah","phone":"+1-555-0032"}'
),
(
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'noor@muraka.dev',
  crypt('Welcome@123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Noor Hassan","phone":"+1-555-0033"}'
),
(
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'zainab@muraka.dev',
  crypt('Welcome@123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Zainab Ahmed","phone":"+1-555-0034"}'
),
(
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'karim@muraka.dev',
  crypt('Welcome@123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Karim Ibrahim","phone":"+1-555-0035"}'
),
(
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'dina@muraka.dev',
  crypt('Welcome@123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Dina Saleh","phone":"+1-555-0036"}'
),
(
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'rashid@muraka.dev',
  crypt('Welcome@123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Rashid Ahmed","phone":"+1-555-0037"}'
),
(
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'hana@muraka.dev',
  crypt('Welcome@123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Hana Ibrahim","phone":"+1-555-0038"}'
),
(
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'tariq@muraka.dev',
  crypt('Welcome@123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Tariq Hassan","phone":"+1-555-0039"}'
),
(
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'leila@muraka.dev',
  crypt('Welcome@123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Leila Ahmed","phone":"+1-555-0040"}'
)
ON CONFLICT DO NOTHING;

-- Create profiles for guests
INSERT INTO public.profiles (
  id,
  full_name,
  phone,
  role,
  created_at,
  updated_at
) SELECT
  id,
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'phone',
  'guest',
  NOW(),
  NOW()
FROM auth.users
WHERE email IN (
  'ali@muraka.dev',
  'sara@muraka.dev',
  'noor@muraka.dev',
  'zainab@muraka.dev',
  'karim@muraka.dev',
  'dina@muraka.dev',
  'rashid@muraka.dev',
  'hana@muraka.dev',
  'tariq@muraka.dev',
  'leila@muraka.dev'
)
ON CONFLICT DO NOTHING;

-- ========================================
-- VERIFICATION QUERY
-- ========================================
-- Run this to verify all accounts were created:

SELECT auth.users.email, public.profiles.full_name, public.profiles.role FROM auth.users
JOIN public.profiles ON auth.users.id = public.profiles.id
ORDER BY public.profiles.role DESC, public.profiles.full_name;
