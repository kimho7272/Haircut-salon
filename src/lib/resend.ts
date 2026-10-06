// Resend HTTP API로 직접 메일을 보낸다 (Supabase 기본 메일 발송이 아님).
// 직원 계정은 내부적으로 합성 이메일을 쓰기 때문에, Supabase의 inviteUserByEmail이
// 보내는 메일은 그 합성 주소로 가버려 실제 사람에게 닿지 않는다 — 그래서 초대 링크는
// 우리가 직접 만들어서(generateLink) Resend로 실제 이메일 주소에 보낸다.

export const isResendConfigured = () =>
  Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL)

export const sendInviteEmail = async (params: {
  to: string
  salonName: string
  inviteLink: string
}): Promise<{ ok: boolean; error?: string }> => {
  if (!isResendConfigured()) {
    return { ok: false, error: 'resend_not_configured' }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to: params.to,
      subject: `${params.salonName}에서 함께 일해요 — 계정 설정하기`,
      html: `
        <p>${params.salonName}에서 직원 계정이 생성되었습니다.</p>
        <p><a href="${params.inviteLink}">아래 링크를 눌러 비밀번호를 설정하세요</a></p>
        <p>${params.inviteLink}</p>
      `,
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    return { ok: false, error: detail || `resend_http_${response.status}` }
  }

  return { ok: true }
}
