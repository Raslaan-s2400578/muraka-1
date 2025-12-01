-- ========================================
-- COMPLETE HOTEL AND ROOM SEED SCRIPT
-- ========================================
-- This script creates:
-- 1. Three hotels (Muraka Male, Muraka Laamu, Muraka Faafu)
-- 2. Room types for each hotel
-- 3. 48 rooms per hotel (144 total rooms)
--
-- Run this script to populate your database with hotel and room data

-- ========================================
-- CREATE HOTELS
-- ========================================
INSERT INTO hotels (name, location, address) VALUES
  ('Muraka Male', 'Male', 'Muraka Island, Male Atoll, Maldives'),
  ('Muraka Laamu', 'Laamu', 'Paradise Beach, Laamu Atoll, Maldives'),
  ('Muraka Faafu', 'Faafu', 'Crystal Bay, Faafu Atoll, Maldives')
ON CONFLICT DO NOTHING;

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
    ('Deluxe Double', 2, 200.00, 350.00, 'Spacious room with king bed, air conditioning, and premium amenities'),
    ('Family Suite', 4, 350.00, 550.00, 'Large suite perfect for families with separate living area'),
    ('Presidential Suite', 6, 800.00, 1200.00, 'Luxury penthouse with panoramic views and private pool')
) AS types(room_type, capacity, price_off_peak, price_peak, description)
ON CONFLICT DO NOTHING;

-- ========================================
-- CREATE ROOMS FOR ALL HOTELS
-- ========================================

-- Standard Double Rooms (100-138 - 20 rooms per hotel)
INSERT INTO rooms (hotel_id, room_type_id, room_number, status)
WITH room_nums AS (
  SELECT (generate_series(0, 19) * 2 + 100)::TEXT as num,
         (generate_series(0, 19) + 1) as seq
),
hotel_data AS (
  SELECT h.id, h.name, h.location,
    CASE h.location
      WHEN 'Male' THEN 'M'
      WHEN 'Laamu' THEN 'L'
      WHEN 'Faafu' THEN 'F'
    END as code
  FROM hotels h
),
status_dist AS (
  SELECT
    hd.id as hotel_id,
    rt.id as room_type_id,
    hd.code || '-' || room_nums.num as room_number,
    CASE
      WHEN room_nums.seq <= 12 THEN 'Available'
      WHEN room_nums.seq <= 16 THEN 'Occupied'
      WHEN room_nums.seq <= 19 THEN 'Cleaning'
      ELSE 'Out of Service'
    END as status
  FROM room_nums
  CROSS JOIN hotel_data hd
  CROSS JOIN room_types rt
  WHERE rt.hotel_id = hd.id AND rt.name = 'Standard Double'
)
SELECT hotel_id, room_type_id, room_number, status FROM status_dist
ON CONFLICT DO NOTHING;

-- Deluxe Double Rooms (200-228 - 15 rooms per hotel)
INSERT INTO rooms (hotel_id, room_type_id, room_number, status)
WITH room_nums AS (
  SELECT (generate_series(0, 14) * 2 + 200)::TEXT as num,
         (generate_series(0, 14) + 1) as seq
),
hotel_data AS (
  SELECT h.id, h.name, h.location,
    CASE h.location
      WHEN 'Male' THEN 'M'
      WHEN 'Laamu' THEN 'L'
      WHEN 'Faafu' THEN 'F'
    END as code
  FROM hotels h
),
status_dist AS (
  SELECT
    hd.id as hotel_id,
    rt.id as room_type_id,
    hd.code || '-' || room_nums.num as room_number,
    CASE
      WHEN room_nums.seq <= 9 THEN 'Available'
      WHEN room_nums.seq <= 12 THEN 'Occupied'
      WHEN room_nums.seq <= 14 THEN 'Cleaning'
      ELSE 'Out of Service'
    END as status
  FROM room_nums
  CROSS JOIN hotel_data hd
  CROSS JOIN room_types rt
  WHERE rt.hotel_id = hd.id AND rt.name = 'Deluxe Double'
)
SELECT hotel_id, room_type_id, room_number, status FROM status_dist
ON CONFLICT DO NOTHING;

-- Family Suite Rooms (300-318 - 10 rooms per hotel)
INSERT INTO rooms (hotel_id, room_type_id, room_number, status)
WITH room_nums AS (
  SELECT (generate_series(0, 9) * 2 + 300)::TEXT as num,
         (generate_series(0, 9) + 1) as seq
),
hotel_data AS (
  SELECT h.id, h.name, h.location,
    CASE h.location
      WHEN 'Male' THEN 'M'
      WHEN 'Laamu' THEN 'L'
      WHEN 'Faafu' THEN 'F'
    END as code
  FROM hotels h
),
status_dist AS (
  SELECT
    hd.id as hotel_id,
    rt.id as room_type_id,
    hd.code || '-' || room_nums.num as room_number,
    CASE
      WHEN room_nums.seq <= 6 THEN 'Available'
      WHEN room_nums.seq <= 8 THEN 'Occupied'
      WHEN room_nums.seq <= 9 THEN 'Cleaning'
      ELSE 'Out of Service'
    END as status
  FROM room_nums
  CROSS JOIN hotel_data hd
  CROSS JOIN room_types rt
  WHERE rt.hotel_id = hd.id AND rt.name = 'Family Suite'
)
SELECT hotel_id, room_type_id, room_number, status FROM status_dist
ON CONFLICT DO NOTHING;

-- Presidential Suite Rooms (400-404 - 3 rooms per hotel)
INSERT INTO rooms (hotel_id, room_type_id, room_number, status)
WITH room_nums AS (
  SELECT (generate_series(0, 2) * 2 + 400)::TEXT as num,
         (generate_series(0, 2) + 1) as seq
),
hotel_data AS (
  SELECT h.id, h.name, h.location,
    CASE h.location
      WHEN 'Male' THEN 'M'
      WHEN 'Laamu' THEN 'L'
      WHEN 'Faafu' THEN 'F'
    END as code
  FROM hotels h
),
status_dist AS (
  SELECT
    hd.id as hotel_id,
    rt.id as room_type_id,
    hd.code || '-' || room_nums.num as room_number,
    CASE
      WHEN room_nums.seq <= 1 THEN 'Available'
      WHEN room_nums.seq <= 2 THEN 'Occupied'
      ELSE 'Cleaning'
    END as status
  FROM room_nums
  CROSS JOIN hotel_data hd
  CROSS JOIN room_types rt
  WHERE rt.hotel_id = hd.id AND rt.name = 'Presidential Suite'
)
SELECT hotel_id, room_type_id, room_number, status FROM status_dist
ON CONFLICT DO NOTHING;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Count hotels
SELECT 'Total Hotels:' as info, COUNT(*) as count FROM hotels;

-- List all hotels
SELECT name, location, address FROM hotels ORDER BY location;

-- Count rooms by hotel and type
SELECT
  h.name as hotel,
  h.location,
  rt.name as room_type,
  COUNT(r.id) as room_count
FROM hotels h
LEFT JOIN room_types rt ON rt.hotel_id = h.id
LEFT JOIN rooms r ON r.room_type_id = rt.id
GROUP BY h.name, h.location, rt.name
ORDER BY h.location, rt.name;

-- Count total rooms per hotel
SELECT
  h.name as hotel,
  h.location,
  COUNT(r.id) as total_rooms,
  COUNT(CASE WHEN r.status = 'Available' THEN 1 END) as available_rooms
FROM hotels h
LEFT JOIN rooms r ON r.hotel_id = h.id
GROUP BY h.name, h.location
ORDER BY h.location;

-- Count by status per location
SELECT
  h.location,
  r.status,
  COUNT(r.id) as count
FROM rooms r
JOIN hotels h ON r.hotel_id = h.id
GROUP BY h.location, r.status
ORDER BY h.location, r.status;

-- Grand totals
SELECT
  COUNT(DISTINCT h.id) as total_hotels,
  COUNT(DISTINCT rt.id) as total_room_types,
  COUNT(r.id) as total_rooms,
  COUNT(CASE WHEN r.status = 'Available' THEN 1 END) as available_rooms
FROM hotels h
LEFT JOIN room_types rt ON rt.hotel_id = h.id
LEFT JOIN rooms r ON r.hotel_id = h.id;
