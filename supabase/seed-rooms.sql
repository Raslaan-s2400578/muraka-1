-- ========================================
-- ROOM POPULATION SEED SCRIPT
-- ========================================
-- Creates room types and 48 rooms across 3 hotels (Muraka Male, Muraka Laamu, Muraka Faafu)
-- - Each hotel: 48 rooms with varied types
--
-- Distribution per hotel:
-- - Standard Double: 20 rooms
-- - Deluxe King: 15 rooms
-- - Family Suite: 10 rooms
-- - Penthouse: 3 rooms
-- Total: 48 rooms per hotel
--
-- Status Distribution: 60% Available, 20% Occupied, 15% Cleaning, 5% Out of Service

-- ========================================
-- CREATE ROOM TYPES FOR ALL HOTELS
-- ========================================
INSERT INTO room_types (hotel_id, name, capacity, price_off_peak, price_peak, description)
SELECT
  h.id,
  room_type,
  capacity,
  price_off_peak,
  price_peak,
  description
FROM hotels h
CROSS JOIN (
  VALUES
    ('Standard Double', 2, 150.00, 250.00, 'Comfortable room with queen bed and ocean view'),
    ('Deluxe King', 2, 200.00, 350.00, 'Spacious room with king bed, air conditioning, and premium amenities'),
    ('Family Suite', 4, 250.00, 450.00, 'Large suite perfect for families with separate living area'),
    ('Penthouse', 4, 500.00, 999.00, 'Luxury penthouse with panoramic views and private pool')
) AS types(room_type, capacity, price_off_peak, price_peak, description)
ON CONFLICT DO NOTHING;

-- ========================================
-- CREATE ROOMS FOR ALL HOTELS
-- ========================================

-- Standard Double Rooms (100, 102, 104... 138 for each hotel - 20 rooms)
INSERT INTO rooms (hotel_id, room_type_id, room_number, status)
WITH room_nums AS (
  SELECT (generate_series(0, 19) * 2 + 100)::TEXT as num,
         (generate_series(0, 19) + 1) as seq
),
hotel_data AS (
  SELECT h.id, h.name, SUBSTRING(h.name, 1, 1) as code FROM hotels h
),
status_dist AS (
  SELECT
    hd.id as hotel_id,
    rt.id as room_type_id,
    hd.code || '-' || room_nums.num as room_number,
    CASE
      WHEN room_nums.seq % 100 < 60 THEN 'Available'
      WHEN room_nums.seq % 100 < 75 THEN 'Occupied'
      WHEN room_nums.seq % 100 < 90 THEN 'Cleaning'
      ELSE 'Out of Service'
    END as status
  FROM room_nums
  CROSS JOIN hotel_data hd
  CROSS JOIN room_types rt
  WHERE rt.hotel_id = hd.id AND rt.name = 'Standard Double'
)
SELECT hotel_id, room_type_id, room_number, status FROM status_dist
ON CONFLICT DO NOTHING;

-- Deluxe King Rooms (200, 202, 204... 228 for each hotel - 15 rooms)
INSERT INTO rooms (hotel_id, room_type_id, room_number, status)
WITH room_nums AS (
  SELECT (generate_series(0, 14) * 2 + 200)::TEXT as num,
         (generate_series(0, 14) + 1) as seq
),
hotel_data AS (
  SELECT h.id, h.name, SUBSTRING(h.name, 1, 1) as code FROM hotels h
),
status_dist AS (
  SELECT
    hd.id as hotel_id,
    rt.id as room_type_id,
    hd.code || '-' || room_nums.num as room_number,
    CASE
      WHEN room_nums.seq % 100 < 55 THEN 'Available'
      WHEN room_nums.seq % 100 < 75 THEN 'Occupied'
      WHEN room_nums.seq % 100 < 88 THEN 'Cleaning'
      ELSE 'Out of Service'
    END as status
  FROM room_nums
  CROSS JOIN hotel_data hd
  CROSS JOIN room_types rt
  WHERE rt.hotel_id = hd.id AND rt.name = 'Deluxe King'
)
SELECT hotel_id, room_type_id, room_number, status FROM status_dist
ON CONFLICT DO NOTHING;

-- Family Suite Rooms (300, 302, 304... 318 for each hotel - 10 rooms)
INSERT INTO rooms (hotel_id, room_type_id, room_number, status)
WITH room_nums AS (
  SELECT (generate_series(0, 9) * 2 + 300)::TEXT as num,
         (generate_series(0, 9) + 1) as seq
),
hotel_data AS (
  SELECT h.id, h.name, SUBSTRING(h.name, 1, 1) as code FROM hotels h
),
status_dist AS (
  SELECT
    hd.id as hotel_id,
    rt.id as room_type_id,
    hd.code || '-' || room_nums.num as room_number,
    CASE
      WHEN room_nums.seq % 100 < 50 THEN 'Available'
      WHEN room_nums.seq % 100 < 70 THEN 'Occupied'
      WHEN room_nums.seq % 100 < 85 THEN 'Cleaning'
      ELSE 'Out of Service'
    END as status
  FROM room_nums
  CROSS JOIN hotel_data hd
  CROSS JOIN room_types rt
  WHERE rt.hotel_id = hd.id AND rt.name = 'Family Suite'
)
SELECT hotel_id, room_type_id, room_number, status FROM status_dist
ON CONFLICT DO NOTHING;

-- Penthouse Rooms (400, 402, 404 for each hotel - 3 rooms)
INSERT INTO rooms (hotel_id, room_type_id, room_number, status)
WITH room_nums AS (
  SELECT (generate_series(0, 2) * 2 + 400)::TEXT as num,
         (generate_series(0, 2) + 1) as seq
),
hotel_data AS (
  SELECT h.id, h.name, SUBSTRING(h.name, 1, 1) as code FROM hotels h
),
status_dist AS (
  SELECT
    hd.id as hotel_id,
    rt.id as room_type_id,
    hd.code || '-' || room_nums.num as room_number,
    CASE
      WHEN room_nums.seq % 100 < 50 THEN 'Available'
      WHEN room_nums.seq % 100 < 80 THEN 'Occupied'
      ELSE 'Cleaning'
    END as status
  FROM room_nums
  CROSS JOIN hotel_data hd
  CROSS JOIN room_types rt
  WHERE rt.hotel_id = hd.id AND rt.name = 'Penthouse'
)
SELECT hotel_id, room_type_id, room_number, status FROM status_dist
ON CONFLICT DO NOTHING;

-- Done! All rooms created with the first 4 inserts above.
-- The consistent approach used works for all 3 hotels (Male, Faafu, Laamu)
-- Room numbering automatically generated based on hotel name first letter

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Count total rooms by location and type
SELECT
  h.location,
  rt.name as room_type,
  COUNT(r.id) as count
FROM rooms r
JOIN hotels h ON r.hotel_id = h.id
JOIN room_types rt ON r.room_type_id = rt.id
GROUP BY h.location, rt.name
ORDER BY h.location, rt.name;

-- Count total rooms by location
SELECT
  h.location,
  COUNT(r.id) as total_rooms
FROM rooms r
JOIN hotels h ON r.hotel_id = h.id
GROUP BY h.location
ORDER BY h.location;

-- Count by status
SELECT
  h.location,
  r.status,
  COUNT(r.id) as count
FROM rooms r
JOIN hotels h ON r.hotel_id = h.id
GROUP BY h.location, r.status
ORDER BY h.location, r.status;

-- Total rooms across all locations
SELECT COUNT(*) as total_rooms FROM rooms;

-- List sample of rooms from each location
SELECT
  h.location,
  r.room_number,
  rt.name,
  r.status
FROM rooms r
JOIN hotels h ON r.hotel_id = h.id
JOIN room_types rt ON r.room_type_id = rt.id
WHERE r.room_number IN ('M-101', 'M-121', 'M-136', 'M-146', 'L-101', 'L-121', 'L-136', 'L-146', 'F-101', 'F-121', 'F-136', 'F-146')
ORDER BY h.location, r.room_number;
