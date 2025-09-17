import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import { GoogleAnalytics } from '@next/third-parties/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: {
    default: 'Wayhome - Your Real Estate Partner',
    template: '%s | Wayhome'
  },
  description: 'Find your dream property in Albania. Browse apartments, houses, and commercial spaces with Wayhome, the leading real estate platform.',
  keywords: ['real estate', 'Albania', 'property', 'apartment', 'house', 'buy', 'rent', 'Tirana', 'Durrës'],
  authors: [{ name: 'Wayhome' }],
  creator: 'Wayhome',
  publisher: 'Wayhome',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_WEB_URL,
    title: 'Wayhome - Your Real Estate Partner',
    description: 'Find your dream property in Albania with Wayhome.',
    siteName: 'Wayhome',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Wayhome - Real Estate Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wayhome - Your Real Estate Partner',
    description: 'Find your dream property in Albania with Wayhome.',
    images: ['/og-image.jpg'],
    creator: '@wayhome',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="theme-color" content="#2563eb" />
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Emergency CSS while Tailwind loads */
            * { box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; }
            .w-5 { width: 1.25rem !important; }
            .h-5 { height: 1.25rem !important; }
            .w-8 { width: 2rem !important; }
            .h-8 { height: 2rem !important; }
            .text-2xl { font-size: 1.5rem !important; }
            .font-bold { font-weight: 700 !important; }
            .bg-primary-600 { background-color: #2563eb !important; }
            .text-white { color: white !important; }
            .rounded-lg { border-radius: 0.5rem !important; }
            .p-4 { padding: 1rem !important; }
            .mb-4 { margin-bottom: 1rem !important; }
            .flex { display: flex !important; }
            .items-center { align-items: center !important; }
            .justify-center { justify-content: center !important; }
          `
        }} />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
        
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  )
}
