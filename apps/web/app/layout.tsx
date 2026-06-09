import type { Metadata, Viewport } from 'next'
import { NotificationPrompt } from '@/components/NotificationPrompt'
import { Inter } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/components/cart-provider'
import { NavServer } from '@/components/NavServer'
import { ScrollToTop } from '@/components/ScrollToTop'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.clarendonelitesportsprogram.com'

export const metadata: Metadata = {
  title: {
    default: 'Clarendon Elite Sports Program',
    template: '%s | Clarendon Elite Sports Program',
  },
  description: 'The official platform for the Clarendon Elite Sports Program and Clarendon Elite Cup tournament. Live scores, fixtures, news, donations, and more.',
  keywords: ['Clarendon Elite Sports Program', 'Clarendon Elite Cup', 'football', 'charity', 'Jamaica', 'soccer', 'league'],
  metadataBase: new URL(APP_URL),
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: APP_URL,
    title: 'Clarendon Elite Sports Program',
    description: 'The official platform for the Clarendon Elite Sports Program and Clarendon Elite Cup tournament. Live scores, fixtures, news, donations, and more.',
    siteName: 'Clarendon Elite Sports Program',
    images: [{ url: '/brand/cesp-logo.jpg', width: 512, height: 512, alt: 'CESP Logo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clarendon Elite Sports Program',
    description: 'The official platform for the Clarendon Elite Sports Program and Clarendon Elite Cup tournament.',
  },
  verification: {
    google: 'D84jqWWOBVFiEOVJ_D7pq8QHsGpgBKWdZWHSVTO3ZG8',
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'CESP',
    statusBarStyle: 'black-translucent',
    startupImage: '/brand/cesp-logo.jpg',
  },
  alternates: {
    canonical: 'https://www.clarendonelitesportsprogram.com',
  },
  icons: {
    icon: [
      { url: '/brand/cesp-logo.svg', type: 'image/svg+xml' },
      { url: '/brand/cesp-logo.jpg', type: 'image/jpeg', sizes: '320x320' },
    ],
    shortcut: '/brand/cesp-logo.jpg',
    apple: '/brand/cesp-logo.jpg',
  },
}

export const viewport: Viewport = {
  themeColor: '#E85D04',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans bg-bg-base text-text-primary antialiased`}>
        <CartProvider>
          <ScrollToTop />
          <NavServer />
          <div className="pt-16">
            {children}
          </div>
          <NotificationPrompt />
        </CartProvider>
      </body>
    </html>
  )
}
