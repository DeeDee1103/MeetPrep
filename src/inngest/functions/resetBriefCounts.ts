import { inngest } from '@/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'

export const resetBriefCountsFn = inngest.createFunction(
  {
    id: 'reset-brief-counts',
    name: 'Reset Monthly Brief Counts',
  },
  { cron: 'TZ=UTC 0 0 1 * *' }, // 1st of every month at midnight UTC
  async ({ step }) => {
    await step.run('reset-counts', async () => {
      const supabase = createAdminClient()
      const { error } = await supabase.rpc('reset_monthly_brief_counts')
      if (error) throw new Error(`Failed to reset brief counts: ${error.message}`)
      console.log('Monthly brief counts reset successfully')
    })
  }
)
