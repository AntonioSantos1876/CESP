'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Shirt, X } from 'lucide-react'
import { useCart } from '@/components/cart-provider'
import {
  MERCH_CATEGORY_LABELS,
  formatCurrency,
  type MerchCategory,
  type MerchProduct,
} from '@/lib/merch'
import { hexToRgba } from '@/lib/school-teams'

type CatalogProps = {
  products: MerchProduct[]
  compact?: boolean
  showFilters?: boolean
  showCartSummary?: boolean
}

function ProductArtwork({ product }: { product: MerchProduct }) {
  if (product.kind === 'jersey' && product.imagePath) {
    return (
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/10">
        <Image
          src={product.imagePath}
          alt={product.name}
          fill
          className="object-cover object-center"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
        />
        <div
          className="absolute inset-x-0 bottom-0 h-24"
          style={{ background: `linear-gradient(180deg, transparent 0%, ${hexToRgba(product.branding.primary, 0.88)} 100%)` }}
        />
      </div>
    )
  }

  return (
    <div
      className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] border border-white/10"
      style={{
        background: `linear-gradient(145deg, ${product.branding.secondary} 0%, ${hexToRgba(product.branding.primary, 0.95)} 78%)`,
      }}
    >
      <div className="absolute inset-0 opacity-25" style={{
        backgroundImage: `radial-gradient(circle at 20% 20%, ${hexToRgba(product.branding.accent, 0.95)} 0, transparent 34%), radial-gradient(circle at 80% 22%, ${hexToRgba(product.branding.secondary, 0.75)} 0, transparent 28%)`,
      }} />
      <div className="relative flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-black/15">
          <Shirt size={38} style={{ color: product.branding.primary }} />
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-black/70">{product.branding.shortName}</p>
          <p className="mt-2 text-2xl font-black text-black/75">{product.name}</p>
          <p className="mt-2 text-sm font-medium text-black/60">{product.teamName}</p>
        </div>
      </div>
    </div>
  )
}

function OptionsModal({
  product,
  onClose,
}: {
  product: MerchProduct
  onClose: () => void
}) {
  const { addItem } = useCart()
  const [size, setSize] = useState(product.sizes[0] ?? '')
  const [quantity, setQuantity] = useState(1)
  const [customName, setCustomName] = useState('')
  const [customNumber, setCustomNumber] = useState('')

  function handleAddToCart() {
    addItem({
      product,
      size,
      quantity,
      customName: product.customizable ? customName : undefined,
      customNumber: product.customizable ? customNumber : undefined,
    })
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.98 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-8 w-[min(92vw,44rem)] rounded-[2rem] border border-white/10 bg-[#0f0f0f] p-4 shadow-2xl sm:mt-12 sm:p-6"
          onClick={event => event.stopPropagation()}
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-text-muted">{product.teamName}</p>
              <h3 className="mt-2 text-2xl font-black text-text-primary">{product.name}</h3>
              <p className="mt-2 max-w-xl text-sm text-text-secondary">{product.description}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/5 p-2 text-text-secondary transition-colors hover:text-text-primary"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.05fr,0.95fr]">
            <ProductArtwork product={product} />

            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-text-secondary">Starting from</span>
                <span className="text-2xl font-black text-text-primary">{formatCurrency(product.price)}</span>
              </div>

              <label className="mb-4 block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.3em] text-text-muted">Size</span>
                <select value={size} onChange={event => setSize(event.target.value)} className="input w-full">
                  {product.sizes.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="mb-4 block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.3em] text-text-muted">Quantity</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={quantity}
                  onChange={event => setQuantity(Math.max(1, Number(event.target.value) || 1))}
                  className="input w-full"
                />
              </label>

              {product.customizable && (
                <>
                  <label className="mb-4 block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.3em] text-text-muted">Name on back</span>
                    <input
                      value={customName}
                      onChange={event => setCustomName(event.target.value.slice(0, 16))}
                      placeholder="Optional"
                      className="input w-full"
                    />
                  </label>

                  <label className="mb-5 block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.3em] text-text-muted">Number</span>
                    <input
                      value={customNumber}
                      onChange={event => setCustomNumber(event.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                      placeholder="Optional"
                      className="input w-full"
                    />
                  </label>
                </>
              )}

              <button
                onClick={handleAddToCart}
                className="btn-primary flex w-full items-center justify-center gap-2 py-3"
              >
                <ShoppingBag size={16} />
                Add to cart
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function ProductCard({
  product,
  compact,
  onOpenOptions,
}: {
  product: MerchProduct
  compact?: boolean
  onOpenOptions: (product: MerchProduct) => void
}) {
  const { addItem } = useCart()
  const hasOptions = product.customizable || product.sizes.length > 1

  function handlePrimaryAction() {
    if (hasOptions) {
      onOpenOptions(product)
      return
    }

    addItem({
      product,
      size: product.sizes[0] ?? 'Standard',
      quantity: 1,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group overflow-hidden rounded-[2rem] border border-white/10 bg-[#111111] shadow-[0_24px_60px_rgba(0,0,0,0.28)]"
    >
      <div
        className={`relative p-3 ${compact ? 'pb-2' : 'pb-3'}`}
        style={{
          background: `linear-gradient(180deg, ${hexToRgba(product.branding.secondary, 0.2)} 0%, ${hexToRgba(product.branding.primary, 0.06)} 100%)`,
        }}
      >
        <ProductArtwork product={product} />
        {product.badge && (
          <span
            className="absolute left-6 top-6 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.3em]"
            style={{
              background: hexToRgba(product.branding.accent, 0.2),
              color: product.branding.secondary,
            }}
          >
            {product.badge}
          </span>
        )}
      </div>

      <div className={`${compact ? 'p-4' : 'p-5'}`}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-text-muted">{product.teamName}</p>
            <h3 className="mt-2 text-xl font-black leading-tight text-text-primary">{product.name}</h3>
          </div>
          <div
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              background: hexToRgba(product.branding.primary, 0.16),
              color: product.branding.secondary,
            }}
          >
            {formatCurrency(product.price)}
          </div>
        </div>

        <p className="mb-4 text-sm leading-6 text-text-secondary">{product.description}</p>

        <div className="mb-5 flex flex-wrap gap-2">
          {product.sizes.map(size => (
            <span key={size} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-text-muted">
              {size}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <button onClick={handlePrimaryAction} className="btn-primary min-w-[9rem]">
            {product.customizable ? 'Customize' : hasOptions ? 'Choose options' : 'Add to cart'}
          </button>
          <div className="h-10 flex-1 rounded-full border border-white/10 bg-white/[0.03]" style={{
            backgroundImage: `linear-gradient(90deg, ${product.branding.primary} 0 33%, ${product.branding.accent} 33% 66%, ${product.branding.secondary} 66% 100%)`,
          }} />
        </div>
      </div>
    </motion.div>
  )
}

export function MerchandiseCatalog({
  products,
  compact,
  showFilters = false,
  showCartSummary = false,
}: CatalogProps) {
  const { itemCount, subtotal } = useCart()
  const [selectedCategory, setSelectedCategory] = useState<'all' | MerchCategory>('all')
  const [selectedProduct, setSelectedProduct] = useState<MerchProduct | null>(null)

  const filteredProducts = useMemo(
    () => products.filter(product => selectedCategory === 'all' || product.category === selectedCategory),
    [products, selectedCategory]
  )

  return (
    <>
      {(showFilters || showCartSummary) && (
        <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          {showFilters ? (
            <div className="flex flex-wrap gap-2">
              {(Object.keys(MERCH_CATEGORY_LABELS) as Array<'all' | MerchCategory>).map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                    selectedCategory === category
                      ? 'border-brand-primary bg-brand-primary text-white'
                      : 'border-white/10 bg-white/[0.03] text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {MERCH_CATEGORY_LABELS[category]}
                </button>
              ))}
            </div>
          ) : <div />}

          {showCartSummary && (
            <div className="flex flex-col gap-3 rounded-[1.75rem] border border-white/10 bg-[#111111] p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.35em] text-text-muted">Cart</p>
                <p className="mt-2 text-lg font-bold text-text-primary">{itemCount} item{itemCount === 1 ? '' : 's'} ready</p>
                <p className="text-sm text-text-secondary">{formatCurrency(subtotal)} subtotal</p>
              </div>
              <Link href="/cart" className="btn-primary text-center">
                Proceed to checkout
              </Link>
            </div>
          )}
        </div>
      )}

      <div className={`grid grid-cols-1 gap-5 ${compact ? 'lg:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-2 xl:grid-cols-4'}`}>
        {filteredProducts.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            compact={compact}
            onOpenOptions={setSelectedProduct}
          />
        ))}
      </div>

      {selectedProduct && (
        <OptionsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  )
}
