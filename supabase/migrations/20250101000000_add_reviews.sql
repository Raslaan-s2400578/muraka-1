-- Create reviews table for guest feedback
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one review per booking
  UNIQUE(booking_id)
);

-- Add index for faster queries
CREATE INDEX idx_reviews_hotel ON reviews(hotel_id);
CREATE INDEX idx_reviews_guest ON reviews(guest_id);
CREATE INDEX idx_reviews_created ON reviews(created_at DESC);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Guests can create reviews for their own bookings
CREATE POLICY "Guests can create reviews for their bookings"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = guest_id AND
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_id
      AND bookings.guest_id = auth.uid()
      AND bookings.status = 'checked_out'
    )
  );

-- Guests can update their own reviews
CREATE POLICY "Guests can update their own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = guest_id)
  WITH CHECK (auth.uid() = guest_id);

-- Everyone can read reviews
CREATE POLICY "Anyone can read reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_reviews_updated_at();

-- Add average rating column to hotels (denormalized for performance)
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Function to update hotel ratings
CREATE OR REPLACE FUNCTION update_hotel_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE hotels
  SET
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews
      WHERE hotel_id = COALESCE(NEW.hotel_id, OLD.hotel_id)
    ),
    review_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE hotel_id = COALESCE(NEW.hotel_id, OLD.hotel_id)
    )
  WHERE id = COALESCE(NEW.hotel_id, OLD.hotel_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update hotel ratings when reviews change
CREATE TRIGGER update_hotel_rating_on_insert
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_hotel_rating();

CREATE TRIGGER update_hotel_rating_on_update
  AFTER UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_hotel_rating();

CREATE TRIGGER update_hotel_rating_on_delete
  AFTER DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_hotel_rating();
