import type { Metadata } from 'next'
import './globals.css'

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
      <body className="h-full bg-gray-50 text-gray-900 font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
