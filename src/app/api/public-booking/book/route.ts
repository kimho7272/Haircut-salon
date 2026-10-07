import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAvailableSlots, todayKstDateString } from '@/lib/publicBooking'
import { isResendConfigured, sendBookingConfirmationEmail } from '@/lib/resend'

type BookBody = {
  slug?: string
  date?: string
  time?: string
  staffId?: string | null
  serviceIds?: string[]
  customerName?: string
  customerPhone?: string
  customerEmail?: string
}

export async function POST(request: NextRequest) {
  const body: BookBody = await request.json().catch(() => ({}))
  const { slug, date, time, staffId, serviceIds, customerEmail } = body
  const customerName = body.customerName?.trim()
  const customerPhone = body.customerPhone?.trim()

  if (
    !slug || !date || !time ||
    !Array.isArray(serviceIds) || serviceIds.length === 0 ||
    !customerName || !customerPhone
  ) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 })
  }

  if (date < todayKstDateString()) {
    return NextResponse.json({ error: 'slot_unavailable' }, { status: 409 })
  }

  const { data: salon } = await supabaseAdmin
    .from('salons')
    .select('id, name, status')
    .eq('slug', slug)
    .maybeSingle()

  if (!salon || salon.status === 'suspended') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const { data: services, error: servicesError } = await supabaseAdmin
    .from('services')
    .select('id, name, price, duration')
    .eq('salon_id', salon.id)
    .eq('active', true)
    .in('id', serviceIds)

  if (servicesError || !services || services.length !== serviceIds.length) {
    return NextResponse.json({ error: 'invalid_services' }, { status: 400 })
  }

  const totalDuration = services.reduce((sum, s) => sum + s.duration, 0)

  // 클라이언트가 보낸 시간이 여전히 유효한지 서버에서 재검증 (동시 예약/레이스 방지)
  let availableSlots: string[]
  try {
    availableSlots = await getAvailableSlots({ salonId: salon.id, date, staffId: staffId || null, duration: totalDuration })
  } catch (error) {
    console.error('가능 시간 재검증 실패:', error)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }

  if (!availableSlots.includes(time)) {
    return NextResponse.json({ error: 'slot_unavailable' }, { status: 409 })
  }

  // 고객 찾기/생성 (같은 미용실 내에서 이름+전화번호로 식별)
  const { data: existingCustomer } = await supabaseAdmin
    .from('customers')
    .select('id')
    .eq('salon_id', salon.id)
    .eq('name', customerName)
    .eq('phone', customerPhone)
    .maybeSingle()

  let customerId = existingCustomer?.id as string | undefined
  let createdNewCustomer = false

  if (!customerId) {
    const { data: newCustomer, error: customerError } = await supabaseAdmin
      .from('customers')
      .insert([{ salon_id: salon.id, name: customerName, phone: customerPhone, email: customerEmail || null }])
      .select('id')
      .single()

    if (customerError || !newCustomer) {
      console.error('고객 생성 실패:', customerError)
      return NextResponse.json({ error: 'server_error' }, { status: 500 })
    }
    customerId = newCustomer.id
    createdNewCustomer = true
  } else if (customerEmail) {
    // 기존 고객이지만 이번에 이메일을 입력했다면 갱신 (리마인더 발송용)
    await supabaseAdmin.from('customers').update({ email: customerEmail }).eq('id', customerId)
  }

  const { data: appointment, error: appointmentError } = await supabaseAdmin
    .from('appointments')
    .insert([{
      salon_id: salon.id,
      customer_id: customerId,
      staff_id: staffId || null,
      service_id: serviceIds[0],
      appointment_date: date,
      appointment_time: time,
      duration: totalDuration,
      status: 'scheduled',
      booking_source: 'online',
    }])
    .select('id')
    .single()

  if (appointmentError || !appointment) {
    console.error('온라인 예약 생성 실패:', appointmentError)
    // 이번 요청에서 새로 만든 고객인데 예약 생성이 실패했다면 고아 레코드로 남지 않게 롤백
    if (createdNewCustomer && customerId) {
      await supabaseAdmin.from('customers').delete().eq('id', customerId)
    }
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }

  await supabaseAdmin
    .from('appointment_services')
    .insert(serviceIds.map(serviceId => ({ appointment_id: appointment.id, service_id: serviceId })))

  if (customerEmail && isResendConfigured()) {
    const dateLabel = new Date(`${date}T00:00:00+09:00`).toLocaleDateString('ko-KR', {
      timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
    })
    sendBookingConfirmationEmail({
      to: customerEmail,
      salonName: salon.name,
      serviceNames: services.map(s => s.name),
      dateLabel,
      timeLabel: time,
    }).catch(err => console.error('예약 확인 메일 발송 실패:', err))
  }

  return NextResponse.json({ success: true, appointmentId: appointment.id })
}
