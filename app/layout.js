import './globals.css'

export const metadata = {
  title: 'قصّتي | جرّب قصّتك قبل الحلاق',
  description: 'استوديو تجربة قصّات الشعر واللحى بالكاميرا مباشرة على وجهك — أكثر من 40 قصة و19 لحية مع دليل حلاق كامل. يعمل على جهازك بدون ذكاء اصطناعي.',
  applicationName: 'قصّتي',
  icons: { icon: '/icon.svg' },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0b0a09',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=El+Messiri:wght@500;600;700&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,500;1,500&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
