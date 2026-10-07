import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// 고객 셀프 예약 페이지용 공개 조회 — 미용실 이름/서비스/직원 목록만 노출 (민감정보 없음)
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')?.trim()
  if (!slug) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 })
  }

  const { data: salon } = await supabaseAdmin
    .from('salons')
    .select('id, name, status')
    .eq('slug', slug)
    .maybeSingle()

  if (!salon || salon.status === 'suspended') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const [{ data: services }, { data: staff }] = await Promise.all([
    supabaseAdmin
      .from('services')
      .select('id, name, price, duration, description')
      .eq('salon_id', salon.id)
      .eq('active', true)
      .order('name', { ascending: true }),
    supabaseAdmin
      .from('staff')
      .select('id, name')
      .eq('salon_id', salon.id)
      .eq('active', true)
      .order('name', { ascending: true }),
  ])

  return NextResponse.json({
    salonName: salon.name,
    services: services || [],
    staff: staff || [],
  })
}
