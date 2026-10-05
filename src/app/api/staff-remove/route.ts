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

  const body = await request.json().catch(() => null)
  const targetUserId = body?.userId

  if (!targetUserId) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 })
  }

  // 대상 계정이 내 미용실 소속인지 확인 (다른 미용실 계정은 건드릴 수 없음)
  const { data: targetProfile } = await supabaseAdmin
    .from('user_profiles')
    .select('user_id, salon_id')
    .eq('user_id', targetUserId)
    .single()

  if (!targetProfile || targetProfile.salon_id !== callerProfile.salon_id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  // 미용실 소유자(가입 시 만들어진 관리자) 본인은 이 기능으로 제거할 수 없음 —
  // 소유자가 없어지면 그 미용실을 관리할 사람이 아무도 없게 됨
  const { data: salon } = await supabaseAdmin
    .from('salons')
    .select('owner_user_id')
    .eq('id', callerProfile.salon_id)
    .single()

  if (salon?.owner_user_id === targetUserId) {
    return NextResponse.json({ error: 'cannot_remove_owner' }, { status: 400 })
  }

  // user_profiles 행 삭제 + auth 계정 자체도 삭제해야 그 이메일이 다른 미용실에서
  // 다시 쓸 수 있게 풀림 (Supabase는 이메일을 프로젝트 전체에서 유일하게 강제함)
  await supabaseAdmin.from('user_profiles').delete().eq('user_id', targetUserId)
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)

  if (deleteError) {
    return NextResponse.json({ error: 'remove_failed', detail: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
