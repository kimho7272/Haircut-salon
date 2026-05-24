// 로컬 스토리지를 사용한 임시 데이터 관리

export interface LocalAppointment {
  id: string
  customer_name: string
  customer_phone: string
  staff_id: string
  staff_name: string
  service_id: string
  service_name: string
  service_price: number
  service_duration: number
  appointment_date: string
  appointment_time: string
  notes?: string
  status: 'scheduled' | 'completed' | 'cancelled'
  created_at: string
}

const STORAGE_KEY = 'haircut_appointments'

// 모든 예약 조회
export const getAppointments = (): LocalAppointment[] => {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

// 예약 저장
export const saveAppointment = (appointment: Omit<LocalAppointment, 'id' | 'created_at'>): LocalAppointment => {
  const newAppointment: LocalAppointment = {
    ...appointment,
    id: Date.now().toString(),
    created_at: new Date().toISOString(),
  }

  const appointments = getAppointments()
  appointments.push(newAppointment)

  localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments))
  return newAppointment
}

// 예약 업데이트
export const updateAppointment = (id: string, updates: Partial<LocalAppointment>): LocalAppointment | null => {
  const appointments = getAppointments()
  const index = appointments.findIndex(apt => apt.id === id)

  if (index === -1) return null

  appointments[index] = { ...appointments[index], ...updates }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments))

  return appointments[index]
}

// 예약 삭제
export const deleteAppointment = (id: string): boolean => {
  const appointments = getAppointments()
  const filteredAppointments = appointments.filter(apt => apt.id !== id)

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredAppointments))
  return filteredAppointments.length < appointments.length
}

// 날짜별 예약 조회
export const getAppointmentsByDateRange = (startDate: string, endDate: string): LocalAppointment[] => {
  const appointments = getAppointments()
  return appointments.filter(apt =>
    apt.appointment_date >= startDate && apt.appointment_date <= endDate
  )
}