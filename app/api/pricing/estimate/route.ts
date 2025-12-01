/**
 * Pricing Estimate API Route
 * GET /api/pricing/estimate
 * Calculate pricing estimate for given booking parameters
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculateRoomPriceByDates, calculateItemizedBookingCost } from '@/lib/pricing/calculator'
import { Currency } from '@/types/pricing'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Get parameters
    const hotelId = searchParams.get('hotel_id')
    const roomTypeId = searchParams.get('room_type_id')
    const checkIn = searchParams.get('check_in')
    const checkOut = searchParams.get('check_out')
    const isPeak = searchParams.get('is_peak') === 'true'

    // Validate required parameters
    if (!hotelId || !roomTypeId || !checkIn || !checkOut) {
      return NextResponse.json(
        {
          error: 'Missing required parameters: hotel_id, room_type_id, check_in, check_out',
        },
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

    // Fetch room type details
    const { data: roomType, error: roomError } = await supabase
      .from('room_types')
      .select('*')
      .eq('id', roomTypeId)
      .single()

    if (roomError || !roomType) {
      return NextResponse.json(
        { error: 'Room type not found' },
        { status: 404 }
      )
    }

    // Calculate room pricing
    const roomPricing = calculateRoomPriceByDates(
      roomType.price_off_peak,
      roomType.price_peak,
      checkIn,
      checkOut,
      isPeak
    )

    // Fetch available services
    const { data: services = [] } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)

    // Calculate total with no services initially
    const itemized = calculateItemizedBookingCost(roomPricing, [], 0.2, Currency.GBP)

    return NextResponse.json({
      success: true,
      data: {
        check_in: checkIn,
        check_out: checkOut,
        room_type: roomType,
        pricing: roomPricing,
        itemized,
        available_services: services,
        currency: Currency.GBP,
      },
    })
  } catch (error: any) {
    console.error('Pricing estimate error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
