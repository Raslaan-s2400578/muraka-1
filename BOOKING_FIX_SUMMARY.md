# Booking Display Fix - Complete Summary

## Problem Identified

When viewing bookings in the admin dashboard, two issues appeared:
1. **Guest names** were showing as "Unknown" instead of actual names
2. **Guest numbers** were all showing as "1" instead of varied 1-5 values

**Root Causes:**

1. **Database Schema Issue**: The `bookings` table was missing three columns:
   - `num_guests` - number of guests in the booking
   - `phone` - guest's phone number
   - `special_requests` - any special booking requests

2. **Seeder Data Issue**: The `seed-bookings.sql` script was:
   - Creating bookings without calculating `num_guests` (defaulting to 1)
   - Not providing varied guest counts based on booking complexity

3. **UI Data Fetching Issue**: The bookings page wasn't properly joining guest profile data

---

## Solutions Implemented

### 1. Updated Database Schema

**File:** `supabase/schema.sql`

Added three new columns to the bookings table:
```sql
CREATE TABLE bookings (
  ...
  num_guests INTEGER DEFAULT 1 CHECK (num_guests > 0),
  phone TEXT,
  special_requests TEXT,
  ...
)
```

### 2. Created Migration File

**File:** `supabase/migrations/20250201_add_booking_fields.sql`

This migration adds the missing columns to the existing bookings table:
```sql
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS num_guests INTEGER DEFAULT 1 CHECK (num_guests > 0),
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS special_requests TEXT;
```

### 3. Updated Seeder Script

**File:** `supabase/seed-bookings.sql`

Modified the INSERT statement to calculate varied `num_guests` values:
```sql
INSERT INTO bookings (guest_id, hotel_id, check_in, check_out, num_guests, total_price, status)
SELECT
  gb.guest_id,
  h.id,
  gb.check_in,
  (gb.check_in + make_interval(days => gb.duration_days::INT))::DATE as check_out,
  CASE
    WHEN gb.guest_num % 3 = 0 THEN 1 + (gb.guest_num % 2)  -- 1-2 guests
    WHEN gb.guest_num % 3 = 1 THEN 2 + (gb.guest_num % 3)  -- 2-4 guests
    ELSE 3 + (gb.guest_num % 3)  -- 3-5 guests
  END as num_guests,
  gb.total_price,
  CASE
    WHEN gb.guest_num % 12 = 0 THEN 'cancelled'::TEXT
    WHEN gb.check_in < CURRENT_DATE THEN 'checked_out'::TEXT
    WHEN gb.check_in = CURRENT_DATE THEN 'checked_in'::TEXT
    WHEN gb.check_in <= CURRENT_DATE + INTERVAL '7 days' THEN 'confirmed'::TEXT
    ELSE 'pending'::TEXT
  END
FROM guest_bookings gb
JOIN hotel_data h ON h.hotel_num = gb.hotel_seq
ORDER BY gb.guest_id, gb.booking_seq;
```

**Key Changes:**
- Added `num_guests` column to INSERT
- Added CASE statement to calculate varied guest counts (1-5)
- Distribution varies based on guest_num modulo arithmetic
- Creates realistic booking patterns

### 4. Updated UI Component

**File:** `app/dashboard/admin/bookings/page.tsx`

Enhanced the `loadBookings()` function to:
- Fetch related profiles and hotels data separately
- Create Map data structures for efficient lookups
- Join data using Map.get() instead of relying on Supabase relationships

```typescript
const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || [])
const hotelsMap = new Map(hotelsData?.map(h => [h.id, h]) || [])

const transformedBookings = bookingsData.map((booking: any, index: number) => {
  const guest = profilesMap.get(booking.guest_id) || { full_name: 'Unknown', email: '' }
  const hotel = hotelsMap.get(booking.hotel_id) || { name: 'Unknown' }

  return {
    ...booking,
    guest,
    hotel,
    ...
  }
})
```

---

## Implementation Steps

### Step 1: Run Migration in Supabase

1. Go to https://app.supabase.com
2. Select your Muraka Hotels project
3. Navigate to **SQL Editor**
4. Create a new query and run:

```sql
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS num_guests INTEGER DEFAULT 1 CHECK (num_guests > 0),
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS special_requests TEXT;
```

**Expected result:** `success - no rows returned`

### Step 2: Clear Existing Bookings (Optional)

If you want fresh data:

```sql
DELETE FROM booking_services;
DELETE FROM booking_rooms;
DELETE FROM bookings;
```

### Step 3: Re-run Seeder Script

Run the updated `seed-bookings.sql` in Supabase SQL Editor:

```sql
-- [Entire contents of supabase/seed-bookings.sql]
```

This will create bookings with:
- Proper `num_guests` values (1-5 varied)
- Proper guest assignments
- Proper hotel assignments
- Varied statuses and dates

### Step 4: Verify in Admin Dashboard

1. Navigate to: Admin Dashboard > Bookings
2. Hard refresh browser (Ctrl+Shift+R)
3. Check that:
   - Guest names appear (not "Unknown")
   - Guest numbers vary (1-5, not all 1)
   - Different booking statuses appear

---

## Test Verification Query

Run this in Supabase SQL Editor to verify the data:

```sql
SELECT
  b.id,
  b.guest_id,
  p.full_name as guest_name,
  b.check_in,
  b.check_out,
  b.num_guests,
  b.status,
  h.name as hotel_name
FROM bookings b
JOIN profiles p ON b.guest_id = p.id
JOIN hotels h ON b.hotel_id = h.id
ORDER BY b.guest_id
LIMIT 20;
```

Expected output:
- Guest names from profiles table
- num_guests values: 1, 2, 3, 4, 5 (varied)
- Different statuses: pending, confirmed, checked_in, checked_out, cancelled
- Guest names matching the actual guest accounts

---

## Files Modified/Created

| File | Status | Purpose |
|------|--------|---------|
| supabase/schema.sql | ✅ Modified | Added three columns to bookings table |
| supabase/migrations/20250201_add_booking_fields.sql | ✅ Created | Migration to update existing table |
| supabase/seed-bookings.sql | ✅ Modified | Updated to calculate num_guests |
| app/dashboard/admin/bookings/page.tsx | ✅ Modified | Fixed guest/hotel data fetching |

---

## Key Technical Details

### SQL Features Used

1. **PostgreSQL CASE WHEN**: For conditional guest count calculation
2. **PostgreSQL Modulo (%)**: For distributing values across guests
3. **PostgreSQL Interval Arithmetic**: For date calculations
4. **PostgreSQL Window Functions**: For generating sequences
5. **PostgreSQL CTEs (WITH clause)**: For complex multi-step queries

### JavaScript Features Used

1. **Map Data Structure**: For O(1) lookup of related data
2. **Array.map()**: For transforming booking data
3. **Template Literals**: For flexible string construction
4. **Optional Chaining (?.)**: For safe property access

---

## Expected Results

After completing all steps:

| Metric | Before | After |
|--------|--------|-------|
| Guest names in table | "Unknown" | Actual guest names |
| Guest numbers | All "1" | Varied 1-5 |
| Booking count | Should increase | Bookings properly populated |
| Status variety | All same | Mix of pending/confirmed/checked_in/checked_out/cancelled |

---

## Troubleshooting

### Issue: Still seeing "Unknown" for guest names

**Solution:**
1. Check that the profile data is actually created (Admin > Users)
2. Hard refresh the browser (Ctrl+Shift+R)
3. Check browser console for errors (F12)
4. Verify the SQL executed without errors

### Issue: Still seeing all "1" for guest numbers

**Solution:**
1. Make sure you ran the migration first
2. Delete existing bookings: `DELETE FROM bookings;`
3. Re-run the entire seed-bookings.sql script
4. Hard refresh the browser

### Issue: Migration fails with "column already exists"

**Solution:**
- The columns might already exist. Run the verification query to check:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'bookings' AND column_name = 'num_guests';
```

---

## Summary

The complete fix involves three components:

1. **Schema Update**: Add missing columns to bookings table
2. **Data Update**: Re-seed bookings with proper guest counts
3. **UI Update**: Properly fetch and display related data

All three components must be in place for the fix to work completely.
