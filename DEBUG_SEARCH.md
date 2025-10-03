# Debug: Room Search Issues

## Problem
Search shows "No rooms available" even though rooms exist in Muraka Laamu.

## Fixed Issues

### 1. Search Query Fix
**Previous issue**: Query was using `.eq('hotels.location', location)` which doesn't work with Supabase joins.

**Fix Applied**:
- First fetch hotels by location
- Then fetch room_types for those hotels
- Attach hotel info to each room type

### 2. Hotel Data Structure
The search now properly:
1. Gets all hotels in selected location (e.g., "Laamu")
2. Gets room types for those hotels
3. Checks room availability
4. Returns results with full hotel information

## To Verify Your Setup in Supabase

### Step 1: Check Hotels Table
Run this query in Supabase SQL Editor:
```sql
SELECT * FROM hotels WHERE location = 'Laamu';
```

**Expected**: Should return at least one hotel with location = 'Laamu'

### Step 2: Check Room Types
```sql
SELECT rt.*, h.name as hotel_name, h.location
FROM room_types rt
JOIN hotels h ON rt.hotel_id = h.id
WHERE h.location = 'Laamu';
```

**Expected**: Should show room types linked to Laamu hotel

### Step 3: Check Rooms
```sql
SELECT r.*, rt.name as room_type_name, h.name as hotel_name
FROM rooms r
JOIN room_types rt ON r.room_type_id = rt.id
JOIN hotels h ON rt.hotel_id = h.id
WHERE h.location = 'Laamu'
AND r.status = 'Available';
```

**Expected**: Should show at least 3 available rooms

### Step 4: Full Search Simulation
```sql
-- This simulates what the search does
WITH laamu_hotels AS (
  SELECT id, name, location, address
  FROM hotels
  WHERE location = 'Laamu'
),
laamu_room_types AS (
  SELECT rt.*, h.name as hotel_name
  FROM room_types rt
  JOIN laamu_hotels h ON rt.hotel_id = h.id
  WHERE rt.capacity >= 2  -- For 2 guests
)
SELECT
  lrt.*,
  COUNT(r.id) as available_rooms_count
FROM laamu_room_types lrt
LEFT JOIN rooms r ON r.room_type_id = lrt.id AND r.status = 'Available'
GROUP BY lrt.id, lrt.hotel_id, lrt.name, lrt.capacity, lrt.price_off_peak, lrt.price_peak, lrt.description, lrt.created_at, lrt.hotel_name;
```

## Common Issues & Solutions

### Issue 1: Location Mismatch
**Problem**: Hotel location is "Laamu Atoll" but search expects "Laamu"

**Solution**:
```sql
UPDATE hotels SET location = 'Laamu' WHERE name LIKE '%Laamu%';
UPDATE hotels SET location = 'Male' WHERE name LIKE '%Male%';
UPDATE hotels SET location = 'Faafu' WHERE name LIKE '%Faafu%';
```

### Issue 2: No Room Types
**Problem**: Rooms exist but not linked to room_types

**Solution**:
```sql
-- Check if room_type_id exists in rooms
SELECT r.id, r.room_number, r.room_type_id, rt.name
FROM rooms r
LEFT JOIN room_types rt ON r.room_type_id = rt.id
WHERE r.hotel_id = (SELECT id FROM hotels WHERE location = 'Laamu' LIMIT 1);
```

### Issue 3: Rooms Not Available
**Problem**: Room status is not 'Available'

**Solution**:
```sql
-- Update all rooms to Available status
UPDATE rooms SET status = 'Available'
WHERE hotel_id = (SELECT id FROM hotels WHERE location = 'Laamu' LIMIT 1);
```

## Quick Fix for Laamu Hotel

Run this complete setup:

```sql
-- 1. Ensure hotel exists with correct location
INSERT INTO hotels (name, location, address)
VALUES ('Muraka Laamu', 'Laamu', 'Laamu Atoll, Maldives')
ON CONFLICT (id) DO UPDATE SET location = 'Laamu';

-- 2. Get the hotel ID
DO $$
DECLARE
  laamu_hotel_id UUID;
  standard_room_type_id UUID;
BEGIN
  -- Get Laamu hotel ID
  SELECT id INTO laamu_hotel_id FROM hotels WHERE location = 'Laamu' LIMIT 1;

  -- Create room type if doesn't exist
  INSERT INTO room_types (hotel_id, name, capacity, price_off_peak, price_peak, description)
  VALUES (
    laamu_hotel_id,
    'Standard Double',
    2,
    150.00,
    250.00,
    'Comfortable double room with ocean view'
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO standard_room_type_id;

  -- Get room type ID if insert was skipped
  IF standard_room_type_id IS NULL THEN
    SELECT id INTO standard_room_type_id
    FROM room_types
    WHERE hotel_id = laamu_hotel_id AND name = 'Standard Double'
    LIMIT 1;
  END IF;

  -- Create 3 rooms
  INSERT INTO rooms (hotel_id, room_type_id, room_number, status)
  VALUES
    (laamu_hotel_id, standard_room_type_id, '101', 'Available'),
    (laamu_hotel_id, standard_room_type_id, '102', 'Available'),
    (laamu_hotel_id, standard_room_type_id, '103', 'Available')
  ON CONFLICT (hotel_id, room_number) DO UPDATE SET status = 'Available';
END $$;
```

## Test Search

After running the fixes, test search with:
- **Location**: Laamu
- **Check-in**: Any future date
- **Check-out**: Day after check-in
- **Guests**: 2

Should now show available rooms!

## Enhanced Search Page Features

### What's New:
1. ✅ **Better error handling** - Shows why no rooms found
2. ✅ **Inline modification** - Change location/guests without going to home
3. ✅ **Smart tips** - Suggests what to adjust
4. ✅ **Two action buttons**:
   - "Start New Search" → Go to home page
   - "Search Again" → Refresh current search

### No Results Page Now Shows:
- Location selector (can change without leaving page)
- Guest count selector (can change without leaving page)
- Helpful tips on what to try
- Quick access to start over or refresh

