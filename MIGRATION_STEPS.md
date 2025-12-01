# Migration Steps to Fix Guest Numbers in Bookings

## Step 1: Run Migration in Supabase Dashboard

1. Go to: https://app.supabase.com
2. Select your project (Muraka Hotels)
3. Go to **SQL Editor**
4. Click **"Create a new query"**
5. Copy and paste this SQL:

```sql
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS num_guests INTEGER DEFAULT 1 CHECK (num_guests > 0),
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS special_requests TEXT;
```

6. Click **"Run"** button

You should see: `success - no rows returned`

---

## Step 2: Delete Existing Bookings (Optional)

If you want to clear old data and start fresh:

```sql
DELETE FROM booking_services;
DELETE FROM booking_rooms;
DELETE FROM bookings;
```

---

## Step 3: Run Updated Seeder

Now run the seed-bookings.sql file in Supabase SQL Editor:

**Location:** `supabase/seed-bookings.sql`

This file now includes:
- Proper `num_guests` values (varied between 1-5 based on guest number)
- Varied booking durations
- Varied pricing based on duration
- Proper status distribution (pending, confirmed, checked_in, checked_out, cancelled)

---

## Step 4: Verify Results

Check the bookings table to verify:

```sql
SELECT
  b.id,
  b.guest_id,
  p.full_name,
  b.check_in,
  b.check_out,
  b.num_guests,
  b.status,
  h.name as hotel
FROM bookings b
JOIN profiles p ON b.guest_id = p.id
JOIN hotels h ON b.hotel_id = h.id
LIMIT 10;
```

You should see:
- Guest names populated from profiles
- Guest numbers varied (1-5) instead of all 1s
- Different statuses (pending, confirmed, etc.)

---

## Step 5: Refresh the App

1. Go to your admin dashboard
2. Navigate to **Bookings**
3. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
4. Guest names and numbers should now display correctly

---

## What Was Fixed

**Before:**
- Guest names: "Unknown"
- Guest numbers: All showing "1"

**After:**
- Guest names: Properly populated from profiles table
- Guest numbers: Varied 1-5 based on booking complexity
- All three columns populated: num_guests, phone, special_requests

---

## Files Modified

1. **supabase/migrations/20250201_add_booking_fields.sql** - New migration file
2. **supabase/seed-bookings.sql** - Updated to include num_guests calculation
3. **app/dashboard/admin/bookings/page.tsx** - Updated to properly join guest and hotel data
