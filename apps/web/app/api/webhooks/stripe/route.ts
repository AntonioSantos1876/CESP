import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Webhook signature verification failed: ${message}`)
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentSucceeded(paymentIntent)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentFailed(paymentIntent)
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        await handleChargeRefunded(charge)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (err) {
    console.error(`Error handling webhook event ${event.type}:`, err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata ?? {}
  const userId = metadata.user_id
  const donationAmount = session.amount_total ? session.amount_total / 100 : 0

  if (!userId) return

  await supabase.from('donations').insert({
    user_id: userId,
    stripe_session_id: session.id,
    stripe_payment_intent_id: session.payment_intent as string,
    amount: donationAmount,
    currency: session.currency?.toUpperCase() ?? 'GBP',
    status: 'completed',
    metadata: metadata,
  })
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const metadata = paymentIntent.metadata ?? {}

  await supabase
    .from('donations')
    .update({ status: 'completed' })
    .eq('stripe_payment_intent_id', paymentIntent.id)

  console.log(`Payment succeeded: ${paymentIntent.id}`, metadata)
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  await supabase
    .from('donations')
    .update({ status: 'failed' })
    .eq('stripe_payment_intent_id', paymentIntent.id)

  console.log(`Payment failed: ${paymentIntent.id}`)
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  await supabase
    .from('donations')
    .update({ status: 'refunded' })
    .eq('stripe_payment_intent_id', charge.payment_intent as string)

  console.log(`Charge refunded: ${charge.id}`)
}
