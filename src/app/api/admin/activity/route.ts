import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, requirePlatformAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  const admin = await requirePlatformAdmin(request.headers.get('authorization'))
  if (!admin) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const salonId = request.nextUrl.searchParams.get('salonId')
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit')) || 50, 200)

  let query = supabaseAdmin
    .from('platform_audit_log')
    .select('id, actor_user_id, actor_type, action, target_salon_id, detail, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (salonId) {
    query = query.eq('target_salon_id', salonId)
  }

  const { data: events, error } = await query

  if (error) {
    return NextResponse.json({ error: 'query_failed' }, { status: 500 })
  }

  // 액터/대상 미용실 정보를 붙여서 돌려줌 (프론트에서 추가 조회 안 해도 되게).
  // 액터는 플랫폼 운영자일 수도, 미용실 소속 계정일 수도 있어서 auth 쪽에서
  // 바로 이메일을 가져온다 (user_profiles에는 운영자가 없음).
  const actorIds = Array.from(new Set((events || []).map(e => e.actor_user_id).filter(Boolean))) as string[]
  const salonIds = Array.from(new Set((events || []).map(e => e.target_salon_id).filter(Boolean))) as string[]

  const [actorEmails, salons] = await Promise.all([
    Promise.all(actorIds.map(async id => {
      const { data } = await supabaseAdmin.auth.admin.getUserById(id)
      return [id, data.user?.email || null] as const
    })),
    salonIds.length > 0
      ? supabaseAdmin.from('salons').select('id, name, slug').in('id', salonIds)
      : Promise.resolve({ data: [] as { id: string; name: string; slug: string }[] }),
  ])

  const actorMap = new Map(actorEmails)
  const salonMap = new Map((salons.data || []).map(s => [s.id, s]))

  const enriched = (events || []).map(e => ({
    ...e,
    actorEmail: e.actor_user_id ? actorMap.get(e.actor_user_id) || null : null,
    targetSalon: e.target_salon_id ? salonMap.get(e.target_salon_id) || null : null,
  }))

  return NextResponse.json({ events: enriched })
}
