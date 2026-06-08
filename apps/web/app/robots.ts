import { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.clarendonelitesportsprogram.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/profile', '/cart', '/auth', '/api', '/donate/success', '/shop/success'],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  }
}
