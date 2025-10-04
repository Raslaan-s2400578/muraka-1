-- Complete fix for signup profile creation
-- Run this in Supabase SQL Editor

-- Step 1: Add email column to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email TEXT;
    CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
  END IF;
END $$;

-- Step 2: Make full_name nullable temporarily to avoid constraint issues
ALTER TABLE profiles ALTER COLUMN full_name DROP NOT NULL;

-- Step 3: Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Step 4: Create improved function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_full_name TEXT;
  user_phone TEXT;
BEGIN
  -- Extract metadata with defaults
  user_full_name := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), 'Guest User');
  user_phone := NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), '');

  -- Insert into profiles table
  INSERT INTO public.profiles (
    id,
    full_name,
    phone,
    email,
    role
  )
  VALUES (
    NEW.id,
    user_full_name,
    user_phone,
    NEW.email,
    'guest'
  );

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, update it instead
    UPDATE public.profiles
    SET
      full_name = COALESCE(user_full_name, full_name),
      phone = COALESCE(user_phone, phone),
      email = COALESCE(NEW.email, email),
      updated_at = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
  WHEN others THEN
    -- Log the error but don't fail the auth insert
    RAISE WARNING 'Failed to create profile for user %: % - %', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

-- Step 5: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Step 6: Drop ALL existing RLS policies
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
  DROP POLICY IF EXISTS "Anyone can insert their profile" ON profiles;
  DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
  DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
  DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
  DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
  DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
  DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
  DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
  DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
  DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
END $$;

-- Step 7: Create RLS policies
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Step 8: Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 9: Sync existing users' data
UPDATE profiles
SET
  email = (SELECT email FROM auth.users WHERE auth.users.id = profiles.id),
  updated_at = NOW()
WHERE email IS NULL;

-- Step 10: Verify the setup
SELECT
  'Trigger exists: ' || CASE WHEN COUNT(*) > 0 THEN 'YES ✓' ELSE 'NO ✗' END as status
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

SELECT
  'Policies count: ' || COUNT(*)::text as status
FROM pg_policies
WHERE tablename = 'profiles';

SELECT
  'Email column exists: ' || CASE WHEN COUNT(*) > 0 THEN 'YES ✓' ELSE 'NO ✗' END as status
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'email';
