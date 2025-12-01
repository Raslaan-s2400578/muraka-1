-- ========================================
-- PRICING SYSTEM IMPLEMENTATION
-- ========================================
-- Migration: Implement complete pricing structure
-- Date: 2025-01-25

-- ========================================
-- 1. CREATE PEAK SEASONS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS peak_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  multiplier DECIMAL(3,2) DEFAULT 1.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (start_date <= end_date),
  UNIQUE(hotel_id, name)
);

CREATE INDEX idx_peak_seasons_hotel_id ON peak_seasons(hotel_id);
CREATE INDEX idx_peak_seasons_dates ON peak_seasons(start_date, end_date);
CREATE INDEX idx_peak_seasons_active ON peak_seasons(is_active);

-- ========================================
-- 2. UPDATE ROOM_TYPES TABLE (add currency)
-- ========================================

ALTER TABLE room_types
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'GBP' CHECK (currency IN ('GBP', 'USD', 'EUR')),
ADD COLUMN IF NOT EXISTS description_full TEXT,
ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'::jsonb;

-- ========================================
-- 3. CREATE CANCELLATION FEES TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS cancellation_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  days_before_checkin_min INTEGER NOT NULL,
  days_before_checkin_max INTEGER NOT NULL,
  fee_type TEXT NOT NULL CHECK (fee_type IN ('percentage', 'fixed', 'nights')),
  fee_value DECIMAL(10,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_days CHECK (days_before_checkin_min <= days_before_checkin_max),
  UNIQUE(hotel_id, days_before_checkin_min, days_before_checkin_max)
);

CREATE INDEX idx_cancellation_fees_hotel ON cancellation_fees(hotel_id);
CREATE INDEX idx_cancellation_fees_active ON cancellation_fees(is_active);

-- ========================================
-- 4. UPDATE SERVICES TABLE (add details)
-- ========================================

ALTER TABLE services
ADD COLUMN IF NOT EXISTS unit_type TEXT DEFAULT 'per_occurrence' CHECK (
  unit_type IN ('per_occurrence', 'per_person_per_day', 'per_transfer')
),
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other' CHECK (
  category IN ('transfer', 'food', 'wellness', 'other')
),
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'GBP' CHECK (currency IN ('GBP', 'USD', 'EUR')),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_active ON services(is_active);

-- ========================================
-- 5. CREATE PRICING_AUDIT TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS pricing_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type_id UUID REFERENCES room_types(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  old_price DECIMAL(10,2),
  new_price DECIMAL(10,2),
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  change_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pricing_audit_room_type ON pricing_audit(room_type_id);
CREATE INDEX idx_pricing_audit_service ON pricing_audit(service_id);
CREATE INDEX idx_pricing_audit_date ON pricing_audit(created_at DESC);

-- ========================================
-- 6. INSERT DEFAULT CANCELLATION FEES
-- ========================================

-- For each hotel, insert standard cancellation fee structure
INSERT INTO cancellation_fees (hotel_id, days_before_checkin_min, days_before_checkin_max, fee_type, fee_value, description)
SELECT
  h.id,
  days_min,
  days_max,
  fee_type,
  fee_value,
  description
FROM (
  SELECT 15 as days_min, 9999 as days_max, 'percentage' as fee_type, 0 as fee_value, 'More than 14 days: Free' as description
  UNION ALL
  SELECT 3, 14, 'nights', 1, '3-14 days: 50% of first night' as description
  UNION ALL
  SELECT 0, 2, 'nights', 1, 'Less than 72 hours: 100% of first night' as description
) AS fees
CROSS JOIN hotels h
ON CONFLICT DO NOTHING;

-- ========================================
-- 7. UPDATE ROOM_TYPES WITH STANDARD DATA
-- ========================================

UPDATE room_types
SET
  currency = 'GBP',
  description_full = CASE
    WHEN name = 'Standard Double' THEN 'Comfortable double room with all essentials'
    WHEN name = 'Deluxe King' THEN 'Spacious room with premium bedding and amenities'
    WHEN name = 'Family Suite' THEN 'Large suite perfect for families with separate areas'
    WHEN name = 'Penthouse' THEN 'Luxury penthouse with panoramic views'
    ELSE 'Premium accommodation'
  END,
  amenities = CASE
    WHEN name = 'Standard Double' THEN '["TV", "WiFi", "Private Bathroom", "Air Conditioning"]'::jsonb
    WHEN name = 'Deluxe King' THEN '["TV", "WiFi", "Private Bathroom", "Air Conditioning", "Mini Bar", "Premium Bedding"]'::jsonb
    WHEN name = 'Family Suite' THEN '["TV", "WiFi", "Private Bathroom", "Air Conditioning", "Mini Bar", "Living Area", "Kitchenette"]'::jsonb
    WHEN name = 'Penthouse' THEN '["TV", "WiFi", "Private Bathroom", "Air Conditioning", "Mini Bar", "Panoramic Views", "Hot Tub", "Private Terrace"]'::jsonb
    ELSE '["TV", "WiFi", "Private Bathroom", "Air Conditioning"]'::jsonb
  END
WHERE name IN ('Standard Double', 'Deluxe King', 'Family Suite', 'Penthouse');

-- ========================================
-- 8. UPDATE SERVICES WITH STANDARD DATA
-- ========================================

UPDATE services
SET
  unit_type = CASE
    WHEN name LIKE 'Airport%' THEN 'per_transfer'
    WHEN name LIKE '%Breakfast%' THEN 'per_person_per_day'
    WHEN name LIKE '%Spa%' THEN 'per_person_per_day'
    WHEN name LIKE '%Check-out%' THEN 'per_occurrence'
    ELSE 'per_occurrence'
  END,
  category = CASE
    WHEN name LIKE 'Airport%' THEN 'transfer'
    WHEN name LIKE '%Breakfast%' THEN 'food'
    WHEN name LIKE '%Spa%' THEN 'wellness'
    ELSE 'other'
  END,
  currency = 'GBP',
  is_active = true
WHERE name IN (
  'Airport Transfer (One-way)',
  'Full English Breakfast',
  'Spa Access',
  'Late Check-out (until 2 PM)'
);

-- ========================================
-- 9. RLS POLICIES FOR NEW TABLES
-- ========================================

-- Peak Seasons RLS
ALTER TABLE peak_seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Peak seasons viewable by everyone" ON peak_seasons
  FOR SELECT USING (is_active = true);

CREATE POLICY "Managers and admins can manage peak seasons" ON peak_seasons
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('manager', 'admin')
    )
  );

-- Cancellation Fees RLS
ALTER TABLE cancellation_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cancellation fees viewable by everyone" ON cancellation_fees
  FOR SELECT USING (is_active = true);

CREATE POLICY "Managers and admins can manage cancellation fees" ON cancellation_fees
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('manager', 'admin')
    )
  );

-- Pricing Audit RLS
ALTER TABLE pricing_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and managers can view pricing audit" ON pricing_audit
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('manager', 'admin')
    )
  );

CREATE POLICY "System can create audit entries" ON pricing_audit
  FOR INSERT WITH CHECK (true);

-- ========================================
-- 10. HELPER FUNCTION: Calculate Peak Season Status
-- ========================================

CREATE OR REPLACE FUNCTION is_peak_season(
  hotel_id UUID,
  check_date DATE
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM peak_seasons
    WHERE peak_seasons.hotel_id = is_peak_season.hotel_id
      AND is_active = true
      AND check_date BETWEEN start_date AND end_date
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ========================================
-- 11. HELPER FUNCTION: Calculate Room Price
-- ========================================

CREATE OR REPLACE FUNCTION calculate_room_price(
  room_type_id UUID,
  check_in_date DATE,
  check_out_date DATE,
  hotel_id UUID
)
RETURNS TABLE(
  base_price DECIMAL,
  is_peak BOOLEAN,
  applied_price DECIMAL,
  num_nights INTEGER,
  total_price DECIMAL
) AS $$
DECLARE
  v_base_price DECIMAL;
  v_peak_price DECIMAL;
  v_is_peak BOOLEAN;
  v_num_nights INTEGER;
  v_applied_price DECIMAL;
BEGIN
  -- Get room type pricing
  SELECT price_off_peak, price_peak INTO v_base_price, v_peak_price
  FROM room_types
  WHERE id = room_type_id;

  -- Calculate nights
  v_num_nights := check_out_date - check_in_date;

  -- Check if peak season (check-in date determines pricing)
  v_is_peak := is_peak_season(hotel_id, check_in_date);

  -- Determine applied price
  v_applied_price := CASE WHEN v_is_peak THEN v_peak_price ELSE v_base_price END;

  RETURN QUERY SELECT
    v_base_price,
    v_is_peak,
    v_applied_price,
    v_num_nights,
    v_applied_price * v_num_nights;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ========================================
-- 12. HELPER FUNCTION: Calculate Cancellation Fee
-- ========================================

CREATE OR REPLACE FUNCTION calculate_cancellation_fee(
  hotel_id UUID,
  check_in_date DATE,
  first_night_price DECIMAL,
  total_booking_price DECIMAL,
  cancellation_date DATE
)
RETURNS TABLE(
  fee_amount DECIMAL,
  fee_percentage DECIMAL,
  description TEXT,
  refund_amount DECIMAL
) AS $$
DECLARE
  v_days_before INTEGER;
  v_fee_type TEXT;
  v_fee_value DECIMAL;
  v_fee_amount DECIMAL;
  v_fee_percentage DECIMAL;
  v_description TEXT;
BEGIN
  -- Calculate days before check-in
  v_days_before := check_in_date - cancellation_date;

  -- Get applicable fee rule
  SELECT
    fee_type,
    fee_value,
    cancellation_fees.description
  INTO v_fee_type, v_fee_value, v_description
  FROM cancellation_fees
  WHERE cancellation_fees.hotel_id = calculate_cancellation_fee.hotel_id
    AND is_active = true
    AND v_days_before BETWEEN days_before_checkin_min AND days_before_checkin_max
  LIMIT 1;

  -- Default if no rule found (should not happen)
  IF v_fee_type IS NULL THEN
    v_fee_type := 'percentage';
    v_fee_value := 100;
    v_description := 'No-show: 100% charge';
  END IF;

  -- Calculate fee based on type
  CASE v_fee_type
    WHEN 'percentage' THEN
      v_fee_amount := (total_booking_price * v_fee_value) / 100;
      v_fee_percentage := v_fee_value;
    WHEN 'nights' THEN
      v_fee_amount := first_night_price * v_fee_value;
      v_fee_percentage := (v_fee_amount / total_booking_price) * 100;
    WHEN 'fixed' THEN
      v_fee_amount := v_fee_value;
      v_fee_percentage := (v_fee_amount / total_booking_price) * 100;
  END CASE;

  RETURN QUERY SELECT
    v_fee_amount,
    v_fee_percentage,
    v_description,
    total_booking_price - v_fee_amount;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ========================================
-- 13. INSERT DEFAULT PEAK SEASONS
-- ========================================

INSERT INTO peak_seasons (hotel_id, name, start_date, end_date, multiplier, is_active)
SELECT
  h.id,
  season,
  start_dt,
  end_dt,
  mult,
  true
FROM (
  SELECT 'Summer Peak' as season, '2025-07-01'::DATE as start_dt, '2025-08-31'::DATE as end_dt, 1.0::DECIMAL as mult
  UNION ALL
  SELECT 'Christmas/New Year', '2025-12-15'::DATE, '2026-01-05'::DATE, 1.0
  UNION ALL
  SELECT 'Easter', '2026-03-20'::DATE, '2026-04-10'::DATE, 1.0
) AS seasons
CROSS JOIN hotels h
ON CONFLICT DO NOTHING;

-- ========================================
-- 14. CREATE FUNCTION: Get Itemized Booking Cost
-- ========================================

CREATE OR REPLACE FUNCTION calculate_itemized_booking_cost(
  p_hotel_id UUID,
  p_check_in DATE,
  p_check_out DATE,
  p_room_type_id UUID,
  p_service_details JSONB -- [{service_id: uuid, quantity: int}, ...]
)
RETURNS TABLE(
  room_cost DECIMAL,
  room_nights INTEGER,
  room_per_night DECIMAL,
  is_peak BOOLEAN,
  services_cost DECIMAL,
  service_details JSONB,
  subtotal DECIMAL,
  tax_amount DECIMAL,
  tax_rate DECIMAL,
  total_cost DECIMAL
) AS $$
DECLARE
  v_room_cost DECIMAL;
  v_room_nights INTEGER;
  v_room_per_night DECIMAL;
  v_is_peak BOOLEAN;
  v_services_cost DECIMAL;
  v_service_details JSONB;
  v_subtotal DECIMAL;
  v_tax_amount DECIMAL := 0;
  v_tax_rate DECIMAL := 0.20; -- 20% VAT default
BEGIN
  -- Calculate room costs
  SELECT
    total_price,
    num_nights,
    applied_price,
    is_peak
  INTO v_room_cost, v_room_nights, v_room_per_night, v_is_peak
  FROM calculate_room_price(p_room_type_id, p_check_in, p_check_out, p_hotel_id);

  -- Calculate services cost
  v_services_cost := 0;
  v_service_details := '[]'::jsonb;

  IF p_service_details IS NOT NULL THEN
    WITH service_calcs AS (
      SELECT
        (item->>'service_id')::UUID as service_id,
        (item->>'quantity')::INTEGER as quantity,
        s.price,
        s.unit_type,
        CASE
          WHEN s.unit_type = 'per_person_per_day' THEN s.price * (item->>'quantity')::INTEGER * v_room_nights
          ELSE s.price * (item->>'quantity')::INTEGER
        END as total_cost
      FROM jsonb_array_elements(p_service_details) as item
      JOIN services s ON s.id = (item->>'service_id')::UUID
    )
    SELECT
      SUM(total_cost),
      jsonb_agg(jsonb_build_object(
        'service_id', service_id,
        'quantity', quantity,
        'price_per_unit', price,
        'unit_type', unit_type,
        'total', total_cost
      ))
    INTO v_services_cost, v_service_details
    FROM service_calcs;
  END IF;

  v_services_cost := COALESCE(v_services_cost, 0);
  v_subtotal := v_room_cost + v_services_cost;
  v_tax_amount := v_subtotal * v_tax_rate;

  RETURN QUERY SELECT
    v_room_cost,
    v_room_nights,
    v_room_per_night,
    v_is_peak,
    v_services_cost,
    v_service_details,
    v_subtotal,
    v_tax_amount,
    v_tax_rate,
    v_subtotal + v_tax_amount;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- VERIFICATION
-- ========================================

-- Show created tables
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('peak_seasons', 'cancellation_fees', 'pricing_audit')
ORDER BY tablename;
