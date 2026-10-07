import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAvailableSlots, todayKstDateString } from '@/lib/publicBooking'

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')?.trim()
  const date = request.nextUrl.searchParams.get('date')?.trim()
  const staffId = request.nextUrl.searchParams.get('staffId')?.trim() || null
  const duration = Number(request.nextUrl.searchParams.get('duration'))

  if (!slug || !date || !Number.isFinite(duration) || duration <= 0) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 })
  }

  if (date < todayKstDateString()) {
    return NextResponse.json({ slots: [] })
  }

  const { data: salon } = await supabaseAdmin
    .from('salons')
    .select('id, status')
    .eq('slug', slug)
    .maybeSingle()

  if (!salon || salon.status === 'suspended') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  try {
    const slots = await getAvailableSlots({ salonId: salon.id, date, staffId, duration })
    return NextResponse.json({ slots })
  } catch (error) {
    console.error('가능 시간 조회 실패:', error)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
