'use client'

import { motion } from 'framer-motion'
import { ShoppingBag, Star, Package } from 'lucide-react'
import { useState } from 'react'

type Category = 'all' | 'kit' | 'accessories' | 'prints'

const products = [
  {
    id: 1,
    name: 'CESP Home Shirt 2026',
    price: 35,
    category: 'kit',
    badge: 'New',
    rating: 4.9,
    reviews: 24,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    description: 'Official 2026 home shirt. Lightweight moisture-wicking fabric.',
  },
  {
    id: 2,
    name: 'CESP Away Shirt 2026',
    price: 35,
    category: 'kit',
    badge: 'New',
    rating: 4.8,
    reviews: 18,
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Official 2026 away shirt in charcoal and orange.',
  },
  {
    id: 3,
    name: 'Training Top',
    price: 22,
    category: 'kit',
    badge: null,
    rating: 4.7,
    reviews: 11,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    description: 'Lightweight training top. Perfect for matchday warm-ups.',
  },
  {
    id: 4,
    name: 'CESP Cap',
    price: 14,
    category: 'accessories',
    badge: 'Popular',
    rating: 5.0,
    reviews: 32,
    sizes: ['One size'],
    description: 'Embroidered snapback cap. One size fits all.',
  },
  {
    id: 5,
    name: 'Scarf',
    price: 12,
    category: 'accessories',
    badge: null,
    rating: 4.8,
    reviews: 9,
    sizes: ['One size'],
    description: 'Knitted supporter scarf in CESP colours.',
  },
  {
    id: 6,
    name: 'Water Bottle',
    price: 10,
    category: 'accessories',
    badge: null,
    rating: 4.6,
    reviews: 7,
    sizes: ['750ml'],
    description: 'Stainless steel bottle with CESP crest.',
  },
  {
    id: 7,
    name: 'Match Day Print - Final 2025',
    price: 18,
    category: 'prints',
    badge: 'Limited',
    rating: 5.0,
    reviews: 14,
    sizes: ['A3', 'A2'],
    description: 'Limited run signed print commemorating the 2025 final.',
  },
  {
    id: 8,
    name: 'Season Poster 2026',
    price: 12,
    category: 'prints',
    badge: 'New',
    rating: 4.9,
    reviews: 6,
    sizes: ['A3', 'A2'],
    description: 'Official 2026 season team poster, ready to frame.',
  },
]

const categoryLabels: Record<Category, string> = {
  all: 'All',
  kit: 'Kit',
  accessories: 'Accessories',
  prints: 'Prints',
}

const badgeColour: Record<string, string> = {
  'New': 'badge-brand',
  'Popular': 'bg-status-success/15 text-status-success badge',
  'Limited': 'bg-status-warning/15 text-status-warning badge',
}

export default function ShopPage() {
  const [category, setCategory] = useState<Category>('all')

  const filtered = products.filter(p => category === 'all' || p.category === category)

  return (
    <main className="min-h-screen bg-bg-base">
      <div className="container-cesp py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-2">
            <ShoppingBag size={24} className="text-brand-primary" />
            <h1 className="text-4xl font-bold text-text-primary">Shop</h1>
          </div>
          <p className="text-text-secondary">Official Clarendon Elite Cup merchandise. All profits support the league.</p>
        </motion.div>

        <div className="flex items-center gap-2 mb-8">
          {(Object.keys(categoryLabels) as Category[]).map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                category === c
                  ? 'bg-brand-primary text-white'
                  : 'bg-bg-muted text-text-secondary hover:text-text-primary border border-bg-border'
              }`}
            >
              {categoryLabels[c]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4 }}
              className="card-hover group flex flex-col"
            >
              <div className="w-full aspect-square rounded-xl bg-bg-muted mb-4 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5" />
                <Package size={40} className="text-bg-border" />
                {product.badge && (
                  <span className={`absolute top-2 left-2 ${badgeColour[product.badge] ?? 'badge-brand'}`}>
                    {product.badge}
                  </span>
                )}
              </div>

              <div className="flex-1 flex flex-col">
                <h3 className="font-semibold text-text-primary mb-1 group-hover:text-brand-secondary transition-colors text-sm">
                  {product.name}
                </h3>
                <p className="text-xs text-text-muted mb-2 line-clamp-2 flex-1">{product.description}</p>

                <div className="flex items-center gap-1 mb-3 text-xs text-text-muted">
                  <Star size={11} className="text-status-warning fill-status-warning" />
                  <span className="text-text-secondary">{product.rating}</span>
                  <span>({product.reviews})</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-text-primary">£{product.price}</span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-primary text-xs px-3 py-1.5"
                  >
                    Add to cart
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-12 card text-center border-brand-primary/20 bg-brand-primary/5"
        >
          <ShoppingBag size={28} className="text-brand-primary mx-auto mb-3" />
          <h3 className="font-bold text-text-primary mb-1">Bulk or team orders</h3>
          <p className="text-sm text-text-secondary mb-4">
            Need kit for your whole squad? We offer discounted team orders. Get in touch.
          </p>
          <a href="mailto:shop@clarendonelite.com" className="btn-secondary">
            Contact us
          </a>
        </motion.div>
      </div>
    </main>
  )
}
