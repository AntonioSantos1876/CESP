'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { MerchProduct } from '@/lib/merch'

const STORAGE_KEY = 'cesp-cart-v1'

export type CartItem = {
  id: string
  productId: string
  teamName: string
  name: string
  kind: MerchProduct['kind']
  price: number
  quantity: number
  size: string
  customName?: string
  customNumber?: string
  imagePath?: string
  primaryColor: string
  secondaryColor: string
}

type AddCartItemInput = {
  product: MerchProduct
  quantity?: number
  size: string
  customName?: string
  customNumber?: string
}

type CartContextValue = {
  items: CartItem[]
  itemCount: number
  subtotal: number
  addItem: (input: AddCartItemInput) => void
  updateQuantity: (itemId: string, quantity: number) => void
  removeItem: (itemId: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function buildItemId(input: AddCartItemInput) {
  const customName = input.customName?.trim().toUpperCase() ?? ''
  const customNumber = input.customNumber?.trim() ?? ''
  return [input.product.id, input.size, customName, customNumber].join('::')
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (!saved) return
      const parsed = JSON.parse(saved) as CartItem[]
      if (Array.isArray(parsed)) {
        setItems(parsed)
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const value = useMemo<CartContextValue>(() => ({
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    addItem: (input) => {
      const itemId = buildItemId(input)
      const customName = input.customName?.trim()
      const customNumber = input.customNumber?.trim()

      setItems(current => {
        const existing = current.find(item => item.id === itemId)
        if (existing) {
          return current.map(item =>
            item.id === itemId
              ? { ...item, quantity: item.quantity + (input.quantity ?? 1) }
              : item
          )
        }

        return [
          ...current,
          {
            id: itemId,
            productId: input.product.id,
            teamName: input.product.teamName,
            name: input.product.name,
            kind: input.product.kind,
            price: input.product.price,
            quantity: input.quantity ?? 1,
            size: input.size,
            customName: customName || undefined,
            customNumber: customNumber || undefined,
            imagePath: input.product.kind === 'jersey' ? input.product.imagePath : undefined,
            primaryColor: input.product.branding.primary,
            secondaryColor: input.product.branding.secondary,
          },
        ]
      })
    },
    updateQuantity: (itemId, quantity) => {
      setItems(current =>
        current.flatMap(item => {
          if (item.id !== itemId) return [item]
          if (quantity <= 0) return []
          return [{ ...item, quantity }]
        })
      )
    },
    removeItem: (itemId) => {
      setItems(current => current.filter(item => item.id !== itemId))
    },
    clearCart: () => {
      setItems([])
    },
  }), [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
