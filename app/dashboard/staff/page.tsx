'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CalendarIcon, UsersIcon, ClipboardListIcon, SearchIcon, HomeIcon } from 'lucide-react'
import { format } from 'date-fns'

interface Booking {
  id: string
  check_in: string
  check_out: string
  total_price: number
  status: string
  guest: {
    full_name: string
    phone: string | null
  }
  hotel: {
    id: string
    name: string
    location: string
  }
  booking_rooms: {
    room: {
      id: string
      room_number: string
      room_type: {
        name: string
      }
    }
  }[]
}

interface Room {
  id: string
  room_number: string
  status: string
  room_type: {
    name: string
    capacity: number
  }
  hotel: {
    name: string
    location: string
  }
}

interface Profile {
  id: string
  full_name: string
  phone: string | null
  role: string
}

export default function StaffDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeView, setActiveView] = useState('dashboard')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUserAndLoadData()
  }, [])

  const checkUserAndLoadData = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'staff' && profile?.role !== 'manager' && profile?.role !== 'admin') {
        router.push('/dashboard/guest')
        return
      }

      setProfile(profile)
      await loadStaffData()
    } catch (err) {
      console.error('Auth error:', err)
      router.push('/login')
    }
  }

  const loadStaffData = async () => {
    try {
      setLoading(true)

      // Load today's bookings
      const today = new Date().toISOString().split('T')[0]

      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          guest:profiles(full_name, phone),
          hotel:hotels(id, name, location),
          booking_rooms(
            room:rooms(
              id,
              room_number,
              room_type:room_types(name)
            )
          )
        `)
        .or(`check_in.eq.${today},check_out.eq.${today}`)
        .in('status', ['confirmed', 'checked_in'])
        .order('check_in')

      if (bookingsError) {
        throw bookingsError
      }

      setBookings(bookingsData || [])

      // Load all rooms for management
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select(`
          *,
          room_type:room_types(name, capacity),
          hotel:hotels(name, location)
        `)
        .order('room_number')

      if (roomsError) {
        throw roomsError
      }

      setRooms(roomsData || [])
    } catch (err) {
      console.error('Loading error:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      router.push('/')
    }
  }

  const updateRoomStatus = async (roomId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ status: newStatus })
        .eq('id', roomId)

      if (error) {
        throw error
      }

      // Refresh rooms data
      await loadStaffData()
    } catch (err) {
      console.error('Update error:', err)
      setError('Failed to update room status')
    }
  }

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId)

      if (error) {
        throw error
      }

      // Refresh bookings data
      await loadStaffData()
    } catch (err) {
      console.error('Update error:', err)
      setError('Failed to update booking status')
    }
  }

  const getStatusBadge = (status: string, type: 'room' | 'booking' = 'booking') => {
    const variants = {
      // Room statuses
      Available: 'outline',
      Occupied: 'default',
      Cleaning: 'secondary',
      'Out of Service': 'destructive',
      // Booking statuses
      confirmed: 'default',
      checked_in: 'outline',
      checked_out: 'outline',
      pending: 'secondary'
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = !searchTerm ||
      room.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.room_type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.hotel.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = !statusFilter || room.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const todayCheckIns = bookings.filter(b => b.check_in === new Date().toISOString().split('T')[0])
  const todayCheckOuts = bookings.filter(b => b.check_out === new Date().toISOString().split('T')[0])

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading staff dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF]">
      {/* Sidebar */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        user={{ name: profile?.full_name || '', role: 'Staff' }}
        onLogout={handleSignOut}
      />

      {/* Main Content */}
      <div className="ml-64">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Page Header */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back!</h1>
              <p className="text-gray-600">Here's what's happening with your hotels today</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">{currentDate}</p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <CalendarIcon className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Check-ins Today</p>
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  {todayCheckIns.length}
                </p>
                <p className="text-xs text-green-600 font-medium">
                  {todayCheckIns.length} arrivals scheduled
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <CalendarIcon className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Check-outs Today</p>
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  {todayCheckOuts.length}
                </p>
                <p className="text-xs text-green-600 font-medium">
                  {todayCheckOuts.length} departures scheduled
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <HomeIcon className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Available Rooms</p>
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  {rooms.filter(r => r.status === 'Available').length}
                </p>
                <p className="text-xs text-green-600 font-medium">
                  Ready for guests
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <ClipboardListIcon className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Cleaning Required</p>
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  {rooms.filter(r => r.status === 'Cleaning').length}
                </p>
                <p className="text-xs text-orange-600 font-medium">
                  Needs attention
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Today's Check-ins */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Today&apos;s Check-ins</CardTitle>
                <CardDescription>Guests arriving today ({todayCheckIns.length})</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todayCheckIns.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No check-ins today</p>
                  ) : (
                    todayCheckIns.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between py-3 border-b last:border-0">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{booking.guest.full_name}</p>
                          <p className="text-xs text-gray-500">
                            {booking.booking_rooms[0]?.room.room_type.name} - Room {booking.booking_rooms[0]?.room.room_number}
                          </p>
                          <p className="text-xs text-blue-600 mt-1">{booking.hotel.name}</p>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                            className={booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}
                          >
                            {booking.status}
                          </Badge>
                          {booking.status === 'confirmed' && (
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'checked_in')}
                              className="mt-2 text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                            >
                              Check In
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Today's Check-outs */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Today&apos;s Check-outs</CardTitle>
                <CardDescription>Guests departing today ({todayCheckOuts.length})</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todayCheckOuts.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No check-outs today</p>
                  ) : (
                    todayCheckOuts.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between py-3 border-b last:border-0">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{booking.guest.full_name}</p>
                          <p className="text-xs text-gray-500">
                            {booking.booking_rooms[0]?.room.room_type.name} - Room {booking.booking_rooms[0]?.room.room_number}
                          </p>
                          <p className="text-xs text-blue-600 mt-1">{booking.hotel.name}</p>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={booking.status === 'checked_in' ? 'default' : 'secondary'}
                            className={booking.status === 'checked_in' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                          >
                            {booking.status}
                          </Badge>
                          {booking.status === 'checked_in' && (
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'checked_out')}
                              className="mt-2 text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                            >
                              Check Out
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="today" className="space-y-6">
          <TabsList>
            <TabsTrigger value="today">Today&apos;s Activity</TabsTrigger>
            <TabsTrigger value="rooms">Room Management</TabsTrigger>
            <TabsTrigger value="guests">Guest Search</TabsTrigger>
          </TabsList>

          <TabsContent value="today">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Check-ins */}
              <Card>
                <CardHeader>
                  <CardTitle>Today&apos;s Check-ins</CardTitle>
                  <CardDescription>
                    Guests arriving today ({todayCheckIns.length})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {todayCheckIns.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No check-ins today</p>
                  ) : (
                    <div className="space-y-3">
                      {todayCheckIns.map((booking) => (
                        <div key={booking.id} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{booking.guest.full_name}</p>
                            <p className="text-sm text-gray-600">
                              {booking.booking_rooms[0]?.room.room_type.name} - Room {booking.booking_rooms[0]?.room.room_number}
                            </p>
                            <p className="text-sm text-blue-600">{booking.hotel.name}</p>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(booking.status)}
                            {booking.status === 'confirmed' && (
                              <Button
                                size="sm"
                                className="mt-2"
                                onClick={() => updateBookingStatus(booking.id, 'checked_in')}
                              >
                                Check In
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Check-outs */}
              <Card>
                <CardHeader>
                  <CardTitle>Today&apos;s Check-outs</CardTitle>
                  <CardDescription>
                    Guests departing today ({todayCheckOuts.length})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {todayCheckOuts.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No check-outs today</p>
                  ) : (
                    <div className="space-y-3">
                      {todayCheckOuts.map((booking) => (
                        <div key={booking.id} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{booking.guest.full_name}</p>
                            <p className="text-sm text-gray-600">
                              {booking.booking_rooms[0]?.room.room_type.name} - Room {booking.booking_rooms[0]?.room.room_number}
                            </p>
                            <p className="text-sm text-blue-600">{booking.hotel.name}</p>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(booking.status)}
                            {booking.status === 'checked_in' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="mt-2"
                                onClick={() => updateBookingStatus(booking.id, 'checked_out')}
                              >
                                Check Out
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="rooms">
            <Card>
              <CardHeader>
                <CardTitle>Room Management</CardTitle>
                <CardDescription>
                  Monitor and update room statuses across all locations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search rooms, types, or hotels..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      <SelectItem value="Available">Available</SelectItem>
                      <SelectItem value="Occupied">Occupied</SelectItem>
                      <SelectItem value="Cleaning">Cleaning</SelectItem>
                      <SelectItem value="Out of Service">Out of Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Rooms Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Hotel</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRooms.map((room) => (
                      <TableRow key={room.id}>
                        <TableCell className="font-medium">
                          Room {room.room_number}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{room.room_type.name}</p>
                            <p className="text-sm text-gray-500">
                              {room.room_type.capacity} guests
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{room.hotel.name}</p>
                            <p className="text-sm text-gray-500">{room.hotel.location}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(room.status, 'room')}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={room.status}
                            onValueChange={(newStatus) => updateRoomStatus(room.id, newStatus)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Available">Available</SelectItem>
                              <SelectItem value="Occupied">Occupied</SelectItem>
                              <SelectItem value="Cleaning">Cleaning</SelectItem>
                              <SelectItem value="Out of Service">Out of Service</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guests">
            <Card>
              <CardHeader>
                <CardTitle>Guest Search</CardTitle>
                <CardDescription>
                  Search and manage guest bookings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Guest search functionality</p>
                  <p className="text-sm text-gray-400">
                    Feature to be implemented: Search guests by name, booking ID, or phone number
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  )
}