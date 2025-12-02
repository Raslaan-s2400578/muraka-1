-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'successful', 'failed', 'refunded', 'completed')),
    payment_method TEXT,
    transaction_id TEXT UNIQUE,
    payment_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_booking_payment UNIQUE(booking_id)
);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- RLS Policies
-- Allow guests to view and create payments for their bookings
CREATE POLICY "Guests can view payments for their bookings"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_id
      AND bookings.guest_id = auth.uid()
    )
  );

CREATE POLICY "Guests can create payments for their bookings"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_id
      AND bookings.guest_id = auth.uid()
    )
  );

-- Allow staff/admin to view and manage all payments
CREATE POLICY "Staff and admin can view all payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff', 'manager')
    )
  );

CREATE POLICY "Staff and admin can update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff', 'manager')
    )
  );

-- Allow admin to delete payments
CREATE POLICY "Admin can delete payments"
  ON payments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert test payment data for confirmed bookings
INSERT INTO payments (booking_id, amount, status, payment_method, created_at)
SELECT
  b.id,
  b.total_price,
  CASE
    WHEN RANDOM() < 0.7 THEN 'completed'::TEXT
    WHEN RANDOM() < 0.9 THEN 'pending'::TEXT
    ELSE 'failed'::TEXT
  END as status,
  CASE
    WHEN RANDOM() < 0.6 THEN 'credit_card'::TEXT
    WHEN RANDOM() < 0.8 THEN 'debit_card'::TEXT
    ELSE 'bank_transfer'::TEXT
  END as payment_method,
  NOW() - INTERVAL '1 day' * (RANDOM() * 30)::INT
FROM bookings b
WHERE b.status IN ('confirmed', 'checked_in', 'checked_out')
AND NOT EXISTS (
  SELECT 1 FROM payments p WHERE p.booking_id = b.id
)
ON CONFLICT (booking_id) DO NOTHING;
