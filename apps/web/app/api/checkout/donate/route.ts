import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-05-27.dahlia',
  })

  let amount: number
  try {
    const body = await req.json()
    amount = Number(body.amount)
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!amount || amount < 1 || !Number.isFinite(amount)) {
    return NextResponse.json({ error: 'Amount must be at least £1' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'gbp',
          product_data: {
            name: 'Clarendon Elite Sports Program - Donation',
            description: 'Thank you for supporting the league. 100% of your donation goes back into the community.',
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/donate`,
  })

  return NextResponse.json({ url: session.url })
}
