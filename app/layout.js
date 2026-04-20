import './globals.css'

export const metadata = {
  title: 'متجر الصماد',
  description: 'نظام إدارة الاشتراكات والعملاء والفواتير',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  )
}
