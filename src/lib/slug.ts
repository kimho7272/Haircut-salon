import { supabaseAdmin } from '@/lib/supabase-admin'

// 이 경로들은 /[slug] 동적 라우트와 겹치면 안 되는 예약어
export const RESERVED_SLUGS = new Set(['admin', 'signup', 'api', 'login', 'www'])

export const makeSlug = (name: string) => {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || 'salon'
}

// 미용실 이름으로부터 실제 사용 가능한 slug를 찾는다 (중복/예약어면 짧은 접미사를 붙임).
// 회원가입 폼의 실시간 미리보기와 실제 가입 처리가 서로 다른 slug를 계산하지 않도록
// 동일한 로직을 공유한다.
export const resolveAvailableSlug = async (salonName: string): Promise<string> => {
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
  return slug
}
