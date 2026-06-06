'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, X, ChevronLeft, ChevronRight } from 'lucide-react'

type Category = 'all' | 'matchday' | 'teams' | 'community'

type Photo = {
  id: number
  title: string
  category: Exclude<Category, 'all'>
  aspect: 'square' | 'wide' | 'tall'
  gradient: string
}

const PHOTOS: Photo[] = [
  { id: 1, title: 'Chapelton FC matchday crowd', category: 'matchday', aspect: 'wide', gradient: 'from-brand-primary/30 to-brand-secondary/20' },
  { id: 2, title: 'MUC players training', category: 'teams', aspect: 'square', gradient: 'from-blue-500/30 to-indigo-500/20' },
  { id: 3, title: 'Porus Oval atmosphere', category: 'matchday', aspect: 'square', gradient: 'from-green-500/30 to-teal-500/20' },
  { id: 4, title: 'Community kids tournament', category: 'community', aspect: 'wide', gradient: 'from-purple-500/30 to-pink-500/20' },
  { id: 5, title: 'Frankfield Boys squad photo', category: 'teams', aspect: 'tall', gradient: 'from-red-500/30 to-orange-500/20' },
  { id: 6, title: 'Trophy presentation 2025', category: 'matchday', aspect: 'square', gradient: 'from-amber-500/30 to-yellow-500/20' },
  { id: 7, title: 'Spaldings All Stars warming up', category: 'teams', aspect: 'wide', gradient: 'from-cyan-500/30 to-sky-500/20' },
  { id: 8, title: 'Denbigh Field opening day', category: 'community', aspect: 'square', gradient: 'from-emerald-500/30 to-lime-500/20' },
  { id: 9, title: 'Rock River Rangers lineup', category: 'teams', aspect: 'square', gradient: 'from-violet-500/30 to-purple-500/20' },
  { id: 10, title: 'Half-time charity draw', category: 'matchday', aspect: 'tall', gradient: 'from-rose-500/30 to-pink-500/20' },
  { id: 11, title: 'Youth coaching session', category: 'community', aspect: 'square', gradient: 'from-teal-500/30 to-cyan-500/20' },
  { id: 12, title: 'Match referee briefing', category: 'matchday', aspect: 'wide', gradient: 'from-slate-500/30 to-gray-500/20' },
]

const LABELS: Record<Category, string> = {
  all: 'All Photos',
  matchday: 'Match Day',
  teams: 'Teams',
  community: 'Community',
}

function aspectClass(a: Photo['aspect']) {
  if (a === 'wide') return 'col-span-2 row-span-1'
  if (a === 'tall') return 'col-span-1 row-span-2'
  return 'col-span-1 row-span-1'
}

function aspectRatio(a: Photo['aspect']) {
  if (a === 'wide') return 'aspect-[16/9]'
  if (a === 'tall') return 'aspect-[3/4]'
  return 'aspect-square'
}

export default function GalleryPage() {
  const [category, setCategory] = useState<Category>('all')
  const [lightbox, setLightbox] = useState<number | null>(null)

  const filtered = category === 'all' ? PHOTOS : PHOTOS.filter(p => p.category === category)
  const lightboxPhoto = lightbox !== null ? filtered.find(p => p.id === lightbox) ?? null : null
  const lightboxIdx = lightbox !== null ? filtered.findIndex(p => p.id === lightbox) : -1

  function prev() {
    if (lightboxIdx <= 0) return
    setLightbox(filtered[lightboxIdx - 1].id)
  }
  function next() {
    if (lightboxIdx >= filtered.length - 1) return
    setLightbox(filtered[lightboxIdx + 1].id)
  }

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
            <Camera size={24} className="text-brand-primary" />
            <h1 className="text-4xl font-bold text-text-primary">Gallery</h1>
          </div>
          <p className="text-text-secondary">Photos from matches, training, and community events</p>
        </motion.div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          {(Object.keys(LABELS) as Category[]).map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                category === c
                  ? 'bg-brand-primary text-white'
                  : 'bg-bg-muted text-text-secondary hover:text-text-primary border border-bg-border'
              }`}
            >
              {LABELS[c]}
            </button>
          ))}
          <span className="ml-auto text-xs text-text-muted">{filtered.length} photos</span>
        </div>

        {/* Grid */}
        <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-[180px]">
          <AnimatePresence mode="popLayout">
            {filtered.map((photo, i) => (
              <motion.button
                key={photo.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                onClick={() => setLightbox(photo.id)}
                className={`${aspectClass(photo.aspect)} group relative rounded-2xl overflow-hidden cursor-pointer`}
              >
                <div className={`w-full h-full bg-gradient-to-br ${photo.gradient} bg-bg-card flex items-center justify-center relative`}>
                  <Camera size={32} className="text-white/20" />
                  <div className="absolute inset-0 bg-bg-base/0 group-hover:bg-bg-base/30 transition-all duration-300" />
                  <div className="absolute inset-0 p-3 flex items-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white text-xs font-medium bg-bg-base/60 backdrop-blur-sm rounded-lg px-2 py-1 line-clamp-1">
                      {photo.title}
                    </p>
                  </div>
                  <span className={`absolute top-2 right-2 badge ${photo.category === 'matchday' ? 'badge-brand' : 'bg-bg-muted/80 text-text-secondary'} text-[10px] opacity-0 group-hover:opacity-100 transition-opacity`}>
                    {LABELS[photo.category]}
                  </span>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-text-muted">No photos in this category yet.</div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-bg-base/95 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-3xl"
            >
              <div className={`w-full ${aspectRatio(lightboxPhoto.aspect)} max-h-[70vh] rounded-2xl overflow-hidden bg-gradient-to-br ${lightboxPhoto.gradient} bg-bg-card flex items-center justify-center`}>
                <Camera size={64} className="text-white/20" />
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-text-primary">{lightboxPhoto.title}</p>
                  <span className="badge badge-brand mt-1 text-xs">{LABELS[lightboxPhoto.category]}</span>
                </div>
                <p className="text-text-muted text-sm">{lightboxIdx + 1} / {filtered.length}</p>
              </div>

              {/* Nav arrows */}
              {lightboxIdx > 0 && (
                <button
                  onClick={prev}
                  className="absolute left-0 top-1/3 -translate-x-14 w-10 h-10 rounded-full bg-bg-card border border-bg-border flex items-center justify-center hover:border-brand-primary/40 transition-colors"
                >
                  <ChevronLeft size={18} className="text-text-primary" />
                </button>
              )}
              {lightboxIdx < filtered.length - 1 && (
                <button
                  onClick={next}
                  className="absolute right-0 top-1/3 translate-x-14 w-10 h-10 rounded-full bg-bg-card border border-bg-border flex items-center justify-center hover:border-brand-primary/40 transition-colors"
                >
                  <ChevronRight size={18} className="text-text-primary" />
                </button>
              )}

              <button
                onClick={() => setLightbox(null)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-bg-base/80 backdrop-blur-sm border border-bg-border flex items-center justify-center hover:border-brand-primary/40 transition-colors"
              >
                <X size={16} className="text-text-primary" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
