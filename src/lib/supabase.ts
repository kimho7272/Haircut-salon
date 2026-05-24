import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create Supabase client with optimized settings
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Disable session persistence in development
    autoRefreshToken: false, // Disable auto refresh in development
    detectSessionInUrl: false, // Disable URL session detection
  },
})

// Type definitions for our database
export type Customer = {
  id: string
  name: string
  phone: string
  email?: string
  notes?: string
  created_at: string
  last_visit?: string
}

export type Staff = {
  id: string
  username: string
  name: string
  role: 'admin' | 'staff'
  active: boolean
  created_at: string
}

export type Service = {
  id: string
  name: string
  price: number
  duration: number // in minutes
  description?: string
  active: boolean
}

export type Appointment = {
  id: string
  customer_id: string
  staff_id: string
  service_id: string
  appointment_date: string
  appointment_time: string
  duration: number
  status: 'scheduled' | 'completed' | 'cancelled'
  notes?: string
  created_at: string
  // Relations
  customer?: Customer
  staff?: Staff
  service?: Service
}

export type Payment = {
  id: string
  appointment_id: string
  amount: number
  payment_method: 'cash' | 'card'
  payment_date: string
  staff_id: string
}