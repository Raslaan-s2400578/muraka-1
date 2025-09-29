export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      hotels: {
        Row: {
          id: string
          name: string
          location: string
          address: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          location: string
          address: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          location?: string
          address?: string
          created_at?: string
        }
      }
      room_types: {
        Row: {
          id: string
          hotel_id: string
          name: string
          capacity: number
          price_off_peak: number
          price_peak: number
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          hotel_id: string
          name: string
          capacity: number
          price_off_peak: number
          price_peak: number
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          hotel_id?: string
          name?: string
          capacity?: number
          price_off_peak?: number
          price_peak?: number
          description?: string
          created_at?: string
        }
      }
      rooms: {
        Row: {
          id: string
          hotel_id: string
          room_type_id: string
          room_number: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          hotel_id: string
          room_type_id: string
          room_number: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          hotel_id?: string
          room_type_id?: string
          room_number?: string
          status?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          role: string
          full_name: string
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: string
          full_name: string
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: string
          full_name?: string
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          guest_id: string
          hotel_id: string
          check_in: string
          check_out: string
          total_price: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          guest_id: string
          hotel_id: string
          check_in: string
          check_out: string
          total_price: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          guest_id?: string
          hotel_id?: string
          check_in?: string
          check_out?: string
          total_price?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      booking_rooms: {
        Row: {
          id: string
          booking_id: string
          room_id: string
          price_per_night: number
        }
        Insert: {
          id?: string
          booking_id: string
          room_id: string
          price_per_night: number
        }
        Update: {
          id?: string
          booking_id?: string
          room_id?: string
          price_per_night?: number
        }
      }
      services: {
        Row: {
          id: string
          name: string
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          price?: number
          created_at?: string
        }
      }
      booking_services: {
        Row: {
          id: string
          booking_id: string
          service_id: string
          quantity: number
        }
        Insert: {
          id?: string
          booking_id: string
          service_id: string
          quantity: number
        }
        Update: {
          id?: string
          booking_id?: string
          service_id?: string
          quantity?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}