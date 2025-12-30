import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface Room {
  id: string
  room_number: string
  status: string
  room_type: {
    name: string
    capacity: number
  }
  hotel: {
    id: string
    name: string
    location: string
  }
}

interface UseRoomsOptions {
  page?: number
  pageSize?: number
  status?: string
  searchTerm?: string
  hotelId?: string
}

export function useRooms(options: UseRoomsOptions = {}) {
  const { page = 0, pageSize = 50, status, searchTerm, hotelId } = options
  const supabase = createClient()

  return useQuery({
    queryKey: ['rooms', page, pageSize, status, searchTerm, hotelId],
    queryFn: async () => {
      const start = page * pageSize
      const end = start + pageSize - 1

      let query = supabase
        .from('rooms')
        .select(`
          id,
          room_number,
          status,
          room_type:room_types(
            name,
            capacity
          ),
          hotel:hotels(
            id,
            name,
            location
          )
        `, { count: 'exact' })

      // Hotel filter
      if (hotelId) {
        query = query.eq('hotel_id', hotelId)
      }

      // Status filter
      if (status) {
        query = query.eq('status', status)
      }

      // Server-side search filter - much faster than client-side
      if (searchTerm) {
        query = query.or(`room_number.ilike.%${searchTerm}%`)
      }

      query = query
        .range(start, end)
        .order('room_number')

      const { data, error, count } = await query

      if (error) throw error

      // Transform data to match interface
      const transformedData = (data || []).map(room => ({
        id: room.id,
        room_number: room.room_number,
        status: room.status,
        room_type: Array.isArray(room.room_type) && room.room_type.length > 0
          ? { name: room.room_type[0].name, capacity: room.room_type[0].capacity }
          : { name: 'Unknown', capacity: 0 },
        hotel: Array.isArray(room.hotel) && room.hotel.length > 0
          ? { id: room.hotel[0].id, name: room.hotel[0].name, location: room.hotel[0].location }
          : { id: '', name: 'Unknown', location: 'Unknown' }
      }))

      return {
        rooms: transformedData as Room[],
        total: count || 0,
        page,
        pageSize
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes cache
  })
}

export function useUpdateRoomStatus() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ roomId, status }: { roomId: string; status: string }) => {
      const { data, error } = await supabase
        .from('rooms')
        .update({ status })
        .eq('id', roomId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalidate all room queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}
