-- Fix payments table RLS policies to allow guests to create payments for their bookings

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
DROP POLICY IF EXISTS "Staff can view all payments" ON payments;
DROP POLICY IF EXISTS "Admin can manage all payments" ON payments;

-- Allow guests to insert payments for their own bookings
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

-- Allow users to view their own payments
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_id
      AND bookings.guest_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff', 'manager')
    )
  );

-- Allow staff/admin to update payments
CREATE POLICY "Staff and admin can update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (
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
