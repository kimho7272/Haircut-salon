import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create Supabase client with environment-aware settings
const isDevelopment = process.env.NODE_ENV === 'development'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: !isDevelopment, // Enable session persistence in production
    autoRefreshToken: !isDevelopment, // Enable auto refresh in production
    detectSessionInUrl: false, // Keep disabled for security
  },
})

// Type definitions for our database
export type Customer = {
  id: string
  name: string
  phone?: string
  email?: string
  notes?: string
  created_at: string
  last_visit?: string
}

export type Staff = {
  id: string
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
  staff_id?: string
  service_id: string
  appointment_date: string
  appointment_time: string
  duration: number
  status: 'scheduled' | 'completed' | 'cancelled' | 'auto_completed'
  notes?: string
  created_at: string
  // Payment info
  payment_method?: 'cash' | 'card'
  payment_amount?: number
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

export type AppointmentService = {
  id: string
  appointment_id: string
  service_id: string
  created_at: string
}