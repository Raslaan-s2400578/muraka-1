-- ========================================
-- ROOM POPULATION SEED SCRIPT
-- ========================================
-- Creates 144 rooms across 3 hotel locations:
-- - Male: 48 rooms (M-101 to M-148)
-- - Laamu: 48 rooms (L-101 to L-148)
-- - Faafu: 48 rooms (F-101 to F-148)
--
-- Distribution per location:
-- - Standard Double: 20 rooms
-- - Deluxe King: 15 rooms
-- - Family Suite: 10 rooms
-- - Penthouse: 3 rooms
-- Total: 48 rooms per location
--
-- Status Distribution: 60% Available, 20% Occupied, 15% Cleaning, 5% Out of Service

-- ========================================
-- MALE LOCATION ROOMS (48 total)
-- ========================================

-- M-101 to M-120: Standard Double
INSERT INTO rooms (hotel_id, room_type_id, room_number, status)
WITH room_data AS (
  SELECT generate_series(101, 120) as num
)
SELECT
  h.id,
  rt.id,
  'M-' || room_data.num::text,
  CASE
    WHEN ((room_data.num - 101) % 10) IN (0,1,2,3,4) THEN 'Available'
    WHEN ((room_data.num - 101) % 10) IN (5,6) THEN 'Occupied'
    WHEN ((room_data.num - 101) % 10) IN (7,8) THEN 'Cleaning'
    ELSE 'Out of Service'
  END
FROM room_data
CROSS JOIN hotels h
CROSS JOIN room_types rt
WHERE h.location = 'Male' AND rt.name = 'Standard Double'
ON CONFLICT DO NOTHING;

-- M-121 to M-135: Deluxe King
INSERT INTO rooms (hotel_id, room_type_id, room_number, status)
WITH room_data AS (
  SELECT generate_series(121, 135) as num
)
SELECT
  h.id,
  rt.id,
  'M-' || room_data.num::text,
  CASE
    WHEN ((room_data.num - 121) % 10) IN (0,1,2,3,4) THEN 'Available'
    WHEN ((room_data.num - 121) % 10) IN (5,6) THEN 'Occupied'
    WHEN ((room_data.num - 121) % 10) IN (7,8) THEN 'Cleaning'
    ELSE 'Out of Service'
  END
FROM room_data
CROSS JOIN hotels h
CROSS JOIN room_types rt
WHERE h.location = 'Male' AND rt.name = 'Deluxe King'
ON CONFLICT DO NOTHING;

-- M-136 to M-145: Family Suite
INSERT INTO rooms (hotel_id, room_type_id, room_number, status)
WITH room_data AS (
  SELECT generate_series(136, 145) as num
)
SELECT
  h.id,
  rt.id,
  'M-' || room_data.num::text,
  CASE
    WHEN ((room_data.num - 136) % 10) IN (0,1,2,3,4) THEN 'Available'
    WHEN ((room_data.num - 136) % 10) IN (5,6) THEN 'Occupied'
    WHEN ((room_data.num - 136) % 10) IN (7,8) THEN 'Cleaning'
    ELSE 'Out of Service'
  END
FROM room_data
CROSS JOIN hotels h
CROSS JOIN room_types rt
WHERE h.location = 'Male' AND rt.name = 'Family Suite'
ON CONFLICT DO NOTHING;

-- M-146 to M-148: Penthouse
INSERT INTO rooms (hotel_id, room_type_id, room_number, status)
WITH room_data AS (
  SELECT generate_series(146, 148) as num
)
SELECT
  h.id,
  rt.id,
  'M-' || room_data.num::text,
  CASE
    WHEN ((room_data.num - 146) % 10) IN (0,1) THEN 'Available'
    WHEN ((room_data.num - 146) % 10) = 2 THEN 'Occupied'
    ELSE 'Out of Service'
  END
FROM room_data
CROSS JOIN hotels h
CROSS JOIN room_types rt
WHERE h.location = 'Male' AND rt.name = 'Penthouse'
ON CONFLICT DO NOTHING;

-- ========================================
-- LAAMU LOCATION ROOMS (48 total)
-- ========================================

-- L-101 to L-120: Standard Double
INSERT INTO rooms (hotel_id, room_type_id, room_number, status)
WITH room_data AS (
  SELECT generate_series(101, 120) as num
)
SELECT
  h.id,
  rt.id,
  'L-' || room_data.num::text,
  CASE
    WHEN ((room_data.num - 101) % 10) IN (0,1,2,3,4) THEN 'Available'
    WHEN ((room_data.num - 101) % 10) IN (5,6) THEN 'Occupied'
    WHEN ((room_data.num - 101) % 10) IN (7,8) THEN 'Cleaning'
    ELSE 'Out of Service'
  END
FROM room_data
CROSS JOIN hotels h
CROSS JOIN room_types rt
WHERE h.location = 'Laamu' AND rt.name = 'Standard Double'
ON CONFLICT DO NOTHING;

-- L-121 to L-135: Deluxe King
INSERT INTO rooms (hotel_id, room_type_id, room_number, status)
WITH room_data AS (
  SELECT generate_series(121, 135) as num
)
SELECT
  h.id,
  rt.id,
  'L-' || room_data.num::text,
  CASE
    WHEN ((room_data.num - 121) % 10) IN (0,1,2,3,4) THEN 'Available'
    WHEN ((room_data.num - 121) % 10) IN (5,6) THEN 'Occupied'
    WHEN ((room_data.num - 121) % 10) IN (7,8) THEN 'Cleaning'
    ELSE 'Out of Service'
  END
FROM room_data
CROSS JOIN hotels h
CROSS JOIN room_types rt
WHERE h.location = 'Laamu' AND rt.name = 'Deluxe King'
ON CONFLICT DO NOTHING;

-- L-136 to L-145: Family Suite
INSERT INTO rooms (hotel_id, room_type_id, room_number, status)
WITH room_data AS (
  SELECT generate_series(136, 145) as num
)
SELECT
  h.id,
  rt.id,
  'L-' || room_data.num::text,
  CASE
    WHEN ((room_data.num - 136) % 10) IN (0,1,2,3,4) THEN 'Available'
    WHEN ((room_data.num - 136) % 10) IN (5,6) THEN 'Occupied'
    WHEN ((room_data.num - 136) % 10) IN (7,8) THEN 'Cleaning'
    ELSE 'Out of Service'
  END
FROM room_data
CROSS JOIN hotels h
CROSS JOIN room_types rt
WHERE h.location = 'Laamu' AND rt.name = 'Family Suite'
ON CONFLICT DO NOTHING;

-- L-146 to L-148: Penthouse
INSERT INTO rooms (hotel_id, room_type_id, room_number, status)
WITH room_data AS (
  SELECT generate_series(146, 148) as num
)
SELECT
  h.id,
  rt.id,
  'L-' || room_data.num::text,
  CASE
    WHEN ((room_data.num - 146) % 10) IN (0,1) THEN 'Available'
    WHEN ((room_data.num - 146) % 10) = 2 THEN 'Occupied'
    ELSE 'Out of Service'
  END
FROM room_data
CROSS JOIN hotels h
CROSS JOIN room_types rt
WHERE h.location = 'Laamu' AND rt.name = 'Penthouse'
ON CONFLICT DO NOTHING;

-- ========================================
-- FAAFU LOCATION ROOMS (48 total)
-- ========================================

-- F-101 to F-120: Standard Double
INSERT INTO rooms (hotel_id, room_type_id, room_number, status)
WITH room_data AS (
  SELECT generate_series(101, 120) as num
)
SELECT
  h.id,
  rt.id,
  'F-' || room_data.num::text,
  CASE
    WHEN ((room_data.num - 101) % 10) IN (0,1,2,3,4) THEN 'Available'
    WHEN ((room_data.num - 101) % 10) IN (5,6) THEN 'Occupied'
    WHEN ((room_data.num - 101) % 10) IN (7,8) THEN 'Cleaning'
    ELSE 'Out of Service'
  END
FROM room_data
CROSS JOIN hotels h
CROSS JOIN room_types rt
WHERE h.location = 'Faafu' AND rt.name = 'Standard Double'
ON CONFLICT DO NOTHING;

-- F-121 to F-135: Deluxe King
INSERT INTO rooms (hotel_id, room_type_id, room_number, status)
WITH room_data AS (
  SELECT generate_series(121, 135) as num
)
SELECT
  h.id,
  rt.id,
  'F-' || room_data.num::text,
  CASE
    WHEN ((room_data.num - 121) % 10) IN (0,1,2,3,4) THEN 'Available'
    WHEN ((room_data.num - 121) % 10) IN (5,6) THEN 'Occupied'
    WHEN ((room_data.num - 121) % 10) IN (7,8) THEN 'Cleaning'
    ELSE 'Out of Service'
  END
FROM room_data
CROSS JOIN hotels h
CROSS JOIN room_types rt
WHERE h.location = 'Faafu' AND rt.name = 'Deluxe King'
ON CONFLICT DO NOTHING;

-- F-136 to F-145: Family Suite
INSERT INTO rooms (hotel_id, room_type_id, room_number, status)
WITH room_data AS (
  SELECT generate_series(136, 145) as num
)
SELECT
  h.id,
  rt.id,
  'F-' || room_data.num::text,
  CASE
    WHEN ((room_data.num - 136) % 10) IN (0,1,2,3,4) THEN 'Available'
    WHEN ((room_data.num - 136) % 10) IN (5,6) THEN 'Occupied'
    WHEN ((room_data.num - 136) % 10) IN (7,8) THEN 'Cleaning'
    ELSE 'Out of Service'
  END
FROM room_data
CROSS JOIN hotels h
CROSS JOIN room_types rt
WHERE h.location = 'Faafu' AND rt.name = 'Family Suite'
ON CONFLICT DO NOTHING;

-- F-146 to F-148: Penthouse
INSERT INTO rooms (hotel_id, room_type_id, room_number, status)
WITH room_data AS (
  SELECT generate_series(146, 148) as num
)
SELECT
  h.id,
  rt.id,
  'F-' || room_data.num::text,
  CASE
    WHEN ((room_data.num - 146) % 10) IN (0,1) THEN 'Available'
    WHEN ((room_data.num - 146) % 10) = 2 THEN 'Occupied'
    ELSE 'Out of Service'
  END
FROM room_data
CROSS JOIN hotels h
CROSS JOIN room_types rt
WHERE h.location = 'Faafu' AND rt.name = 'Penthouse'
ON CONFLICT DO NOTHING;

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
