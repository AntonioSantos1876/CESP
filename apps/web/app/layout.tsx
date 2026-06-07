import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/components/cart-provider'
import { NavServer } from '@/components/NavServer'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://clarendonelitecup.com'

export const metadata: Metadata = {
  title: {
    default: 'Clarendon Elite Cup',
    template: '%s | Clarendon Elite Cup',
  },
  description: 'The official platform for the Clarendon Elite Cup charity football league. Live scores, fixtures, news, and more.',
  keywords: ['Clarendon Elite Cup', 'football', 'charity', 'Jamaica', 'soccer', 'league'],
  metadataBase: new URL(APP_URL),
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: APP_URL,
    title: 'Clarendon Elite Cup',
    description: 'The official platform for the Clarendon Elite Cup charity football league. Live scores, fixtures, news, and more.',
    siteName: 'Clarendon Elite Cup',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clarendon Elite Cup',
    description: 'The official platform for the Clarendon Elite Cup charity football league.',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: APP_URL,
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
          <NavServer />
          {children}
        </CartProvider>
      </body>
    </html>
  )
}
