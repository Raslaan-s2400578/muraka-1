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

/**
 * Cancellation Fee Calculator API Route
 * POST /api/pricing/cancellation-fee
 * Calculate cancellation fee for given booking and cancellation date
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculateCancellationFee, getApplicableCancellationRule } from '@/lib/pricing/calculator'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      hotel_id,
      check_in,
      cancellation_date,
      first_night_price,
      total_booking_price,
    } = body

    // Validate required fields
    if (
      !hotel_id ||
      !check_in ||
      !cancellation_date ||
      first_night_price === undefined ||
      total_booking_price === undefined
    ) {
      return NextResponse.json(
        {
          error: 'Missing required fields: hotel_id, check_in, cancellation_date, first_night_price, total_booking_price',
        },
        { status: 400 }
      )
    }

    // Validate price values
    if (first_night_price < 0 || total_booking_price < 0) {
      return NextResponse.json(
        { error: 'Prices cannot be negative' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch cancellation fee rules for hotel
    const { data: rules, error: rulesError } = await supabase
      .from('cancellation_fees')
      .select('*')
      .eq('hotel_id', hotel_id)
      .eq('is_active', true)
      .order('days_before_checkin_min', { ascending: false })

    if (rulesError) {
      console.error('Error fetching cancellation rules:', rulesError)
      return NextResponse.json(
        { error: 'Failed to fetch cancellation rules' },
        { status: 500 }
      )
    }

    if (!rules || rules.length === 0) {
      return NextResponse.json(
        { error: 'No cancellation rules found for this hotel' },
        { status: 404 }
      )
    }

    // Calculate days before check-in
    const checkInDate = new Date(check_in)
    const cancellationDateObj = new Date(cancellation_date)
    const daysBeforeCheckIn = Math.ceil(
      (checkInDate.getTime() - cancellationDateObj.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Get applicable rule
    const applicableRule = getApplicableCancellationRule(daysBeforeCheckIn, rules)

    if (!applicableRule) {
      return NextResponse.json(
        { error: 'No applicable cancellation rule found' },
        { status: 400 }
      )
    }

    // Calculate fee
    const cancellationFee = calculateCancellationFee(
      check_in,
      cancellation_date,
      first_night_price,
      total_booking_price,
      {
        days_before: daysBeforeCheckIn,
        fee_type: applicableRule.fee_type,
        fee_value: applicableRule.fee_value,
      }
    )

    return NextResponse.json({
      success: true,
      data: {
        ...cancellationFee,
        applicable_rule: applicableRule,
        policy_description: (applicableRule as any).description || 'Cancellation fee applied',
      },
    })
  } catch (error: any) {
    console.error('Cancellation fee calculation error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
