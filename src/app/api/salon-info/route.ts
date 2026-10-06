import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// 로그인 페이지에 미용실 이름만 보여주기 위한 공개 조회 (민감정보 없음)
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')?.trim()
  if (!slug) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 })
  }

  const { data: salon } = await supabaseAdmin
    .from('salons')
    .select('name')
    .eq('slug', slug)
    .maybeSingle()

  if (!salon) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  return NextResponse.json({ name: salon.name })
}
