'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CalendarIcon, MapPinIcon, UsersIcon, CreditCardIcon, CheckCircle2Icon, ClockIcon, XCircleIcon } from 'lucide-react'
import { format } from 'date-fns'

interface Booking {
  id: string
  check_in: string
  check_out: string
  total_price: number
  status: string
  created_at: string
  hotel: {
    name: string
    location: string
    address: string
  }
  booking_rooms: {
    room: {
      room_number: string
      room_type: {
        name: string
        capacity: number
      }
    }
  }[]
  booking_services: {
    quantity: number
    service: {
      name: string
      price: number
    }
  }[]
}

interface Profile {
  id: string
  full_name: string
  phone: string | null
  role: string
}

function GuestDashboardContent() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancellingBooking, setCancellingBooking] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const highlightBookingId = searchParams.get('booking')
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

      setUser(user)
      await loadUserData(user.id)
    } catch (err) {
      console.error('Auth error:', err)
      router.push('/login')
    }
  }

  const loadUserData = async (userId: string) => {
    try {
      setLoading(true)

      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        throw profileError
      }

      setProfile(profileData)

      // Load user bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          booking_rooms(
            room:rooms(
              room_number,
              room_type:room_types(name, capacity)
            )
          ),
          booking_services(
            quantity,
            service:services(name, price)
          )
        `)
        .eq('guest_id', userId)
        .order('created_at', { ascending: false })

      if (bookingsError) {
        throw bookingsError
      }

      // Fetch hotel data separately and merge
      if (bookingsData && bookingsData.length > 0) {
        const hotelIds = [...new Set(bookingsData.map(b => b.hotel_id))]
        const { data: hotels } = await supabase
          .from('hotels')
          .select('id, name, location, address')
          .in('id', hotelIds)

        const hotelMap = new Map(hotels?.map(h => [h.id, h]) || [])

        const bookingsWithHotels = bookingsData.map(booking => ({
          ...booking,
          hotel: hotelMap.get(booking.hotel_id) || { name: 'Unknown Hotel', location: 'Unknown', address: '' }
        }))

        setBookings(bookingsWithHotels)
      } else {
        setBookings([])
      }
    } catch (err) {
      console.error('Loading error:', err)
      if (err instanceof Error) {
        console.error('Error message:', err.message)
        console.error('Stack trace:', err.stack)
      } else {
        console.error('Error details:', JSON.stringify(err, null, 2))
      }
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

  const handleCancelBooking = async (bookingId: string) => {
    setCancellingBooking(bookingId)

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)

      if (error) {
        throw error
      }

      // Refresh bookings
      if (user) {
        await loadUserData(user.id)
      }
    } catch (err) {
      console.error('Cancellation error:', err)
      setError('Failed to cancel booking')
    } finally {
      setCancellingBooking(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      confirmed: 'default',
      checked_in: 'default',
      checked_out: 'outline',
      cancelled: 'destructive'
    } as const

    const icons = {
      pending: <ClockIcon className="w-3 h-3 mr-1" />,
      confirmed: <CheckCircle2Icon className="w-3 h-3 mr-1" />,
      checked_in: <CheckCircle2Icon className="w-3 h-3 mr-1" />,
      checked_out: <CheckCircle2Icon className="w-3 h-3 mr-1" />,
      cancelled: <XCircleIcon className="w-3 h-3 mr-1" />
    } as const

    const variant = variants[status as keyof typeof variants] || 'outline'
    const icon = icons[status as keyof typeof icons]

    return (
      <Badge variant={variant}>
        {icon}
        {status.replace('_', ' ').toLowerCase()}
      </Badge>
    )
  }

  const canCancelBooking = (booking: Booking) => {
    return booking.status === 'pending' || booking.status === 'confirmed'
  }

  const upcomingBookings = bookings.filter(b =>
    new Date(b.check_in) >= new Date() && (b.status === 'confirmed' || b.status === 'pending')
  )

  const pastBookings = bookings.filter(b =>
    new Date(b.check_out) < new Date() || b.status === 'cancelled' || b.status === 'checked_out'
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading your dashboard...</p>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Guest Dashboard</h2>
          <p className="text-gray-600">Manage your bookings and account settings</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {highlightBookingId && (
          <Alert className="mb-6">
            <CheckCircle2Icon className="w-4 h-4" />
            <AlertDescription>
              Your booking has been confirmed! Check your email for details.
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{bookings.length}</p>
                </div>
                <CalendarIcon className="w-10 h-10 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Upcoming Stays</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{upcomingBookings.length}</p>
                </div>
                <UsersIcon className="w-10 h-10 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Spent</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    ${bookings.reduce((sum, b) => sum + b.total_price, 0).toLocaleString()}
                  </p>
                </div>
                <CreditCardIcon className="w-10 h-10 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-500 bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center flex flex-col items-center justify-center h-full">
              <CalendarIcon className="w-10 h-10 mb-3" />
              <h3 className="font-semibold mb-2">Book New Stay</h3>
              <Button size="sm" asChild className="bg-white text-blue-600 hover:bg-blue-50 mt-2">
                <Link href="/">Search Rooms</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Bookings Tabs */}
        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList>
            <TabsTrigger value="upcoming">
              Upcoming Bookings ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past Bookings ({pastBookings.length})
            </TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Bookings</CardTitle>
                <CardDescription>
                  Your confirmed and pending reservations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingBookings.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CalendarIcon className="w-12 h-12 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Upcoming Bookings</h3>
                    <p className="text-gray-500 mb-6">Start planning your next amazing getaway</p>
                    <Button size="lg" asChild className="bg-blue-600 hover:bg-blue-700">
                      <Link href="/">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        Browse & Book Rooms
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingBookings.map((booking) => (
                      <Card key={booking.id} className={highlightBookingId === booking.id ? 'ring-2 ring-blue-500' : ''}>
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-semibold text-lg">{booking.hotel.name}</h4>
                              <p className="text-blue-600 text-sm">{booking.hotel.location} Atoll</p>
                              {booking.booking_rooms[0] && (
                                <p className="text-gray-600 text-sm">
                                  {booking.booking_rooms[0].room.room_type.name} - Room {booking.booking_rooms[0].room.room_number}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              {getStatusBadge(booking.status)}
                              <p className="text-2xl font-bold text-blue-600 mt-2">
                                ${booking.total_price.toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Check-in</p>
                              <p className="font-medium">{format(new Date(booking.check_in), 'MMM dd, yyyy')}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Check-out</p>
                              <p className="font-medium">{format(new Date(booking.check_out), 'MMM dd, yyyy')}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Guests</p>
                              <p className="font-medium">{booking.booking_rooms[0]?.room.room_type.capacity || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Booked</p>
                              <p className="font-medium">{format(new Date(booking.created_at), 'MMM dd, yyyy')}</p>
                            </div>
                          </div>

                          {booking.booking_services.length > 0 && (
                            <div className="mt-4">
                              <p className="text-sm text-gray-500 mb-2">Additional Services:</p>
                              <div className="flex flex-wrap gap-2">
                                {booking.booking_services.map((bs, index) => (
                                  <Badge key={index} variant="outline">
                                    {bs.service.name} ({bs.quantity}x)
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex justify-between items-center mt-4 pt-4 border-t">
                            <p className="text-sm text-gray-500">
                              Free cancellation until 24 hours before check-in
                            </p>
                            {canCancelBooking(booking) && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    Cancel Booking
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Cancel Booking</DialogTitle>
                                    <DialogDescription>
                                      Are you sure you want to cancel this booking? This action cannot be undone.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <Button variant="outline">Keep Booking</Button>
                                    <Button
                                      variant="destructive"
                                      onClick={() => handleCancelBooking(booking.id)}
                                      disabled={cancellingBooking === booking.id}
                                    >
                                      {cancellingBooking === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="past">
            <Card>
              <CardHeader>
                <CardTitle>Past Bookings</CardTitle>
                <CardDescription>
                  Your booking history and completed stays
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pastBookings.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <ClockIcon className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Past Bookings</h3>
                    <p className="text-gray-500">Your booking history will appear here</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hotel</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pastBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{booking.hotel.name}</p>
                              <p className="text-sm text-gray-500">{booking.hotel.location}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{format(new Date(booking.check_in), 'MMM dd')}</p>
                              <p className="text-gray-500">
                                to {format(new Date(booking.check_out), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {booking.booking_rooms[0] ? (
                              <div className="text-sm">
                                <p>{booking.booking_rooms[0].room.room_type.name}</p>
                                <p className="text-gray-500">Room {booking.booking_rooms[0].room.room_number}</p>
                              </div>
                            ) : (
                              'N/A'
                            )}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(booking.status)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${booking.total_price.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Your account details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profile && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Full Name</label>
                        <p className="text-lg">{profile.full_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-lg">{user?.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="text-lg">{profile.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Account Type</label>
                        <Badge className="mt-1">{profile.role}</Badge>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button variant="outline">
                        Edit Profile
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default function GuestDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <GuestDashboardContent />
    </Suspense>
  )
}