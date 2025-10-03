import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface Customer {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: string
  created_at: string
  _count?: {
    bookings: number
  }
}

interface UseCustomersOptions {
  page?: number
  pageSize?: number
  searchTerm?: string
}

export function useCustomers(options: UseCustomersOptions = {}) {
  const { page = 0, pageSize = 20, searchTerm } = options
  const supabase = createClient()

  return useQuery({
    queryKey: ['customers', page, pageSize, searchTerm],
    queryFn: async () => {
      const start = page * pageSize
      const end = start + pageSize - 1

      let query = supabase
        .from('profiles')
        .select('id, full_name, email, phone, role, created_at', { count: 'exact' })
        .eq('role', 'guest')

      // Search filter
      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
      }

      query = query
        .range(start, end)
        .order('created_at', { ascending: false })

      const { data: customers, error, count } = await query

      if (error) throw error

      // Get booking counts for each customer
      if (customers && customers.length > 0) {
        const customerIds = customers.map(c => c.id)

        const { data: bookingCounts } = await supabase
          .from('bookings')
          .select('guest_id')
          .in('guest_id', customerIds)

        const countsMap = new Map<string, number>()
        bookingCounts?.forEach(booking => {
          countsMap.set(booking.guest_id, (countsMap.get(booking.guest_id) || 0) + 1)
        })

        return {
          customers: (customers || []).map(customer => ({
            ...customer,
            _count: {
              bookings: countsMap.get(customer.id) || 0
            }
          })) as Customer[],
          total: count || 0,
          page,
          pageSize
        }
      }

      return {
        customers: [] as Customer[],
        total: 0,
        page,
        pageSize
      }
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
  })
}
