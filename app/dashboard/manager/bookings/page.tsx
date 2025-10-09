'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/Sidebar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Eye, Edit, Trash2, Search } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Booking {
  id: string
  check_in: string
  check_out: string
  status: string
  total_price: number
  num_guests: number
  phone?: string
  special_requests?: string
  guest: {
    full_name: string
    email: string
  }
  hotel: {
    name: string
  }
  booking_rooms: {
    room: {
      room_number: string
      room_type: string
    }
  }[]
}

interface Profile {
  id: string
  full_name: string
  phone: string | null
  role: string
}

interface Guest {
  id: string
  full_name: string | null
  email: string
}

interface Hotel {
  id: string
  name: string
  location: string
}

interface Room {
  id: string
  room_number: string
  room_type: string
  price_per_night: number
  hotel_id: string
}

export default function ManagerBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeView] = useState('bookings')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [guests, setGuests] = useState<Guest[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [availableRooms, setAvailableRooms] = useState<Room[]>([])
  const [formData, setFormData] = useState({
    guest_id: '',
    hotel_id: '',
    room_id: '',
    check_in: '',
    check_out: '',
    num_guests: 1,
    status: 'pending',
    total_price: 0
  })

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

      if (profile?.role !== 'admin' && profile?.role !== 'manager') {
        router.push('/dashboard/guest')
        return
      }

      setProfile(profile)
      await loadBookings()
    } catch (err) {
      console.error('Auth error:', err)
      router.push('/login')
    }
  }

  const loadBookings = async () => {
    try {
      setLoading(true)

      // Fetch bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })

      if (bookingsError) {
        console.error('Bookings error:', bookingsError)
        setError(`Failed to load bookings: ${bookingsError.message}`)
        setBookings([])
        return
      }

      if (!bookingsData || bookingsData.length === 0) {
        setBookings([])
        return
      }

      console.log('Fetched bookings:', bookingsData.length)
      console.log('Sample booking data:', bookingsData.slice(0, 2))

      // Fetch all profiles with email from auth.users
      // Since profiles.id references auth.users.id, we can join them
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')

      if (profilesError) {
        console.error('Profiles fetch error:', profilesError)
      }

      // Fetch all hotels
      const { data: hotelsData } = await supabase
        .from('hotels')
        .select('id, name')

      // Fetch booking_rooms with room details
      const { data: bookingRoomsData } = await supabase
        .from('booking_rooms')
        .select(`
          booking_id,
          room_id,
          rooms(
            room_number,
            room_type_id,
            hotel_id
          )
        `)

      // Fetch room types
      const { data: roomTypesData } = await supabase
        .from('room_types')
        .select('id, name')

      console.log('Profiles:', profilesData?.length || 0)
      console.log('Sample profiles:', profilesData?.slice(0, 2))
      console.log('Hotels:', hotelsData?.length || 0)
      console.log('Sample hotels:', hotelsData)
      console.log('Booking rooms:', bookingRoomsData?.length || 0)
      console.log('Sample booking_rooms:', bookingRoomsData?.slice(0, 3))
      console.log('Room types:', roomTypesData?.length || 0)

      // Get unique guest_ids from bookings that don't have profiles
      const guestIdsWithoutProfiles = bookingsData
        .map(b => b.guest_id)
        .filter(guestId => !profilesData?.find(p => p.id === guestId))

      console.log('Guest IDs without profiles:', guestIdsWithoutProfiles.length)
      console.log('Sample missing guest IDs:', guestIdsWithoutProfiles.slice(0, 3))

      // Create lookup maps
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || [])
      const hotelsMap = new Map(hotelsData?.map(h => [h.id, h]) || [])
      const roomTypesMap = new Map(roomTypesData?.map(rt => [rt.id, rt]) || [])

      // Group booking rooms by booking_id
      const bookingRoomsMap = new Map<string, any[]>()
      bookingRoomsData?.forEach(br => {
        if (!bookingRoomsMap.has(br.booking_id)) {
          bookingRoomsMap.set(br.booking_id, [])
        }
        bookingRoomsMap.get(br.booking_id)?.push(br)
      })

      // Transform bookings with joined data
      const transformedBookings = bookingsData.map((booking: any, index: number) => {
        const guest = profilesMap.get(booking.guest_id)
        const bookingRooms = bookingRoomsMap.get(booking.id) || []

        // Get hotel from the room's hotel_id since booking.hotel_id is null
        let hotel = null
        let hotelFromRoom = null
        if (booking.hotel_id) {
          hotel = hotelsMap.get(booking.hotel_id)
        }
        // Try to get hotel from first room if booking doesn't have hotel_id
        if (!hotel && bookingRooms.length > 0 && bookingRooms[0].rooms?.hotel_id) {
          hotelFromRoom = hotelsMap.get(bookingRooms[0].rooms.hotel_id)
        }

        const finalHotel = hotel || hotelFromRoom

        console.log(`Booking ${index}:`, {
          id: booking.id,
          guest_id: booking.guest_id,
          hotel_id: booking.hotel_id,
          room_hotel_id: bookingRooms[0]?.rooms?.hotel_id,
          found_guest: !!guest,
          found_hotel: !!finalHotel,
          num_rooms: bookingRooms.length
        })

        if (!guest) {
          console.warn(`Booking ${booking.id}: No profile found for guest_id ${booking.guest_id}`)
        }
        if (!finalHotel) {
          console.warn(`Booking ${booking.id}: No hotel found`)
        }

        return {
          ...booking,
          guest: guest || { full_name: 'Unknown', email: '' },
          hotel: finalHotel || { name: 'Unknown' },
          booking_rooms: bookingRooms.map((br: any) => {
            const roomType = br.rooms?.room_type_id
              ? roomTypesMap.get(br.rooms.room_type_id)
              : null

            return {
              room: {
                room_number: br.rooms?.room_number || 'Unknown',
                room_type: roomType?.name || 'Unknown'
              }
            }
          })
        }
      })

      console.log('Transformed bookings:', transformedBookings.length)
      setBookings(transformedBookings)

    } catch (err) {
      console.error('Loading error:', err)
      if (err instanceof Error) {
        console.error('Error message:', err.message)
        console.error('Stack trace:', err.stack)
        setError(`Failed to load bookings: ${err.message}`)
      } else {
        console.error('Error details:', JSON.stringify(err, null, 2))
        setError('Failed to load bookings: Unknown error')
      }
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

  const loadFormData = async () => {
    try {
      // Load guests (profiles with role='guest' only)
      const { data: guestsData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'guest')
        .order('created_at', { ascending: false })

      // Load hotels
      const { data: hotelsData } = await supabase
        .from('hotels')
        .select('id, name, location')
        .order('name')

      // Load all rooms with room type and pricing info
      const { data: roomsData } = await supabase
        .from('rooms')
        .select(`
          id,
          room_number,
          hotel_id,
          room_type:room_types(
            name,
            price_off_peak
          )
        `)
        .order('room_number')

      // Transform the data to match the Room interface
      const transformedRooms = roomsData?.map(room => ({
        id: room.id,
        room_number: room.room_number,
        room_type: Array.isArray(room.room_type) && room.room_type.length > 0
          ? room.room_type[0].name
          : 'Unknown',
        price_per_night: Array.isArray(room.room_type) && room.room_type.length > 0
          ? room.room_type[0].price_off_peak
          : 0,
        hotel_id: room.hotel_id
      })) || []

      setGuests(guestsData || [])
      setHotels(hotelsData || [])
      setRooms(transformedRooms)
    } catch (err) {
      console.error('Error loading form data:', err)
    }
  }

  const handleHotelChange = (hotelId: string) => {
    setFormData({ ...formData, hotel_id: hotelId, room_id: '' })
    const filtered = rooms.filter(r => r.hotel_id === hotelId)
    setAvailableRooms(filtered)
  }

  const handleRoomChange = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId)
    if (room && formData.check_in && formData.check_out) {
      const nights = calculateNights(formData.check_in, formData.check_out)
      const total = room.price_per_night * nights
      setFormData({ ...formData, room_id: roomId, total_price: total })
    } else {
      setFormData({ ...formData, room_id: roomId })
    }
  }

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const diff = end.getTime() - start.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const handleDateChange = (field: 'check_in' | 'check_out', value: string) => {
    const newFormData = { ...formData, [field]: value }

    if (newFormData.check_in && newFormData.check_out && newFormData.room_id) {
      const room = rooms.find(r => r.id === newFormData.room_id)
      if (room) {
        const nights = calculateNights(newFormData.check_in, newFormData.check_out)
        newFormData.total_price = room.price_per_night * nights
      }
    }

    setFormData(newFormData)
  }

  const handleCreateBooking = async () => {
    try {
      setError('')
      setSuccess('')

      // Validation
      if (!formData.guest_id) {
        setError('Please select a guest')
        return
      }
      if (!formData.hotel_id) {
        setError('Please select a hotel')
        return
      }
      if (!formData.room_id) {
        setError('Please select a room')
        return
      }
      if (!formData.check_in || !formData.check_out) {
        setError('Please select check-in and check-out dates')
        return
      }
      if (new Date(formData.check_in) >= new Date(formData.check_out)) {
        setError('Check-out date must be after check-in date')
        return
      }

      // Create booking
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert([
          {
            guest_id: formData.guest_id,
            hotel_id: formData.hotel_id,
            check_in: formData.check_in,
            check_out: formData.check_out,
            num_guests: formData.num_guests,
            status: formData.status,
            total_price: formData.total_price
          }
        ])
        .select()
        .single()

      if (bookingError) throw bookingError

      // Get room price for booking_rooms
      const selectedRoom = rooms.find(r => r.id === formData.room_id)
      if (!selectedRoom) throw new Error('Room not found')

      // Create booking_rooms entry
      const { error: roomError } = await supabase
        .from('booking_rooms')
        .insert([
          {
            booking_id: bookingData.id,
            room_id: formData.room_id,
            price_per_night: selectedRoom.price_per_night
          }
        ])

      if (roomError) throw roomError

      // Success
      setSuccess('Booking created successfully!')
      setFormData({
        guest_id: '',
        hotel_id: '',
        room_id: '',
        check_in: '',
        check_out: '',
        num_guests: 1,
        status: 'pending',
        total_price: 0
      })
      setAvailableRooms([])

      // Reload bookings
      await loadBookings()

      // Close dialog after delay
      setTimeout(() => {
        setDialogOpen(false)
        setSuccess('')
      }, 1500)

    } catch (err: any) {
      console.error('Create booking error:', err)
      setError(err.message || 'Failed to create booking')
    }
  }

  const handleDialogOpen = (open: boolean) => {
    setDialogOpen(open)
    if (open) {
      loadFormData()
    } else {
      setError('')
      setSuccess('')
    }
  }

  const handleViewClick = (booking: Booking) => {
    setSelectedBooking(booking)
    setViewDialogOpen(true)
  }

  const handleEditClick = (booking: Booking) => {
    setSelectedBooking(booking)
    setEditDialogOpen(true)
  }

  const handleDeleteClick = (booking: Booking) => {
    setSelectedBooking(booking)
    setDeleteDialogOpen(true)
  }

  const handleDeleteBooking = async () => {
    if (!selectedBooking) return

    try {
      setError('')
      setSuccess('')

      const { error: deleteError } = await supabase
        .from('bookings')
        .delete()
        .eq('id', selectedBooking.id)

      if (deleteError) throw deleteError

      setSuccess('Booking deleted successfully!')

      // Reload bookings
      await loadBookings()

      // Close dialog after delay
      setTimeout(() => {
        setDeleteDialogOpen(false)
        setSelectedBooking(null)
        setSuccess('')
      }, 1500)

    } catch (err: any) {
      console.error('Delete booking error:', err)
      setError(err.message || 'Failed to delete booking')
    }
  }

  const handleUpdateBooking = async (newStatus: string) => {
    if (!selectedBooking) return

    try {
      setError('')
      setSuccess('')

      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', selectedBooking.id)

      if (updateError) throw updateError

      setSuccess('Booking status updated successfully!')

      // Reload bookings to show updated status
      await loadBookings()

      // Close dialog after delay
      setTimeout(() => {
        setEditDialogOpen(false)
        setSelectedBooking(null)
        setSuccess('')
      }, 1500)

    } catch (err: any) {
      console.error('Update booking error:', err)
      setError(err.message || 'Failed to update booking')
    }
  }

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch =
      booking.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.guest.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.guest.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Loading bookings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF]">
      {/* Sidebar */}
      <Sidebar
        activeView={activeView}
        setActiveView={(view) => {
          if (view === 'dashboard') router.push('/dashboard/manager')
          else if (view === 'bookings') router.push('/dashboard/manager/bookings')
          else if (view === 'hotels') router.push('/dashboard/manager/hotels')
          else if (view === 'customers') router.push('/dashboard/manager/customers')
          else if (view === 'payments') router.push('/dashboard/manager/payments')
          else if (view === 'reports') router.push('/dashboard/manager/reports')
        }}
        user={{ name: profile?.full_name || '', role: profile?.role || 'Manager' }}
        onLogout={handleSignOut}
      />

      {/* Main Content */}
      <div className="ml-64">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Page Header */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Management</h1>
              <p className="text-gray-600">View and manage all hotel bookings</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={handleDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  Add New Booking
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create New Booking</DialogTitle>
                  <DialogDescription>
                    Add a new booking for a guest at a hotel
                  </DialogDescription>
                </DialogHeader>

                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="mb-4 bg-green-50 text-green-900 border-green-200">
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="guest">Guest *</Label>
                    <Select
                      value={formData.guest_id}
                      onValueChange={(value) => setFormData({ ...formData, guest_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select guest" />
                      </SelectTrigger>
                      <SelectContent>
                        {guests.map((guest) => (
                          <SelectItem key={guest.id} value={guest.id}>
                            {guest.full_name ? `${guest.full_name} (${guest.email})` : guest.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="hotel">Hotel *</Label>
                    <Select
                      value={formData.hotel_id}
                      onValueChange={handleHotelChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select hotel" />
                      </SelectTrigger>
                      <SelectContent>
                        {hotels.map((hotel) => (
                          <SelectItem key={hotel.id} value={hotel.id}>
                            {hotel.name} ({hotel.location})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="room">Room *</Label>
                    <Select
                      value={formData.room_id}
                      onValueChange={handleRoomChange}
                      disabled={!formData.hotel_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            Room {room.room_number} - {room.room_type} (${room.price_per_night}/night)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="check_in">Check-In *</Label>
                      <Input
                        id="check_in"
                        type="date"
                        value={formData.check_in}
                        onChange={(e) => handleDateChange('check_in', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="check_out">Check-Out *</Label>
                      <Input
                        id="check_out"
                        type="date"
                        value={formData.check_out}
                        onChange={(e) => handleDateChange('check_out', e.target.value)}
                        min={formData.check_in || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="num_guests">Number of Guests *</Label>
                      <Input
                        id="num_guests"
                        type="number"
                        min="1"
                        value={formData.num_guests}
                        onChange={(e) => setFormData({ ...formData, num_guests: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="status">Status *</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.total_price > 0 && (
                    <div className="rounded-md bg-blue-50 p-4">
                      <p className="text-sm text-blue-900">
                        <strong>Total Price:</strong> ${formData.total_price.toLocaleString()}
                      </p>
                      {formData.check_in && formData.check_out && (
                        <p className="text-xs text-blue-700 mt-1">
                          {calculateNights(formData.check_in, formData.check_out)} night(s)
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false)
                      setError('')
                      setSuccess('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateBooking}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Create Booking
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Booking Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Edit Booking</DialogTitle>
                  <DialogDescription>
                    Update booking status for {selectedBooking?.guest.full_name}
                  </DialogDescription>
                </DialogHeader>

                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="mb-4 bg-green-50 text-green-900 border-green-200">
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                {selectedBooking && (
                  <div className="space-y-4 py-4">
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <p className="text-sm text-gray-600">
                        <strong>Booking ID:</strong> #{selectedBooking.id.slice(0, 8)}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Guest:</strong> {selectedBooking.guest.full_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Hotel:</strong> {selectedBooking.hotel.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Check-in:</strong> {new Date(selectedBooking.check_in).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Check-out:</strong> {new Date(selectedBooking.check_out).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Current Status:</strong>{' '}
                        <Badge
                          className={
                            selectedBooking.status === 'confirmed'
                              ? 'bg-green-100 text-green-700 border-0'
                              : selectedBooking.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700 border-0'
                              : 'bg-red-100 text-red-700 border-0'
                          }
                        >
                          {selectedBooking.status}
                        </Badge>
                      </p>
                    </div>

                    <div className="grid gap-2">
                      <Label>Update Status</Label>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <Button
                          variant={selectedBooking.status === 'pending' ? 'default' : 'outline'}
                          className={
                            selectedBooking.status === 'pending'
                              ? 'bg-yellow-600 hover:bg-yellow-700'
                              : 'hover:bg-yellow-50'
                          }
                          onClick={() => handleUpdateBooking('pending')}
                          disabled={selectedBooking.status === 'pending'}
                        >
                          Pending
                        </Button>
                        <Button
                          variant={selectedBooking.status === 'confirmed' ? 'default' : 'outline'}
                          className={
                            selectedBooking.status === 'confirmed'
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'hover:bg-green-50'
                          }
                          onClick={() => handleUpdateBooking('confirmed')}
                          disabled={selectedBooking.status === 'confirmed'}
                        >
                          Confirmed
                        </Button>
                        <Button
                          variant={selectedBooking.status === 'checked_in' ? 'default' : 'outline'}
                          className={
                            selectedBooking.status === 'checked_in'
                              ? 'bg-blue-600 hover:bg-blue-700'
                              : 'hover:bg-blue-50'
                          }
                          onClick={() => handleUpdateBooking('checked_in')}
                          disabled={selectedBooking.status === 'checked_in'}
                        >
                          Checked In
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={selectedBooking.status === 'checked_out' ? 'default' : 'outline'}
                          className={
                            selectedBooking.status === 'checked_out'
                              ? 'bg-purple-600 hover:bg-purple-700'
                              : 'hover:bg-purple-50'
                          }
                          onClick={() => handleUpdateBooking('checked_out')}
                          disabled={selectedBooking.status === 'checked_out'}
                        >
                          Checked Out
                        </Button>
                        <Button
                          variant={selectedBooking.status === 'cancelled' ? 'default' : 'outline'}
                          className={
                            selectedBooking.status === 'cancelled'
                              ? 'bg-red-600 hover:bg-red-700'
                              : 'hover:bg-red-50'
                          }
                          onClick={() => handleUpdateBooking('cancelled')}
                          disabled={selectedBooking.status === 'cancelled'}
                        >
                          Cancelled
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditDialogOpen(false)
                      setSelectedBooking(null)
                      setError('')
                      setSuccess('')
                    }}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* View Booking Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Booking Details</DialogTitle>
                  <DialogDescription>
                    Complete booking information
                  </DialogDescription>
                </DialogHeader>

                {selectedBooking && (
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-gray-500">Booking ID</Label>
                        <p className="font-mono text-sm">#{selectedBooking.id.slice(0, 8)}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Status</Label>
                        <div className="mt-1">
                          <Badge
                            className={
                              selectedBooking.status === 'confirmed'
                                ? 'bg-green-100 text-green-700 border-0'
                                : selectedBooking.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700 border-0'
                                : selectedBooking.status === 'checked_in'
                                ? 'bg-blue-100 text-blue-700 border-0'
                                : selectedBooking.status === 'checked_out'
                                ? 'bg-purple-100 text-purple-700 border-0'
                                : 'bg-red-100 text-red-700 border-0'
                            }
                          >
                            {selectedBooking.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3">Guest Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-gray-500">Name</Label>
                          <p className="text-sm">{selectedBooking.guest.full_name}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Email</Label>
                          <p className="text-sm">{selectedBooking.guest.email}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Phone</Label>
                          <p className="text-sm">{selectedBooking.phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Number of Guests</Label>
                          <p className="text-sm">{selectedBooking.num_guests}</p>
                        </div>
                      </div>
                      {selectedBooking.special_requests && (
                        <div className="mt-4">
                          <Label className="text-xs text-gray-500">Special Requests</Label>
                          <p className="text-sm bg-gray-50 p-3 rounded-md mt-1">
                            {selectedBooking.special_requests}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3">Accommodation</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-gray-500">Hotel</Label>
                          <p className="text-sm">{selectedBooking.hotel.name}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Room</Label>
                          <p className="text-sm">
                            {selectedBooking.booking_rooms[0]?.room.room_number || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Room Type</Label>
                          <p className="text-sm">
                            {selectedBooking.booking_rooms[0]?.room.room_type || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3">Dates & Payment</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-gray-500">Check-In</Label>
                          <p className="text-sm">{new Date(selectedBooking.check_in).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Check-Out</Label>
                          <p className="text-sm">{new Date(selectedBooking.check_out).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Total Price</Label>
                          <p className="text-lg font-semibold text-green-600">
                            ${selectedBooking.total_price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setViewDialogOpen(false)
                      setSelectedBooking(null)
                    }}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Delete Booking</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this booking? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>

                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="mb-4 bg-green-50 text-green-900 border-green-200">
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                {selectedBooking && (
                  <div className="bg-red-50 p-4 rounded-lg space-y-2">
                    <p className="text-sm text-gray-700">
                      <strong>Booking ID:</strong> #{selectedBooking.id.slice(0, 8)}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Guest:</strong> {selectedBooking.guest.full_name}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Hotel:</strong> {selectedBooking.hotel.name}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Dates:</strong> {new Date(selectedBooking.check_in).toLocaleDateString()} - {new Date(selectedBooking.check_out).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDeleteDialogOpen(false)
                      setSelectedBooking(null)
                      setError('')
                      setSuccess('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteBooking}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete Booking
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Search and Filter */}
          <Card className="bg-white shadow-sm mb-6">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by booking ID, guest name, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="checked_in">Checked In</SelectItem>
                    <SelectItem value="checked_out">Checked Out</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Bookings Table */}
          <Card className="bg-white shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="font-semibold text-gray-700">Booking ID</TableHead>
                    <TableHead className="font-semibold text-gray-700">Guest</TableHead>
                    <TableHead className="font-semibold text-gray-700">Hotel & Room</TableHead>
                    <TableHead className="font-semibold text-gray-700">Dates</TableHead>
                    <TableHead className="font-semibold text-gray-700">Guests</TableHead>
                    <TableHead className="font-semibold text-gray-700">Amount</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        No bookings found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBookings.map((booking) => (
                      <TableRow key={booking.id} className="border-b border-gray-100">
                        <TableCell className="font-mono text-sm text-gray-900">
                          #{booking.id.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{booking.guest.full_name}</p>
                            <p className="text-sm text-gray-500">{booking.guest.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{booking.hotel.name}</p>
                            <p className="text-sm text-gray-500">
                              Room {booking.booking_rooms[0]?.room.room_number}
                            </p>
                            <p className="text-xs text-gray-400">
                              {booking.booking_rooms[0]?.room.room_type}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(booking.check_in).toLocaleDateString()} -{' '}
                          {new Date(booking.check_out).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm text-gray-900">
                          {booking.num_guests}
                        </TableCell>
                        <TableCell className="font-semibold text-gray-900">
                          ${booking.total_price.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              booking.status === 'confirmed'
                                ? 'bg-green-100 text-green-700 border-0'
                                : booking.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700 border-0'
                                : booking.status === 'checked_in'
                                ? 'bg-blue-100 text-blue-700 border-0'
                                : booking.status === 'checked_out'
                                ? 'bg-purple-100 text-purple-700 border-0'
                                : 'bg-red-100 text-red-700 border-0'
                            }
                          >
                            {booking.status === 'checked_in' ? 'checked in' : booking.status === 'checked_out' ? 'checked out' : booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <button
                              className="p-1 text-gray-600 hover:text-blue-600"
                              onClick={() => handleViewClick(booking)}
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              className="p-1 text-gray-600 hover:text-purple-600"
                              onClick={() => handleEditClick(booking)}
                              title="Edit status"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              className="p-1 text-gray-600 hover:text-red-600"
                              onClick={() => handleDeleteClick(booking)}
                              title="Delete booking"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
