import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 앱 전체에서 쓰는 단 하나의 Supabase 클라이언트.
// 과거에는 supabase-auth.ts가 별도의 createClient()를 만들어 로그인을 처리했는데,
// 서로 세션을 공유하지 않아서 실제 데이터 요청(이 클라이언트)은 로그인 여부와
// 무관하게 항상 익명(anon) 권한으로 나갔음 — RLS를 auth.uid() 기반으로 걸려면
// 로그인과 데이터 요청이 반드시 같은 클라이언트여야 해서 하나로 합쳤음.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Keep disabled for security
    storageKey: 'haircut-auth',
    storage: {
      getItem: (key: string) => {
        if (typeof window !== 'undefined') {
          return sessionStorage.getItem(key)
        }
        return null
      },
      setItem: (key: string, value: string) => {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(key, value)
        }
      },
      removeItem: (key: string) => {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(key)
        }
      }
    }
  },
})

// Type definitions for our database

// Tenant (미용실) — multi-tenant 전환용
export type Salon = {
  id: string
  name: string
  slug: string
  plan: 'free' | 'paid'
  status: 'trial' | 'active' | 'suspended'
  owner_user_id?: string
  created_at: string
  updated_at: string
}

export type Customer = {
  id: string
  salon_id: string
  name: string
  phone?: string
  email?: string
  notes?: string
  created_at: string
  last_visit?: string
}

export type Staff = {
  id: string
  salon_id: string
  name: string
  role: 'admin' | 'staff'
  active: boolean
  created_at: string
}

export type Service = {
  id: string
  salon_id: string
  name: string
  price: number
  duration: number // in minutes
  description?: string
  active: boolean
}

export type Appointment = {
  id: string
  salon_id: string
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
  // 고객 셀프 예약 관련
  booking_source?: 'staff' | 'online'
  reminder_sent_at?: string | null
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