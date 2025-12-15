import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sunpower Agency Dashboard',
  description: 'Client Monitoring Dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

