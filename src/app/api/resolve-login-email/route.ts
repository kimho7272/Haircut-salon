import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// 미용실 slug + 실제(contact) 이메일 → 내부 합성 auth 이메일로 변환만 한다.
// 비밀번호 검증은 여기서 하지 않음 — 클라이언트가 이 값을 받아서
// supabase.auth.signInWithPassword()를 직접 호출해 루트 로그인과 동일한 방식으로
// 검증한다 (서버에서 세션을 만들어 토큰을 넘겨주는 방식은 실제로 써보니
// 브라우저 쪽 supabase-js가 멈춰버리는 문제가 있어서 피함).
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const slug = body?.slug?.trim()
  const email = body?.email?.trim()

  if (!slug || !email) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 })
  }

  const notFound = () => NextResponse.json({ error: 'not_found' }, { status: 404 })

  const { data: salon } = await supabaseAdmin
    .from('salons')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (!salon) return notFound()

  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('user_id')
    .eq('salon_id', salon.id)
    .ilike('contact_email', email)
    .maybeSingle()

  if (!profile) return notFound()

  const { data: authUser, error } = await supabaseAdmin.auth.admin.getUserById(profile.user_id)
  if (error || !authUser.user?.email) return notFound()

  return NextResponse.json({ authEmail: authUser.user.email })
}
