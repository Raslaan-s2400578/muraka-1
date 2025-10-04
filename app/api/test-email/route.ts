import { NextResponse } from 'next/server'
import { sendWelcomeEmail, sendBookingConfirmation } from '@/lib/email/send'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'welcome'
  const email = searchParams.get('email')

  if (!email) {
    return NextResponse.json(
      { error: 'Email parameter required. Use: ?type=welcome&email=your@email.com' },
      { status: 400 }
    )
  }

  try {
    if (type === 'welcome') {
      const result = await sendWelcomeEmail(email, 'Mohamed Raslaan')
      return NextResponse.json(result)
    }

    if (type === 'booking') {
      const result = await sendBookingConfirmation(email, {
        guestName: 'Mohamed Raslaan',
        bookingId: '22be711d-970e-48c1-9a5b-2a61df5ae5b3',
        hotelName: 'Muraka Laamu',
        roomNumber: '101',
        roomType: 'Standard Double',
        checkIn: 'Friday, October 18, 2025',
        checkOut: 'Sunday, October 29, 2025',
        numberOfGuests: 2,
        totalAmount: 1650.00,
        phone: '+960 123-4567',
        specialRequests: 'Late check-in please, arriving around 10 PM',
      })
      return NextResponse.json(result)
    }

    return NextResponse.json(
      { error: 'Invalid type. Use ?type=welcome or ?type=booking' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { error: 'Failed to send test email', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
