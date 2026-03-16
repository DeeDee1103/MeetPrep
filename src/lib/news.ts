interface BingNewsArticle {
  name: string
}

interface BingNewsResponse {
  value?: BingNewsArticle[]
}

export async function getCompanyNews(companyName: string): Promise<string[]> {
  const apiKey = process.env.BING_NEWS_API_KEY
  if (!apiKey) {
    console.warn('BING_NEWS_API_KEY not set, skipping news lookup')
    return []
  }

  try {
    const query = encodeURIComponent(`${companyName} company news`)
    const response = await fetch(
      `https://api.bing.microsoft.com/v7.0/news/search?q=${query}&count=5&freshness=Month&mkt=en-US`,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': apiKey,
        },
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!response.ok) {
      console.warn(`Bing News API error: ${response.status} for ${companyName}`)
      return []
    }

    const data: BingNewsResponse = await response.json()
    const articles = data.value ?? []

    return articles.slice(0, 3).map((article) => article.name)
  } catch (error) {
    console.warn(`Failed to get news for ${companyName}:`, error)
    return []
  }
}
