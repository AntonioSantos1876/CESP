import { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.clarendonelitesportsprogram.com'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: APP_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${APP_URL}/fixtures`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${APP_URL}/teams`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${APP_URL}/news`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${APP_URL}/live`, lastModified: new Date(), changeFrequency: 'always', priority: 0.8 },
    { url: `${APP_URL}/shop`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${APP_URL}/donate`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${APP_URL}/gallery`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${APP_URL}/sponsors`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${APP_URL}/volunteer`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]
}
