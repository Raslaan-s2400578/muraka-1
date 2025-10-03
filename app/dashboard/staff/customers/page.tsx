'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SearchIcon, UsersIcon } from 'lucide-react'
import { useCustomers } from '@/hooks/useCustomers'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'

export default function StaffCustomersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  // Fetch current user profile
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return null
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'staff' && profile?.role !== 'manager' && profile?.role !== 'admin') {
        router.push('/dashboard/guest')
        return null
      }

      return profile
    },
    staleTime: 5 * 60 * 1000,
  })

  // Fetch customers
  const { data: customersData, isLoading, error } = useCustomers({
    page,
    pageSize: 20,
    searchTerm,
  })

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      router.push('/')
    }
  }

  if (isLoading || !profile) {
    return null // Loading handled by loading.tsx
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF]">
      <Sidebar
        activeView="customers"
        setActiveView={(view) => {
          if (view === 'dashboard') {
            router.push('/dashboard/staff')
          } else {
            router.push(`/dashboard/staff/${view}`)
          }
        }}
        user={{ name: profile.full_name || '', role: 'Staff' }}
        onLogout={handleSignOut}
      />

      <div className="ml-64">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Customers Management</h1>
            <p className="text-gray-600">View and manage guest information</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>Failed to load customers. Please try again.</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>All Customers</CardTitle>
              <CardDescription>
                Guest list with booking history ({customersData?.total || 0} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Customers Table */}
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="font-semibold text-gray-700">Customer</TableHead>
                    <TableHead className="font-semibold text-gray-700">Contact</TableHead>
                    <TableHead className="font-semibold text-gray-700">Total Bookings</TableHead>
                    <TableHead className="font-semibold text-gray-700">Member Since</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customersData?.customers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p>No customers found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    customersData?.customers.map((customer) => (
                      <TableRow key={customer.id} className="border-b border-gray-100">
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{customer.full_name}</p>
                            <p className="text-sm text-gray-500">ID: {customer.id.slice(0, 8)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm text-gray-900">{customer.email}</p>
                            <p className="text-sm text-gray-500">{customer.phone || 'No phone'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {customer._count?.bookings || 0} {customer._count?.bookings === 1 ? 'booking' : 'bookings'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {format(new Date(customer.created_at), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Active
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {customersData && customersData.total > customersData.pageSize && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-gray-600">
                    Showing {page * customersData.pageSize + 1} to {Math.min((page + 1) * customersData.pageSize, customersData.total)} of {customersData.total} customers
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage(p => p + 1)}
                      disabled={(page + 1) * customersData.pageSize >= customersData.total}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
