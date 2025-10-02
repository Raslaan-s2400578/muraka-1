# Fix Bookings & Booking Rooms RLS Policies

To enable booking creation functionality, you need to set up Row Level Security policies for the `bookings` and `booking_rooms` tables.

## Quick Fix - Run this SQL in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the SQL below:

```sql
-- ===== BOOKINGS TABLE =====

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can create all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can delete all bookings" ON bookings;

-- Users can view their own bookings
CREATE POLICY "Users can view their own bookings"
ON bookings FOR SELECT TO authenticated
USING (guest_id = auth.uid());

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings"
ON bookings FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager', 'staff')
  )
);

-- Users can create their own bookings
CREATE POLICY "Users can create their own bookings"
ON bookings FOR INSERT TO authenticated
WITH CHECK (guest_id = auth.uid());

-- Admins can create bookings for anyone
CREATE POLICY "Admins can create all bookings"
ON bookings FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager', 'staff')
  )
);

-- Admins can update all bookings
CREATE POLICY "Admins can update all bookings"
ON bookings FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager', 'staff')
  )
);

-- Admins can delete all bookings
CREATE POLICY "Admins can delete all bookings"
ON bookings FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);

-- ===== BOOKING_ROOMS TABLE =====

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their booking rooms" ON booking_rooms;
DROP POLICY IF EXISTS "Admins can view all booking rooms" ON booking_rooms;
DROP POLICY IF EXISTS "Users can create their booking rooms" ON booking_rooms;
DROP POLICY IF EXISTS "Admins can create all booking rooms" ON booking_rooms;
DROP POLICY IF EXISTS "Admins can update all booking rooms" ON booking_rooms;
DROP POLICY IF EXISTS "Admins can delete all booking rooms" ON booking_rooms;

-- Users can view their own booking rooms
CREATE POLICY "Users can view their booking rooms"
ON booking_rooms FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_rooms.booking_id
    AND bookings.guest_id = auth.uid()
  )
);

-- Admins can view all booking rooms
CREATE POLICY "Admins can view all booking rooms"
ON booking_rooms FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager', 'staff')
  )
);

-- Users can create their own booking rooms
CREATE POLICY "Users can create their booking rooms"
ON booking_rooms FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_rooms.booking_id
    AND bookings.guest_id = auth.uid()
  )
);

-- Admins can create all booking rooms
CREATE POLICY "Admins can create all booking rooms"
ON booking_rooms FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager', 'staff')
  )
);

-- Admins can update all booking rooms
CREATE POLICY "Admins can update all booking rooms"
ON booking_rooms FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager', 'staff')
  )
);

-- Admins can delete all booking rooms
CREATE POLICY "Admins can delete all booking rooms"
ON booking_rooms FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);
```

5. Click **Run** or press `Ctrl+Enter`

## What These Policies Do:

### Bookings Table:
- ✅ Users can **view** their own bookings
- ✅ Admins/managers/staff can **view** all bookings
- ✅ Users can **create** bookings for themselves
- ✅ Admins/managers/staff can **create** bookings for anyone
- ✅ Admins/managers/staff can **update** any booking
- ✅ Admins/managers can **delete** bookings

### Booking Rooms Table:
- ✅ Users can **view** rooms for their bookings
- ✅ Admins/managers/staff can **view** all booking rooms
- ✅ Users can **create** booking rooms for their bookings
- ✅ Admins/managers/staff can **create** booking rooms for any booking
- ✅ Admins/managers/staff can **update** any booking room
- ✅ Admins/managers can **delete** booking rooms

## Verify It Worked:

1. Make sure your user has `role = 'admin'` in profiles table
2. Refresh your admin dashboard
3. Go to Bookings page
4. Click "Add New Booking"
5. Fill in the form and create a booking
6. It should work! ✅

## How the Booking Form Works:

1. **Select Guest** - Choose from existing users
2. **Select Hotel** - Choose hotel location
3. **Select Room** - Rooms are filtered by selected hotel
4. **Pick Dates** - Check-in and check-out dates
5. **Set Guests** - Number of guests
6. **Choose Status** - Pending/Confirmed/Cancelled
7. **Auto-calculates** - Total price based on room rate and nights

The total price is automatically calculated: `room price × number of nights` 💰
