import { supabaseAdmin } from '@/lib/supabase-admin'

// 영업시간: 09:00 ~ 19:00, 30분 단위. 당일 예약은 최소 60분 전까지만 허용.
export const BUSINESS_START_MINUTES = 9 * 60
export const BUSINESS_END_MINUTES = 19 * 60
export const SLOT_STEP_MINUTES = 30
export const MIN_LEAD_MINUTES = 60
const KST_OFFSET_MINUTES = 9 * 60

export const minutesToTime = (minutes: number) =>
  `${Math.floor(minutes / 60).toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`

export const timeToMinutes = (time: string) => {
  const [h, m] = time.slice(0, 5).split(':').map(Number)
  return h * 60 + m
}

// 서버가 UTC로 돌아가므로 한국 시간 기준 "지금"과 "오늘"을 직접 계산
const nowInKst = () => {
  const now = new Date()
  return new Date(now.getTime() + (KST_OFFSET_MINUTES + now.getTimezoneOffset()) * 60000)
}

export const todayKstDateString = () => {
  const kst = nowInKst()
  return `${kst.getFullYear()}-${(kst.getMonth() + 1).toString().padStart(2, '0')}-${kst.getDate().toString().padStart(2, '0')}`
}

const nowKstMinutes = () => {
  const kst = nowInKst()
  return kst.getHours() * 60 + kst.getMinutes()
}

export const getAvailableSlots = async (params: {
  salonId: string
  date: string
  staffId?: string | null
  duration: number
}): Promise<string[]> => {
  const { salonId, date, staffId, duration } = params

  if (duration <= 0 || duration > BUSINESS_END_MINUTES - BUSINESS_START_MINUTES) return []

  let query = supabaseAdmin
    .from('appointments')
    .select('appointment_time, duration, staff_id')
    .eq('salon_id', salonId)
    .eq('appointment_date', date)
    .neq('status', 'cancelled')

  if (staffId) {
    query = query.eq('staff_id', staffId)
  }

  const { data: existing, error } = await query
  if (error) throw error

  const busyIntervals = (existing || []).map(apt => {
    const start = timeToMinutes(apt.appointment_time)
    return { start, end: start + (apt.duration || 0) }
  })

  const isToday = date === todayKstDateString()
  const earliestStart = isToday ? nowKstMinutes() + MIN_LEAD_MINUTES : -Infinity

  const slots: string[] = []
  for (
    let start = BUSINESS_START_MINUTES;
    start + duration <= BUSINESS_END_MINUTES;
    start += SLOT_STEP_MINUTES
  ) {
    if (start < earliestStart) continue

    const end = start + duration
    const overlaps = busyIntervals.some(b => start < b.end && b.start < end)
    if (!overlaps) slots.push(minutesToTime(start))
  }

  return slots
}
