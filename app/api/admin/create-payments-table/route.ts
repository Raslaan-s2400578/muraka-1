/**
 * Hotel Management System - Muraka
 * 
 * @student Aminath Yaula Yaarid - S2400576
 * @student Hawwa Saha Nasih - S2400566
 * @student Milyaaf Abdul Sattar - S2300565
 * @student Mohamed Raslaan Najeeb - S2400578
 * 
 * Module: UFCF8S-30-2 Advanced Software Development
 * Institution: UWE Bristol
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 400 }
      )
    }

    const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })

    // Execute raw SQL to create payments table and add test data
    const { error } = await adminSupabase.rpc('exec', {
      sql: `
        -- Create payments table if it doesn't exist
        CREATE TABLE IF NOT EXISTS payments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
          amount DECIMAL(10, 2) NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          payment_method TEXT,
          transaction_id TEXT,
          payment_date TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          CONSTRAINT unique_booking_payment UNIQUE(booking_id)
        );

        -- Create index
        CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
        CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

        -- Insert test payments for confirmed bookings
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
      `
    })

    if (error) {
      throw error
    }

    return NextResponse.json({
      message: 'Payments table created and populated successfully'
    })
  } catch (error: any) {
    console.error('Create payments table error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
