'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UsersIcon, MapPinIcon, CalendarIcon, FilterIcon } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'

interface RoomTypeWithHotel {
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
  }
  available_rooms: number
}

interface BookingRoom {
  room_id: string
  booking: {
    check_in: string
    check_out: string
    status: string
  }
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [roomTypes, setRoomTypes] = useState<RoomTypeWithHotel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState('price')
  const [filterCapacity, setFilterCapacity] = useState('')

  const location = searchParams.get('location')
  const checkIn = searchParams.get('checkIn')
  const checkOut = searchParams.get('checkOut')
  const guests = parseInt(searchParams.get('guests') || '2')
  const roomType = searchParams.get('roomType')

  const supabase = createClient()

  useEffect(() => {
    if (!location || !checkIn || !checkOut) {
      setError('Missing search parameters')
      setLoading(false)
      return
    }

    searchRooms()
  }, [location, checkIn, checkOut, guests, roomType])

  const searchRooms = async () => {
    try {
      setLoading(true)
      setError('')

      let query = supabase
        .from('room_types')
        .select(`
          id,
          name,
          capacity,
          price_off_peak,
          price_peak,
          description,
          hotel:hotels(id, name, location, address)
        `)
        .eq('hotels.location', location)
        .gte('capacity', guests)

      if (roomType) {
        query = query.eq('name', roomType)
      }

      const { data: roomTypesData, error: roomTypesError } = await query

      if (roomTypesError) {
        throw roomTypesError
      }

      // For each room type, check available rooms
      const roomTypesWithAvailability = await Promise.all(
        (roomTypesData || []).map(async (rt: any) => {
          // Get rooms that are not occupied and not in conflicting bookings
          const { data: availableRooms, error: roomsError } = await supabase
            .from('rooms')
            .select('id')
            .eq('room_type_id', rt.id)
            .eq('status', 'Available')

          if (roomsError) {
            console.error('Error fetching rooms:', roomsError)
            return { ...rt, available_rooms: 0 } as RoomTypeWithHotel
          }

          // Check for booking conflicts
          const { data: conflictingBookings, error: bookingsError } = await supabase
            .from('booking_rooms')
            .select(`
              room_id,
              booking:bookings(check_in, check_out, status)
            `)
            .in('room_id', availableRooms?.map(r => r.id) || [])
            .in('bookings.status', ['confirmed', 'checked_in'])

          if (bookingsError) {
            console.error('Error checking bookings:', bookingsError)
            return { ...rt, available_rooms: availableRooms?.length || 0 } as RoomTypeWithHotel
          }

          // Filter out rooms with overlapping bookings
          const conflictingRoomIds = new Set()
          conflictingBookings?.forEach((booking: any) => {
            if (!booking.booking) return
            const bookingCheckIn = new Date(booking.booking.check_in)
            const bookingCheckOut = new Date(booking.booking.check_out)
            const searchCheckIn = new Date(checkIn!)
            const searchCheckOut = new Date(checkOut!)

            // Check for date overlap
            if (
              (searchCheckIn >= bookingCheckIn && searchCheckIn < bookingCheckOut) ||
              (searchCheckOut > bookingCheckIn && searchCheckOut <= bookingCheckOut) ||
              (searchCheckIn <= bookingCheckIn && searchCheckOut >= bookingCheckOut)
            ) {
              conflictingRoomIds.add(booking.room_id)
            }
          })

          const availableCount = (availableRooms?.length || 0) - conflictingRoomIds.size

          return {
            ...rt,
            available_rooms: Math.max(0, availableCount)
          } as RoomTypeWithHotel
        })
      )

      // Filter out room types with no available rooms
      const availableRoomTypes = roomTypesWithAvailability.filter(rt => rt.available_rooms > 0)

      setRoomTypes(availableRoomTypes)
    } catch (err) {
      console.error('Search error:', err)
      setError('Failed to search rooms')
    } finally {
      setLoading(false)
    }
  }

  const getSortedAndFilteredRooms = () => {
    let filtered = [...roomTypes]

    if (filterCapacity) {
      const capacity = parseInt(filterCapacity)
      filtered = filtered.filter(rt => rt.capacity >= capacity)
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price_off_peak - b.price_off_peak
        case 'capacity':
          return b.capacity - a.capacity
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

    return filtered
  }

  const calculatePrice = (roomType: RoomTypeWithHotel) => {
    if (!checkIn || !checkOut) return roomType.price_off_peak

    const nights = differenceInDays(new Date(checkOut), new Date(checkIn))
    const pricePerNight = roomType.price_off_peak // For now, using off-peak pricing
    return pricePerNight * nights
  }

  const handleBooking = (roomTypeId: string) => {
    const bookingParams = new URLSearchParams({
      roomTypeId,
      location: location || '',
      checkIn: checkIn || '',
      checkOut: checkOut || '',
      guests: guests.toString()
    })

    router.push(`/booking?${bookingParams.toString()}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Searching for available rooms...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/')}>
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  const sortedRooms = getSortedAndFilteredRooms()
  const nights = checkIn && checkOut ? differenceInDays(new Date(checkOut), new Date(checkIn)) : 1

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
              <Button variant="ghost" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Summary */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center">
              <MapPinIcon className="w-4 h-4 mr-1" />
              Muraka {location}
            </div>
            <div className="flex items-center">
              <CalendarIcon className="w-4 h-4 mr-1" />
              {checkIn && checkOut && (
                <>
                  {format(new Date(checkIn), 'MMM dd')} - {format(new Date(checkOut), 'MMM dd, yyyy')}
                  <span className="ml-1">({nights} night{nights !== 1 ? 's' : ''})</span>
                </>
              )}
            </div>
            <div className="flex items-center">
              <UsersIcon className="w-4 h-4 mr-1" />
              {guests} guest{guests !== 1 ? 's' : ''}
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900">
            {sortedRooms.length} Available Room{sortedRooms.length !== 1 ? 's' : ''}
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters */}
          <div className="lg:w-1/4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FilterIcon className="w-4 h-4 mr-2" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Sort by</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price">Price (Low to High)</SelectItem>
                      <SelectItem value="capacity">Capacity (High to Low)</SelectItem>
                      <SelectItem value="name">Room Type</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Minimum Capacity</label>
                  <Select value={filterCapacity} onValueChange={setFilterCapacity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any capacity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any capacity</SelectItem>
                      <SelectItem value="2">2+ guests</SelectItem>
                      <SelectItem value="4">4+ guests</SelectItem>
                      <SelectItem value="6">6+ guests</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:w-3/4">
            {sortedRooms.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-500 mb-4">No rooms available for your search criteria.</p>
                  <Button onClick={() => router.push('/')}>
                    Try Different Dates
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {sortedRooms.map((roomType) => (
                  <Card key={roomType.id} className="overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      {/* Room Image Placeholder */}
                      <div className="md:w-1/3 h-48 md:h-auto bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                            <UsersIcon className="w-8 h-8 text-white" />
                          </div>
                          <p className="text-blue-600 font-medium">Up to {roomType.capacity} guests</p>
                        </div>
                      </div>

                      {/* Room Details */}
                      <div className="md:w-2/3 p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-semibold mb-2">{roomType.name}</h3>
                            <p className="text-blue-600 text-sm mb-2">{roomType.hotel.name}</p>
                            <p className="text-gray-600 text-sm mb-4">{roomType.description}</p>

                            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                              <div className="flex items-center">
                                <UsersIcon className="w-4 h-4 mr-1" />
                                Up to {roomType.capacity} guests
                              </div>
                              <div className="flex items-center">
                                <MapPinIcon className="w-4 h-4 mr-1" />
                                {roomType.hotel.location} Atoll
                              </div>
                            </div>

                            <Badge variant="outline">
                              {roomType.available_rooms} room{roomType.available_rooms !== 1 ? 's' : ''} available
                            </Badge>
                          </div>

                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">
                              ${calculatePrice(roomType).toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              ${roomType.price_off_peak}/night × {nights} night{nights !== 1 ? 's' : ''}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Total price
                            </div>
                          </div>
                        </div>

                        <Separator className="my-4" />

                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-600">
                            Free cancellation until 24 hours before check-in
                          </div>
                          <Button onClick={() => handleBooking(roomType.id)}>
                            Book Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}