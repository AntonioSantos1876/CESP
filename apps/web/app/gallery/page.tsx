'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Play, Upload, Volume2, VolumeX, X, ChevronLeft, ChevronRight } from 'lucide-react'

type Category = 'all' | 'spotlight' | 'teams' | 'matchday' | 'awards'
type MediaType = 'image' | 'video'
type Aspect = 'square' | 'wide' | 'tall'

type GalleryItem = {
  id: number
  title: string
  description: string
  category: Exclude<Category, 'all'>
  type: MediaType
  aspect: Aspect
  src: string
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 1,
    title: 'Smile Jamaica Interview',
    description: 'Anthony Baker shares the Clarendon Elite Sports Program story on TVJ.',
    category: 'spotlight',
    type: 'video',
    aspect: 'wide',
    src: '/gallery/launch-june-2026/founder-smile-jamaica-interview.mp4',
  },
  {
    id: 2,
    title: 'Founder On Set',
    description: 'Anthony Baker on the Smile Jamaica set with the Clarendon Elite trophy.',
    category: 'spotlight',
    type: 'image',
    aspect: 'tall',
    src: '/gallery/launch-june-2026/founder-smile-jamaica-set.jpeg',
  },
  {
    id: 3,
    title: 'Founder Trophy Portrait',
    description: 'Studio portrait with the 2025 winner trophy after the television feature.',
    category: 'spotlight',
    type: 'image',
    aspect: 'tall',
    src: '/gallery/launch-june-2026/founder-trophy-portrait.jpeg',
  },
  {
    id: 4,
    title: 'Tournament Highlights',
    description: 'Video recap from the tournament atmosphere and the teams on show.',
    category: 'matchday',
    type: 'video',
    aspect: 'wide',
    src: '/gallery/launch-june-2026/tournament-highlights.mp4',
  },
  {
    id: 5,
    title: 'Pre-match Lineup',
    description: 'Both squads line up before kick-off in Clarendon.',
    category: 'matchday',
    type: 'image',
    aspect: 'wide',
    src: '/gallery/launch-june-2026/prematch-handshake-lineup.jpeg',
  },
  {
    id: 6,
    title: 'Denbigh Starting XI',
    description: 'Denbigh High School team photo before the match.',
    category: 'teams',
    type: 'image',
    aspect: 'tall',
    src: '/gallery/launch-june-2026/team-denbigh-lineup.jpeg',
  },
  {
    id: 7,
    title: 'Manchester Starting XI',
    description: 'Manchester High School squad lined up on matchday.',
    category: 'teams',
    type: 'image',
    aspect: 'tall',
    src: '/gallery/launch-june-2026/team-manchester-lineup.jpeg',
  },
  {
    id: 8,
    title: 'Glenmuir & Belair High School Full Team',
    description: 'Glenmuir and Belair High School full team photo on the pitch, last year.',
    category: 'teams',
    type: 'image',
    aspect: 'wide',
    src: '/gallery/launch-june-2026/team-excelsior-lineup.jpeg',
  },
  {
    id: 9,
    title: 'Vere Technical High School 2025',
    description: 'Vere Technical High School squad photo from last year’s tournament.',
    category: 'teams',
    type: 'image',
    aspect: 'wide',
    src: '/gallery/launch-june-2026/team-vere-last-year.jpeg',
  },
  {
    id: 10,
    title: 'Glenmuir High School Starting XI',
    description: 'Glenmuir High School starting eleven lined up on the pitch, last year.',
    category: 'teams',
    type: 'image',
    aspect: 'wide',
    src: '/gallery/launch-june-2026/team-denbigh-celebration.jpeg',
  },
  {
    id: 11,
    title: 'Vere Award Presentation',
    description: 'Vere Technical High School collect their second-place presentation.',
    category: 'awards',
    type: 'image',
    aspect: 'tall',
    src: '/gallery/launch-june-2026/team-vere-award.jpeg',
  },
  {
    id: 12,
    title: 'Chapelton Award Presentation',
    description: 'Chapelton High School celebrate with their award presentation.',
    category: 'awards',
    type: 'image',
    aspect: 'tall',
    src: '/gallery/launch-june-2026/team-chapelton-award.jpeg',
  },
  {
    id: 13,
    title: 'Denbigh Award Presentation',
    description: 'Denbigh High School celebrate with their prize presentation.',
    category: 'awards',
    type: 'image',
    aspect: 'tall',
    src: '/gallery/launch-june-2026/team-denbigh-award.jpeg',
  },
] as const

const LABELS: Record<Category, string> = {
  all: 'All Media',
  spotlight: 'Spotlight',
  teams: 'Teams',
  matchday: 'Match Day',
  awards: 'Awards',
}

function aspectClass(aspect: Aspect) {
  if (aspect === 'wide') return 'col-span-2 row-span-1'
  if (aspect === 'tall') return 'col-span-1 row-span-2'
  return 'col-span-1 row-span-1'
}

function aspectRatio(aspect: Aspect) {
  if (aspect === 'wide') return 'aspect-[16/9]'
  if (aspect === 'tall') return 'aspect-[3/4]'
  return 'aspect-square'
}

function MediaCard({
  item,
  onOpen,
}: {
  item: GalleryItem
  onOpen: (id: number) => void
}) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.28 }}
      onClick={() => onOpen(item.id)}
      className={`${aspectClass(item.aspect)} group relative overflow-hidden rounded-[1.4rem] border border-white/10 bg-[#111111] text-left shadow-[0_20px_55px_rgba(0,0,0,0.28)]`}
    >
      <div className={`relative h-full w-full ${aspectRatio(item.aspect)}`}>
        {item.type === 'image' ? (
          <Image
            src={item.src}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <video
            src={item.src}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className={`badge text-[10px] ${item.category === 'matchday' ? 'badge-brand' : 'bg-black/45 text-white border border-white/10'}`}>
            {LABELS[item.category]}
          </span>
          {item.type === 'video' && (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-white">
              <Play size={11} />
              Video
            </span>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="text-sm font-bold text-white md:text-base">{item.title}</p>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/78">{item.description}</p>
          {item.type === 'video' && (
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-secondary">
              Opens muted. Tap video for sound.
            </p>
          )}
        </div>
      </div>
    </motion.button>
  )
}

export default function GalleryPage() {
  const [category, setCategory] = useState<Category>('all')
  const [lightboxId, setLightboxId] = useState<number | null>(null)
  const [videoMuted, setVideoMuted] = useState(true)

  const filtered = useMemo(
    () => (category === 'all' ? GALLERY_ITEMS : GALLERY_ITEMS.filter(item => item.category === category)),
    [category]
  )

  const lightboxIndex = lightboxId === null ? -1 : filtered.findIndex(item => item.id === lightboxId)
  const lightboxItem = lightboxIndex >= 0 ? filtered[lightboxIndex] : null

  function openLightbox(id: number) {
    setLightboxId(id)
    setVideoMuted(true)
  }

  function closeLightbox() {
    setLightboxId(null)
    setVideoMuted(true)
  }

  function showPrevious() {
    if (lightboxIndex <= 0) return
    setLightboxId(filtered[lightboxIndex - 1].id)
    setVideoMuted(true)
  }

  function showNext() {
    if (lightboxIndex < 0 || lightboxIndex >= filtered.length - 1) return
    setLightboxId(filtered[lightboxIndex + 1].id)
    setVideoMuted(true)
  }

  function toggleVideoAudio() {
    setVideoMuted(current => !current)
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
          <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Camera size={24} className="text-brand-primary" />
                <h1 className="text-4xl font-bold text-text-primary">Gallery</h1>
              </div>
            </div>
            <a
              href="mailto:media@clarendonelite.com?subject=Gallery%20Media%20Upload"
              className="btn-secondary inline-flex items-center gap-2 self-start"
            >
              <Upload size={16} />
              Upload media
            </a>
          </div>
          <p className="max-w-2xl text-text-secondary">
            Match photos, team portraits, award presentations, and Smile Jamaica media moments from the Clarendon Elite Sports Program.
          </p>
          <p className="mt-3 text-sm text-text-muted">
            Have more photos or clips to add? Use the upload button to send them to the gallery desk.
          </p>
        </motion.div>

        <div className="mb-8 flex flex-wrap items-center gap-2">
          {(Object.keys(LABELS) as Category[]).map(entry => (
            <button
              key={entry}
              onClick={() => setCategory(entry)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                category === entry
                  ? 'bg-brand-primary text-white'
                  : 'border border-bg-border bg-bg-muted text-text-secondary hover:text-text-primary'
              }`}
            >
              {LABELS[entry]}
            </button>
          ))}
          <span className="ml-auto text-xs text-text-muted">{filtered.length} items</span>
        </div>

        <motion.div layout className="grid grid-cols-2 auto-rows-[180px] gap-3 md:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {filtered.map(item => (
              <MediaCard key={item.id} item={item} onOpen={openLightbox} />
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <div className="py-20 text-center text-text-muted">No media in this section yet.</div>
        )}
      </div>

      <AnimatePresence>
        {lightboxItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/95 p-4 backdrop-blur-md"
            onClick={closeLightbox}
          >
            <motion.div
              initial={{ scale: 0.94 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.94 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              onClick={event => event.stopPropagation()}
              className="relative w-full max-w-5xl"
            >
              <div className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#111111] shadow-[0_30px_80px_rgba(0,0,0,0.42)]">
                <div className="relative flex min-h-[45vh] items-center justify-center bg-black">
                  {lightboxItem.type === 'image' ? (
                    <div className={`relative w-full ${aspectRatio(lightboxItem.aspect)} max-h-[75vh]`}>
                      <Image
                        src={lightboxItem.src}
                        alt={lightboxItem.title}
                        fill
                        sizes="100vw"
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="relative w-full">
                      <video
                        key={lightboxItem.id}
                        src={lightboxItem.src}
                        className="max-h-[75vh] w-full cursor-pointer bg-black object-contain"
                        autoPlay
                        muted={videoMuted}
                        loop
                        playsInline
                        controls={false}
                        preload="auto"
                        onClick={toggleVideoAudio}
                      />
                      <button
                        onClick={toggleVideoAudio}
                        className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/75"
                      >
                        {videoMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        {videoMuted ? 'Tap for sound' : 'Mute audio'}
                      </button>
                    </div>
                  )}

                  <button
                    onClick={closeLightbox}
                    className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white transition-colors hover:border-brand-primary/40"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>

                  {lightboxIndex > 0 && (
                    <button
                      onClick={showPrevious}
                      className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white transition-colors hover:border-brand-primary/40"
                      aria-label="Previous media"
                    >
                      <ChevronLeft size={18} />
                    </button>
                  )}

                  {lightboxIndex < filtered.length - 1 && (
                    <button
                      onClick={showNext}
                      className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white transition-colors hover:border-brand-primary/40"
                      aria-label="Next media"
                    >
                      <ChevronRight size={18} />
                    </button>
                  )}
                </div>

                <div className="border-t border-white/10 px-5 py-4 md:px-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <p className="text-lg font-bold text-text-primary">{lightboxItem.title}</p>
                      <p className="mt-1 max-w-3xl text-sm leading-6 text-text-secondary">{lightboxItem.description}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="badge badge-brand text-xs">{LABELS[lightboxItem.category]}</span>
                        {lightboxItem.type === 'video' && (
                          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-semibold text-text-secondary">
                            Autoplay video
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-text-muted">{lightboxIndex + 1} / {filtered.length}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
