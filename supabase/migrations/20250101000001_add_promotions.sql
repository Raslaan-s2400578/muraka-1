-- Create promotions/discounts table
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  discount_percentage INTEGER CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  discount_amount DECIMAL(10,2),
  code TEXT UNIQUE,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  room_type_id UUID REFERENCES room_types(id) ON DELETE CASCADE,
  min_nights INTEGER DEFAULT 1,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure at least one discount type is set
  CONSTRAINT check_discount_type CHECK (
    (discount_percentage IS NOT NULL AND discount_amount IS NULL) OR
    (discount_percentage IS NULL AND discount_amount IS NOT NULL)
  ),

  -- Ensure end date is after start date
  CONSTRAINT check_dates CHECK (end_date > start_date)
);

-- Add indexes
CREATE INDEX idx_promotions_active ON promotions(is_active, start_date, end_date);
CREATE INDEX idx_promotions_code ON promotions(code) WHERE code IS NOT NULL;
CREATE INDEX idx_promotions_hotel ON promotions(hotel_id);

-- Enable RLS
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Admin and manager can manage promotions
CREATE POLICY "Admins and managers can manage promotions"
  ON promotions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Everyone can read active promotions
CREATE POLICY "Anyone can read active promotions"
  ON promotions FOR SELECT
  TO authenticated
  USING (is_active = true AND NOW() BETWEEN start_date AND end_date);

-- Create newsletter subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  unsubscribed_at TIMESTAMP WITH TIME ZONE
);

-- Add index
CREATE INDEX idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX idx_newsletter_active ON newsletter_subscribers(is_active);

-- Enable RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe
CREATE POLICY "Anyone can subscribe to newsletter"
  ON newsletter_subscribers FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admin can view and manage subscribers
CREATE POLICY "Admins can manage newsletter subscribers"
  ON newsletter_subscribers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Trigger to update updated_at
CREATE TRIGGER promotions_updated_at
  BEFORE UPDATE ON promotions
  FOR EACH ROW
  EXECUTE FUNCTION update_reviews_updated_at();
