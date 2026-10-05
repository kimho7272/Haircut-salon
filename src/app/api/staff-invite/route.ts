import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, getCallerUser } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  const caller = await getCallerUser(request.headers.get('authorization'))
  if (!caller) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { data: callerProfile } = await supabaseAdmin
    .from('user_profiles')
    .select('salon_id, role')
    .eq('user_id', caller.id)
    .single()

  if (!callerProfile || callerProfile.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const salonId = callerProfile.salon_id

  const body = await request.json().catch(() => null)
  const email = body?.email?.trim()
  const name = body?.name?.trim()

  if (!email || !name) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 })
  }

  // 좌석 제한 체크: 무료 플랜은 관리자 1명뿐, 그 이상은 유료 플랜 필요
  // (서버에서도 다시 확인 — 클라이언트 쪽 체크만 믿지 않음)
  const { data: salon } = await supabaseAdmin
    .from('salons')
    .select('plan')
    .eq('id', salonId)
    .single()

  const { count: memberCount } = await supabaseAdmin
    .from('user_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('salon_id', salonId)

  if (salon?.plan === 'free' && (memberCount || 0) >= 1) {
    return NextResponse.json({ error: 'seat_limit_reached' }, { status: 402 })
  }

  const { data: invited, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)

  if (inviteError || !invited.user) {
    const isDuplicate = inviteError?.message?.toLowerCase().includes('already')
    return NextResponse.json(
      { error: isDuplicate ? 'email_taken' : 'invite_failed', detail: inviteError?.message },
      { status: isDuplicate ? 409 : 500 }
    )
  }

  const { error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .insert([{ user_id: invited.user.id, salon_id: salonId, name, role: 'staff' }])

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(invited.user.id)
    return NextResponse.json({ error: 'invite_failed', detail: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
