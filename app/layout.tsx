import type { Metadata } from 'next'
import { Inter, IBM_Plex_Sans_Arabic } from 'next/font/google'
import './globals.css'
import ClientShell from './shell'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-ibm-arabic',
})

export const metadata: Metadata = {
  title: 'ألمظ استور — Apple Premium Reseller',
  description: 'ارتقِ بتجربتك مع أحدث الأجهزة الذكية الحصرية. وكيل معتمد لأبل في مصر.',
  keywords: 'ألمظ, Apple, iPhone, iPad, Mac, مصر, القاهرة, Apple Premium Reseller',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${inter.variable} ${ibmPlexArabic.variable}`}
    >
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
        {/*
          ClientShell detects the pathname and renders:
          • /dashboard/* → bare children (dashboard owns its full layout)
          • everything else → <Navbar> + <main> + <Footer>
        */}
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  )
}
