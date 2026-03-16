import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

interface DashboardLayoutProps {
  children: React.ReactNode
}

// Map pathname patterns to page titles
function getPageTitle(segment: string): string {
  const titles: Record<string, string> = {
    dashboard: 'Dashboard',
    briefs: 'Brief',
    settings: 'Settings',
    'vision-board': 'Vision Board',
  }
  return titles[segment] ?? 'MeetPrep'
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('users')
    .select('email, full_name, avatar_url')
    .eq('id', user.id)
    .single()

  const userEmail = profile?.email ?? user.email ?? null
  const avatarUrl = profile?.avatar_url ?? null

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar userEmail={userEmail} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header
          title="MeetPrep"
          userEmail={userEmail}
          avatarUrl={avatarUrl}
        />
        <main className="flex-1 overflow-y-auto px-8 py-8">{children}</main>
      </div>
    </div>
  )
}
