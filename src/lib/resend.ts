// Resend HTTP API로 직접 메일을 보낸다 (Supabase 기본 메일 발송이 아님).
// 직원 계정은 내부적으로 합성 이메일을 쓰기 때문에, Supabase의 inviteUserByEmail이
// 보내는 메일은 그 합성 주소로 가버려 실제 사람에게 닿지 않는다 — 그래서 초대 링크는
// 우리가 직접 만들어서(generateLink) Resend로 실제 이메일 주소에 보낸다.
// 예약 확인/리마인더 메일도 같은 경로를 재사용한다.

export const isResendConfigured = () =>
  Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL)

export const sendEmail = async (params: {
  to: string
  subject: string
  html: string
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
      subject: params.subject,
      html: params.html,
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    return { ok: false, error: detail || `resend_http_${response.status}` }
  }

  return { ok: true }
}

export const sendInviteEmail = (params: { to: string; salonName: string; inviteLink: string }) =>
  sendEmail({
    to: params.to,
    subject: `${params.salonName}에서 함께 일해요 — 계정 설정하기`,
    html: `
      <p>${params.salonName}에서 직원 계정이 생성되었습니다.</p>
      <p><a href="${params.inviteLink}">아래 링크를 눌러 비밀번호를 설정하세요</a></p>
      <p>${params.inviteLink}</p>
    `,
  })

export const sendBookingConfirmationEmail = (params: {
  to: string
  salonName: string
  serviceNames: string[]
  dateLabel: string
  timeLabel: string
}) =>
  sendEmail({
    to: params.to,
    subject: `${params.salonName} 예약이 확정되었습니다`,
    html: `
      <p>${params.salonName}에 예약이 정상적으로 접수되었습니다.</p>
      <ul>
        <li>날짜: ${params.dateLabel}</li>
        <li>시간: ${params.timeLabel}</li>
        <li>서비스: ${params.serviceNames.join(', ')}</li>
      </ul>
      <p>예약 변경이나 취소가 필요하시면 매장으로 직접 연락해주세요.</p>
    `,
  })

export const sendReminderEmail = (params: {
  to: string
  salonName: string
  serviceNames: string[]
  dateLabel: string
  timeLabel: string
}) =>
  sendEmail({
    to: params.to,
    subject: `[리마인더] 내일 ${params.salonName} 예약이 있습니다`,
    html: `
      <p>예약하신 일정을 알려드립니다.</p>
      <ul>
        <li>미용실: ${params.salonName}</li>
        <li>날짜: ${params.dateLabel}</li>
        <li>시간: ${params.timeLabel}</li>
        <li>서비스: ${params.serviceNames.join(', ')}</li>
      </ul>
      <p>일정 변경이나 취소가 필요하시면 매장으로 직접 연락해주세요.</p>
    `,
  })
