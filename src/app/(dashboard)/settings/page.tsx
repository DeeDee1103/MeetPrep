import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PLANS } from '@/lib/stripe'
import { getPlanLimit } from '@/lib/utils'
import { SettingsActions } from './SettingsActions'
import { UpgradeButtonClient } from './UpgradeButton'
import type { User } from '@/types'

export default async function SettingsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profileData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileData as User | null
  const plan = profile?.plan ?? 'free'
  const briefsUsed = profile?.briefs_generated_this_month ?? 0
  const limit = getPlanLimit(plan)
  const calendarConnected = profile?.calendar_connected ?? false
  const hasStripeCustomer = !!profile?.stripe_customer_id

  const currentPlanDetails = PLANS.find((p) => p.id === plan)

  const starterPriceId = process.env.STRIPE_STARTER_PRICE_ID ?? ''
  const proPriceId = process.env.STRIPE_PRO_PRICE_ID ?? ''
  const upgradePriceId = plan === 'free' ? starterPriceId : proPriceId
  const upgradeTarget = plan === 'free' ? 'starter' : 'pro'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Manage your account, subscription, and integrations.
        </p>
      </div>

      {/* Plan & Usage */}
      <Card title="Plan & Usage">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Current Plan</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-bold text-gray-900">
                  {currentPlanDetails?.name ?? 'Free'}
                </span>
                <Badge
                  variant={
                    plan === 'pro'
                      ? 'success'
                      : plan === 'starter'
                      ? 'info'
                      : 'default'
                  }
                >
                  {plan.charAt(0).toUpperCase() + plan.slice(1)}
                </Badge>
              </div>
            </div>
            {currentPlanDetails && currentPlanDetails.price > 0 && (
              <p className="text-sm text-gray-500">
                ${currentPlanDetails.price}/month
              </p>
            )}
          </div>

          {/* Usage bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-sm text-gray-600">Briefs this month</p>
              <p className="text-sm font-medium text-gray-900">
                {briefsUsed}
                {limit !== null ? ` / ${limit}` : ' (unlimited)'}
              </p>
            </div>
            {limit !== null && (
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    briefsUsed / limit > 0.8 ? 'bg-red-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${Math.min((briefsUsed / limit) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Features */}
          {currentPlanDetails && (
            <ul className="space-y-1.5 pt-2 border-t border-gray-100">
              {currentPlanDetails.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="h-4 w-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          )}

          <SettingsActions
            plan={plan}
            hasStripeCustomer={hasStripeCustomer}
            stripeCustomerId={profile?.stripe_customer_id ?? null}
          />
        </div>
      </Card>

      {/* Calendar Integration */}
      <Card title="Google Calendar">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-700">
                Calendar Connection
              </p>
              <Badge variant={calendarConnected ? 'success' : 'default'}>
                {calendarConnected ? 'Connected' : 'Not connected'}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {calendarConnected
                ? 'Your Google Calendar is synced. New meetings will automatically generate briefs.'
                : 'Connect your Google Calendar to automatically import meetings.'}
            </p>
          </div>
          <Link
            href="/api/calendar/connect"
            className={`flex-shrink-0 text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${
              calendarConnected
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {calendarConnected ? 'Reconnect' : 'Connect'}
          </Link>
        </div>
      </Card>

      {/* Account */}
      <Card title="Account">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-700">Email</p>
            <p className="text-sm text-gray-900 mt-0.5">{profile?.email ?? user.email}</p>
          </div>
          {profile?.full_name && (
            <div>
              <p className="text-sm font-medium text-gray-700">Name</p>
              <p className="text-sm text-gray-900 mt-0.5">{profile.full_name}</p>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-700">Member since</p>
            <p className="text-sm text-gray-900 mt-0.5">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '—'}
            </p>
          </div>
        </div>
      </Card>

      {/* Upgrade CTA for free/starter */}
      {plan !== 'pro' && (
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-bold mb-1">
            {plan === 'free' ? 'Upgrade to Starter' : 'Upgrade to Pro'}
          </h3>
          <p className="text-indigo-100 text-sm mb-4">
            {plan === 'free'
              ? 'Get 20 briefs per month plus company enrichment and LinkedIn summaries.'
              : 'Unlimited briefs, advanced research, and priority support.'}
          </p>
          <UpgradeButtonClient priceId={upgradePriceId} planName={upgradeTarget} />
        </div>
      )}
    </div>
  )
}
