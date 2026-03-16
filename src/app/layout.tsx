import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MeetPrep – AI Meeting Intelligence',
  description:
    'Walk into every meeting fully prepared. MeetPrep generates AI-powered briefs with attendee research, talking points, and icebreakers.',
  openGraph: {
    title: 'MeetPrep – AI Meeting Intelligence',
    description: 'Walk into every meeting fully prepared.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50 text-gray-900 antialiased`}>
        {children}
      </body>
    </html>
  )
}
