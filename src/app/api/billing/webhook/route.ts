import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getStripe } from '@/lib/stripe'
import type Stripe from 'stripe'

// Stripe 서명 검증을 위해 raw body가 필요하므로 request.json()을 쓰지 않음
export async function POST(request: NextRequest) {
  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: 'billing_not_configured' }, { status: 501 })
  }

  const signature = request.headers.get('stripe-signature')
  const rawBody = await request.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature || '', webhookSecret)
  } catch (err) {
    console.error('Stripe webhook signature 검증 실패:', err)
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 })
  }

  const setSalonPlan = async (salonId: string | undefined, plan: 'free' | 'paid') => {
    if (!salonId) return
    await supabaseAdmin.from('salons').update({ plan }).eq('id', salonId)
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      await setSalonPlan(session.metadata?.salon_id, 'paid')
      break
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const plan = subscription.status === 'active' || subscription.status === 'trialing' ? 'paid' : 'free'
      await setSalonPlan(subscription.metadata?.salon_id, plan)
      break
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await setSalonPlan(subscription.metadata?.salon_id, 'free')
      break
    }
    default:
      break
  }

  return NextResponse.json({ received: true })
}
