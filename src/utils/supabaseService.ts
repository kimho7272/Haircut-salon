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

// 고객의 최근 방문 기록 조회
export const getCustomerHistory = async (customerId: string): Promise<AppointmentWithRelations[]> => {
  console.log('방문 기록 조회 중:', customerId) // 디버깅

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      customer:customers(id, name, phone, email),
      staff:staff(id, name, username, role),
      service:services(id, name, price, duration, description)
    `)
    .eq('customer_id', customerId)
    // 일단 모든 상태의 예약을 조회 (완료된 것만이 아니라)
    .order('appointment_date', { ascending: false })
    .order('appointment_time', { ascending: false })
    .limit(3)

  console.log('방문 기록 조회 결과:', { data, error }) // 디버깅

  if (error) {
    console.error('고객 방문 기록 조회 실패:', error)
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
    // 중복 제약조건 위반은 정상적인 비즈니스 로직이므로 에러 로그 출력하지 않음
    const isDuplicateConstraint = error.message && (
      error.message.includes('duplicate key value violates unique constraint "unique_name_phone_with_number"') ||
      error.message.includes('duplicate key value violates unique constraint "unique_name_no_phone"')
    )

    if (!isDuplicateConstraint) {
      console.error('고객 저장 실패:', error)
      console.error('에러 세부 정보:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
    }

    throw error
  }

  return data
}

// 고객 정보 업데이트
export const updateCustomer = async (
  id: string,
  updates: Partial<Omit<Customer, 'id' | 'created_at'>>
): Promise<Customer> => {
  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('고객 정보 업데이트 실패:', error)
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