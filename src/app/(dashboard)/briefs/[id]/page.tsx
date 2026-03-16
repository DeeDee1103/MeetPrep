import { redirect } from 'next/navigation'

// Brief viewing is handled by the public page at /briefs/[id]
// (no auth required, shareable by link)
interface BriefPageProps {
  params: { id: string }
}

export default function BriefPage({ params }: BriefPageProps) {
  redirect(`/briefs/${params.id}`)
}
