'use client'

import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'

export default function StaffPaymentsPage() {
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

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      router.push('/')
    }
  }

  if (!profile) {
    return null // Loading handled by loading.tsx
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF]">
      <Sidebar
        activeView="payments"
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payments Management</h1>
            <p className="text-gray-600">Track and manage payment transactions</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Payment Processing</CardTitle>
              <CardDescription>
                Payment management functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-16">
                <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment System</h3>
                <p className="text-gray-500 mb-4">
                  Payment tracking and management features will be available here.
                </p>
                <p className="text-sm text-gray-400">
                  This feature is currently under development.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
