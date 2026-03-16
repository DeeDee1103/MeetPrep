import { NextResponse, type NextRequest } from 'next/server'

// Deprecated: use /api/briefs/demo instead
export async function POST(request: NextRequest) {
  const url = new URL('/api/briefs/demo', request.url)
  return NextResponse.redirect(url, { status: 308 })
}
