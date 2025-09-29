'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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

export default function StaffDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
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
      Available: 'success',
      Occupied: 'default',
      Cleaning: 'secondary',
      'Out of Service': 'destructive',
      // Booking statuses
      confirmed: 'default',
      checked_in: 'success',
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">Muraka Hotels</h1>
              <Badge className="ml-4">Staff Portal</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {profile?.full_name}</span>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Staff Dashboard</h2>
          <p className="text-gray-600">Manage daily operations and guest services</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <CalendarIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-2">Check-ins Today</h3>
              <p className="text-2xl font-bold text-blue-600">{todayCheckIns.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <CalendarIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-2">Check-outs Today</h3>
              <p className="text-2xl font-bold text-green-600">{todayCheckOuts.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <HomeIcon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-2">Available Rooms</h3>
              <p className="text-2xl font-bold text-purple-600">
                {rooms.filter(r => r.status === 'Available').length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <ClipboardListIcon className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-2">Cleaning Required</h3>
              <p className="text-2xl font-bold text-orange-600">
                {rooms.filter(r => r.status === 'Cleaning').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="today" className="space-y-6">
          <TabsList>
            <TabsTrigger value="today">Today's Activity</TabsTrigger>
            <TabsTrigger value="rooms">Room Management</TabsTrigger>
            <TabsTrigger value="guests">Guest Search</TabsTrigger>
          </TabsList>

          <TabsContent value="today">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Check-ins */}
              <Card>
                <CardHeader>
                  <CardTitle>Today's Check-ins</CardTitle>
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
                  <CardTitle>Today's Check-outs</CardTitle>
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
  )
}