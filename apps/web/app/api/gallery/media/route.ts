import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

const BUCKET_NAME = 'gallery-media'
const GALLERY_UPLOAD_ALBUM_TITLE = 'Gallery Uploads'
const META_PREFIX = '__CESP_MEDIA__'
const UPLOAD_ROLES = ['super_admin', 'photographer']
const DELETE_ROLES = ['super_admin']

type GalleryCategory = 'spotlight' | 'teams' | 'matchday' | 'awards'
type GalleryMediaType = 'image' | 'video'
type GalleryAspect = 'square' | 'wide' | 'tall'

type StoredCaptionMeta = {
  title: string
  description: string
  category: GalleryCategory
  mediaType: GalleryMediaType
  aspect: GalleryAspect
}

function normaliseCategory(value: FormDataEntryValue | null): GalleryCategory {
  return value === 'spotlight' || value === 'teams' || value === 'awards' ? value : 'matchday'
}

function normaliseAspect(value: FormDataEntryValue | null): GalleryAspect {
  return value === 'wide' || value === 'tall' ? value : 'square'
}

function encodeCaption(meta: StoredCaptionMeta) {
  return `${META_PREFIX}${JSON.stringify(meta)}`
}

function decodeCaption(caption: string | null) {
  if (!caption?.startsWith(META_PREFIX)) return null

  try {
    return JSON.parse(caption.slice(META_PREFIX.length)) as StoredCaptionMeta
  } catch {
    return null
  }
}

function inferMediaTypeFromUrl(url: string): GalleryMediaType {
  return /\.(mp4|mov|webm|m4v|avi|mkv)$/i.test(url) ? 'video' : 'image'
}

function getStoragePathFromPublicUrl(url: string) {
  const marker = `/storage/v1/object/public/${BUCKET_NAME}/`
  const markerIndex = url.indexOf(marker)
  if (markerIndex === -1) return null

  const path = url.slice(markerIndex + marker.length).split('?')[0]
  return path || null
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function ensureBucket() {
  const adminSupabase = await createAdminClient()
  const { data: bucket, error } = await adminSupabase.storage.getBucket(BUCKET_NAME)

  if (!error && bucket) {
    if (!bucket.public) {
      await adminSupabase.storage.updateBucket(BUCKET_NAME, { public: true })
    }
    return adminSupabase
  }

  const { error: createError } = await adminSupabase.storage.createBucket(BUCKET_NAME, { public: true })
  if (createError && !/already exists/i.test(createError.message)) {
    throw createError
  }

  return adminSupabase
}

async function requireRole(allowedRoles: string[]) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || !allowedRoles.includes(profile.role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { user, role: profile.role as string }
}

async function ensureAlbum(adminSupabase: any, userId: string) {
  const { data: existingAlbum, error: lookupError } = await adminSupabase
    .from('gallery_albums')
    .select('id')
    .eq('author_id', userId)
    .eq('title', GALLERY_UPLOAD_ALBUM_TITLE)
    .maybeSingle()

  if (lookupError) throw lookupError
  if (existingAlbum?.id) return existingAlbum.id as string

  const { data: newAlbum, error: createError } = await adminSupabase
    .from('gallery_albums')
    .insert({
      title: GALLERY_UPLOAD_ALBUM_TITLE,
      description: 'Uploads submitted from the public gallery page.',
      author_id: userId,
      is_published: true,
    })
    .select('id')
    .single()

  if (createError) throw createError
  return newAlbum.id as string
}

export async function GET() {
  const supabase = await createClient()
  const { data: photos, error } = await (supabase as any)
    .from('gallery_photos')
    .select('id, url, thumbnail_url, caption, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const items = ((photos ?? []) as Array<{ id: string; url: string; caption: string | null }>).map((photo) => {
    const meta = decodeCaption(photo.caption)
    return {
      id: photo.id,
      title: meta?.title ?? 'Gallery Upload',
      description: meta?.description ?? 'New upload to the Clarendon Elite gallery.',
      category: meta?.category ?? 'matchday',
      type: meta?.mediaType ?? inferMediaTypeFromUrl(photo.url),
      aspect: meta?.aspect ?? 'square',
      src: photo.url,
    }
  })

  return NextResponse.json({ items })
}

export async function POST(req: Request) {
  const auth = await requireRole(UPLOAD_ROLES)
  if (auth.error) return auth.error

  const formData = await req.formData()
  const title = String(formData.get('title') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const category = normaliseCategory(formData.get('category'))
  const aspect = normaliseAspect(formData.get('aspect'))
  const file = formData.get('file')

  if (!title) {
    return NextResponse.json({ error: 'Title is required.' }, { status: 400 })
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Choose a file to upload.' }, { status: 400 })
  }

  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    return NextResponse.json({ error: 'Only images and videos are supported.' }, { status: 400 })
  }

  try {
    const adminSupabase = await ensureBucket()
    const albumId = await ensureAlbum(adminSupabase as any, auth.user.id)
    const filePath = `${auth.user.id}/${Date.now()}-${slugify(file.name)}`
    const mediaType: GalleryMediaType = file.type.startsWith('video/') ? 'video' : 'image'

    const { error: uploadError } = await adminSupabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 400 })
    }

    const { data: publicData } = adminSupabase.storage.from(BUCKET_NAME).getPublicUrl(filePath)
    const caption = encodeCaption({
      title,
      description,
      category,
      mediaType,
      aspect,
    })

    const { data: insertedPhoto, error: insertError } = await (adminSupabase as any)
      .from('gallery_photos')
      .insert({
        album_id: albumId,
        url: publicData.publicUrl,
        thumbnail_url: mediaType === 'image' ? publicData.publicUrl : null,
        caption,
        sort_order: 0,
      })
      .select('id, url')
      .single()

    if (insertError) {
      await adminSupabase.storage.from(BUCKET_NAME).remove([filePath])
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    return NextResponse.json({
      item: {
        id: insertedPhoto.id,
        title,
        description: description || 'New upload to the Clarendon Elite gallery.',
        category,
        type: mediaType,
        aspect,
        src: insertedPhoto.url,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const auth = await requireRole(DELETE_ROLES)
  if (auth.error) return auth.error

  let body: { id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!body.id) {
    return NextResponse.json({ error: 'Media id is required.' }, { status: 400 })
  }

  try {
    const adminSupabase = await ensureBucket()
    const { data: photo, error: photoError } = await (adminSupabase as any)
      .from('gallery_photos')
      .select('id, url')
      .eq('id', body.id)
      .maybeSingle()

    if (photoError) {
      return NextResponse.json({ error: photoError.message }, { status: 400 })
    }

    if (!photo) {
      return NextResponse.json({ error: 'Media not found.' }, { status: 404 })
    }

    const storagePath = getStoragePathFromPublicUrl(photo.url)
    if (storagePath) {
      const { error: storageDeleteError } = await adminSupabase.storage
        .from(BUCKET_NAME)
        .remove([storagePath])

      if (storageDeleteError) {
        return NextResponse.json({ error: storageDeleteError.message }, { status: 400 })
      }
    }

    const { error: deleteError } = await (adminSupabase as any)
      .from('gallery_photos')
      .delete()
      .eq('id', body.id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Delete failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
