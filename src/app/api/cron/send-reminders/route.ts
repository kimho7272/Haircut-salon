import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { todayKstDateString } from '@/lib/publicBooking'
import { isResendConfigured, sendReminderEmail } from '@/lib/resend'

// Vercel Cron이 매일 호출 — 내일 예약 중 아직 리마인더 안 보낸 건에 이메일 발송.
// Vercel은 CRON_SECRET 환경변수가 설정되어 있으면 자동으로 Authorization 헤더를 붙여서
// 이 라우트를 호출하므로, 그 값과 일치하는지만 확인하면 외부에서 함부로 못 트리거함.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  if (!isResendConfigured()) {
    return NextResponse.json({ error: 'resend_not_configured' }, { status: 500 })
  }

  const tomorrow = new Date(`${todayKstDateString()}T00:00:00+09:00`)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowDate = tomorrow.toISOString().slice(0, 10)

  const { data: appointments, error } = await supabaseAdmin
    .from('appointments')
    .select(`
      id, appointment_time,
      salon:salons(name),
      customer:customers(name, email)
    `)
    .eq('appointment_date', tomorrowDate)
    .eq('status', 'scheduled')
    .is('reminder_sent_at', null)

  if (error) {
    console.error('리마인더 대상 조회 실패:', error)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }

  let sent = 0
  let skipped = 0
  let failed = 0

  for (const apt of appointments || []) {
    const customer = Array.isArray(apt.customer) ? apt.customer[0] : apt.customer
    const salon = Array.isArray(apt.salon) ? apt.salon[0] : apt.salon

    if (!customer?.email || !salon?.name) {
      skipped++
      continue
    }

    const { data: aptServices } = await supabaseAdmin
      .from('appointment_services')
      .select('service:services(name)')
      .eq('appointment_id', apt.id)

    const serviceNames = ((aptServices || []) as Array<{ service: { name: string } | { name: string }[] | null }>)
      .map(row => Array.isArray(row.service) ? row.service[0]?.name : row.service?.name)
      .filter((name): name is string => Boolean(name))

    const dateLabel = new Date(`${tomorrowDate}T00:00:00+09:00`).toLocaleDateString('ko-KR', {
      timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
    })

    const result = await sendReminderEmail({
      to: customer.email,
      salonName: salon.name,
      serviceNames: serviceNames.length > 0 ? serviceNames : ['-'],
      dateLabel,
      timeLabel: apt.appointment_time.slice(0, 5),
    })

    if (result.ok) {
      await supabaseAdmin.from('appointments').update({ reminder_sent_at: new Date().toISOString() }).eq('id', apt.id)
      sent++
    } else {
      console.error('리마인더 발송 실패:', apt.id, result.error)
      failed++
    }
  }

  return NextResponse.json({ sent, skipped, failed, total: appointments?.length || 0 })
}
