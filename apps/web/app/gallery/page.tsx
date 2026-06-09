'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Play,
  Upload,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Category = 'all' | 'spotlight' | 'teams' | 'matchday' | 'awards'
type MediaType = 'image' | 'video'
type Aspect = 'square' | 'wide' | 'tall'
type UserRole = 'fan' | 'super_admin' | 'team_admin' | 'coach' | 'livestream_operator' | 'photographer' | 'volunteer'

type GalleryItem = {
  id: string
  title: string
  description: string
  category: Exclude<Category, 'all'>
  type: MediaType
  aspect: Aspect
  src: string
  storagePath?: string
}

type GalleryPhotoRow = {
  id: string
  title: string
  description: string | null
  category: string
  media_type: string
  aspect: string
  url: string
}

const UPLOAD_ROLES: UserRole[] = ['super_admin', 'photographer']
const GALLERY_UPLOAD_ALBUM_TITLE = 'Gallery Uploads'

const STATIC_GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'seed-1',
    title: 'Glenmuir High School 2025 Champions Standing Ovation',
    description: 'Standing ovation on the pitch for Glenmuir High School, winners of the 2025 season.',
    category: 'awards',
    type: 'video',
    aspect: 'wide',
    src: '/gallery/launch-june-2026/founder-smile-jamaica-interview.mp4',
  },
  {
    id: 'seed-2',
    title: 'Denbigh High School Third Place',
    description: 'Denbigh High School celebrate finishing third in the 2025 Clarendon Elite Sports Program season.',
    category: 'awards',
    type: 'image',
    aspect: 'tall',
    src: '/gallery/launch-june-2026/founder-smile-jamaica-set.jpeg',
  },
  {
    id: 'seed-3',
    title: 'Founder Trophy Portrait',
    description: 'Studio portrait with the 2025 winner trophy after the television feature.',
    category: 'spotlight',
    type: 'image',
    aspect: 'tall',
    src: '/gallery/launch-june-2026/founder-trophy-portrait.jpeg',
  },
  {
    id: 'seed-4',
    title: 'Smile Jamaica Interview',
    description: 'Anthony Baker shares the Clarendon Elite Sports Program story on TVJ.',
    category: 'spotlight',
    type: 'video',
    aspect: 'wide',
    src: '/gallery/launch-june-2026/tournament-highlights.mp4',
  },
  {
    id: 'seed-5',
    title: 'Pre-match Lineup',
    description: 'Both squads line up before kick-off in Clarendon.',
    category: 'matchday',
    type: 'image',
    aspect: 'wide',
    src: '/gallery/launch-june-2026/prematch-handshake-lineup.jpeg',
  },
  {
    id: 'seed-6',
    title: 'Denbigh Starting XI',
    description: 'Denbigh High School team photo before the match.',
    category: 'teams',
    type: 'image',
    aspect: 'tall',
    src: '/gallery/launch-june-2026/team-denbigh-lineup.jpeg',
  },
  {
    id: 'seed-7',
    title: 'Manchester Starting XI',
    description: 'Manchester High School squad lined up on matchday.',
    category: 'teams',
    type: 'image',
    aspect: 'tall',
    src: '/gallery/launch-june-2026/team-manchester-lineup.jpeg',
  },
  {
    id: 'seed-8',
    title: 'Glenmuir & Belair High School Full Team',
    description: 'Glenmuir and Belair High School full team photo on the pitch, last year.',
    category: 'teams',
    type: 'image',
    aspect: 'wide',
    src: '/gallery/launch-june-2026/team-excelsior-lineup.jpeg',
  },
  {
    id: 'seed-9',
    title: 'Vere Technical High School 2025',
    description: 'Vere Technical High School squad photo from last year’s tournament.',
    category: 'teams',
    type: 'image',
    aspect: 'wide',
    src: '/gallery/launch-june-2026/team-vere-last-year.jpeg',
  },
  {
    id: 'seed-10',
    title: 'Glenmuir High School Starting XI',
    description: 'Glenmuir High School starting eleven lined up on the pitch, last year.',
    category: 'teams',
    type: 'image',
    aspect: 'wide',
    src: '/gallery/launch-june-2026/team-denbigh-celebration.jpeg',
  },
  {
    id: 'seed-11',
    title: 'Vere Award Presentation',
    description: 'Vere Technical High School collect their second-place presentation.',
    category: 'awards',
    type: 'image',
    aspect: 'tall',
    src: '/gallery/launch-june-2026/team-vere-award.jpeg',
  },
  {
    id: 'seed-12',
    title: 'Denbigh High School Starting XI',
    description: 'Denbigh High School starting eleven lined up on the pitch, last year.',
    category: 'teams',
    type: 'image',
    aspect: 'tall',
    src: '/gallery/launch-june-2026/team-chapelton-award.jpeg',
  },
  {
    id: 'seed-13',
    title: 'Vere Technical High School Starting XI',
    description: 'Vere Technical High School starting eleven lined up on the pitch, last year.',
    category: 'teams',
    type: 'image',
    aspect: 'tall',
    src: '/gallery/launch-june-2026/team-denbigh-award.jpeg',
  },
]

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

function normaliseAspect(value: string | null | undefined): Aspect {
  return value === 'wide' || value === 'tall' ? value : 'square'
}

function normaliseCategory(value: string | null | undefined): Exclude<Category, 'all'> {
  return value === 'spotlight' || value === 'teams' || value === 'awards' ? value : 'matchday'
}

function normaliseMediaType(value: string | null | undefined): MediaType {
  return value === 'video' ? 'video' : 'image'
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-|-$/g, '')
}

function getStoragePathFromPublicUrl(url: string) {
  const marker = '/storage/v1/object/public/gallery-media/'
  const markerIndex = url.indexOf(marker)

  if (markerIndex === -1) return null

  const path = url.slice(markerIndex + marker.length).split('?')[0]
  return path || null
}

async function inferAspect(file: File): Promise<Aspect> {
  if (typeof window === 'undefined') return 'square'

  const objectUrl = URL.createObjectURL(file)

  try {
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      if (file.type.startsWith('video/')) {
        const video = document.createElement('video')
        video.preload = 'metadata'
        video.onloadedmetadata = () => resolve({ width: video.videoWidth, height: video.videoHeight })
        video.onerror = () => reject(new Error('Unable to read video dimensions.'))
        video.src = objectUrl
        return
      }

      const image = new window.Image()
      image.onload = () => resolve({ width: image.width, height: image.height })
      image.onerror = () => reject(new Error('Unable to read image dimensions.'))
      image.src = objectUrl
    })

    const ratio = dimensions.width / Math.max(dimensions.height, 1)
    if (ratio >= 1.35) return 'wide'
    if (ratio <= 0.8) return 'tall'
    return 'square'
  } catch {
    return 'square'
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function MediaCard({
  item,
  onOpen,
}: {
  item: GalleryItem
  onOpen: (id: string) => void
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
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(STATIC_GALLERY_ITEMS)
  const [lightboxId, setLightboxId] = useState<string | null>(null)
  const [videoMuted, setVideoMuted] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [uploadCategory, setUploadCategory] = useState<Exclude<Category, 'all'>>('matchday')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')

  useEffect(() => {
    async function loadGallery() {
      const supabase = createClient()
      const { data: photos } = await (supabase as any)
        .from('gallery_photos')
        .select('id, title, description, category, media_type, aspect, url')
        .order('created_at', { ascending: false })

      const uploadedItems = ((photos ?? []) as GalleryPhotoRow[]).map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description ?? 'New upload to the Clarendon Elite gallery.',
        category: normaliseCategory(item.category),
        type: normaliseMediaType(item.media_type),
        aspect: normaliseAspect(item.aspect),
        src: item.url,
        storagePath: getStoragePathFromPublicUrl(item.url) ?? undefined,
      }))

      setGalleryItems([...uploadedItems, ...STATIC_GALLERY_ITEMS])
    }

    async function loadUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setUserId(null)
        setUserRole(null)
        return
      }

      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      setUserId(user.id)
      setUserRole((profile?.role as UserRole | undefined) ?? null)
    }

    loadGallery()
    loadUser()
  }, [])

  const canUploadMedia = !!userId && !!userRole && UPLOAD_ROLES.includes(userRole)
  const canDeleteMedia = userRole === 'super_admin'

  const filtered = useMemo(
    () => (category === 'all' ? galleryItems : galleryItems.filter((item) => item.category === category)),
    [category, galleryItems]
  )

  const lightboxIndex = lightboxId === null ? -1 : filtered.findIndex((item) => item.id === lightboxId)
  const lightboxItem = lightboxIndex >= 0 ? filtered[lightboxIndex] : null

  function openLightbox(id: string) {
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
    setVideoMuted((current) => !current)
  }

  function resetUploadForm() {
    setTitle('')
    setDescription('')
    setUploadCategory('matchday')
    setUploadFile(null)
    setUploadError('')
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setUploadFile(event.target.files?.[0] ?? null)
    setUploadError('')
  }

  async function handleUpload() {
    if (!userId || !canUploadMedia) {
      setUploadError('You need an approved photographer or super admin account to upload.')
      return
    }

    if (!title.trim()) {
      setUploadError('Title is required.')
      return
    }

    if (!uploadFile) {
      setUploadError('Choose a file to upload.')
      return
    }

    setUploading(true)
    setUploadError('')
    setUploadSuccess('')

    const supabase = createClient()

    let albumId: string | null = null
    const { data: existingAlbum, error: albumLookupError } = await (supabase as any)
      .from('gallery_albums')
      .select('id')
      .eq('author_id', userId)
      .eq('title', GALLERY_UPLOAD_ALBUM_TITLE)
      .maybeSingle()

    if (albumLookupError) {
      setUploadError(albumLookupError.message)
      setUploading(false)
      return
    }

    albumId = existingAlbum?.id ?? null

    if (!albumId) {
      const { data: newAlbum, error: albumCreateError } = await (supabase as any)
        .from('gallery_albums')
        .insert({
          title: GALLERY_UPLOAD_ALBUM_TITLE,
          description: 'Uploads submitted from the public gallery page.',
          author_id: userId,
          is_published: true,
        })
        .select('id')
        .single()

      if (albumCreateError) {
        setUploadError(albumCreateError.message)
        setUploading(false)
        return
      }

      albumId = newAlbum?.id ?? null
    }

    const filePath = `${userId}/${Date.now()}-${slugify(uploadFile.name)}`
    const { error: uploadStorageError } = await supabase.storage
      .from('gallery-media')
      .upload(filePath, uploadFile, {
        cacheControl: '3600',
        upsert: false,
        contentType: uploadFile.type,
      })

    if (uploadStorageError) {
      setUploadError(uploadStorageError.message)
      setUploading(false)
      return
    }

    const { data: publicData } = supabase.storage
      .from('gallery-media')
      .getPublicUrl(filePath)

    const mediaType: MediaType = uploadFile.type.startsWith('video/') ? 'video' : 'image'
    const aspect = await inferAspect(uploadFile)

    const { data: insertedPhoto, error: insertError } = await (supabase as any)
      .from('gallery_photos')
      .insert({
        album_id: albumId,
        url: publicData.publicUrl,
        thumbnail_url: mediaType === 'image' ? publicData.publicUrl : null,
        caption: description.trim() || title.trim(),
        title: title.trim(),
        description: description.trim() || null,
        media_type: mediaType,
        category: uploadCategory,
        aspect,
        sort_order: 0,
      })
      .select('id, title, description, category, media_type, aspect, url')
      .single()

    setUploading(false)

    if (insertError) {
      await supabase.storage.from('gallery-media').remove([filePath])
      setUploadError(insertError.message)
      return
    }

    const newItem: GalleryItem = {
      id: insertedPhoto.id,
      title: insertedPhoto.title,
      description: insertedPhoto.description ?? 'New upload to the Clarendon Elite gallery.',
      category: normaliseCategory(insertedPhoto.category),
      type: normaliseMediaType(insertedPhoto.media_type),
      aspect: normaliseAspect(insertedPhoto.aspect),
      src: insertedPhoto.url,
      storagePath: filePath,
    }

    setGalleryItems((current) => [newItem, ...current])
    setUploadSuccess('Media uploaded to the gallery.')
    resetUploadForm()
    setUploadOpen(false)
  }

  async function handleDeleteMedia() {
    if (!lightboxItem?.storagePath || !canDeleteMedia) return

    const confirmed = window.confirm(`Delete "${lightboxItem.title}" from the gallery?`)
    if (!confirmed) return

    const supabase = createClient()
    setUploadError('')
    setUploadSuccess('')

    const { error: storageDeleteError } = await supabase.storage
      .from('gallery-media')
      .remove([lightboxItem.storagePath])

    if (storageDeleteError) {
      setUploadError(storageDeleteError.message)
      return
    }

    const { error: photoDeleteError } = await (supabase as any)
      .from('gallery_photos')
      .delete()
      .eq('id', lightboxItem.id)

    if (photoDeleteError) {
      setUploadError(photoDeleteError.message)
      return
    }

    setGalleryItems((current) => current.filter((item) => item.id !== lightboxItem.id))
    setUploadSuccess('Media deleted from the gallery.')
    closeLightbox()
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
            <div className="flex flex-wrap gap-3 self-start">
              <button
                onClick={() => {
                  setUploadError('')
                  setUploadSuccess('')
                  setUploadOpen(true)
                }}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <Upload size={16} />
                Upload media
              </button>
              <a
                href="mailto:clarendonelitecup@gmail.com?subject=Gallery%20Media%20For%20Review&body=Please%20attach%20your%20photos%20or%20videos%20for%20gallery%20review.%0A%0AInclude%20the%20match%2C%20team%2C%20or%20moment%20in%20your%20message."
                className="inline-flex items-center gap-2 rounded-xl border border-bg-border px-4 py-2.5 text-sm text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
              >
                Email gallery desk
              </a>
            </div>
          </div>
          <p className="max-w-2xl text-text-secondary">
            Match photos, team portraits, award presentations, and Smile Jamaica media moments from the Clarendon Elite Sports Program.
          </p>
          <p className="mt-3 text-sm text-text-muted">
            Super admins can upload and remove gallery media. Photographers can upload for review. Everyone else can email the gallery desk with photos or videos to be checked before posting.
          </p>
          {uploadSuccess && <p className="mt-3 text-sm text-emerald-400">{uploadSuccess}</p>}
        </motion.div>

        <div className="mb-8 flex flex-wrap items-center gap-2">
          {(Object.keys(LABELS) as Category[]).map((entry) => (
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
            {filtered.map((item) => (
              <MediaCard key={item.id} item={item} onOpen={openLightbox} />
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <div className="py-20 text-center text-text-muted">No media in this section yet.</div>
        )}
      </div>

      <AnimatePresence>
        {uploadOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/90 p-4 backdrop-blur-md"
            onClick={() => {
              setUploadOpen(false)
              setUploadError('')
            }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-lg rounded-[1.6rem] border border-white/10 bg-[#111111] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.42)]"
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-text-primary">Upload gallery media</h2>
                  <p className="mt-1 text-sm text-text-muted">
                    Super admins and photographers can add match photos or videos here.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setUploadOpen(false)
                    setUploadError('')
                  }}
                  className="rounded-full p-2 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
                >
                  <X size={16} />
                </button>
              </div>

              {!userId ? (
                <div className="space-y-4">
                  <p className="text-sm text-text-secondary">
                    Sign in first to upload gallery media.
                  </p>
                  <Link href="/auth/login?redirectTo=/gallery" className="btn-primary inline-flex">
                    Sign in to continue
                  </Link>
                </div>
              ) : !canUploadMedia ? (
                <div className="space-y-4">
                  <p className="text-sm text-text-secondary">
                    Your account can view the gallery, but direct uploads are limited to photographers and super admins.
                  </p>
                  <Link href="/profile" className="btn-secondary inline-flex">
                    Open profile
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm text-text-muted">Title</label>
                    <input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="e.g. Semi-final tunnel walk"
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm text-text-muted">Description</label>
                    <textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Add a short caption for the gallery."
                      rows={4}
                      className="input w-full resize-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm text-text-muted">Category</label>
                    <select
                      value={uploadCategory}
                      onChange={(event) => setUploadCategory(event.target.value as Exclude<Category, 'all'>)}
                      className="input w-full"
                    >
                      <option value="matchday">Match Day</option>
                      <option value="teams">Teams</option>
                      <option value="awards">Awards</option>
                      <option value="spotlight">Spotlight</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm text-text-muted">File</label>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="block w-full rounded-xl border border-bg-border bg-bg-muted px-4 py-3 text-sm text-text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-brand-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
                    />
                    <p className="mt-2 text-xs text-text-muted">
                      Images and videos are supported. If you do not have upload access, send them to the gallery desk for review by email.
                    </p>
                  </div>

                  {uploadError && <p className="text-sm text-red-400">{uploadError}</p>}

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        setUploadOpen(false)
                        setUploadError('')
                      }}
                      className="rounded-xl border border-bg-border px-4 py-2.5 text-sm text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
                    >
                      {uploading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <Upload size={15} />
                      )}
                      Upload now
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              onClick={(event) => event.stopPropagation()}
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
                    className="absolute right-4 top-4 rounded-full border border-white/15 bg-black/45 p-2 text-white transition-colors hover:bg-black/65"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex flex-col gap-5 px-6 py-5 md:flex-row md:items-end md:justify-between">
                  <div className="max-w-3xl">
                    <div className="mb-2 flex items-center gap-2">
                      <span className={`badge ${lightboxItem.category === 'matchday' ? 'badge-brand' : 'bg-white/5 text-text-secondary border border-white/10'}`}>
                        {LABELS[lightboxItem.category]}
                      </span>
                      {lightboxItem.type === 'video' && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-white">
                          <Play size={11} />
                          Highlight clip
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold text-white">{lightboxItem.title}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">{lightboxItem.description}</p>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-auto">
                    {canDeleteMedia && lightboxItem.storagePath ? (
                      <button
                        onClick={handleDeleteMedia}
                        className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/20"
                      >
                        <Trash2 size={16} />
                        Delete media
                      </button>
                    ) : null}
                    <button
                      onClick={showPrevious}
                      disabled={lightboxIndex <= 0}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/5 text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={showNext}
                      disabled={lightboxIndex < 0 || lightboxIndex >= filtered.length - 1}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/5 text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      <ChevronRight size={18} />
                    </button>
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
