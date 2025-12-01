-- Booking Seeder for Test Guests
-- Creates 20 sample bookings for test guests across different hotels, dates, and statuses
-- Run this AFTER creating all guest accounts

-- Delete existing bookings and related data (optional - comment out if you want to keep existing bookings)
-- DELETE FROM booking_services;
-- DELETE FROM booking_rooms;
-- DELETE FROM bookings;

-- Get guest IDs from profiles table and create bookings
WITH guest_profiles AS (
  SELECT id, full_name, created_at FROM profiles WHERE role = 'guest' LIMIT 20
),
hotel_data AS (
  SELECT id FROM hotels LIMIT 3
),
room_data AS (
  SELECT id, hotel_id, room_type_id FROM rooms LIMIT 30
)
INSERT INTO bookings (guest_id, hotel_id, check_in, check_out, total_price, status)
SELECT
  gp.id,
  h.id,
  -- Varied check-in dates: some past, some present, some future
  CASE
    WHEN ROW_NUMBER() OVER (ORDER BY gp.id) % 5 = 0 THEN CURRENT_DATE - INTERVAL '30 days'
    WHEN ROW_NUMBER() OVER (ORDER BY gp.id) % 5 = 1 THEN CURRENT_DATE - INTERVAL '7 days'
    WHEN ROW_NUMBER() OVER (ORDER BY gp.id) % 5 = 2 THEN CURRENT_DATE + INTERVAL '7 days'
    WHEN ROW_NUMBER() OVER (ORDER BY gp.id) % 5 = 3 THEN CURRENT_DATE + INTERVAL '30 days'
    ELSE CURRENT_DATE + INTERVAL '60 days'
  END::DATE as check_in,
  -- Check-out is 3-7 days after check-in
  (CASE
    WHEN ROW_NUMBER() OVER (ORDER BY gp.id) % 5 = 0 THEN CURRENT_DATE - INTERVAL '30 days'
    WHEN ROW_NUMBER() OVER (ORDER BY gp.id) % 5 = 1 THEN CURRENT_DATE - INTERVAL '7 days'
    WHEN ROW_NUMBER() OVER (ORDER BY gp.id) % 5 = 2 THEN CURRENT_DATE + INTERVAL '7 days'
    WHEN ROW_NUMBER() OVER (ORDER BY gp.id) % 5 = 3 THEN CURRENT_DATE + INTERVAL '30 days'
    ELSE CURRENT_DATE + INTERVAL '60 days'
  END + INTERVAL (3 + (ROW_NUMBER() OVER (ORDER BY gp.id) % 5)) * INTERVAL '1 day')::DATE as check_out,
  -- Total price varies: 300-1500 per booking
  (500 + (ROW_NUMBER() OVER (ORDER BY gp.id) * 73) % 1000)::DECIMAL(10,2),
  -- Status varies: past bookings are checked_out, upcoming are confirmed/pending, some cancelled
  CASE
    WHEN ROW_NUMBER() OVER (ORDER BY gp.id) % 10 = 0 THEN 'cancelled'::TEXT
    WHEN CASE
      WHEN ROW_NUMBER() OVER (ORDER BY gp.id) % 5 = 0 THEN CURRENT_DATE - INTERVAL '30 days'
      WHEN ROW_NUMBER() OVER (ORDER BY gp.id) % 5 = 1 THEN CURRENT_DATE - INTERVAL '7 days'
      ELSE CURRENT_DATE
    END < CURRENT_DATE THEN 'checked_out'::TEXT
    WHEN CASE
      WHEN ROW_NUMBER() OVER (ORDER BY gp.id) % 5 = 0 THEN CURRENT_DATE - INTERVAL '30 days'
      WHEN ROW_NUMBER() OVER (ORDER BY gp.id) % 5 = 1 THEN CURRENT_DATE - INTERVAL '7 days'
      ELSE CURRENT_DATE
    END = CURRENT_DATE THEN 'checked_in'::TEXT
    WHEN ROW_NUMBER() OVER (ORDER BY gp.id) % 3 = 0 THEN 'confirmed'::TEXT
    ELSE 'pending'::TEXT
  END
FROM guest_profiles gp
CROSS JOIN (SELECT * FROM hotel_data ORDER BY random() LIMIT 1) h
WHERE gp.id IS NOT NULL
LIMIT 20;

-- Create booking_rooms associations for each booking
WITH booking_list AS (
  SELECT id, guest_id FROM bookings WHERE id IN (
    SELECT id FROM bookings ORDER BY created_at DESC LIMIT 20
  )
)
INSERT INTO booking_rooms (booking_id, room_id, price_per_night)
SELECT
  bl.id,
  r.id,
  (200 + (RANDOM() * 200))::DECIMAL(10,2)
FROM booking_list bl
CROSS JOIN (SELECT * FROM rooms WHERE hotel_id = (SELECT hotel_id FROM bookings WHERE id = bl.id) ORDER BY random() LIMIT 1) r
WHERE r.id IS NOT NULL
ON CONFLICT (booking_id, room_id) DO NOTHING;

-- Add some services to certain bookings
WITH booking_list AS (
  SELECT id FROM bookings ORDER BY created_at DESC LIMIT 10
)
INSERT INTO booking_services (booking_id, service_id, quantity)
SELECT
  bl.id,
  s.id,
  1 + (ROW_NUMBER() OVER (ORDER BY bl.id) % 3)
FROM booking_list bl
CROSS JOIN services s
WHERE (ROW_NUMBER() OVER (ORDER BY bl.id, s.id) % 3 = 0)
ON CONFLICT (booking_id, service_id) DO NOTHING;

-- Log completion
SELECT 'Bookings seeded successfully! ' || COUNT(*) || ' bookings created.' as result FROM bookings;
