import { createClient } from '@supabase/supabase-js'

// 서버(Next.js Route Handler)에서만 쓰는 service-role 클라이언트.
// RLS를 전부 무시하므로 절대 클라이언트 번들에 들어가면 안 됨 — 'use client' 파일이나
// NEXT_PUBLIC_* 변수에서 참조하지 말 것.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

// API route에서 호출자가 보낸 Authorization 헤더(사용자 access token)로
// "이 사람이 누구인지"만 서비스 롤로 확인한다 (RLS 우회 없이 신원 확인 용도).
export const getCallerUser = async (authHeader: string | null) => {
  if (!authHeader) return null
  const token = authHeader.replace(/^Bearer\s+/i, '')
  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data.user) return null
  return data.user
}

// 운영자 콘솔 API 공통 가드 — 호출자가 platform_admins에 등록된 사람인지 확인
export const requirePlatformAdmin = async (authHeader: string | null) => {
  const caller = await getCallerUser(authHeader)
  if (!caller) return null

  const { data } = await supabaseAdmin
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', caller.id)
    .maybeSingle()

  return data ? caller : null
}
