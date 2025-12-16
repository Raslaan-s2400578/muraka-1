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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { CreditCard, Search, Eye, Edit, Trash2, Landmark } from 'lucide-react'

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
  const [error, setError] = useState('')
  const [activeView] = useState('payments')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [editForm, setEditForm] = useState({ status: '', payment_method: '' })

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

      if (profile?.role !== 'admin' && profile?.role !== 'staff' && profile?.role !== 'manager') {
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

      // Fetch payments with booking and guest information
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          id,
          booking_id,
          amount,
          status,
          payment_method,
          transaction_id,
          payment_date,
          created_at,
          bookings (
            id,
            guest_id
          )
        `)
        .order('created_at', { ascending: false })

      if (paymentsError) {
        console.error('Payments error:', paymentsError)
        if (paymentsError.code === 'PGRST205') {
          // Table doesn't exist
          setError('Payments table needs to be created. Please run the database migration or create it in Supabase.')
        }
        setPayments([])
        return
      }

      if (!paymentsData || paymentsData.length === 0) {
        setPayments([])
        return
      }

      // Fetch guest data
      const guestIds = [...new Set(paymentsData.map((p: any) => p.bookings?.guest_id).filter(Boolean))]
      const { data: guests } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', guestIds)

      const guestMap = new Map(guests?.map(g => [g.id, g]) || [])

      // Transform payment data
      const transformedPayments: Payment[] = paymentsData.map((payment: any) => {
        const guest = guestMap.get(payment.bookings?.guest_id)
        return {
          id: payment.id.length > 13 ? payment.id.slice(0, 13).toUpperCase() : payment.id.toUpperCase(),
          booking_id: payment.booking_id.length > 8 ? payment.booking_id.slice(0, 8) : payment.booking_id,
          amount: payment.amount,
          status: payment.status,
          payment_method: payment.payment_method,
          transaction_id: payment.transaction_id || 'N/A',
          created_at: payment.payment_date || payment.created_at,
          customer_name: guest?.full_name || 'Unknown',
          customer_email: guest?.email || 'unknown@example.com'
        }
      })

      setPayments(transformedPayments)
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

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      router.push('/')
    }
  }

  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment)
    setViewDialogOpen(true)
  }

  const handleEditPayment = (payment: Payment) => {
    setSelectedPayment(payment)
    setEditForm({
      status: payment.status,
      payment_method: payment.payment_method
    })
    setEditDialogOpen(true)
  }

  const handleDeletePayment = (payment: Payment) => {
    setSelectedPayment(payment)
    setDeleteDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedPayment) return

    try {
      const { error } = await supabase
        .from('payments')
        .update({
          status: editForm.status,
          payment_method: editForm.payment_method,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedPayment.id)

      if (error) throw error

      await loadPayments()
      setEditDialogOpen(false)
      setSelectedPayment(null)
    } catch (err) {
      console.error('Update error:', err)
      alert('Failed to update payment')
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedPayment) return

    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', selectedPayment.id)

      if (error) throw error

      await loadPayments()
      setDeleteDialogOpen(false)
      setSelectedPayment(null)
    } catch (err) {
      console.error('Delete error:', err)
      alert('Failed to delete payment')
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
          if (view === 'dashboard') router.push('/dashboard/staff')
          else if (view === 'bookings') router.push('/dashboard/staff/bookings')
          else if (view === 'hotels') router.push('/dashboard/staff/hotels')
          else if (view === 'customers') router.push('/dashboard/staff/customers')
          else if (view === 'payments') router.push('/dashboard/staff/payments')
          else if (view === 'reports') router.push('/dashboard/staff/reports')
        }}
        user={{ name: profile?.full_name || '', role: profile?.role || 'Staff' }}
        onLogout={handleSignOut}
      />

      {/* Main Content */}
      <div className="ml-64">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Management</h1>
            <p className="text-gray-600">Track and manage all payment transactions</p>
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
                            <button
                              onClick={() => handleViewPayment(payment)}
                              className="p-1 text-gray-600 hover:text-blue-600"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditPayment(payment)}
                              className="p-1 text-gray-600 hover:text-purple-600"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePayment(payment)}
                              className="p-1 text-gray-600 hover:text-red-600"
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

      {/* View Payment Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>View complete payment information</DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-gray-500">Payment ID</Label>
                <p className="font-medium">{selectedPayment.id}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Transaction ID</Label>
                <p className="font-mono text-sm">{selectedPayment.transaction_id}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Customer</Label>
                <p className="font-medium">{selectedPayment.customer_name}</p>
                <p className="text-sm text-gray-500">{selectedPayment.customer_email}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Booking ID</Label>
                <p className="font-mono">#{selectedPayment.booking_id}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Amount</Label>
                <p className="font-bold text-lg">${selectedPayment.amount.toLocaleString()} USD</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Payment Method</Label>
                <p className="capitalize">{selectedPayment.payment_method.replace('_', ' ')}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Status</Label>
                <Badge
                  className={
                    selectedPayment.status === 'completed'
                      ? 'bg-green-100 text-green-700 border-0'
                      : selectedPayment.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700 border-0'
                      : 'bg-red-100 text-red-700 border-0'
                  }
                >
                  {selectedPayment.status}
                </Badge>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Date</Label>
                <p>{new Date(selectedPayment.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Payment Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
            <DialogDescription>Update payment status or method</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select value={editForm.payment_method} onValueChange={(value) => setEditForm({ ...editForm, payment_method: value })}>
                <SelectTrigger id="payment_method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="debit_card">Debit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="bg-purple-600 hover:bg-purple-700">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Payment Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Payment</DialogTitle>
            <DialogDescription>Are you sure you want to delete this payment record?</DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Payment ID: {selectedPayment.id}</p>
              <p className="text-sm text-gray-600">Amount: ${selectedPayment.amount.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Customer: {selectedPayment.customer_name}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}