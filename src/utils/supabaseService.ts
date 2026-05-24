import { supabase, type Appointment, type Customer, type Staff, type Service } from '@/lib/supabase'

// Extended appointment type with relation data
export type AppointmentWithRelations = Appointment & {
  customer: Customer
  staff: Staff
  service: Service
}

// 모든 예약 조회
export const getAppointments = async (): Promise<AppointmentWithRelations[]> => {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      customer:customers(id, name, phone, email),
      staff:staff(id, name, username, role),
      service:services(id, name, price, duration, description)
    `)
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true })

  if (error) {
    console.error('예약 조회 실패:', error)
    throw error
  }

  return data || []
}

// 날짜별 예약 조회
export const getAppointmentsByDateRange = async (
  startDate: string,
  endDate: string
): Promise<AppointmentWithRelations[]> => {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      customer:customers(id, name, phone, email),
      staff:staff(id, name, username, role),
      service:services(id, name, price, duration, description)
    `)
    .gte('appointment_date', startDate)
    .lte('appointment_date', endDate)
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true })

  if (error) {
    console.error('날짜별 예약 조회 실패:', error)
    throw error
  }

  return data || []
}

// 예약 저장
export const saveAppointment = async (
  appointmentData: Omit<Appointment, 'id' | 'created_at'>
): Promise<AppointmentWithRelations> => {
  const { data, error } = await supabase
    .from('appointments')
    .insert([appointmentData])
    .select(`
      *,
      customer:customers(id, name, phone, email),
      staff:staff(id, name, username, role),
      service:services(id, name, price, duration, description)
    `)
    .single()

  if (error) {
    console.error('예약 저장 실패:', error)
    throw error
  }

  return data
}

// 예약 업데이트
export const updateAppointment = async (
  id: string,
  updates: Partial<Appointment>
): Promise<AppointmentWithRelations | null> => {
  const { data, error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      customer:customers(id, name, phone, email),
      staff:staff(id, name, username, role),
      service:services(id, name, price, duration, description)
    `)
    .single()

  if (error) {
    console.error('예약 업데이트 실패:', error)
    throw error
  }

  return data
}

// 예약 삭제
export const deleteAppointment = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('예약 삭제 실패:', error)
    throw error
  }

  return true
}

// 고객 조회
export const getCustomers = async (): Promise<Customer[]> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('고객 조회 실패:', error)
    throw error
  }

  return data || []
}

// 고객 저장
export const saveCustomer = async (
  customerData: Omit<Customer, 'id' | 'created_at'>
): Promise<Customer> => {
  const { data, error } = await supabase
    .from('customers')
    .insert([customerData])
    .select()
    .single()

  if (error) {
    console.error('고객 저장 실패:', error)
    throw error
  }

  return data
}

// 직원 조회
export const getStaff = async (): Promise<Staff[]> => {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('직원 조회 실패:', error)
    throw error
  }

  return data || []
}

// 서비스 조회
export const getServices = async (): Promise<Service[]> => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('서비스 조회 실패:', error)
    throw error
  }

  return data || []
}