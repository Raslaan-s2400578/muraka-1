-- Fix pricing data to match specification
-- All locations should have SAME pricing (currently they differ)

-- STANDARD DOUBLE: £120 / £180
UPDATE room_types SET price_off_peak = 120, price_peak = 180
WHERE name = 'Standard Double';

-- DELUXE KING: £180 / £250
UPDATE room_types SET price_off_peak = 180, price_peak = 250
WHERE name = 'Deluxe King';

-- FAMILY SUITE: £240 / £320
UPDATE room_types SET price_off_peak = 240, price_peak = 320
WHERE name = 'Family Suite';

-- PENTHOUSE: £500 / £750
UPDATE room_types SET price_off_peak = 500, price_peak = 750
WHERE name = 'Penthouse';

-- Verify the fix
SELECT name, price_off_peak, price_peak FROM room_types ORDER BY name;
