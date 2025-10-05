-- Create payment records for existing bookings that don't have payments yet

INSERT INTO payments (booking_id, amount, status, payment_method, transaction_id, payment_date, created_at)
SELECT
    b.id as booking_id,
    b.total_price as amount,
    CASE
        WHEN b.status = 'cancelled' THEN 'failed'
        WHEN b.status IN ('confirmed', 'checked_in', 'checked_out') THEN 'completed'
        ELSE 'pending'
    END as status,
    -- Alternate between payment methods for variety
    CASE WHEN (ROW_NUMBER() OVER (ORDER BY b.created_at)) % 2 = 0 THEN 'credit_card' ELSE 'bank_transfer' END as payment_method,
    'TXN-' || UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 10)) as transaction_id,
    b.created_at as payment_date,
    b.created_at as created_at
FROM bookings b
LEFT JOIN payments p ON b.id = p.booking_id
WHERE p.id IS NULL;

-- Verify results
SELECT
    'Total bookings' as metric,
    COUNT(*) as count
FROM bookings
UNION ALL
SELECT
    'Total payments' as metric,
    COUNT(*) as count
FROM payments
UNION ALL
SELECT
    'Bookings without payments' as metric,
    COUNT(*) as count
FROM bookings b
LEFT JOIN payments p ON b.id = p.booking_id
WHERE p.id IS NULL;
