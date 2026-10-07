import { NextRequest, NextResponse } from 'next/server'
import { resolveAvailableSlug } from '@/lib/slug'

// 회원가입 폼에서 미용실 이름을 입력하는 동안 실제 생성될 slug를 미리 보여주기 위한 조회 전용 엔드포인트.
// 실제 가입(POST /api/signup)과 동일한 resolveAvailableSlug를 쓰므로 미리보기와 실제 결과가 항상 일치한다.
export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name')?.trim()
  if (!name) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 })
  }

  const slug = await resolveAvailableSlug(name)
  return NextResponse.json({ slug })
}
