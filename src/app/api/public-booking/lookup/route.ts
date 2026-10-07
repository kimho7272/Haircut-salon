import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { todayKstDateString } from '@/lib/publicBooking'

// 전화번호로 본인의 예정된 예약을 조회 (계정 없이도 조회/취소할 수 있게 하는 용도 — 비밀번호 대신 전화번호를 본인확인 수단으로 사용)
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const slug = body.slug?.trim()
  const phone = body.phone?.trim()

  if (!slug || !phone) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 })
  }

  const { data: salon } = await supabaseAdmin.from('salons').select('id').eq('slug', slug).maybeSingle()
  if (!salon) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const { data: customers } = await supabaseAdmin
    .from('customers')
    .select('id')
    .eq('salon_id', salon.id)
    .eq('phone', phone)

  if (!customers || customers.length === 0) {
    return NextResponse.json({ appointments: [] })
  }

  const { data: appointments, error } = await supabaseAdmin
    .from('appointments')
    .select('id, appointment_date, appointment_time, status, staff:staff(name)')
    .in('customer_id', customers.map(c => c.id))
    .eq('status', 'scheduled')
    .gte('appointment_date', todayKstDateString())
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true })

  if (error) {
    console.error('예약 조회 실패:', error)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }

  const appointmentIds = (appointments || []).map(a => a.id)
  const { data: aptServices } = appointmentIds.length > 0
    ? await supabaseAdmin
      .from('appointment_services')
      .select('appointment_id, service:services(name)')
      .in('appointment_id', appointmentIds)
    : { data: [] as { appointment_id: string; service: { name: string } | { name: string }[] | null }[] }

  const result = (appointments || []).map(apt => {
    const staff = Array.isArray(apt.staff) ? apt.staff[0] : apt.staff
    const serviceNames = (aptServices || [])
      .filter(row => row.appointment_id === apt.id)
      .map(row => Array.isArray(row.service) ? row.service[0]?.name : row.service?.name)
      .filter((name): name is string => Boolean(name))
    return {
      id: apt.id,
      date: apt.appointment_date,
      time: apt.appointment_time.slice(0, 5),
      staffName: staff?.name || null,
      serviceNames,
    }
  })

  return NextResponse.json({ appointments: result })
}
