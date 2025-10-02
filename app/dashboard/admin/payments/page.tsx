'use client'

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
import { CreditCard, Clock, CheckCircle, XCircle, Download, Search, Eye, Edit, Trash2, Landmark } from 'lucide-react'

interface Payment {
  id: string
  booking_id: string
  amount: number
  status: string
  payment_method: string
  transaction_id: string
  created_at: string
  customer_name: string
  customer_email: string
}

interface Profile {
  id: string
  full_name: string
  phone: string | null
  role: string
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeView] = useState('payments')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

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

      if (profile?.role !== 'admin') {
        router.push('/dashboard/guest')
        return
      }

      setProfile(profile)
      await loadPayments()
    } catch (err) {
      console.error('Auth error:', err)
      router.push('/login')
    }
  }

  const loadPayments = async () => {
    try {
      setLoading(true)

      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          total_price,
          status,
          created_at,
          guest_id
        `)
        .order('created_at', { ascending: false })

      if (bookingsError) {
        console.error('Bookings error:', bookingsError)
        setPayments([])
      } else if (bookingsData) {
        // Fetch guest data
        const guestIds = [...new Set(bookingsData.map(b => b.guest_id))]
        const { data: guests } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', guestIds)

        const guestMap = new Map(guests?.map(g => [g.id, g]) || [])

        // Mock payment data from bookings
        const mockPayments: Payment[] = bookingsData.map((booking: any, index: number) => {
          const guest = guestMap.get(booking.guest_id)
          return {
            id: `PAY-${booking.id.slice(0, 8)}`,
            booking_id: booking.id.slice(0, 8),
            amount: booking.total_price,
            status: ['completed', 'pending', 'failed'][index % 3],
            payment_method: ['credit_card', 'bank_transfer'][index % 2],
            transaction_id: `TXN-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
            created_at: booking.created_at,
            customer_name: guest?.full_name || 'Unknown',
            customer_email: guest?.email || `unknown@example.com`
          }
        })
        setPayments(mockPayments)
      }
    } catch (err) {
      console.error('Loading error:', err)
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

  const filteredPayments = payments.filter(payment => {
    const matchesSearch =
      payment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.transaction_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.customer_name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const totalRevenue = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0)
  const pendingPayments = payments.filter(p => p.status === 'pending').length
  const failedPayments = payments.filter(p => p.status === 'failed').length
  const successRate = payments.length > 0 ? Math.round((payments.filter(p => p.status === 'completed').length / payments.length) * 100) : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Loading payments...</p>
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Management</h1>
              <p className="text-gray-600">Track and manage all payment transactions</p>
            </div>
            <Button className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <CreditCard className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  ${totalRevenue.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-900 mb-2">{pendingPayments}</p>
                <p className="text-xs text-red-600 font-medium">
                  -3.2% from last month
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{successRate}%</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-red-50 rounded-lg">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Failed Payments</p>
                <p className="text-2xl font-bold text-gray-900 mb-2">{failedPayments}</p>
                <p className="text-xs text-red-600 font-medium">
                  -8.3% from last month
                </p>
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
                    placeholder="Search by payment ID, transaction ID, or customer..."
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
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Payments Table */}
          <Card className="bg-white shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="font-semibold text-gray-700">Payment ID</TableHead>
                    <TableHead className="font-semibold text-gray-700">Customer</TableHead>
                    <TableHead className="font-semibold text-gray-700">Booking</TableHead>
                    <TableHead className="font-semibold text-gray-700">Amount</TableHead>
                    <TableHead className="font-semibold text-gray-700">Method</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700">Date</TableHead>
                    <TableHead className="font-semibold text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        No payments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id} className="border-b border-gray-100">
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{payment.id}</p>
                            <p className="text-xs text-gray-500 font-mono">{payment.transaction_id}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{payment.customer_name}</p>
                            <p className="text-sm text-gray-500">{payment.customer_email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-gray-900">
                          #{payment.booking_id}
                        </TableCell>
                        <TableCell className="font-semibold text-gray-900">
                          ${payment.amount.toLocaleString()} USD
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {payment.payment_method === 'credit_card' ? (
                              <>
                                <CreditCard className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-700">Credit Card</span>
                              </>
                            ) : (
                              <>
                                <Landmark className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-700">Bank Transfer</span>
                              </>
                            )}
                          </div>
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
                        <TableCell className="text-sm text-gray-600">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <button className="p-1 text-gray-600 hover:text-blue-600">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-gray-600 hover:text-purple-600">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-gray-600 hover:text-red-600">
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