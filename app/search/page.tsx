'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UsersIcon, MapPinIcon, CalendarIcon, FilterIcon, ArrowLeft, Bed, Wifi, Coffee } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

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

function SearchPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [roomTypes, setRoomTypes] = useState<RoomTypeWithHotel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState('price')
  const [filterCapacity, setFilterCapacity] = useState('0')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const location = searchParams.get('location')
  const checkIn = searchParams.get('checkIn')
  const checkOut = searchParams.get('checkOut')
  const guests = parseInt(searchParams.get('guests') || '2')
  const roomType = searchParams.get('roomType')

  const supabase = createClient()

  useEffect(() => {
    checkLoginStatus()
  }, [])

  const checkLoginStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setIsLoggedIn(!!user)
  }

  useEffect(() => {
    if (!checkIn || !checkOut) {
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

      // Get all hotels or filter by location if provided
      let hotelsQuery = supabase
        .from('hotels')
        .select('id, name, location, address')

      if (location) {
        hotelsQuery = hotelsQuery.eq('location', location)
      }

      const { data: hotelsData, error: hotelsError } = await hotelsQuery

      if (hotelsError) {
        throw hotelsError
      }

      if (!hotelsData || hotelsData.length === 0) {
        setRoomTypes([])
        setLoading(false)
        return
      }

      const hotelIds = hotelsData.map(h => h.id)

      // Get room types for those hotels
      let query = supabase
        .from('room_types')
        .select(`
          id,
          name,
          capacity,
          price_off_peak,
          price_peak,
          description,
          hotel_id
        `)
        .in('hotel_id', hotelIds)
        .gte('capacity', guests)

      if (roomType) {
        query = query.eq('name', roomType)
      }

      const { data: roomTypesData, error: roomTypesError } = await query

      if (roomTypesError) {
        throw roomTypesError
      }

      const hotelMap = new Map(hotelsData.map(h => [h.id, h]))

      const roomTypesWithAvailability = await Promise.all(
        (roomTypesData || []).map(async (rt: any) => {
          const { data: availableRooms, error: roomsError } = await supabase
            .from('rooms')
            .select('id')
            .eq('room_type_id', rt.id)
            .eq('status', 'Available')

          if (roomsError) {
            console.error('Error fetching rooms:', roomsError)
            return { ...rt, available_rooms: 0 } as RoomTypeWithHotel
          }

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

          const conflictingRoomIds = new Set()
          conflictingBookings?.forEach((booking: any) => {
            if (!booking.booking) return
            const bookingCheckIn = new Date(booking.booking.check_in)
            const bookingCheckOut = new Date(booking.booking.check_out)
            const searchCheckIn = new Date(checkIn!)
            const searchCheckOut = new Date(checkOut!)

            if (
              (searchCheckIn >= bookingCheckIn && searchCheckIn < bookingCheckOut) ||
              (searchCheckOut > bookingCheckIn && searchCheckOut <= bookingCheckOut) ||
              (searchCheckIn <= bookingCheckIn && searchCheckOut >= bookingCheckOut)
            ) {
              conflictingRoomIds.add(booking.room_id)
            }
          })

          const availableCount = (availableRooms?.length || 0) - conflictingRoomIds.size
          const hotel = hotelMap.get(rt.hotel_id)

          return {
            ...rt,
            hotel: hotel || { id: rt.hotel_id, name: 'Unknown', location: '', address: '' },
            available_rooms: Math.max(0, availableCount)
          } as RoomTypeWithHotel
        })
      )

      const availableRoomTypes = roomTypesWithAvailability.filter(rt => rt.available_rooms > 0)
      setRoomTypes(availableRoomTypes)
    } catch (err) {
      console.error('Search error:', err)
      setError('Failed to search rooms')
      toast.error('Failed to search rooms. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getSortedAndFilteredRooms = () => {
    let filtered = [...roomTypes]

    if (filterCapacity && filterCapacity !== '0') {
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
    const pricePerNight = roomType.price_off_peak
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gold-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-lg">Searching for available rooms...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
        <div className="text-center text-white">
          <p className="text-xl mb-6">{error}</p>
          <Button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  const sortedRooms = getSortedAndFilteredRooms()
  const nights = checkIn && checkOut ? differenceInDays(new Date(checkOut), new Date(checkIn)) : 1

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Luxury Header */}
      <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center group">
              <ArrowLeft className="w-5 h-5 text-white/70 group-hover:text-gold-400 mr-3 transition-colors" />
              <div>
                <h1 className="text-3xl font-serif font-bold text-white">MURAKA</h1>
                <p className="text-xs text-white/70 tracking-[0.2em]">HOTELS</p>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              {isLoggedIn ? (
                <>
                  <Badge className="bg-gold-500 text-white border-0">
                    Signed In
                  </Badge>
                  <Button variant="ghost" asChild className="text-white hover:text-gold-400 hover:bg-white/10">
                    <Link href="/dashboard/guest">My Dashboard</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild className="text-white hover:text-gold-400 hover:bg-white/10">
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button asChild className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700">
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Summary Banner */}
        <div className="mb-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
          <h2 className="text-3xl font-serif font-bold mb-4">Available Rooms</h2>
          <div className="flex flex-wrap items-center gap-6">
            {location && (
              <div className="flex items-center gap-2">
                <MapPinIcon className="w-5 h-5 text-gold-400" />
                <span className="font-medium">Muraka {location}</span>
              </div>
            )}
            {!location && (
              <div className="flex items-center gap-2">
                <MapPinIcon className="w-5 h-5 text-gold-400" />
                <span className="font-medium">All Locations</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-gold-400" />
              {checkIn && checkOut && (
                <span>
                  {format(new Date(checkIn), 'MMM dd')} - {format(new Date(checkOut), 'MMM dd, yyyy')}
                  <span className="ml-2 text-white/80">({nights} night{nights !== 1 ? 's' : ''})</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-gold-400" />
              <span>{guests} guest{guests !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div className="mt-4 text-2xl font-bold text-gold-400">
            {sortedRooms.length} Room{sortedRooms.length !== 1 ? 's' : ''} Found
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Luxury Sidebar Filters */}
          <div className="lg:w-1/4">
            <Card className="border-0 shadow-xl">
              <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-t-lg">
                <h3 className="flex items-center text-xl font-serif font-bold text-gray-900">
                  <FilterIcon className="w-5 h-5 mr-2 text-blue-600" />
                  Filters
                </h3>
              </div>
              <CardContent className="p-6 space-y-6">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="border-gray-300">
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
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">Minimum Capacity</label>
                  <Select value={filterCapacity} onValueChange={setFilterCapacity}>
                    <SelectTrigger className="border-gray-300">
                      <SelectValue placeholder="Any capacity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Any capacity</SelectItem>
                      <SelectItem value="2">2+ guests</SelectItem>
                      <SelectItem value="4">4+ guests</SelectItem>
                      <SelectItem value="6">6+ guests</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => router.push('/')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  New Search
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:w-3/4">
            {sortedRooms.length === 0 ? (
              <Card className="border-0 shadow-xl">
                <CardContent className="p-12 text-center">
                  <div className="mb-6">
                    <Bed className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2">No Rooms Available</h3>
                    <p className="text-gray-600">
                      No rooms found for your current search criteria. Try adjusting your filters or dates.
                    </p>
                  </div>
                  <div className="flex gap-4 justify-center">
                    <Button
                      onClick={() => router.push('/')}
                      variant="outline"
                    >
                      Start New Search
                    </Button>
                    <Button
                      onClick={() => window.location.reload()}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    >
                      Refresh Results
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {sortedRooms.map((roomType) => (
                  <Card key={roomType.id} className="overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300 group">
                    <div className="flex flex-col md:flex-row">
                      {/* Room Image with Gradient Overlay */}
                      <div className="md:w-2/5 h-64 md:h-auto bg-gradient-to-br from-blue-100 to-blue-200 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        <div className="absolute bottom-6 left-6 text-white">
                          <div className="flex items-center gap-2 mb-2">
                            <Bed className="w-6 h-6" />
                            <span className="text-lg font-semibold">{roomType.name}</span>
                          </div>
                          <Badge className="bg-white/20 backdrop-blur-sm text-white border-0">
                            {roomType.available_rooms} available
                          </Badge>
                        </div>
                      </div>

                      {/* Room Details */}
                      <div className="md:w-3/5 p-8">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2">{roomType.name}</h3>
                            <p className="text-blue-600 font-semibold text-sm mb-3">{roomType.hotel.name}</p>
                            <p className="text-gray-600 mb-4 leading-relaxed">{roomType.description}</p>

                            <div className="flex flex-wrap gap-4 mb-4">
                              <div className="flex items-center text-sm text-gray-600">
                                <UsersIcon className="w-4 h-4 mr-2 text-blue-600" />
                                Up to {roomType.capacity} guests
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <MapPinIcon className="w-4 h-4 mr-2 text-blue-600" />
                                {roomType.hotel.location} Atoll
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Wifi className="w-4 h-4 mr-2 text-blue-600" />
                                Free WiFi
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Coffee className="w-4 h-4 mr-2 text-blue-600" />
                                Breakfast Included
                              </div>
                            </div>
                          </div>

                          <div className="text-right ml-6">
                            <div className="bg-gradient-to-br from-blue-50 to-gold-50 p-4 rounded-lg">
                              <div className="text-3xl font-bold text-blue-900">
                                ${calculatePrice(roomType).toLocaleString()}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                ${roomType.price_off_peak}/night
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {nights} night{nights !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="border-t pt-4 flex justify-between items-center">
                          <div className="text-sm text-green-600 font-medium">
                            ✓ Free cancellation until 24h before check-in
                          </div>
                          <Button
                            onClick={() => handleBooking(roomType.id)}
                            className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-semibold px-8"
                          >
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

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  )
}
