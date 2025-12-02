import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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

    // Check if payments table exists
    const { error: checkError } = await adminSupabase
      .from('payments')
      .select('id')
      .limit(1)

    if (checkError?.code === 'PGRST205') {
      return NextResponse.json(
        {
          message: 'Payments table does not exist. Please create it in Supabase dashboard first.',
          error: checkError.message
        },
        { status: 400 }
      )
    }

    // Get confirmed bookings
    const { data: bookings, error: bookingsError } = await adminSupabase
      .from('bookings')
      .select('id, total_price, status')
      .in('status', ['confirmed', 'checked_in', 'checked_out'])

    if (bookingsError) {
      throw bookingsError
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json(
        { message: 'No confirmed bookings found', created: 0 }
      )
    }

    // Check which bookings already have payments
    const { data: existingPayments } = await adminSupabase
      .from('payments')
      .select('booking_id')

    const existingBookingIds = new Set(existingPayments?.map(p => p.booking_id) || [])

    // Create payments for bookings that don't have one
    const paymentsToCreate = bookings
      .filter(b => !existingBookingIds.has(b.id))
      .map(b => ({
        booking_id: b.id,
        amount: b.total_price || 0,
        status: Math.random() < 0.7 ? 'completed' : Math.random() < 0.9 ? 'pending' : 'failed',
        payment_method: Math.random() < 0.6 ? 'credit_card' : Math.random() < 0.8 ? 'debit_card' : 'bank_transfer',
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      }))

    if (paymentsToCreate.length === 0) {
      return NextResponse.json(
        { message: 'All confirmed bookings already have payments', created: 0 }
      )
    }

    const { data: createdPayments, error: insertError } = await adminSupabase
      .from('payments')
      .insert(paymentsToCreate)
      .select()

    if (insertError) {
      throw insertError
    }

    return NextResponse.json({
      message: 'Payments created successfully',
      created: createdPayments?.length || 0,
      total_bookings: bookings.length
    })
  } catch (error: any) {
    console.error('Seed payments error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
