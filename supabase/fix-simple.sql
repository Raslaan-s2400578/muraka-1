-- SIMPLE FIX - Step by step approach
-- Run each section and verify it works before moving to the next

-- ==================================================
-- SECTION 1: Check what we have
-- ==================================================
SELECT 'Current trigger count: ' || COUNT(*)::text FROM pg_trigger WHERE tgname = 'on_auth_user_created';
SELECT 'Current function count: ' || COUNT(*)::text FROM pg_proc WHERE proname = 'handle_new_user';

-- ==================================================
-- SECTION 2: Clean up old trigger/function
-- ==================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Verify they're gone
SELECT 'After cleanup - trigger: ' || COUNT(*)::text FROM pg_trigger WHERE tgname = 'on_auth_user_created';
SELECT 'After cleanup - function: ' || COUNT(*)::text FROM pg_proc WHERE proname = 'handle_new_user';

-- ==================================================
-- SECTION 3: Ensure profiles table has email column
-- ==================================================
-- Add email column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email TEXT;
    RAISE NOTICE 'Added email column';
  ELSE
    RAISE NOTICE 'Email column already exists';
  END IF;
END $$;

-- Make full_name nullable (in case it's NOT NULL)
ALTER TABLE profiles ALTER COLUMN full_name DROP NOT NULL;

-- Verify columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- ==================================================
-- SECTION 4: Create new function (SIMPLIFIED VERSION)
-- ==================================================
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Simple insert with COALESCE for safety
  INSERT INTO public.profiles (id, full_name, phone, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.raw_user_meta_data->>'phone',
    NEW.email,
    'guest'
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't block signup
  RAISE WARNING 'Error creating profile for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Verify function was created
SELECT 'Function created: ' || COUNT(*)::text FROM pg_proc WHERE proname = 'handle_new_user';

-- ==================================================
-- SECTION 5: Create trigger
-- ==================================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Verify trigger was created
SELECT 'Trigger created: ' || COUNT(*)::text FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- ==================================================
-- SECTION 6: Ensure RLS allows inserts
-- ==================================================
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop old policies to avoid conflicts
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;

-- Create simple policies
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admin policies
CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==================================================
-- SECTION 7: Final verification
-- ==================================================
SELECT
  '✓ Trigger exists' as status
FROM pg_trigger
WHERE tgname = 'on_auth_user_created'
UNION ALL
SELECT
  '✓ Function exists' as status
FROM pg_proc
WHERE proname = 'handle_new_user'
UNION ALL
SELECT
  '✓ ' || COUNT(*)::text || ' RLS policies' as status
FROM pg_policies
WHERE tablename = 'profiles';

-- Show final state
SELECT 'Setup complete! Try signing up now.' as message;
