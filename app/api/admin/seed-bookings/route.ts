import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Configure Edge Runtime for Cloudflare Pages
export const runtime = 'edge'

export async function POST(request: Request) {
  try {
    // Check if service role key is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Service role key not configured' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get all guest profiles
    const { data: guests, error: guestsError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('role', 'guest')

    if (guestsError) throw guestsError
    if (!guests || guests.length === 0) {
      return NextResponse.json(
        { error: 'No guest accounts found. Please create guest accounts first.' },
        { status: 400 }
      )
    }

    // Get all hotels
    const { data: hotels, error: hotelsError } = await supabaseAdmin
      .from('hotels')
      .select('id')

    if (hotelsError) throw hotelsError
    if (!hotels || hotels.length === 0) {
      return NextResponse.json(
        { error: 'No hotels found in database' },
        { status: 400 }
      )
    }

    // Get all rooms
    const { data: rooms, error: roomsError } = await supabaseAdmin
      .from('rooms')
      .select('id, hotel_id')

    if (roomsError) throw roomsError
    if (!rooms || rooms.length === 0) {
      return NextResponse.json(
        { error: 'No rooms found in database' },
        { status: 400 }
      )
    }

    // Get services for booking services
    const { data: services, error: servicesError } = await supabaseAdmin
      .from('services')
      .select('id')

    if (servicesError) throw servicesError

    let bookingsCreated = 0
    const bookingIds: string[] = []

    // Create bookings for each guest
    for (const guest of guests) {
      // Randomize booking details
      const hotel = hotels[Math.floor(Math.random() * hotels.length)]
      const guestRooms = rooms.filter(r => r.hotel_id === hotel.id)
      if (guestRooms.length === 0) continue

      const room = guestRooms[Math.floor(Math.random() * guestRooms.length)]

      // Vary check-in dates
      const daysOffset = Math.floor(Math.random() * 120) - 30 // -30 to +90 days
      const checkInDate = new Date()
      checkInDate.setDate(checkInDate.getDate() + daysOffset)

      // Check-out 3-7 days after check-in
      const checkOutDate = new Date(checkInDate)
      checkOutDate.setDate(checkOutDate.getDate() + (3 + Math.floor(Math.random() * 5)))

      // Generate price
      const totalPrice = 500 + Math.floor(Math.random() * 1000)

      // Determine status based on dates
      const now = new Date()
      let status = 'pending'
      if (checkOutDate < now) {
        status = 'checked_out'
      } else if (checkInDate <= now && checkOutDate > now) {
        status = 'checked_in'
      } else if (Math.random() > 0.85) {
        status = 'cancelled'
      } else if (Math.random() > 0.3) {
        status = 'confirmed'
      }

      // Create booking
      const { data: booking, error: bookingError } = await supabaseAdmin
        .from('bookings')
        .insert({
          guest_id: guest.id,
          hotel_id: hotel.id,
          check_in: checkInDate.toISOString().split('T')[0],
          check_out: checkOutDate.toISOString().split('T')[0],
          total_price: totalPrice,
          status: status
        })
        .select()

      if (bookingError) {
        console.error('Booking creation error:', bookingError)
        continue
      }

      if (booking && booking[0]) {
        bookingsCreated++
        bookingIds.push(booking[0].id)

        // Add room to booking
        const pricePerNight = (totalPrice / (Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)))).toFixed(2)

        const { error: roomError } = await supabaseAdmin
          .from('booking_rooms')
          .insert({
            booking_id: booking[0].id,
            room_id: room.id,
            price_per_night: parseFloat(pricePerNight)
          })

        if (roomError) {
          console.error('Room assignment error:', roomError)
        }

        // Add random services to some bookings
        if (services && services.length > 0 && Math.random() > 0.6) {
          const numServices = Math.floor(Math.random() * 2) + 1
          for (let i = 0; i < numServices; i++) {
            const service = services[Math.floor(Math.random() * services.length)]
            const { error: serviceError } = await supabaseAdmin
              .from('booking_services')
              .insert({
                booking_id: booking[0].id,
                service_id: service.id,
                quantity: Math.floor(Math.random() * 3) + 1
              })

            if (serviceError) {
              console.error('Service assignment error:', serviceError)
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${bookingsCreated} bookings for ${guests.length} guests`,
      bookingsCreated,
      guestCount: guests.length
    })
  } catch (error: any) {
    console.error('Seed bookings error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to seed bookings' },
      { status: 500 }
    )
  }
}
