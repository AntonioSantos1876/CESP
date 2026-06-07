'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { CheckCircle2, ShoppingBag } from 'lucide-react'
import { useCart } from '@/components/cart-provider'

export default function ShopSuccessPage() {
  const { clearCart } = useCart()

  useEffect(() => {
    clearCart()
  }, [clearCart])

  return (
    <main className="min-h-screen bg-bg-base">
      <div className="container-cesp py-20">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-[#111111] p-10 text-center">
          <CheckCircle2 size={48} className="mx-auto text-green-400" />
          <h1 className="mt-6 text-4xl font-black text-text-primary">Order started</h1>
          <p className="mt-3 text-text-secondary">
            Your merch checkout has been opened successfully. Once payment is confirmed, the cart is cleared and your order can be fulfilled.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/shop" className="btn-primary inline-flex items-center justify-center gap-2">
              <ShoppingBag size={16} />
              Back to shop
            </Link>
            <Link href="/teams" className="btn-secondary">
              Browse teams
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
