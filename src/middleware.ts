import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_ROUTES = ['/', '/login', '/signup', '/roadmap']
const PUBLIC_PREFIXES = ['/api/webhooks/', '/api/auth/', '/api/briefs/', '/briefs/', '/_next/', '/favicon']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes and prefixes
  if (
    PUBLIC_ROUTES.includes(pathname) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  ) {
    return NextResponse.next()
  }

  // In demo mode, bypass auth checks for all routes
  if (process.env.DEMO_MODE === 'true') {
    return NextResponse.next()
  }

  const { supabaseResponse, user } = await updateSession(request)

  // If accessing a protected route without a session, redirect to login
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
