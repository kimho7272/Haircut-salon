import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, requirePlatformAdmin } from '@/lib/supabase-admin'
import { logAdminEvent } from '@/lib/adminAudit'

export async function GET(request: NextRequest) {
  const admin = await requirePlatformAdmin(request.headers.get('authorization'))
  if (!admin) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const { data: operators, error } = await supabaseAdmin
    .from('platform_admins')
    .select('user_id, created_at')
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'query_failed' }, { status: 500 })
  }

  const enriched = await Promise.all((operators || []).map(async op => {
    const { data } = await supabaseAdmin.auth.admin.getUserById(op.user_id)
    return { ...op, email: data.user?.email || null }
  }))

  return NextResponse.json({ operators: enriched })
}

export async function POST(request: NextRequest) {
  const admin = await requirePlatformAdmin(request.headers.get('authorization'))
  if (!admin) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const email = body?.email?.trim()

  if (!email) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 })
  }

  // email 단건 조회 API가 없어서 목록에서 직접 대조함 (운영자 수가 적으므로 충분)
  const { data: usersPage } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  const matchedUser = usersPage?.users.find(u => u.email?.toLowerCase() === email.toLowerCase())

  if (!matchedUser) {
    return NextResponse.json({ error: 'user_not_found' }, { status: 404 })
  }

  const { error } = await supabaseAdmin.from('platform_admins').insert([{ user_id: matchedUser.id }])

  if (error) {
    const isDuplicate = error.message?.toLowerCase().includes('duplicate')
    return NextResponse.json({ error: isDuplicate ? 'already_operator' : 'add_failed' }, { status: isDuplicate ? 409 : 500 })
  }

  await logAdminEvent({
    actorUserId: admin.id,
    actorType: 'platform_admin',
    action: 'operator_added',
    detail: { email },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const admin = await requirePlatformAdmin(request.headers.get('authorization'))
  if (!admin) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const userId = body?.userId

  if (!userId) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 })
  }

  if (userId === admin.id) {
    return NextResponse.json({ error: 'cannot_remove_self' }, { status: 400 })
  }

  const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(userId)

  const { error } = await supabaseAdmin.from('platform_admins').delete().eq('user_id', userId)

  if (error) {
    return NextResponse.json({ error: 'remove_failed' }, { status: 500 })
  }

  await logAdminEvent({
    actorUserId: admin.id,
    actorType: 'platform_admin',
    action: 'operator_removed',
    detail: { email: targetUser.user?.email || null },
  })

  return NextResponse.json({ success: true })
}
