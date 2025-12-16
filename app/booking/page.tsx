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

'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, UsersIcon, MapPinIcon } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'

interface RoomType {
  id: string
  name: string
  capacity: number
  price_off_peak: number
  price_peak: number
  description: string
  hotel: {
    id: string
    name: string
    location: string
    address: string
  }[]
}

interface Service {
  id: string
  name: string
  price: number
}

interface BookingForm {
  fullName: string
  email: string
  phone: string
  specialRequests: string
}

function BookingPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [roomType, setRoomType] = useState<RoomType | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [selectedServices, setSelectedServices] = useState<Record<string, number>>({})
  const [form, setForm] = useState<BookingForm>({
    fullName: '',
    email: '',
    phone: '',
    specialRequests: ''
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<User | null>(null)

  const roomTypeId = searchParams.get('roomTypeId')
  const checkIn = searchParams.get('checkIn')
  const checkOut = searchParams.get('checkOut')
  const guests = parseInt(searchParams.get('guests') || '2')

  const supabase = createClient()

  useEffect(() => {
    if (!roomTypeId || !checkIn || !checkOut) {
      setError('Missing booking parameters')
      setLoading(false)
      return
    }

    loadBookingData()
    checkUser()
  }, [roomTypeId])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    if (user) {
      // Pre-fill form with user data
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', user.id)
        .single()

      if (profile) {
        setForm(prev => ({
          ...prev,
          fullName: profile.full_name || '',
          email: user.email || '',
          phone: profile.phone || ''
        }))
      }
    }
  }

  const loadBookingData = async () => {
    try {
      setLoading(true)

      // Load room type details
      const { data: roomTypeData, error: roomTypeError } = await supabase
        .from('room_types')
        .select(`
          id,
          name,
          capacity,
          price_off_peak,
          price_peak,
          description,
          hotel:hotels!inner(id, name, location, address)
        `)
        .eq('id', roomTypeId)
        .single()

      if (roomTypeError) {
        throw roomTypeError
      }

      setRoomType(roomTypeData)

      // Load available services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .order('name')

      if (servicesError) {
        throw servicesError
      }

      setServices(servicesData || [])
    } catch (err) {
      
      
      setError('Failed to load booking details')
    } finally {
      setLoading(false)
    }
  }

  const handleServiceChange = (serviceId: string, checked: boolean) => {
    setSelectedServices(prev => {
      const updated = { ...prev }
      if (checked) {
        updated[serviceId] = 1
      } else {
        delete updated[serviceId]
      }
      return updated
    })
  }

  const handleServiceQuantityChange = (serviceId: string, quantity: number) => {
    if (quantity > 0) {
      setSelectedServices(prev => ({
        ...prev,
        [serviceId]: quantity
      }))
    } else {
      setSelectedServices(prev => {
        const updated = { ...prev }
        delete updated[serviceId]
        return updated
      })
    }
  }

  const calculateTotals = () => {
    if (!roomType || !checkIn || !checkOut) return { nights: 0, roomTotal: 0, servicesTotal: 0, total: 0 }

    const nights = differenceInDays(new Date(checkOut), new Date(checkIn))
    const roomTotal = roomType.price_off_peak * nights

    const servicesTotal = Object.entries(selectedServices).reduce((total, [serviceId, quantity]) => {
      const service = services.find(s => s.id === serviceId)
      return total + (service ? service.price * quantity : 0)
    }, 0)

    return {
      nights,
      roomTotal,
      servicesTotal,
      total: roomTotal + servicesTotal
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      router.push('/login')
      return
    }

    if (!roomType) {
      setError('Room details not available')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const totals = calculateTotals()

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          guest_id: user.id,
          hotel_id: roomType.hotel[0]?.id,
          check_in: checkIn,
          check_out: checkOut,
          num_guests: guests,
          total_price: totals.total,
          status: 'pending',
          phone: form.phone || null,
          special_requests: form.specialRequests || null
        })
        .select()
        .single()

      if (bookingError) {
        throw bookingError
      }

      // Get an available room of this type
      const { data: availableRooms, error: roomsError } = await supabase
        .from('rooms')
        .select('id')
        .eq('room_type_id', roomTypeId)
        .eq('status', 'Available')
        .limit(1)

      if (roomsError || !availableRooms || availableRooms.length === 0) {
        throw new Error('No rooms available')
      }

      // Create booking room association
      const { error: bookingRoomError } = await supabase
        .from('booking_rooms')
        .insert({
          booking_id: booking.id,
          room_id: availableRooms[0].id,
          price_per_night: roomType.price_off_peak
        })

      if (bookingRoomError) {
        throw bookingRoomError
      }

      // Add selected services
      if (Object.keys(selectedServices).length > 0) {
        const serviceInserts = Object.entries(selectedServices).map(([serviceId, quantity]) => ({
          booking_id: booking.id,
          service_id: serviceId,
          quantity
        }))

        const { error: servicesError } = await supabase
          .from('booking_services')
          .insert(serviceInserts)

        if (servicesError) {
          throw servicesError
        }
      }

      // Create payment record
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .insert({
          booking_id: booking.id,
          amount: totals.total,
          status: 'pending',
          payment_method: 'credit_card', // Default for now
          transaction_id: `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          payment_date: new Date().toISOString()
        })
        .select()

      if (paymentError) {
        console.error('Payment creation error:', paymentError)
        console.error('Payment error details:', JSON.stringify(paymentError, null, 2))
        // Don't throw - payment can be created later
      } else {
        console.log('Payment created successfully:', paymentData)
      }

      // Send booking confirmation email (async, don't block user)
      sendBookingConfirmationEmail(booking, roomType, availableRooms[0])

      // Redirect to confirmation or dashboard
      router.push(`/dashboard/guest?booking=${booking.id}`)
    } catch (err) {
      console.error('Booking error:', err)
      setError('Failed to create booking. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Helper function to send booking confirmation email (async)
  const sendBookingConfirmationEmail = async (booking: any, roomType: any, room: any) => {
    try {
      const { sendBookingConfirmation, formatEmailDate } = await import('@/lib/email/send')

      await sendBookingConfirmation(user?.email || '', {
        guestName: form.fullName,
        bookingId: booking.id,
        hotelName: roomType.hotel[0]?.name || 'Muraka Hotel',
        roomNumber: room.room_number || 'TBD',
        roomType: roomType.name,
        checkIn: formatEmailDate(checkIn!),
        checkOut: formatEmailDate(checkOut!),
        numberOfGuests: guests,
        totalAmount: booking.total_price,
        phone: form.phone || undefined,
        specialRequests: form.specialRequests || undefined,
      })
    } catch (emailError) {
      // Log but don't block the booking flow
      console.error('Failed to send booking confirmation email:', emailError)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading booking details...</p>
        </div>
      </div>
    )
  }

  if (error && !roomType) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/search')}>
            Back to Search
          </Button>
        </div>
      </div>
    )
  }

  const totals = calculateTotals()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">Muraka Hotels</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <Badge variant="outline">Signed in</Badge>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Booking</h2>
          <p className="text-gray-600">You&apos;re just one step away from your perfect stay</p>
        </div>

        {!user && (
          <Alert className="mb-6">
            <AlertDescription>
              Please <Link href="/login" className="text-blue-600 hover:underline">sign in</Link> or{' '}
              <Link href="/signup" className="text-blue-600 hover:underline">create an account</Link> to complete your booking.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Guest Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Guest Information</CardTitle>
                  <CardDescription>
                    Please provide your contact details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={form.fullName}
                        onChange={(e) => setForm(prev => ({ ...prev, fullName: e.target.value }))}
                        required
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialRequests">Special Requests</Label>
                    <Input
                      id="specialRequests"
                      value={form.specialRequests}
                      onChange={(e) => setForm(prev => ({ ...prev, specialRequests: e.target.value }))}
                      placeholder="Any special requests or dietary requirements?"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Additional Services */}
              <Card>
                <CardHeader>
                  <CardTitle>Additional Services</CardTitle>
                  <CardDescription>
                    Enhance your stay with our premium services
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {services.map((service) => (
                      <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={service.id}
                            checked={!!selectedServices[service.id]}
                            onCheckedChange={(checked) => handleServiceChange(service.id, checked as boolean)}
                          />
                          <div>
                            <Label htmlFor={service.id} className="font-medium">
                              {service.name}
                            </Label>
                            <p className="text-sm text-gray-600">${service.price}</p>
                          </div>
                        </div>
                        {selectedServices[service.id] && (
                          <div className="flex items-center space-x-2">
                            <Label htmlFor={`quantity-${service.id}`} className="text-sm">
                              Quantity:
                            </Label>
                            <Input
                              id={`quantity-${service.id}`}
                              type="number"
                              min="1"
                              max="10"
                              value={selectedServices[service.id]}
                              onChange={(e) => handleServiceQuantityChange(service.id, parseInt(e.target.value) || 0)}
                              className="w-20"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={submitting || !user}>
                {submitting ? 'Processing...' : !user ? 'Please Sign In to Book' : 'Confirm Booking'}
              </Button>
            </form>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {roomType && (
                  <div className="space-y-4">
                    {/* Room Details */}
                    <div>
                      <h4 className="font-semibold">{roomType.name}</h4>
                      <p className="text-sm text-blue-600">{roomType.hotel[0]?.name}</p>
                      <p className="text-sm text-gray-600">{roomType.description}</p>
                    </div>

                    <Separator />

                    {/* Stay Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          Check-in
                        </div>
                        <span>{checkIn && format(new Date(checkIn), 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          Check-out
                        </div>
                        <span>{checkOut && format(new Date(checkOut), 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <UsersIcon className="w-4 h-4 mr-2" />
                          Guests
                        </div>
                        <span>{guests}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <MapPinIcon className="w-4 h-4 mr-2" />
                          Location
                        </div>
                        <span>{roomType.hotel[0]?.location} Atoll</span>
                      </div>
                    </div>

                    <Separator />

                    {/* Price Breakdown */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>${roomType.price_off_peak}/night × {totals.nights} nights</span>
                        <span>${totals.roomTotal}</span>
                      </div>

                      {Object.entries(selectedServices).map(([serviceId, quantity]) => {
                        const service = services.find(s => s.id === serviceId)
                        if (!service) return null
                        return (
                          <div key={serviceId} className="flex justify-between text-sm">
                            <span>{service.name} × {quantity}</span>
                            <span>${service.price * quantity}</span>
                          </div>
                        )
                      })}

                      <Separator />

                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span>${totals.total}</span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 mt-4">
                      <p>• Free cancellation until 24 hours before check-in</p>
                      <p>• No prepayment needed</p>
                      <p>• Confirmation is immediate</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <BookingPageContent />
    </Suspense>
  )
}