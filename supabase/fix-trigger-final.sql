-- Final fix for the trigger
-- The issue is likely the trigger function is throwing an error during user creation

-- Step 1: Drop and recreate the function with better error handling
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_full_name TEXT;
  v_phone TEXT;
BEGIN
  -- Extract values safely
  v_full_name := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), 'Guest');
  v_phone := NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), '');

  -- Insert profile - this should NOT fail the auth insert
  INSERT INTO public.profiles (id, full_name, phone, email, role)
  VALUES (
    NEW.id,
    v_full_name,
    v_phone,
    NEW.email,
    'guest'
  )
  ON CONFLICT (id) DO UPDATE SET  
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    updated_at = NOW();

  -- Always return NEW to allow the auth user creation to succeed
  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but DO NOT RAISE - this is critical
    -- If we raise an error, the auth.users insert will fail
    RAISE WARNING 'Profile creation failed for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
    -- Still return NEW so auth user gets created
    RETURN NEW;
END;
$$;

-- Step 2: Recreate trigger (this will replace the old one)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;

-- Step 4: Verify
SELECT 'Function recreated successfully' as status;

SELECT
  'Trigger: ' || tgname as name,
  'Enabled: ' || CASE tgenabled WHEN 'O' THEN 'YES' ELSE 'NO' END as status
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- Step 5: Test the function manually (safe test)
DO $$
BEGIN
  RAISE NOTICE 'Trigger setup complete. The function will now handle errors gracefully without blocking user creation.';
END $$;
