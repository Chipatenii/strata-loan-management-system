import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Strata LMS — Secure Loan Management',
  description: 'Enterprise-grade loan management platform. Fast, secure, and compliance-ready.',
  themeColor: '#0A0F1E',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans`}>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'oklch(0.13 0.03 260)',
              border: '1px solid oklch(0.22 0.04 260)',
              color: 'oklch(0.96 0.005 250)',
            },
          }}
        />
      </body>
    </html>
  )
}
