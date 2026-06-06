import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Clarendon Elite Cup',
    template: '%s | Clarendon Elite Cup',
  },
  description: 'The official platform for the Clarendon Elite Cup charity football league. Live scores, fixtures, news, and more.',
  keywords: ['Clarendon Elite Cup', 'football', 'charity', 'Jamaica', 'soccer', 'league'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'Clarendon Elite Cup',
    description: 'The official platform for the Clarendon Elite Cup charity football league.',
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
        {children}
      </body>
    </html>
  )
}
