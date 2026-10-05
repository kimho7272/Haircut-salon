import Stripe from 'stripe'

// STRIPE_SECRET_KEY가 설정되기 전까지는 결제 기능이 비활성 상태로 남아있어야
// 앱이 죽지 않으므로, 모듈 로드 시점에 생성하지 않고 지연 생성한다.
let stripeClient: Stripe | null = null

export const getStripe = (): Stripe | null => {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) return null

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey)
  }
  return stripeClient
}

export const isBillingConfigured = () =>
  Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID_SEAT)
