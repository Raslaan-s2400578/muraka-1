-- Populate booking_rooms for existing bookings that don't have room associations
-- This assigns one room per booking from any available room

-- Step 1: First check which bookings are missing booking_rooms
-- Run this to see the count:
-- SELECT COUNT(*) FROM bookings b
-- LEFT JOIN booking_rooms br ON b.id = br.booking_id
-- WHERE br.booking_id IS NULL;

-- Step 2: Assign rooms to bookings without booking_rooms
WITH bookings_without_rooms AS (
    SELECT b.id as booking_id
    FROM bookings b
    LEFT JOIN booking_rooms br ON b.id = br.booking_id
    WHERE br.booking_id IS NULL
),
available_rooms AS (
    SELECT id as room_id, room_type_id
    FROM rooms
    WHERE status = 'Available'
),
room_assignments AS (
    SELECT
        bwr.booking_id,
        ar.room_id,
        ar.room_type_id,
        ROW_NUMBER() OVER (PARTITION BY bwr.booking_id ORDER BY ar.room_id) as rn
    FROM bookings_without_rooms bwr
    CROSS JOIN available_rooms ar
)
INSERT INTO booking_rooms (booking_id, room_id, price_per_night)
SELECT
    ra.booking_id,
    ra.room_id,
    COALESCE(rt.price_off_peak, 150) as price_per_night
FROM room_assignments ra
LEFT JOIN room_types rt ON ra.room_type_id = rt.id
WHERE ra.rn = 1;

-- Step 3: Verify the results
-- SELECT COUNT(*) FROM booking_rooms;
