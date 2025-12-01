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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CalendarIcon, MapPinIcon, UsersIcon, CreditCardIcon, CheckCircle2Icon, ClockIcon, XCircleIcon, Download, Star, Edit2 } from 'lucide-react'
import { format } from 'date-fns'

interface Payment {
  id: string
  booking_id: string
  amount: number
  status: string
  payment_method: string
  transaction_id: string
  payment_date: string
  booking: {
    hotel: {
      name: string
    }
  }
}

interface Booking {
  id: string
  check_in: string
  check_out: string
  total_price: number
  status: string
  created_at: string
  hotel_id: string
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

interface Review {
  id: string
  booking_id: string
  rating: number
  title: string
  comment: string
  created_at: string
}

function GuestDashboardContent() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancellingBooking, setCancellingBooking] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '' })
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<Booking | null>(null)
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' })
  const [existingReviews, setExistingReviews] = useState<Map<string, Review>>(new Map())

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
      setProfileForm({
        full_name: profileData.full_name || '',
        phone: profileData.phone || ''
      })

      // Load user bookings with hotel data
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          hotel:hotels(
            id,
            name,
            location,
            address
          ),
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

      // Set bookings with hotel data already included from the query
      setBookings(bookingsData || [])

      // Load payment history
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          booking:bookings(
            hotel:hotels(name)
          )
        `)
        .in('booking_id', bookingsData?.map(b => b.id) || [])
        .order('payment_date', { ascending: false })

      if (!paymentsError && paymentsData) {
        setPayments(paymentsData.map((p: any) => ({
          ...p,
          booking: {
            hotel: {
              name: p.booking?.hotel?.name || 'Unknown Hotel'
            }
          }
        })))
      }

      // Load existing reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .eq('guest_id', userId)

      if (reviewsData) {
        const reviewsMap = new Map(reviewsData.map(r => [r.booking_id, r]))
        setExistingReviews(reviewsMap)
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

  const handleUpdateProfile = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileForm.full_name,
          phone: profileForm.phone
        })
        .eq('id', user.id)

      if (error) throw error

      await loadUserData(user.id)
      setEditingProfile(false)
    } catch (err) {
      console.error('Profile update error:', err)
      setError('Failed to update profile')
    }
  }

  const handleSubmitReview = async () => {
    if (!selectedBookingForReview || !user) return

    try {
      const reviewData = {
        booking_id: selectedBookingForReview.id,
        guest_id: user.id,
        hotel_id: selectedBookingForReview.hotel_id,
        rating: reviewForm.rating,
        title: reviewForm.title,
        comment: reviewForm.comment
      }

      const existingReview = existingReviews.get(selectedBookingForReview.id)

      if (existingReview) {
        // Update existing review
        const { error } = await supabase
          .from('reviews')
          .update(reviewData)
          .eq('id', existingReview.id)

        if (error) throw error
      } else {
        // Create new review
        const { error } = await supabase
          .from('reviews')
          .insert([reviewData])

        if (error) throw error
      }

      // Refresh data
      if (user) {
        await loadUserData(user.id)
      }

      setReviewDialogOpen(false)
      setSelectedBookingForReview(null)
      setReviewForm({ rating: 5, title: '', comment: '' })
    } catch (err) {
      console.error('Review submission error:', err)
      setError('Failed to submit review')
    }
  }

  const openReviewDialog = (booking: Booking) => {
    setSelectedBookingForReview(booking)
    const existingReview = existingReviews.get(booking.id)
    if (existingReview) {
      setReviewForm({
        rating: existingReview.rating,
        title: existingReview.title,
        comment: existingReview.comment
      })
    } else {
      setReviewForm({ rating: 5, title: '', comment: '' })
    }
    setReviewDialogOpen(true)
  }

  const downloadReceipt = (payment: Payment) => {
    const receiptContent = `
MURAKA HOTELS - PAYMENT RECEIPT
================================

Payment ID: ${payment.id}
Transaction ID: ${payment.transaction_id}
Date: ${new Date(payment.payment_date).toLocaleDateString()}

Hotel: ${payment.booking.hotel.name}
Amount: $${payment.amount.toLocaleString()}
Payment Method: ${payment.payment_method.replace('_', ' ')}
Status: ${payment.status}

Thank you for your business!
================================
    `.trim()

    const blob = new Blob([receiptContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `receipt-${payment.id}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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

  // Calculate stats excluding cancelled bookings
  const activeBookings = bookings.filter(b => b.status !== 'cancelled')
  const totalSpent = activeBookings.reduce((sum, b) => sum + b.total_price, 0)

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
              <Link href="/">
                <h1 className="text-2xl font-bold text-blue-600 cursor-pointer hover:text-blue-700 transition-colors">
                  Muraka Hotels
                </h1>
              </Link>
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
                  <p className="text-3xl font-bold text-gray-900 mt-1">{activeBookings.length}</p>
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
                    ${totalSpent.toLocaleString()}
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
            <TabsTrigger value="payments">Payment History</TabsTrigger>
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
                                    <DialogClose asChild>
                                      <Button variant="outline">Keep Booking</Button>
                                    </DialogClose>
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
                        <TableHead className="text-right">Review</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pastBookings.map((booking) => {
                        const hasReview = existingReviews.has(booking.id)
                        const canReview = booking.status === 'checked_out'

                        return (
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
                            <TableCell className="text-right">
                              {canReview && (
                                <Button
                                  size="sm"
                                  variant={hasReview ? "outline" : "default"}
                                  onClick={() => openReviewDialog(booking)}
                                >
                                  <Star className="w-3 h-3 mr-1" />
                                  {hasReview ? 'Edit Review' : 'Write Review'}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>
                  View and download receipts for all your payments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CreditCardIcon className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Payment History</h3>
                    <p className="text-gray-500">Your payment records will appear here</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Hotel</TableHead>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">
                            {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>{payment.booking.hotel.name}</TableCell>
                          <TableCell className="font-mono text-sm">{payment.transaction_id}</TableCell>
                          <TableCell className="capitalize">
                            {payment.payment_method.replace('_', ' ')}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                payment.status === 'completed'
                                  ? 'bg-green-100 text-green-700 border-0'
                                  : payment.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700 border-0'
                                  : 'bg-red-100 text-red-700 border-0'
                              }
                            >
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            ${payment.amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadReceipt(payment)}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Receipt
                            </Button>
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
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Your account details and preferences
                    </CardDescription>
                  </div>
                  {!editingProfile && (
                    <Button variant="outline" onClick={() => setEditingProfile(true)}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {profile && (
                  <div className="space-y-4">
                    {editingProfile ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Full Name</label>
                            <input
                              type="text"
                              value={profileForm.full_name}
                              onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Email</label>
                            <p className="text-lg text-gray-500">{user?.email}</p>
                            <p className="text-xs text-gray-400">Email cannot be changed</p>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Phone</label>
                            <input
                              type="tel"
                              value={profileForm.phone}
                              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="+123 456 7890"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Account Type</label>
                            <Badge className="mt-2">{profile.role}</Badge>
                          </div>
                        </div>

                        <div className="pt-4 flex gap-2">
                          <Button onClick={handleUpdateProfile} className="bg-blue-600 hover:bg-blue-700">
                            Save Changes
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditingProfile(false)
                              setProfileForm({
                                full_name: profile.full_name || '',
                                phone: profile.phone || ''
                              })
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </>
                    ) : (
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
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {existingReviews.has(selectedBookingForReview?.id || '') ? 'Edit Your Review' : 'Write a Review'}
            </DialogTitle>
            <DialogDescription>
              Share your experience at {selectedBookingForReview?.hotel.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Star Rating */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= reviewForm.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Title (Optional)</label>
              <input
                type="text"
                value={reviewForm.title}
                onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Summarize your experience"
              />
            </div>

            {/* Comment */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Your Review</label>
              <textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Tell us about your stay..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitReview} className="bg-blue-600 hover:bg-blue-700">
              {existingReviews.has(selectedBookingForReview?.id || '') ? 'Update Review' : 'Submit Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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