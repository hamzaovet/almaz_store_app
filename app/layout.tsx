import type { Metadata } from 'next'
import { Cairo } from 'next/font/google'
import './globals.css'
import ClientShell from './shell'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-cairo',
})

export const metadata: Metadata = {
  title: 'ألمظ استور — Apple Premium Reseller',
  description: 'ارتقِ بتجربتك مع أحدث الأجهزة الذكية الحصرية. وكيل معتمد لأبل في مصر.',
  keywords: 'ألماظ, Apple, iPhone, iPad, Mac, مصر, القاهرة, Apple Premium Reseller',
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
      className={cairo.variable}
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
