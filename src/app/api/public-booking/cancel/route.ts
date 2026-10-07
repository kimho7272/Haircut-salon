import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const slug = body.slug?.trim()
  const appointmentId = body.appointmentId?.trim()
  const phone = body.phone?.trim()

  if (!slug || !appointmentId || !phone) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 })
  }

  const { data: salon } = await supabaseAdmin.from('salons').select('id').eq('slug', slug).maybeSingle()
  if (!salon) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  // 전화번호가 이 예약의 실제 고객과 일치하는지 서버에서 재확인 (URL의 appointmentId만으로는 아무나 취소 못 하게)
  const { data: appointment } = await supabaseAdmin
    .from('appointments')
    .select('id, salon_id, status, customer:customers(phone)')
    .eq('id', appointmentId)
    .eq('salon_id', salon.id)
    .maybeSingle()

  const customer = appointment && (Array.isArray(appointment.customer) ? appointment.customer[0] : appointment.customer)

  if (!appointment || !customer || customer.phone !== phone) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  if (appointment.status === 'cancelled') {
    return NextResponse.json({ success: true })
  }

  const { error } = await supabaseAdmin
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', appointmentId)

  if (error) {
    console.error('예약 취소 실패:', error)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
