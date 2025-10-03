# Troubleshooting Staff Login Issues

## Problem
Staff users cannot login to the dashboard even after running RLS scripts.

## Root Causes & Solutions

### 1. RLS Policy Error: "policy already exists"

**Error Message:**
```
ERROR: 42710: policy "Users can create bookings" for table "bookings" already exists
```

**Solution:**
The updated `update-staff-rls-policies.sql` now includes DROP statements for all policies before creating them.

**Run this updated script:**
```sql
-- In Supabase SQL Editor:
-- File: update-staff-rls-policies.sql
```

---

### 2. Staff Can't Login - Profile Not Found

**Possible Causes:**

#### A. Profile doesn't have 'staff' role
**Check:**
```sql
SELECT id, full_name, email, role FROM profiles WHERE role IN ('staff', 'manager', 'admin');
```

**Fix:**
```sql
-- Update user role to staff
UPDATE profiles
SET role = 'staff'
WHERE email = 'your-staff-email@example.com';
```

#### B. RLS Policies Block Profile Access
**Check:**
```sql
-- Test if you can see profiles
SELECT * FROM profiles WHERE id = 'your-user-id';
```

**Fix:**
Make sure `fix-rls-complete.sql` was run first to create the `get_user_role()` function and proper RLS policies.

---

### 3. Complete Setup Order (IMPORTANT!)

Run scripts in this exact order:

#### Step 1: Fix RLS Infinite Recursion (REQUIRED FIRST)
```sql
-- Run in Supabase SQL Editor:
fix-rls-complete.sql
```
This creates the `get_user_role()` function needed by other policies.

#### Step 2: Update Staff Permissions
```sql
-- Run in Supabase SQL Editor:
update-staff-rls-policies.sql
```
This adds staff booking creation permissions.

---

### 4. Create a Staff User

If you don't have a staff user yet:

#### Option A: Via Supabase Dashboard
1. Go to Authentication → Users
2. Create new user with email/password
3. Copy the user ID
4. Run this SQL:
```sql
-- Replace with actual user ID
UPDATE profiles
SET role = 'staff'
WHERE id = 'user-id-here';
```

#### Option B: Via SQL
```sql
-- First create auth user in Supabase Dashboard
-- Then update profile:
UPDATE profiles
SET role = 'staff', full_name = 'Staff Member'
WHERE email = 'staff@example.com';
```

---

### 5. Verify Staff Access

#### Check 1: User Exists and Has Correct Role
```sql
SELECT
  p.id,
  p.full_name,
  p.email,
  p.role,
  au.email as auth_email
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.role IN ('staff', 'manager', 'admin');
```

Expected: Should show your staff users

#### Check 2: RLS Policies Are Correct
```sql
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('profiles', 'bookings', 'booking_rooms', 'booking_services')
ORDER BY tablename, policyname;
```

Expected: Should show policies with `get_user_role()` function

#### Check 3: get_user_role Function Exists
```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'get_user_role';
```

Expected: Should return one row with `get_user_role` function

---

### 6. Staff Login Flow

When staff tries to login:

1. **User authenticates** → Supabase auth succeeds
2. **Profile lookup** → Queries `profiles` table for user's role
3. **Role check** → If role is 'staff', 'manager', or 'admin' → Allow access
4. **Data load** → Loads bookings and rooms
5. **Dashboard renders** → Shows staff dashboard

**If any step fails:**
- Step 2 fails → RLS policy blocking profile access → Run `fix-rls-complete.sql`
- Step 3 fails → User doesn't have staff role → Update role in database
- Step 4 fails → RLS policies blocking bookings/rooms → Run `update-staff-rls-policies.sql`

---

### 7. Quick Debug Checklist

Run these checks in order:

```sql
-- 1. Check if get_user_role exists
SELECT routine_name FROM information_schema.routines WHERE routine_name = 'get_user_role';
-- Expected: 1 row

-- 2. Check staff user exists
SELECT id, email, role FROM profiles WHERE email = 'your-staff-email@example.com';
-- Expected: 1 row with role = 'staff'

-- 3. Test get_user_role function (replace user-id)
SELECT get_user_role('user-id-here');
-- Expected: 'staff'

-- 4. Check RLS policies
SELECT tablename, policyname FROM pg_policies WHERE tablename = 'profiles';
-- Expected: Multiple policies including ones with get_user_role

-- 5. Test profile access (when logged in as staff)
SELECT * FROM profiles WHERE id = auth.uid();
-- Expected: Should return staff profile
```

---

### 8. Common Errors & Fixes

#### Error: "infinite recursion detected in policy"
**Fix:** Run `fix-rls-complete.sql`

#### Error: "policy already exists"
**Fix:** The updated `update-staff-rls-policies.sql` now includes DROP statements

#### Error: "function get_user_role does not exist"
**Fix:** Run `fix-rls-complete.sql` first

#### Error: Staff redirected to guest dashboard
**Fix:** Update user's role to 'staff' in profiles table

#### Error: Staff can't see bookings
**Fix:** Run `update-staff-rls-policies.sql`

---

### 9. Test After Fix

1. **Login as staff user**
2. **Check you see:** `/dashboard/staff`
3. **Check you can:**
   - See "Today's Activity" tab with check-ins/outs
   - See "All Bookings" tab with all bookings
   - Click "Confirm" on pending bookings
   - Click "Check In" on confirmed bookings
   - Click "Check Out" on checked-in bookings
   - Search and filter bookings

---

## Complete Fix Script

Run this in Supabase SQL Editor (combines everything):

```sql
-- STEP 1: Create get_user_role function (from fix-rls-complete.sql)
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- STEP 2: Fix profiles RLS (from fix-rls-complete.sql)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT TO authenticated
USING (get_user_role(auth.uid()) IN ('admin', 'manager', 'staff'));

-- STEP 3: Update booking policies (from update-staff-rls-policies.sql)
DROP POLICY IF EXISTS "Guests can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;

CREATE POLICY "Users can create bookings" ON bookings
FOR INSERT TO authenticated
WITH CHECK (
  guest_id = auth.uid()
  OR get_user_role(auth.uid()) IN ('staff', 'manager', 'admin')
);

-- STEP 4: Update booking_rooms policies
DROP POLICY IF EXISTS "Booking rooms insertable by booking owner" ON booking_rooms;
DROP POLICY IF EXISTS "Booking rooms insertable by authorized users" ON booking_rooms;

CREATE POLICY "Booking rooms insertable by authorized users" ON booking_rooms
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_id
    AND bookings.guest_id = auth.uid()
  )
  OR get_user_role(auth.uid()) IN ('staff', 'manager', 'admin')
);

-- STEP 5: Update booking_services policies
DROP POLICY IF EXISTS "Booking services insertable by booking owner" ON booking_services;
DROP POLICY IF EXISTS "Booking services insertable by authorized users" ON booking_services;

CREATE POLICY "Booking services insertable by authorized users" ON booking_services
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_id
    AND bookings.guest_id = auth.uid()
  )
  OR get_user_role(auth.uid()) IN ('staff', 'manager', 'admin')
);

-- STEP 6: Verify everything
SELECT 'Functions' as type, routine_name as name FROM information_schema.routines WHERE routine_name = 'get_user_role'
UNION ALL
SELECT 'Policies', tablename || ': ' || policyname FROM pg_policies WHERE tablename IN ('profiles', 'bookings', 'booking_rooms', 'booking_services')
ORDER BY type, name;
```

---

## Summary

**To fix staff login:**

1. ✅ Run the complete fix script above in Supabase SQL Editor
2. ✅ Ensure your user has role = 'staff' in profiles table
3. ✅ Clear browser cache and try logging in again
4. ✅ Check browser console for any errors

Staff should now be able to login and manage all bookings! 🎉
