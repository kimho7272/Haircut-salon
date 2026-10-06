import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, requirePlatformAdmin } from '@/lib/supabase-admin'
import { logAdminEvent } from '@/lib/adminAudit'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requirePlatformAdmin(request.headers.get('authorization'))
  if (!admin) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const { id } = await params

  const { data: salon, error } = await supabaseAdmin
    .from('salons')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error || !salon) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const [membersResult, customersResult, servicesResult, appointmentsResult] = await Promise.all([
    supabaseAdmin
      .from('user_profiles')
      .select('id, user_id, name, role, contact_email, created_at')
      .eq('salon_id', id)
      .order('created_at', { ascending: true }),
    supabaseAdmin.from('customers').select('id', { count: 'exact', head: true }).eq('salon_id', id),
    supabaseAdmin.from('services').select('id', { count: 'exact', head: true }).eq('salon_id', id),
    supabaseAdmin.from('appointments').select('created_at').eq('salon_id', id).order('created_at', { ascending: false }).limit(1),
  ])

  return NextResponse.json({
    salon,
    members: membersResult.data || [],
    usage: {
      customerCount: customersResult.count ?? 0,
      serviceCount: servicesResult.count ?? 0,
      lastActivityAt: appointmentsResult.data?.[0]?.created_at || null,
    },
  })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requirePlatformAdmin(request.headers.get('authorization'))
  if (!admin) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json().catch(() => null)
  const confirmSlug = body?.confirmSlug?.trim()

  const { data: salon } = await supabaseAdmin
    .from('salons')
    .select('id, name, slug')
    .eq('id', id)
    .maybeSingle()

  if (!salon) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  // UI에서 이미 입력받았어도 서버에서 다시 확인 — 클라이언트 쪽 가드만 믿지 않음
  if (confirmSlug !== salon.slug) {
    return NextResponse.json({ error: 'confirmation_mismatch' }, { status: 400 })
  }

  const [{ data: members }, { data: appointments }, { count: customerCount }] = await Promise.all([
    supabaseAdmin.from('user_profiles').select('user_id').eq('salon_id', id),
    supabaseAdmin.from('appointments').select('id').eq('salon_id', id),
    supabaseAdmin.from('customers').select('id', { count: 'exact', head: true }).eq('salon_id', id),
  ])

  const appointmentIds = (appointments || []).map(a => a.id)

  // 삭제 전에 먼저 감사 로그를 남긴다 — 삭제 후에는 target_salon_id가 null이 되므로
  // 이름/통계를 detail에 남겨둬야 나중에도 "무슨 미용실이었는지" 알 수 있음
  await logAdminEvent({
    actorUserId: admin.id,
    actorType: 'platform_admin',
    action: 'salon_deleted',
    targetSalonId: id,
    detail: {
      name: salon.name,
      slug: salon.slug,
      memberCount: members?.length || 0,
      appointmentCount: appointmentIds.length,
      customerCount: customerCount || 0,
    },
  })

  // FK 순서대로 삭제: appointment_services -> appointments -> customers/services/staff ->
  // user_profiles -> auth 계정 -> salons
  if (appointmentIds.length > 0) {
    await supabaseAdmin.from('appointment_services').delete().in('appointment_id', appointmentIds)
  }
  await supabaseAdmin.from('appointments').delete().eq('salon_id', id)
  await supabaseAdmin.from('customers').delete().eq('salon_id', id)
  await supabaseAdmin.from('services').delete().eq('salon_id', id)
  await supabaseAdmin.from('staff').delete().eq('salon_id', id)
  await supabaseAdmin.from('user_profiles').delete().eq('salon_id', id)

  for (const member of members || []) {
    await supabaseAdmin.auth.admin.deleteUser(member.user_id)
  }

  const { error: deleteError } = await supabaseAdmin.from('salons').delete().eq('id', id)

  if (deleteError) {
    return NextResponse.json({ error: 'delete_failed', detail: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
