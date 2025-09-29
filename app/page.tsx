'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, MapPinIcon, UsersIcon, StarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

const roomTypes = [
  {
    name: 'Standard Double',
    capacity: 2,
    priceFrom: 120,
    description: 'Comfortable double room with modern amenities'
  },
  {
    name: 'Deluxe King',
    capacity: 2,
    priceFrom: 200,
    description: 'Spacious king room with premium features'
  },
  {
    name: 'Family Suite',
    capacity: 4,
    priceFrom: 350,
    description: 'Perfect for families with separate living areas'
  },
  {
    name: 'Penthouse',
    capacity: 6,
    priceFrom: 800,
    description: 'Luxury penthouse with stunning views'
  }
]

export default function Home() {
  const [location, setLocation] = useState('')
  const [checkIn, setCheckIn] = useState<Date>()
  const [checkOut, setCheckOut] = useState<Date>()
  const [guests, setGuests] = useState('')
  const [roomType, setRoomType] = useState('')
  const router = useRouter()

  const handleSearch = () => {
    if (!location || !checkIn || !checkOut) {
      alert('Please fill in all required fields')
      return
    }

    const searchParams = new URLSearchParams({
      location,
      checkIn: format(checkIn, 'yyyy-MM-dd'),
      checkOut: format(checkOut, 'yyyy-MM-dd'),
      guests: guests || '2',
      ...(roomType && roomType !== 'any' && { roomType })
    })

    router.push(`/search?${searchParams.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">Muraka Hotels</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <a href="/login">Sign In</a>
              </Button>
              <Button asChild>
                <a href="/signup">Sign Up</a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Experience Paradise at
            <span className="text-blue-600"> Muraka Hotels</span>
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Discover luxury accommodations across three stunning locations in the Maldives.
            Your perfect getaway awaits at Muraka Male, Laamu, and Faafu.
          </p>

          {/* Search Form */}
          <Card className="max-w-5xl mx-auto">
            <CardHeader>
              <CardTitle>Find Your Perfect Stay</CardTitle>
              <CardDescription>
                Search for available rooms across our three beautiful locations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Location */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Location</label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Muraka Male</SelectItem>
                      <SelectItem value="Laamu">Muraka Laamu</SelectItem>
                      <SelectItem value="Faafu">Muraka Faafu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Check-in */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Check-in</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !checkIn && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {checkIn ? format(checkIn, "MMM dd, yyyy") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={checkIn}
                        onSelect={setCheckIn}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Check-out */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Check-out</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !checkOut && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {checkOut ? format(checkOut, "MMM dd, yyyy") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={checkOut}
                        onSelect={setCheckOut}
                        disabled={(date) => date <= (checkIn || new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Guests */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Guests</label>
                  <Select value={guests} onValueChange={setGuests}>
                    <SelectTrigger>
                      <SelectValue placeholder="2 guests" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 guest</SelectItem>
                      <SelectItem value="2">2 guests</SelectItem>
                      <SelectItem value="3">3 guests</SelectItem>
                      <SelectItem value="4">4 guests</SelectItem>
                      <SelectItem value="5">5 guests</SelectItem>
                      <SelectItem value="6">6+ guests</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Search Button */}
                <div className="flex items-end">
                  <Button onClick={handleSearch} className="w-full">
                    Search Rooms
                  </Button>
                </div>
              </div>

              {/* Optional Room Type Filter */}
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Room Type (Optional)
                </label>
                <Select value={roomType} onValueChange={setRoomType}>
                  <SelectTrigger className="w-full md:w-1/3">
                    <SelectValue placeholder="Any room type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any room type</SelectItem>
                    <SelectItem value="Standard Double">Standard Double</SelectItem>
                    <SelectItem value="Deluxe King">Deluxe King</SelectItem>
                    <SelectItem value="Family Suite">Family Suite</SelectItem>
                    <SelectItem value="Penthouse">Penthouse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Featured Room Types */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Our Room Types
            </h3>
            <p className="text-lg text-gray-600">
              Choose from our carefully designed accommodations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {roomTypes.map((room, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <UsersIcon className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-blue-600 font-medium">Up to {room.capacity} guests</p>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-semibold">{room.name}</h4>
                    <Badge variant="secondary">
                      <StarIcon className="w-3 h-3 mr-1" />
                      4.8
                    </Badge>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{room.description}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-blue-600">
                        ${room.priceFrom}
                      </span>
                      <span className="text-gray-500 text-sm">/night</span>
                    </div>
                    <Badge variant="outline">From</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Locations */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Three Stunning Locations
            </h3>
            <p className="text-lg text-gray-600">
              Each location offers unique experiences in the Maldives
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Muraka Male',
                location: 'Male Atoll',
                description: 'Experience urban luxury near the capital with easy airport access and city conveniences.',
                features: ['Airport Transfer', 'City Access', 'Business Center']
              },
              {
                name: 'Muraka Laamu',
                location: 'Laamu Atoll',
                description: 'Immerse yourself in pristine nature with crystal-clear waters and vibrant marine life.',
                features: ['Snorkeling', 'Diving', 'Private Beaches']
              },
              {
                name: 'Muraka Faafu',
                location: 'Faafu Atoll',
                description: 'Discover tranquil paradise with secluded beaches and breathtaking sunset views.',
                features: ['Sunset Views', 'Spa Services', 'Water Sports']
              }
            ].map((location, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-teal-100 to-blue-200 flex items-center justify-center">
                  <MapPinIcon className="w-12 h-12 text-teal-600" />
                </div>
                <CardContent className="p-6">
                  <h4 className="text-xl font-semibold mb-2">{location.name}</h4>
                  <p className="text-blue-600 text-sm mb-3">{location.location}</p>
                  <p className="text-gray-600 mb-4">{location.description}</p>
                  <div className="space-y-2">
                    {location.features.map((feature, idx) => (
                      <Badge key={idx} variant="outline" className="mr-2">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h5 className="text-lg font-semibold mb-4">Muraka Hotels</h5>
              <p className="text-gray-400">
                Luxury accommodation across three beautiful locations in the Maldives.
              </p>
            </div>
            <div>
              <h5 className="text-lg font-semibold mb-4">Locations</h5>
              <ul className="space-y-2 text-gray-400">
                <li>Muraka Male</li>
                <li>Muraka Laamu</li>
                <li>Muraka Faafu</li>
              </ul>
            </div>
            <div>
              <h5 className="text-lg font-semibold mb-4">Services</h5>
              <ul className="space-y-2 text-gray-400">
                <li>Airport Transfer</li>
                <li>Spa Services</li>
                <li>Room Service</li>
                <li>Concierge</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Muraka Hotels. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}