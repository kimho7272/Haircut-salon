import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// 이 경로들은 /[slug] 동적 라우트와 겹치면 안 되는 예약어
const RESERVED_SLUGS = new Set(['admin', 'signup', 'api', 'login', 'www'])

const makeSlug = (name: string) => {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || 'salon'
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const salonName = body?.salonName?.trim()
  const adminName = body?.adminName?.trim()
  const email = body?.email?.trim()
  const password = body?.password

  if (!salonName || !adminName || !email || !password || password.length < 6) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 })
  }

  // slug 중복/예약어 방지 (같은 이름이면 뒤에 짧은 접미사를 붙임)
  const baseSlug = makeSlug(salonName)
  let slug = baseSlug
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await supabaseAdmin
      .from('salons')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    if (!existing && !RESERVED_SLUGS.has(slug)) break
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
  }

  const { data: createdUser, error: userError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (userError || !createdUser.user) {
    const isDuplicate = userError?.message?.toLowerCase().includes('already')
    return NextResponse.json(
      { error: isDuplicate ? 'email_taken' : 'signup_failed', detail: userError?.message },
      { status: isDuplicate ? 409 : 500 }
    )
  }

  const userId = createdUser.user.id

  const { data: salon, error: salonError } = await supabaseAdmin
    .from('salons')
    .insert([{ name: salonName, slug, plan: 'free', status: 'active', owner_user_id: userId }])
    .select()
    .single()

  if (salonError || !salon) {
    await supabaseAdmin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: 'signup_failed', detail: salonError?.message }, { status: 500 })
  }

  const { error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .insert([{ user_id: userId, salon_id: salon.id, name: adminName, role: 'admin', contact_email: email }])

  if (profileError) {
    await supabaseAdmin.from('salons').delete().eq('id', salon.id)
    await supabaseAdmin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: 'signup_failed', detail: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, salonId: salon.id, userId })
}
