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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { UsersIcon, MapPinIcon, CalendarIcon, FilterIcon, ArrowLeft, Bed, Wifi, Coffee } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { DateRange } from 'react-day-picker'

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
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState('price')
  const [filterCapacity, setFilterCapacity] = useState('0')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Local filter states
  const [selectedLocation, setSelectedLocation] = useState<string>(searchParams.get('location') || 'all')
  const [selectedGuests, setSelectedGuests] = useState<number>(parseInt(searchParams.get('guests') || '2'))
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const checkInParam = searchParams.get('checkIn')
    const checkOutParam = searchParams.get('checkOut')
    if (checkInParam && checkOutParam) {
      return {
        from: new Date(checkInParam),
        to: new Date(checkOutParam)
      }
    }
    return undefined
  })

  const location = selectedLocation === 'all' ? null : selectedLocation
  const checkIn = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : searchParams.get('checkIn')
  const checkOut = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : searchParams.get('checkOut')
  const guests = selectedGuests
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
      setError('Please select check-in and check-out dates')
      setLoading(false)
      return
    }

    // Automatically search when filters change
    searchRooms()
  }, [location, checkIn, checkOut, guests, roomType, selectedLocation, selectedGuests, dateRange])

  const searchRooms = async () => {
    try {
      if (isInitialLoad) {
        setLoading(true)
      } else {
        setIsSearching(true)
      }
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
      setIsSearching(false)
      setIsInitialLoad(false)
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
            <Card className="border-0 shadow-xl sticky top-4">
              <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-t-lg">
                <h3 className="flex items-center text-xl font-serif font-bold text-gray-900">
                  <FilterIcon className="w-5 h-5 mr-2 text-blue-600" />
                  Filters
                </h3>
              </div>
              <CardContent className="p-6 space-y-6">
                {/* Loading indicator */}
                {isSearching && (
                  <div className="flex items-center justify-center py-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-2"></div>
                    <span className="text-sm">Updating results...</span>
                  </div>
                )}

                {/* Date Range Picker */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">Dates</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateRange && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(dateRange.from, "LLL dd, y")
                          )
                        ) : (
                          <span>Pick dates</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={1}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Location Filter */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">Location</label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="Male">Muraka Male</SelectItem>
                      <SelectItem value="Laamu">Muraka Laamu</SelectItem>
                      <SelectItem value="Faafu">Muraka Faafu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Guests Filter */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">Guests</label>
                  <Select value={selectedGuests.toString()} onValueChange={(val) => setSelectedGuests(parseInt(val))}>
                    <SelectTrigger className="border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Guest</SelectItem>
                      <SelectItem value="2">2 Guests</SelectItem>
                      <SelectItem value="3">3 Guests</SelectItem>
                      <SelectItem value="4">4 Guests</SelectItem>
                      <SelectItem value="5">5 Guests</SelectItem>
                      <SelectItem value="6">6 Guests</SelectItem>
                      <SelectItem value="7">7 Guests</SelectItem>
                      <SelectItem value="8">8+ Guests</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:w-3/4 relative">
            {/* Overlay during search */}
            {isSearching && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 rounded-lg flex items-start justify-center pt-12">
                <div className="bg-white rounded-lg shadow-lg p-4 flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                  <span className="text-sm font-medium text-gray-700">Updating results...</span>
                </div>
              </div>
            )}

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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {sortedRooms.map((roomType) => {
                  // Generate room-specific Unsplash image based on room type
                  const getRoomImage = (name: string) => {
                    const roomTypes: { [key: string]: string } = {
                      'Standard Double': 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
                      'Deluxe Double': 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',
                      'Family Suite': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80',
                      'Presidential Suite': 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80',
                    }
                    return roomTypes[name] || 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80'
                  }

                  return (
                    <Card key={roomType.id} className="overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group flex flex-col">
                      {/* Room Image */}
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={getRoomImage(roomType.name)}
                          alt={roomType.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 text-xs">
                            {roomType.available_rooms} available
                          </Badge>
                        </div>
                        <div className="absolute bottom-4 left-4 text-white">
                          <div className="flex items-center gap-2">
                            <Bed className="w-5 h-5" />
                            <span className="text-lg font-semibold">{roomType.name}</span>
                          </div>
                        </div>
                      </div>

                      {/* Room Details */}
                      <div className="p-5 flex flex-col flex-grow">
                        <div className="mb-3">
                          <p className="text-blue-600 font-semibold text-sm mb-2">{roomType.hotel.name}</p>
                          <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{roomType.description}</p>
                        </div>

                        <div className="flex flex-wrap gap-3 mb-4">
                          <div className="flex items-center text-xs text-gray-600">
                            <UsersIcon className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                            Up to {roomType.capacity} guests
                          </div>
                          <div className="flex items-center text-xs text-gray-600">
                            <MapPinIcon className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                            {roomType.hotel.location} Atoll
                          </div>
                          <div className="flex items-center text-xs text-gray-600">
                            <Wifi className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                            Free WiFi
                          </div>
                          <div className="flex items-center text-xs text-gray-600">
                            <Coffee className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                            Breakfast Included
                          </div>
                        </div>

                        <div className="mt-auto pt-4 border-t space-y-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-2xl font-bold text-blue-900">
                                ${calculatePrice(roomType).toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                ${roomType.price_off_peak}/night · {nights} night{nights !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <div className="text-xs text-green-600 font-medium">
                              ✓ Free cancellation until 24h before check-in
                            </div>
                            <Button
                              onClick={() => handleBooking(roomType.id)}
                              className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-semibold h-10"
                            >
                              Book Now
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
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
