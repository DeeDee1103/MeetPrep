import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/stripe'
import type { User } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { priceId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { priceId } = body
  if (!priceId) {
    return NextResponse.json({ error: 'priceId is required' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('email, stripe_customer_id')
    .eq('id', user.id)
    .single()

  const userProfile = profile as Pick<User, 'email' | 'stripe_customer_id'> | null
  const email = userProfile?.email ?? user.email ?? ''

  try {
    const url = await createCheckoutSession(user.id, email, priceId)
    return NextResponse.json({ url })
  } catch (error) {
    console.error('Create checkout session error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
