export interface LinkedInProfile {
  name: string | null
  role: string | null
  company: string | null
  summary: string | null
}

interface ProxyCurlResolveResponse {
  url?: string
  name?: string
  summary?: string
  experiences?: Array<{
    company?: string
    title?: string
  }>
  occupation?: string
  headline?: string
}

export async function getLinkedInProfile(email: string): Promise<LinkedInProfile | null> {
  const apiKey = process.env.PROXYCURL_API_KEY
  if (!apiKey) {
    console.warn('PROXYCURL_API_KEY not set, skipping LinkedIn enrichment')
    return null
  }

  try {
    // Use the reverse email lookup with profile enrichment in a single call
    const response = await fetch(
      `https://nubela.co/proxycurl/api/linkedin/profile/resolve/email?work_email=${encodeURIComponent(email)}&enrich_profile=enrich`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!response.ok) {
      if (response.status === 404) return null
      console.warn(`ProxyCurl API error: ${response.status} for ${email}`)
      return null
    }

    const data: ProxyCurlResolveResponse = await response.json()

    if (!data.url) return null

    const latestExp = data.experiences?.[0]
    const summaryParts: string[] = []
    if (data.headline) summaryParts.push(data.headline)
    if (data.summary) summaryParts.push(data.summary.slice(0, 400))

    return {
      name: data.name ?? null,
      role: data.occupation ?? latestExp?.title ?? null,
      company: latestExp?.company ?? null,
      summary: summaryParts.join(' — ') || null,
    }
  } catch (error) {
    console.warn(`Failed to get LinkedIn profile for ${email}:`, error)
    return null
  }
}
