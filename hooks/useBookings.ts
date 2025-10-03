import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface Booking {
  id: string
  check_in: string
  check_out: string
  total_price: number
  status: string
  created_at: string
  guest_id: string
  hotel_id: string
  guest: {
    full_name: string
    phone: string | null
    email: string | null
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

interface UseBookingsOptions {
  page?: number
  pageSize?: number
  status?: string
  searchTerm?: string
  dateFilter?: 'today' | 'all'
}

export function useBookings(options: UseBookingsOptions = {}) {
  const { page = 0, pageSize = 20, status, searchTerm, dateFilter = 'all' } = options
  const supabase = createClient()

  return useQuery({
    queryKey: ['bookings', page, pageSize, status, searchTerm, dateFilter],
    queryFn: async () => {
      const start = page * pageSize
      const end = start + pageSize - 1

      let query = supabase
        .from('bookings')
        .select(`
          id,
          check_in,
          check_out,
          total_price,
          status,
          created_at,
          guest_id,
          hotel_id,
          booking_rooms(
            room:rooms(
              id,
              room_number,
              room_type:room_types(name)
            )
          )
        `, { count: 'exact' })

      // Date filter
      if (dateFilter === 'today') {
        const today = new Date().toISOString().split('T')[0]
        query = query.or(`check_in.eq.${today},check_out.eq.${today}`)
      }

      // Status filter
      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      // Search filter (will be applied client-side after fetching guest/hotel data)
      query = query
        .range(start, end)
        .order('created_at', { ascending: false })

      const { data: bookingsData, error: bookingsError, count } = await query

      if (bookingsError) throw bookingsError

      // Fetch guest and hotel data separately (avoiding RLS circular dependencies)
      if (bookingsData && bookingsData.length > 0) {
        const guestIds = [...new Set(bookingsData.map(b => b.guest_id))]
        const hotelIds = [...new Set(bookingsData.map(b => b.hotel_id))]

        const [{ data: guests }, { data: hotels }] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, full_name, phone, email')
            .in('id', guestIds),
          supabase
            .from('hotels')
            .select('id, name, location')
            .in('id', hotelIds)
        ])

        const guestMap = new Map(guests?.map(g => [g.id, g]) || [])
        const hotelMap = new Map(hotels?.map(h => [h.id, h]) || [])

        const bookingsWithDetails = bookingsData.map(booking => ({
          ...booking,
          guest: guestMap.get(booking.guest_id) || { full_name: 'Unknown Guest', phone: null, email: null },
          hotel: hotelMap.get(booking.hotel_id) || { id: booking.hotel_id, name: 'Unknown Hotel', location: 'Unknown' },
          booking_rooms: booking.booking_rooms.map(br => ({
            room: Array.isArray(br.room) && br.room.length > 0 ? {
              id: br.room[0].id || '',
              room_number: br.room[0].room_number || '',
              room_type: Array.isArray(br.room[0].room_type) && br.room[0].room_type.length > 0
                ? { name: br.room[0].room_type[0].name || '' }
                : { name: 'Unknown' }
            } : {
              id: '',
              room_number: 'N/A',
              room_type: { name: 'Unknown' }
            }
          }))
        }))

        // Apply search filter client-side
        let filteredBookings = bookingsWithDetails
        if (searchTerm) {
          const term = searchTerm.toLowerCase()
          filteredBookings = bookingsWithDetails.filter(b =>
            b.guest.full_name.toLowerCase().includes(term) ||
            b.id.toLowerCase().includes(term) ||
            b.hotel.name.toLowerCase().includes(term)
          )
        }

        return {
          bookings: filteredBookings as Booking[],
          total: count || 0,
          page,
          pageSize
        }
      }

      return {
        bookings: [] as Booking[],
        total: 0,
        page,
        pageSize
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalidate all booking queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
}
