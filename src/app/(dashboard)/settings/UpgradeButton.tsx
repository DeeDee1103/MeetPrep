'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface UpgradeButtonClientProps {
  priceId: string
  planName: string
}

export function UpgradeButtonClient({ priceId, planName }: UpgradeButtonClientProps) {
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    if (!priceId) return
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="secondary"
      size="md"
      loading={loading}
      onClick={handleUpgrade}
      className="bg-white text-indigo-700 hover:bg-indigo-50 border-white"
    >
      Upgrade to {planName.charAt(0).toUpperCase() + planName.slice(1)} →
    </Button>
  )
}
