import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { sendPurchaseConfirmation, sendDonationConfirmation } from '@/lib/email'

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-05-27.dahlia',
  })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

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
        const metadata = session.metadata ?? {}
        const userId = metadata.user_id
        const checkoutType = metadata.type
        const amount = session.amount_total ? session.amount_total / 100 : 0
        const currency = session.currency?.toUpperCase() ?? 'USD'
        const customerEmail = session.customer_details?.email ?? session.customer_email ?? null
        const customerName = session.customer_details?.name ?? undefined

        if (checkoutType === 'donation' || userId) {
          await supabase.from('donations').insert({
            user_id: userId || null,
            stripe_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent as string,
            amount,
            currency,
            status: 'completed',
            metadata,
          })

          if (customerEmail) {
            await sendDonationConfirmation({
              to: customerEmail,
              name: customerName,
              amount,
              currency,
            })
          }
        } else if (checkoutType === 'shop' && customerEmail) {
          await sendPurchaseConfirmation({
            to: customerEmail,
            name: customerName,
            amount,
            currency,
            sessionId: session.id,
          })
        }

        break
      }

      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent
        await supabase.from('donations').update({ status: 'completed' }).eq('stripe_payment_intent_id', pi.id)
        break
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent
        await supabase.from('donations').update({ status: 'failed' }).eq('stripe_payment_intent_id', pi.id)
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        await supabase.from('donations').update({ status: 'refunded' }).eq('stripe_payment_intent_id', charge.payment_intent as string)
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
