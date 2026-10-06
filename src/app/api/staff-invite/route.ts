import { NextRequest, NextResponse } from 'next/server'
import { randomUUID, randomBytes } from 'crypto'
import { supabaseAdmin, getCallerUser } from '@/lib/supabase-admin'
import { sendInviteEmail } from '@/lib/resend'

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

  const { data: salon } = await supabaseAdmin
    .from('salons')
    .select('name, slug, plan')
    .eq('id', salonId)
    .single()

  if (!salon) {
    return NextResponse.json({ error: 'invite_failed' }, { status: 500 })
  }

  // 좌석 제한 체크: 무료 플랜은 관리자 1명뿐, 그 이상은 유료 플랜 필요
  const { count: memberCount } = await supabaseAdmin
    .from('user_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('salon_id', salonId)

  if (salon.plan === 'free' && (memberCount || 0) >= 1) {
    return NextResponse.json({ error: 'seat_limit_reached' }, { status: 402 })
  }

  // 같은 미용실 안에서만 이메일 중복을 막음 (다른 미용실엔 같은 이메일로 등록돼 있어도 됨)
  const { data: existingAtSalon } = await supabaseAdmin
    .from('user_profiles')
    .select('id')
    .eq('salon_id', salonId)
    .ilike('contact_email', email)
    .maybeSingle()

  if (existingAtSalon) {
    return NextResponse.json({ error: 'email_taken' }, { status: 409 })
  }

  // Supabase auth.users는 이메일을 프로젝트 전체에서 유일하게 강제하므로,
  // 직원 계정은 내부용 합성 이메일로 만들고 실제 로그인 이메일은 contact_email에 저장한다.
  // (관리자는 이 과정을 거치지 않고 실제 이메일을 그대로 auth 이메일로 씀 — /api/signup 참고)
  const syntheticEmail = `staff-${randomUUID()}@users.ryansuite.internal`
  const tempPassword = randomBytes(24).toString('base64')

  const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: syntheticEmail,
    password: tempPassword,
    email_confirm: true,
  })

  if (createError || !createdUser.user) {
    return NextResponse.json({ error: 'invite_failed', detail: createError?.message }, { status: 500 })
  }

  const { error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .insert([{ user_id: createdUser.user.id, salon_id: salonId, name, role: 'staff', contact_email: email }])

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(createdUser.user.id)
    return NextResponse.json({ error: 'invite_failed', detail: profileError.message }, { status: 500 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://salon.ryansuite.com'
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email: syntheticEmail,
    options: { redirectTo: `${appUrl}/set-password` },
  })

  if (linkError || !linkData.properties?.action_link) {
    return NextResponse.json({ error: 'invite_failed', detail: linkError?.message }, { status: 500 })
  }

  const sendResult = await sendInviteEmail({
    to: email,
    salonName: salon.name,
    inviteLink: linkData.properties.action_link,
  })

  if (!sendResult.ok) {
    // 계정/프로필은 이미 만들어졌으니 초대 메일만 못 보낸 상태 — 관리자가 재시도할 수 있게 알림
    return NextResponse.json(
      { error: 'email_not_sent', detail: sendResult.error, inviteLink: linkData.properties.action_link },
      { status: 207 }
    )
  }

  return NextResponse.json({ success: true })
}
