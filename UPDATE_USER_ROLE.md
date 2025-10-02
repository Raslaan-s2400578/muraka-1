# Update Your User Role to Admin

Your user profile needs to have the 'admin' role to access the admin dashboard.

## Option 1: Using Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard
2. Navigate to **Table Editor** → **profiles**
3. Find your user row (search by your email or name)
4. Click on the **role** column for your user
5. Change it from 'guest' to **'admin'**
6. Save the changes
7. Refresh your app and try accessing `/dashboard/admin` again

## Option 2: Using SQL in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run this query (replace with your email):

```sql
-- First, find your user ID (replace 'your-email@example.com' with your actual email)
SELECT id, full_name, role
FROM profiles
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'admin@test.com'
);

-- Then update your role to admin (replace 'YOUR-USER-ID' with the ID from above)
UPDATE profiles
SET role = 'admin'
WHERE id = 'YOUR-USER-ID';

-- Verify the change
SELECT id, full_name, role
FROM profiles
WHERE id = 'YOUR-USER-ID';
```

## Option 3: Using the Script

If you have tsx installed:

```bash
npx tsx scripts/check-user-role.ts
```

Make sure you're logged into the app first!

## Verify Access

After updating your role:

1. Clear your browser cache or open an incognito window
2. Login to your app
3. Navigate to `/dashboard/admin`
4. You should now see the admin dashboard!

## Current Available Roles

- `guest` - Regular users
- `staff` - Hotel staff
- `manager` - Hotel managers
- `admin` - System administrators (full access)
