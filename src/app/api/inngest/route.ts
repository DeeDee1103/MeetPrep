import { serve } from 'inngest/next'
import { inngest } from '@/inngest/client'
import { generateBriefFn } from '@/inngest/functions/generateBrief'
import { sendFollowUpEmailFn } from '@/inngest/functions/sendFollowUpEmail'
import { resetBriefCountsFn } from '@/inngest/functions/resetBriefCounts'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateBriefFn, sendFollowUpEmailFn, resetBriefCountsFn],
})
