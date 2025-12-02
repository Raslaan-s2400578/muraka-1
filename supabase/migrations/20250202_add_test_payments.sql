-- Add test payment data for dashboard stats
-- This migration creates sample payments for confirmed bookings

INSERT INTO payments (booking_id, amount, status, payment_method, created_at)
SELECT
  b.id,
  b.total_price,
  CASE
    WHEN RANDOM() < 0.7 THEN 'successful'::TEXT
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
ON CONFLICT (id) DO NOTHING;
