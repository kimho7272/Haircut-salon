import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase-admin'

// 직원은 미용실별 slug 경로(/illy-hair)에서 "실제" 이메일로 로그인한다.
// 그 이메일이 실제 Supabase auth 이메일이 아니라 user_profiles.contact_email로
// 저장돼 있으므로, 여기서 salon_id + contact_email로 실제(합성) auth 이메일을
// 찾은 뒤 그걸로 signInWithPassword를 대신 수행해서 세션 토큰을 돌려준다.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const slug = body?.slug?.trim()
  const email = body?.email?.trim()
  const password = body?.password

  if (!slug || !email || !password) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 })
  }

  // 실패 사유를 구분해서 알려주지 않음 (계정 존재 여부 유추 방지)
  const invalidCredentials = () => NextResponse.json({ error: 'invalid_credentials' }, { status: 401 })

  const { data: salon } = await supabaseAdmin
    .from('salons')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (!salon) {
    return invalidCredentials()
  }

  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('user_id')
    .eq('salon_id', salon.id)
    .ilike('contact_email', email)
    .maybeSingle()

  if (!profile) {
    return invalidCredentials()
  }

  const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(profile.user_id)
  if (authUserError || !authUser.user?.email) {
    return invalidCredentials()
  }

  // signInWithPassword는 supabaseAdmin(모듈 싱글턴, 여러 요청이 재사용됨)이 아니라
  // 이 요청 전용 임시 클라이언트로 수행한다 — 같은 서버리스 인스턴스가 연속된 다른
  // 사용자의 로그인 요청을 처리할 때 세션 상태가 서로 섞이는 걸 방지하기 위함
  // (persistSession: false라 어차피 저장은 안 하지만, 메모리 내 세션 상태 공유 자체를 차단)
  const requestScopedClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  const { data: session, error: signInError } = await requestScopedClient.auth.signInWithPassword({
    email: authUser.user.email,
    password,
  })

  if (signInError || !session.session) {
    return invalidCredentials()
  }

  // 클라이언트에 세션 전체를 그대로 돌려준다 (supabase-js가 sessionStorage에 쓰는
  // 형태와 동일한 모양 — access_token/token_type/expires_in/expires_at/
  // refresh_token/user). 클라이언트는 이걸 auth.setSession()으로 "설정"하지 않고
  // storage에 직접 써넣는다 — 자세한 이유는 [slug]/page.tsx 주석 참고.
  return NextResponse.json(session.session)
}
