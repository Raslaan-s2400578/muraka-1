-- Disable RLS on profiles table to prevent infinite recursion
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can insert their profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
