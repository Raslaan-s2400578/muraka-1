'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  ArrowLeft, Bed, Users, Wifi, Coffee, Tv, Wind, CalendarIcon, MapPinIcon
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const allRoomTypes = [
  {
    id: 'penthouse',
    name: 'Penthouse Suite',
    size: '120 sqm',
    priceFrom: 1200,
    description: 'Luxurious penthouse with panoramic ocean views and exclusive rooftop terrace',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80',
    amenities: ['WiFi', 'Ocean View', 'King Bed', 'Living Room', 'Minibar', 'Smart TV'],
    capacity: 2,
    beds: 1
  },
  {
    id: 'deluxe-ocean',
    name: 'Deluxe Ocean Room',
    size: '65 sqm',
    priceFrom: 650,
    description: 'Spacious room with floor-to-ceiling windows and private balcony overlooking the ocean',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80',
    amenities: ['WiFi', 'Ocean View', 'Queen Bed', 'Balcony', 'Coffee Machine'],
    capacity: 2,
    beds: 1
  },
  {
    id: 'premium-double',
    name: 'Premium Double Room',
    size: '45 sqm',
    priceFrom: 450,
    description: 'Elegantly appointed room with modern amenities and city or pool views',
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80',
    amenities: ['WiFi', 'Pool View', 'Double Bed', 'Work Desk', 'Rain Shower'],
    capacity: 2,
    beds: 1
  },
  {
    id: 'family-suite',
    name: 'Family Suite',
    size: '95 sqm',
    priceFrom: 900,
    description: 'Spacious suite with separate living area and two bedrooms, perfect for families',
    image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=80',
    amenities: ['WiFi', '2 Bedrooms', 'Living Room', 'Kitchenette', 'Sofa Bed'],
    capacity: 6,
    beds: 3
  },
  {
    id: 'executive-suite',
    name: 'Executive Suite',
    size: '85 sqm',
    priceFrom: 1000,
    description: 'Perfect for business travelers with separate work area and meeting space',
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1200&q=80',
    amenities: ['WiFi', 'Work Desk', 'King Bed', 'Meeting Area', 'Espresso Machine'],
    capacity: 2,
    beds: 1
  },
  {
    id: 'honeymoon-suite',
    name: 'Honeymoon Suite',
    size: '100 sqm',
    priceFrom: 1500,
    description: 'Romantic suite with Jacuzzi, canopy bed, and spectacular sunset views',
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&q=80',
    amenities: ['WiFi', 'Jacuzzi', 'Canopy Bed', 'Ocean View', 'Champagne Service'],
    capacity: 2,
    beds: 1
  }
]

export default function RoomsPage() {
  const [location, setLocation] = useState('all')
  const [checkIn, setCheckIn] = useState<Date>()
  const [checkOut, setCheckOut] = useState<Date>()
  const [guests, setGuests] = useState('2')
  const [sortBy, setSortBy] = useState('price')
  const [filterBeds, setFilterBeds] = useState('0')
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      setUserRole(profile?.role || null)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserRole(null)
    toast.success('Signed out successfully')
  }

  const handleDashboardClick = () => {
    if (userRole === 'admin') {
      router.push('/dashboard/admin')
    } else if (userRole === 'manager') {
      router.push('/dashboard/manager')
    } else if (userRole === 'staff') {
      router.push('/dashboard/staff')
    } else {
      router.push('/dashboard/guest')
    }
  }

  const handleSearch = () => {
    if (!checkIn || !checkOut) {
      toast.error('Please select check-in and check-out dates')
      return
    }

    const searchParams = new URLSearchParams({
      ...(location && location !== 'all' && { location }),
      checkIn: format(checkIn, 'yyyy-MM-dd'),
      checkOut: format(checkOut, 'yyyy-MM-dd'),
      guests: guests
    })

    router.push(`/search?${searchParams.toString()}`)
  }

  const getSortedAndFilteredRooms = () => {
    let filtered = [...allRoomTypes]

    if (filterBeds && filterBeds !== '0') {
      const beds = parseInt(filterBeds)
      filtered = filtered.filter(room => room.beds >= beds)
    }

    if (guests) {
      const guestCount = parseInt(guests)
      filtered = filtered.filter(room => room.capacity >= guestCount)
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.priceFrom - b.priceFrom
        case 'price-high':
          return b.priceFrom - a.priceFrom
        case 'size':
          return parseInt(b.size) - parseInt(a.size)
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

    return filtered
  }

  const filteredRooms = getSortedAndFilteredRooms()

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Luxury Header */}
      <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center group">
              <ArrowLeft className="w-5 h-5 text-white/70 group-hover:text-gold-400 mr-3 transition-colors" />
              <div>
                <h1 className="text-3xl font-serif font-bold text-white">MURAKA</h1>
                <p className="text-xs text-white/70 tracking-[0.2em]">HOTELS</p>
              </div>
            </Link>
            <nav className="hidden md:flex items-center space-x-8 text-white">
              <Link href="/#rooms" className="hover:text-gold-400 transition-colors">Rooms</Link>
              <Link href="/#dining" className="hover:text-gold-400 transition-colors">Dining</Link>
              <Link href="/#spa" className="hover:text-gold-400 transition-colors">Spa</Link>
              <Link href="/#experiences" className="hover:text-gold-400 transition-colors">Experiences</Link>
              <Link href="/#gallery" className="hover:text-gold-400 transition-colors">Gallery</Link>
            </nav>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={handleDashboardClick}
                    className="text-white hover:text-gold-400 hover:bg-white/10"
                  >
                    Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSignOut}
                    className="text-white border-white hover:bg-white/10"
                  >
                    Sign Out
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
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-5xl font-serif font-bold text-gray-900 mb-4">Our Rooms</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover our collection of elegantly designed rooms and suites
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="lg:w-1/4">
            <Card className="border-0 shadow-xl sticky top-24">
              <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-t-lg">
                <h3 className="text-xl font-serif font-bold text-gray-900">Search & Filter</h3>
              </div>
              <CardContent className="p-6 space-y-6">
                {/* Location */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">Location</label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger className="border-gray-300">
                      <SelectValue placeholder="All Locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="Male">Muraka Male</SelectItem>
                      <SelectItem value="Laamu">Muraka Laamu</SelectItem>
                      <SelectItem value="Faafu">Muraka Faafu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Check-in */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">Check-in</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal border-gray-300",
                          !checkIn && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {checkIn ? format(checkIn, "MMM dd, yyyy") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={checkIn}
                        onSelect={setCheckIn}
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Check-out */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">Check-out</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal border-gray-300",
                          !checkOut && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {checkOut ? format(checkOut, "MMM dd, yyyy") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={checkOut}
                        onSelect={setCheckOut}
                        disabled={(date) => date <= (checkIn || new Date())}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Guests */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">Guests</label>
                  <Select value={guests} onValueChange={setGuests}>
                    <SelectTrigger className="border-gray-300">
                      <SelectValue placeholder="2 Guests" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6].map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? 'Guest' : 'Guests'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleSearch}
                  className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-semibold"
                >
                  Search Availability
                </Button>

                <div className="border-t pt-6">
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price">Price (Low to High)</SelectItem>
                      <SelectItem value="price-high">Price (High to Low)</SelectItem>
                      <SelectItem value="size">Size (Large to Small)</SelectItem>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">Beds</label>
                  <Select value={filterBeds} onValueChange={setFilterBeds}>
                    <SelectTrigger className="border-gray-300">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Any</SelectItem>
                      <SelectItem value="1">1+ Bed</SelectItem>
                      <SelectItem value="2">2+ Beds</SelectItem>
                      <SelectItem value="3">3+ Beds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Room Grid */}
          <div className="lg:w-3/4">
            <div className="mb-6 flex justify-between items-center">
              <p className="text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredRooms.length}</span> room{filteredRooms.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredRooms.map((room, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-2xl transition-all duration-500 group border-0 p-0">
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={room.image}
                      alt={room.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-4 right-4 bg-gold-500 text-white px-4 py-2 rounded-full font-semibold shadow-lg">
                      From ${room.priceFrom}/night
                    </div>
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-full font-semibold text-sm">
                      {room.size}
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2">{room.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>Up to {room.capacity}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Bed className="w-4 h-4" />
                          <span>{room.beds} {room.beds === 1 ? 'Bed' : 'Beds'}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4 leading-relaxed">{room.description}</p>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {room.amenities.slice(0, 4).map((amenity, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                      {room.amenities.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{room.amenities.length - 4} more
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Button className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                        View Details
                      </Button>
                      <Button
                        onClick={handleSearch}
                        className="flex-1 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700"
                      >
                        Check Availability
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
