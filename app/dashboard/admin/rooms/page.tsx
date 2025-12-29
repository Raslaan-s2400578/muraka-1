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
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/Sidebar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Bed, DollarSign, Building, Search, ArrowLeft } from 'lucide-react'

interface Room {
  id: string
  room_number: string
  room_type_id: string
  room_type?: {
    id: string
    name: string
    capacity: number
    price_off_peak: number
    price_peak: number
  }
  status: string
  is_available: boolean
  hotel_id: string
  hotel?: {
    name: string
    location: string
  }
}

interface RoomType {
  id: string
  name: string
  hotel_id: string
  capacity: number
  price_off_peak: number
  price_peak: number
}

interface Hotel {
  id: string
  name: string
  location: string
}

interface Profile {
  id: string
  full_name: string
  phone: string | null
  role: string
}

function RoomsPageContent() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeView] = useState('hotels')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [hotelFilter, setHotelFilter] = useState('all')
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null)
  const [formData, setFormData] = useState({
    hotel_id: '',
    room_number: '',
    room_type_id: '',
    status: 'Available'
  })

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    checkUserAndLoadData()
  }, [])

  useEffect(() => {
    const hotelId = searchParams.get('hotel')
    if (hotelId && hotels.length > 0) {
      setHotelFilter(hotelId)
      const hotel = hotels.find(h => h.id === hotelId)
      setSelectedHotel(hotel || null)
      setFormData(prev => ({ ...prev, hotel_id: hotelId }))
    }
  }, [searchParams, hotels])

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

      if (profile?.role !== 'admin' && profile?.role !== 'staff' && profile?.role !== 'manager') {
        router.push('/dashboard/guest')
        return
      }

      setProfile(profile)
      await loadRooms()
      await loadHotels()
      await loadRoomTypes()
    } catch (err) {
      console.error('Auth error:', err)
      router.push('/login')
    }
  }

  const loadRooms = async () => {
    try {
      setLoading(true)

      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*, hotel:hotels(name, location), room_type:room_types(id, name, capacity, price_off_peak, price_peak)')
        .order('room_number')

      if (roomsError) {
        console.error('Rooms error:', roomsError)
        setRooms([])
      } else {
        // Transform data to add computed is_available field from status
        const transformedRooms = (roomsData || []).map(room => ({
          ...room,
          is_available: room.status === 'Available'
        }))
        setRooms(transformedRooms)
      }
    } catch (err) {
      console.error('Loading error:', err);
if (err instanceof Error) {
  console.error('Error message:', err.message);
  console.error('Stack trace:', err.stack);
} else {
  console.error('Error details:', JSON.stringify(err, null, 2));
}
    } finally {
      setLoading(false)
    }
  }

  const loadRoomTypes = async () => {
    try {
      const { data: roomTypesData } = await supabase
        .from('room_types')
        .select('id, name, hotel_id, capacity, price_off_peak, price_peak')
        .order('name')

      setRoomTypes(roomTypesData || [])
    } catch (err) {
      console.error('Room types error:', err)
    }
  }

  const loadHotels = async () => {
    try {
      const { data: hotelsData } = await supabase
        .from('hotels')
        .select('id, name, location')
        .order('name')

      setHotels(hotelsData || [])
    } catch (err) {
      console.error('Hotels error:', err)
    }
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      router.push('/')
    }
  }

  const handleCreateRoom = async () => {
    try {
      setError('')
      setSuccess('')

      // Validation
      if (!formData.hotel_id) {
        setError('Please select a hotel')
        return
      }
      if (!formData.room_number.trim()) {
        setError('Room number is required')
        return
      }
      if (!formData.room_type_id) {
        setError('Please select a room type')
        return
      }

      // Insert room into database
      const { error: insertError } = await supabase
        .from('rooms')
        .insert([
          {
            hotel_id: formData.hotel_id,
            room_number: formData.room_number.trim(),
            room_type_id: formData.room_type_id,
            status: formData.status
          }
        ])
        .select()

      if (insertError) {
        throw insertError
      }

      // Success
      setSuccess('Room created successfully!')
      setFormData({
        hotel_id: '',
        room_number: '',
        room_type_id: '',
        status: 'Available'
      })

      // Reload rooms
      await loadRooms()

      // Close dialog after delay
      setTimeout(() => {
        setDialogOpen(false)
        setSuccess('')
      }, 1500)

    } catch (err: any) {
      console.error('Create room error:', err)
      setError(err.message || 'Failed to create room')
    }
  }

  const handleDialogOpen = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setError('')
      setSuccess('')
    }
  }

  const filteredRooms = rooms.filter(room => {
    const matchesSearch =
      room.room_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.room_type?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.hotel?.name?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesHotel = hotelFilter === 'all' || room.hotel_id === hotelFilter

    return matchesSearch && matchesHotel
  })

  const roomTypeStats = {
    total: filteredRooms.length,
    available: filteredRooms.filter(r => r.is_available).length,
    occupied: filteredRooms.filter(r => !r.is_available).length,
    avgPrice: filteredRooms.length > 0 ? Math.round(filteredRooms.reduce((sum, r) => sum + (r.room_type?.price_off_peak || 0), 0) / filteredRooms.length) : 0
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Loading rooms...</p>
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
          if (view === 'dashboard') router.push('/dashboard/admin')
          else if (view === 'bookings') router.push('/dashboard/admin/bookings')
          else if (view === 'hotels') router.push('/dashboard/admin/hotels')
          else if (view === 'customers') router.push('/dashboard/admin/customers')
          else if (view === 'payments') router.push('/dashboard/admin/payments')
          else if (view === 'reports') router.push('/dashboard/admin/reports')
          else if (view === 'users') router.push('/dashboard/admin/users')
        }}
        user={{ name: profile?.full_name || '', role: 'Admin' }}
        onLogout={handleSignOut}
      />

      {/* Main Content */}
      <div className="ml-64">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Page Header */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              {selectedHotel && (
                <Button
                  variant="ghost"
                  onClick={() => router.push('/dashboard/admin/hotels')}
                  className="mb-3 -ml-2 text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Hotels
                </Button>
              )}
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {selectedHotel ? `${selectedHotel.name} - Rooms` : 'Room Management'}
              </h1>
              <p className="text-gray-600">
                {selectedHotel
                  ? `Manage rooms for ${selectedHotel.name} (${selectedHotel.location})`
                  : 'Manage hotel rooms and availability'
                }
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={handleDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  Add New Room
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Room</DialogTitle>
                  <DialogDescription>
                    Create a new room for a hotel
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
                    <Label htmlFor="hotel">Hotel *</Label>
                    <Select
                      value={formData.hotel_id}
                      onValueChange={(value) => setFormData({ ...formData, hotel_id: value, room_type_id: '' })}
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
                    <Label htmlFor="room_number">Room Number *</Label>
                    <Input
                      id="room_number"
                      placeholder="e.g., 101, A-205"
                      value={formData.room_number}
                      onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="room_type">Room Type *</Label>
                    <Select
                      value={formData.room_type_id}
                      onValueChange={(value) => setFormData({ ...formData, room_type_id: value })}
                      disabled={!formData.hotel_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={formData.hotel_id ? "Select room type" : "Select hotel first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {roomTypes
                          .filter(rt => rt.hotel_id === formData.hotel_id)
                          .map((roomType) => (
                            <SelectItem key={roomType.id} value={roomType.id}>
                              {roomType.name} (${roomType.price_off_peak} - ${roomType.price_peak})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
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
                        <SelectItem value="Available">Available</SelectItem>
                        <SelectItem value="Occupied">Occupied</SelectItem>
                        <SelectItem value="Cleaning">Cleaning</SelectItem>
                        <SelectItem value="Out of Service">Out of Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                    onClick={handleCreateRoom}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Create Room
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Bed className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Total Rooms</p>
                <p className="text-2xl font-bold text-gray-900">{roomTypeStats.total}</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <Bed className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Available</p>
                <p className="text-2xl font-bold text-gray-900">{roomTypeStats.available}</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <Building className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Occupied</p>
                <p className="text-2xl font-bold text-gray-900">{roomTypeStats.occupied}</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Avg. Price/Night</p>
                <p className="text-2xl font-bold text-gray-900">${roomTypeStats.avgPrice}</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <Card className="bg-white shadow-sm mb-6">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by room number, type, or hotel..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={hotelFilter} onValueChange={setHotelFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Hotels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Hotels</SelectItem>
                    {hotels.map((hotel) => (
                      <SelectItem key={hotel.id} value={hotel.id}>
                        {hotel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Rooms Table */}
          <Card className="bg-white shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="font-semibold text-gray-700">Room Number</TableHead>
                    <TableHead className="font-semibold text-gray-700">Hotel</TableHead>
                    <TableHead className="font-semibold text-gray-700">Type</TableHead>
                    <TableHead className="font-semibold text-gray-700">Price/Night</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRooms.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No rooms found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRooms.map((room) => (
                      <TableRow key={room.id} className="border-b border-gray-100">
                        <TableCell className="font-medium text-gray-900">
                          {room.room_number}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{room.hotel?.name}</p>
                            <p className="text-sm text-gray-500">{room.hotel?.location}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-700">{room.room_type?.name || 'Unknown'}</TableCell>
                        <TableCell className="font-semibold text-gray-900">
                          ${room.room_type?.price_off_peak || 0}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              room.is_available
                                ? 'bg-green-100 text-green-700 border-0'
                                : 'bg-red-100 text-red-700 border-0'
                            }
                          >
                            {room.is_available ? 'Available' : 'Occupied'}
                          </Badge>
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

export default function RoomsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F5F3EF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading rooms...</p>
        </div>
      </div>
    }>
      <RoomsPageContent />
    </Suspense>
  )
}
