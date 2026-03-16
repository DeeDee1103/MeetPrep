'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface SettingsActionsProps {
  plan: 'free' | 'starter' | 'pro'
  hasStripeCustomer: boolean
  stripeCustomerId: string | null
}

export function SettingsActions({
  plan,
  hasStripeCustomer,
  stripeCustomerId,
}: SettingsActionsProps) {
  const [loading, setLoading] = useState(false)

  const handleManageBilling = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/create-portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } finally {
      setLoading(false)
    }
  }

  if (plan === 'free' || !hasStripeCustomer) {
    return null
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      loading={loading}
      onClick={handleManageBilling}
    >
      Manage Billing
    </Button>
  )
}
