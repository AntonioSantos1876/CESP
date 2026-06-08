'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { useCart } from '@/components/cart-provider'
import { formatCurrency } from '@/lib/merch'

async function readApiPayload(response: Response) {
  const text = await response.text()
  if (!text) return {}

  try {
    return JSON.parse(text)
  } catch {
    throw new Error('The checkout service returned an invalid response. Please try again.')
  }
}

export default function CartPage() {
  const { items, itemCount, subtotal, updateQuantity, removeItem, clearCart } = useCart()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  async function handleCheckout() {
    try {
      setIsCheckingOut(true)
      setCheckoutError(null)

      const response = await fetch('/api/checkout/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            size: item.size,
            customName: item.customName,
            customNumber: item.customNumber,
          })),
        }),
      })

      const payload = await readApiPayload(response) as { url?: string; error?: string }
      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? 'Unable to start checkout')
      }

      window.location.href = payload.url
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'Unable to start checkout')
      setIsCheckingOut(false)
    }
  }

  return (
    <main className="min-h-screen bg-bg-base">
      <div className="container-cesp py-12">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <ShoppingCart size={24} className="text-brand-primary" />
              <h1 className="text-4xl font-black text-text-primary">Cart</h1>
            </div>
            <p className="text-text-secondary">Review your school merchandise and head to checkout when you’re ready.</p>
          </div>
          <Link href="/shop" className="btn-secondary w-full text-center sm:w-auto">
            Continue shopping
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-[#111111] p-10 text-center">
            <ShoppingCart size={40} className="mx-auto mb-4 text-brand-primary" />
            <h2 className="text-2xl font-bold text-text-primary">Your cart is empty</h2>
            <p className="mt-2 text-text-secondary">Pick a jersey, cap, bottle, or armband from the shop to get started.</p>
            <Link href="/shop" className="btn-primary mt-6 inline-flex">
              Visit the shop
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.45fr,0.9fr]">
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.id} className="rounded-[2rem] border border-white/10 bg-[#111111] p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="relative h-32 overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/10 sm:w-28">
                      {item.imagePath ? (
                        <Image
                          src={item.imagePath}
                          alt={item.name}
                          fill
                          className="object-cover object-center"
                          sizes="112px"
                        />
                      ) : (
                        <div
                          className="h-full w-full"
                          style={{ background: `linear-gradient(145deg, ${item.secondaryColor} 0%, ${item.primaryColor} 100%)` }}
                        />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.35em] text-text-muted">{item.teamName}</p>
                          <h2 className="mt-2 text-xl font-black text-text-primary">{item.name}</h2>
                          <div className="mt-3 flex flex-wrap gap-2 text-sm text-text-secondary">
                            <span className="rounded-full border border-white/10 px-3 py-1">Size {item.size}</span>
                            {item.customName && (
                              <span className="rounded-full border border-white/10 px-3 py-1">Name {item.customName}</span>
                            )}
                            {item.customNumber && (
                              <span className="rounded-full border border-white/10 px-3 py-1">No. {item.customNumber}</span>
                            )}
                          </div>
                        </div>
                        <p className="text-xl font-black text-text-primary">{formatCurrency(item.price * item.quantity)}</p>
                      </div>

                      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] p-1">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="rounded-full p-2 text-text-secondary transition-colors hover:text-text-primary"
                            aria-label={`Decrease quantity for ${item.name}`}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="min-w-10 text-center text-sm font-semibold text-text-primary">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="rounded-full p-2 text-text-secondary transition-colors hover:text-text-primary"
                            aria-label={`Increase quantity for ${item.name}`}
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="inline-flex items-center gap-2 text-sm font-medium text-red-300 transition-colors hover:text-red-200"
                        >
                          <Trash2 size={14} />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <aside className="h-fit rounded-[2rem] border border-white/10 bg-[#111111] p-6">
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-text-muted">Summary</p>
              <div className="mt-5 space-y-3 text-sm text-text-secondary">
                <div className="flex items-center justify-between">
                  <span>Items</span>
                  <span>{itemCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Delivery</span>
                  <span>Calculated in checkout</span>
                </div>
                <div className="border-t border-white/10 pt-3">
                  <div className="flex items-center justify-between text-lg font-black text-text-primary">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                </div>
              </div>

              {checkoutError && (
                <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {checkoutError}
                </p>
              )}

              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="btn-primary mt-6 flex w-full items-center justify-center gap-2 py-3 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCheckingOut ? 'Redirecting to checkout...' : 'Proceed to checkout'}
              </button>

              <button
                onClick={clearCart}
                className="btn-secondary mt-3 w-full"
              >
                Clear cart
              </button>
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}
