import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, getCallerUser } from '@/lib/supabase-admin'
import { getStripe, isBillingConfigured } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  if (!isBillingConfigured()) {
    return NextResponse.json({ error: 'billing_not_configured' }, { status: 501 })
  }

  const caller = await getCallerUser(request.headers.get('authorization'))
  if (!caller) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { data: callerProfile } = await supabaseAdmin
    .from('user_profiles')
    .select('salon_id, role')
    .eq('user_id', caller.id)
    .single()

  if (!callerProfile || callerProfile.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const stripe = getStripe()!
  const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || ''

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: caller.email,
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID_SEAT,
        quantity: 1,
      },
    ],
    // 추가 좌석은 고객이 Stripe Billing Portal에서 수량을 늘릴 수 있도록
    // subscription_data.metadata로 salon_id를 남겨 webhook에서 식별한다.
    subscription_data: {
      metadata: { salon_id: callerProfile.salon_id },
    },
    metadata: { salon_id: callerProfile.salon_id },
    success_url: `${origin}/?billing=success`,
    cancel_url: `${origin}/?billing=cancelled`,
  })

  return NextResponse.json({ url: session.url })
}
