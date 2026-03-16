import type { CompanySnapshot } from '@/types'

interface ClearbitCompany {
  name?: string
  description?: string
  category?: {
    industry?: string
  }
  metrics?: {
    employees?: number
    employeesRange?: string
  }
  logo?: string
  tags?: string[]
}

export async function enrichCompany(domain: string): Promise<CompanySnapshot | null> {
  const apiKey = process.env.CLEARBIT_API_KEY
  if (!apiKey) {
    console.warn('CLEARBIT_API_KEY not set, skipping company enrichment')
    return null
  }

  try {
    const response = await fetch(
      `https://company.clearbit.com/v2/companies/find?domain=${encodeURIComponent(domain)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      console.warn(`Clearbit API error: ${response.status} for domain ${domain}`)
      return null
    }

    const data: ClearbitCompany = await response.json()

    return {
      name: data.name ?? domain,
      description: data.description ?? '',
      industry: data.category?.industry ?? null,
      employee_count: data.metrics?.employeesRange ??
        (data.metrics?.employees ? String(data.metrics.employees) : null),
      logo_url: data.logo ? `https://logo.clearbit.com/${domain}` : null,
      recent_news: [],
    }
  } catch (error) {
    console.warn(`Failed to enrich company ${domain}:`, error)
    return null
  }
}
