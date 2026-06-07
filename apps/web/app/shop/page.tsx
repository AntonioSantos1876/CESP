'use client'

import { motion } from 'framer-motion'
import { ShieldCheck, ShoppingBag, Sparkles } from 'lucide-react'
import { MerchandiseCatalog } from '@/components/merchandise'
import { MERCH_PRODUCTS } from '@/lib/merch'

export default function ShopPage() {
  return (
    <main className="min-h-screen bg-bg-base">
      <div className="container-cesp py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#101010] p-8 sm:p-10"
        >
          <div className="grid gap-8 xl:grid-cols-[1.2fr,0.8fr] xl:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.35em] text-brand-secondary">
                <Sparkles size={14} />
                Official school merchandise
              </div>
              <div className="mb-3 flex items-center gap-3">
                <ShoppingBag size={24} className="text-brand-primary" />
                <h1 className="text-4xl font-black text-text-primary sm:text-5xl">Shop</h1>
              </div>
              <p className="max-w-3xl text-lg leading-8 text-text-secondary">
                Every school now has a full merch line ready to order: home jerseys, branded caps, water bottles, and captain armbands.
                Jerseys can be customised with size, name, and number before going into the cart.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs font-bold uppercase tracking-[0.35em] text-text-muted">Schools</p>
                <p className="mt-3 text-3xl font-black text-text-primary">8</p>
                <p className="mt-1 text-sm text-text-secondary">Full catalogues matched to school colours.</p>
              </div>
              <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-3 flex items-center gap-2 text-brand-secondary">
                  <ShieldCheck size={18} />
                  <p className="text-xs font-bold uppercase tracking-[0.35em]">Checkout ready</p>
                </div>
                <p className="text-sm leading-7 text-text-secondary">
                  Add to cart from here or the sponsors page, then proceed straight to checkout.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <MerchandiseCatalog
          products={MERCH_PRODUCTS}
          showFilters
          showCartSummary
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-12 rounded-[2rem] border border-brand-primary/20 bg-brand-primary/5 p-8 text-center"
        >
          <ShoppingBag size={28} className="mx-auto mb-3 text-brand-primary" />
          <h3 className="mb-1 text-xl font-bold text-text-primary">Bulk or school orders</h3>
          <p className="text-sm text-text-secondary mb-4">
            Need a larger order for a school, squad, or supporters group? We can arrange coordinated sizing and batch fulfilment.
          </p>
          <a href="mailto:shop@clarendonelite.com" className="btn-secondary">
            Contact us
          </a>
        </motion.div>
      </div>
    </main>
  )
}
