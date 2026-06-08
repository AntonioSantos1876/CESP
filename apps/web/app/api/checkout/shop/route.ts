import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getMerchProductById } from '@/lib/merch'

type IncomingCartItem = {
  productId?: string
  quantity?: number
  size?: string
  customName?: string
  customNumber?: string
}

function createStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('Stripe is not configured yet. Add STRIPE_SECRET_KEY to continue.')
  }

  return new Stripe(secretKey, {
    apiVersion: '2026-05-27.dahlia',
  })
}

export async function POST(req: Request) {
  try {
    const stripe = createStripeClient()

    let body: { items?: IncomingCartItem[] }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const incomingItems = Array.isArray(body.items) ? body.items : []
    if (incomingItems.length === 0) {
      return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 })
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []

    for (const item of incomingItems) {
      const product = item.productId ? getMerchProductById(item.productId) : null
      if (!product) {
        return NextResponse.json({ error: 'One of the selected products is no longer available' }, { status: 400 })
      }

      const quantity = Math.max(1, Math.min(10, Number(item.quantity) || 1))
      const size = item.size && product.sizes.includes(item.size) ? item.size : product.sizes[0]
      const customName = item.customName?.trim()
      const customNumber = item.customNumber?.trim()
      const customSuffix = product.customizable
        ? [customName ? `Name ${customName}` : null, customNumber ? `No. ${customNumber}` : null].filter(Boolean).join(' | ')
        : ''

      lineItems.push({
        quantity,
        price_data: {
          currency: 'jmd',
          unit_amount: Math.round(product.price * 100),
          product_data: {
            name: product.name,
            description: [
              `${product.teamName} merch`,
              `Size ${size}`,
              customSuffix || null,
            ].filter(Boolean).join(' • '),
          },
        },
      })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://clarendon-elite-sports-program.vercel.app'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      billing_address_collection: 'required',
      success_url: `${appUrl}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cart`,
    })

    return NextResponse.json({ url: session.url })
  } catch {
    return NextResponse.json(
      { error: 'We could not start merch checkout right now. Please check Stripe setup and try again.' },
      { status: 500 }
    )
  }
}
