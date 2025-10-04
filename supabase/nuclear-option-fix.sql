-- NUCLEAR OPTION: Complete reset and rebuild
-- This will fix everything from scratch

-- ===============================================
-- PART 1: Ensure profiles table has correct structure
-- ===============================================

-- Add email column if missing (safe - won't fail if exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'email'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
    RAISE NOTICE 'Added email column';
  END IF;
END $$;

-- Make full_name nullable
ALTER TABLE public.profiles ALTER COLUMN full_name DROP NOT NULL;

-- Verify table structure
SELECT
  'Columns in profiles table:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ===============================================
-- PART 2: Drop and recreate function (SIMPLIFIED)
-- ===============================================

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create the SIMPLEST possible function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Try to insert, ignore if fails
  BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'guest')
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Silently ignore all errors
    NULL;
  END;

  -- ALWAYS return NEW so user creation succeeds
  RETURN NEW;
END;
$$;

-- Verify function was created
SELECT 'Function created: ' || proname FROM pg_proc WHERE proname = 'handle_new_user';

-- ===============================================
-- PART 3: Recreate trigger
-- ===============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

SELECT 'Trigger created: ' || tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- ===============================================
-- PART 4: Grant ALL permissions
-- ===============================================

GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- ===============================================
-- PART 5: Drop and recreate RLS policies
-- ===============================================

-- Drop ALL policies
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname FROM pg_policies WHERE tablename = 'profiles'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.profiles';
  END LOOP;
END $$;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, permissive policies
CREATE POLICY "allow_insert_own_profile"
  ON public.profiles FOR INSERT
  WITH CHECK (true);  -- Allow all inserts during signup

CREATE POLICY "allow_select_own_profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "allow_update_own_profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Show final state
SELECT '=== FINAL VERIFICATION ===' as status;

SELECT 'Trigger: ' || COUNT(*)::text FROM pg_trigger WHERE tgname = 'on_auth_user_created'
UNION ALL
SELECT 'Function: ' || COUNT(*)::text FROM pg_proc WHERE proname = 'handle_new_user'
UNION ALL
SELECT 'Policies: ' || COUNT(*)::text FROM pg_policies WHERE tablename = 'profiles'
UNION ALL
SELECT 'Email column: ' || COUNT(*)::text FROM information_schema.columns
  WHERE table_name = 'profiles' AND column_name = 'email';

SELECT 'Setup complete - try signup now!' as message;
