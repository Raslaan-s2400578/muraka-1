# Fix Rooms Table RLS Policies

To enable room creation functionality, you need to set up Row Level Security policies for the `rooms` table.

## Quick Fix - Run this SQL in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the SQL below:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access to rooms" ON rooms;
DROP POLICY IF EXISTS "Allow admins to insert rooms" ON rooms;
DROP POLICY IF EXISTS "Allow admins to update rooms" ON rooms;
DROP POLICY IF EXISTS "Allow admins to delete rooms" ON rooms;

-- Everyone can read rooms
CREATE POLICY "Allow public read access to rooms"
ON rooms
FOR SELECT
TO authenticated
USING (true);

-- Only admins/managers/staff can insert rooms
CREATE POLICY "Allow admins to insert rooms"
ON rooms
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager', 'staff')
  )
);

-- Only admins/managers/staff can update rooms
CREATE POLICY "Allow admins to update rooms"
ON rooms
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager', 'staff')
  )
);

-- Only admins/managers can delete rooms
CREATE POLICY "Allow admins to delete rooms"
ON rooms
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);
```

5. Click **Run** or press `Ctrl+Enter`

## What This Does:

- ✅ Allows **everyone** to read/view rooms (SELECT)
- ✅ Allows **admins, managers, staff** to create rooms (INSERT)
- ✅ Allows **admins, managers, staff** to update rooms (UPDATE)
- ✅ Allows **admins, managers** to delete rooms (DELETE)

## Verify It Worked:

After running the SQL:
1. Make sure your user has `role = 'admin'` in the profiles table
2. Refresh your admin dashboard
3. Navigate to **Rooms** in the sidebar
4. Click "Add New Room"
5. Fill in the form:
   - Select a hotel
   - Enter room number (e.g., "101", "A-205")
   - Choose room type (Standard, Deluxe, Suite, etc.)
   - Set price per night
   - Check "Available for booking" if needed
6. Click "Create Room"
7. It should work now! ✅

## Room Management Features:

### Add New Room Form:
- **Hotel** - Select which hotel the room belongs to
- **Room Number** - Unique identifier (e.g., 101, 205, A-301)
- **Room Type** - Standard, Deluxe, Suite, Presidential, Ocean View, Beach Villa, Water Villa
- **Price per Night** - Set nightly rate in USD
- **Availability** - Toggle if room is available for booking

### Stats Dashboard:
- **Total Rooms** - All rooms across all hotels
- **Available** - Rooms ready for booking
- **Occupied** - Currently booked rooms
- **Avg. Price/Night** - Average nightly rate

### Search & Filter:
- Search by room number, type, or hotel name
- Filter by specific hotel
- View hotel name and location for each room

## Now You Can Create Bookings!

Once you have rooms created:
1. Go to **Bookings** page
2. Click "Add New Booking"
3. Select a guest, hotel, and room
4. Pick dates and create the booking! 🎉
