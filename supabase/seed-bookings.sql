-- Booking Seeder for Test Guests
-- Creates varied sample bookings with realistic distribution:
-- - Some guests with no bookings (dormant accounts)
-- - Some with 1 short booking
-- - Some with 1-2 longer bookings
-- - Varied group sizes and booking statuses
-- Run this AFTER creating all guest accounts

-- Delete existing bookings and related data (optional - comment out if you want to keep existing bookings)
-- DELETE FROM booking_services;
-- DELETE FROM booking_rooms;
-- DELETE FROM bookings;

-- Create varied bookings with realistic distribution
WITH guest_profiles AS (
  SELECT id, full_name, created_at, ROW_NUMBER() OVER (ORDER BY id) as guest_num
  FROM profiles WHERE role = 'guest'
),
hotel_data AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) as hotel_num FROM hotels LIMIT 3
),
booking_specs AS (
  -- Define which guests get bookings and how many
  SELECT
    gp.id as guest_id,
    gp.guest_num,
    CASE
      -- Guests 1-2: Dormant (no bookings)
      WHEN gp.guest_num IN (1, 2) THEN 0
      -- Guests 3-8: Single short booking
      WHEN gp.guest_num IN (3, 4, 5, 6, 7, 8) THEN 1
      -- Guests 9-14: Single medium booking
      WHEN gp.guest_num IN (9, 10, 11, 12, 13, 14) THEN 1
      -- Guests 15-20: 1-2 bookings (mix)
      ELSE CASE WHEN gp.guest_num % 2 = 0 THEN 2 ELSE 1 END
    END as num_bookings,
    gp.created_at
  FROM guest_profiles gp
),
-- Generate individual booking rows for each guest's bookings
guest_bookings AS (
  SELECT
    bs.guest_id,
    bs.guest_num,
    bs.created_at,
    (h.hotel_num - 1 + (bs.guest_num + booking_seq - 1) % 3) % 3 + 1 as hotel_seq,
    booking_seq,
    -- Varied check-in dates based on guest and booking sequence
    CASE booking_seq
      WHEN 1 THEN
        CASE
          WHEN bs.guest_num % 6 = 0 THEN CURRENT_DATE - INTERVAL '45 days'
          WHEN bs.guest_num % 6 = 1 THEN CURRENT_DATE - INTERVAL '20 days'
          WHEN bs.guest_num % 6 = 2 THEN CURRENT_DATE - INTERVAL '10 days'
          WHEN bs.guest_num % 6 = 3 THEN CURRENT_DATE + INTERVAL '5 days'
          WHEN bs.guest_num % 6 = 4 THEN CURRENT_DATE + INTERVAL '15 days'
          ELSE CURRENT_DATE + INTERVAL '45 days'
        END
      ELSE CURRENT_DATE + INTERVAL '60 days' + make_interval(days => ((bs.guest_num % 30)::INT))
    END::DATE as check_in,
    -- Duration varies: 1-2 nights (short), 3-5 nights (medium), 5-7 nights (long)
    CASE
      WHEN bs.guest_num % 3 = 0 THEN 1 + (bs.guest_num % 2)  -- 1-2 nights (short)
      WHEN bs.guest_num % 3 = 1 THEN 3 + (bs.guest_num % 3)  -- 3-5 nights (medium)
      ELSE 5 + (bs.guest_num % 3)  -- 5-7 nights (long)
    END as duration_days,
    -- Price varies by duration
    CASE
      WHEN bs.guest_num % 3 = 0 THEN 150 + (bs.guest_num * 25)
      WHEN bs.guest_num % 3 = 1 THEN 400 + (bs.guest_num * 35)
      ELSE 700 + (bs.guest_num * 50)
    END::DECIMAL(10,2) as total_price
  FROM booking_specs bs
  CROSS JOIN (SELECT DISTINCT hotel_num FROM hotel_data) h
  CROSS JOIN LATERAL (
    SELECT generate_series(1, bs.num_bookings) as booking_seq
  ) bookings
  WHERE bs.num_bookings > 0
)
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
  -- Status varies based on dates and guest
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
CROSS JOIN LATERAL (SELECT * FROM rooms WHERE hotel_id = (SELECT hotel_id FROM bookings WHERE id = bl.id) ORDER BY random() LIMIT 1) r
WHERE r.id IS NOT NULL
ON CONFLICT (booking_id, room_id) DO NOTHING;

-- Add some services to certain bookings
WITH booking_list AS (
  SELECT id FROM bookings ORDER BY created_at DESC LIMIT 10
),
service_assignments AS (
  SELECT
    bl.id as booking_id,
    s.id as service_id,
    1 + (ROW_NUMBER() OVER (ORDER BY bl.id) % 3) as quantity,
    ROW_NUMBER() OVER (ORDER BY bl.id, s.id) as rn
  FROM booking_list bl
  CROSS JOIN services s
)
INSERT INTO booking_services (booking_id, service_id, quantity)
SELECT booking_id, service_id, quantity
FROM service_assignments
WHERE (rn % 3 = 0)
ON CONFLICT (booking_id, service_id) DO NOTHING;

-- Log completion
SELECT 'Bookings seeded successfully! ' || COUNT(*) || ' bookings created.' as result FROM bookings;
