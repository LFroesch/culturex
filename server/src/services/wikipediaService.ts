import axios from 'axios';

/**
 * Wikipedia API Service
 * Uses Wikipedia's free REST API - no API key required!
 * Documentation: https://en.wikipedia.org/api/rest_v1/
 */

interface WikipediaSummary {
  title: string;
  extract: string;
  description?: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  originalImage?: {
    source: string;
    width: number;
    height: number;
  };
  url: string;
}

/**
 * Fetch Wikipedia summary for a given topic
 * @param title - The title to search for (e.g., "Paris", "Tokyo", "Eiffel Tower")
 * @param language - Language code (default: 'en' for English)
 * @returns Wikipedia summary data
 */
export async function getWikipediaSummary(
  title: string,
  language: string = 'en'
): Promise<WikipediaSummary | null> {
  try {
    // Wikipedia REST API endpoint
    const url = `https://${language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'CulturalX-App/1.0 (https://culturalx.com; contact@culturalx.com)',
        'Accept': 'application/json'
      }
    });

    const data = response.data;

    return {
      title: data.title,
      extract: data.extract,
      description: data.description,
      thumbnail: data.thumbnail,
      originalImage: data.originalimage,
      url: data.content_urls?.desktop?.page || `https://${language}.wikipedia.org/wiki/${encodeURIComponent(title)}`
    };
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.log(`Wikipedia article not found for: ${title}`);
      return null;
    }
    console.error('Wikipedia API error:', error.message);
    throw error;
  }
}

/**
 * Search Wikipedia for articles matching a query
 * @param query - Search query
 * @param language - Language code (default: 'en')
 * @param limit - Number of results (default: 5)
 * @returns Array of search results
 */
export async function searchWikipedia(
  query: string,
  language: string = 'en',
  limit: number = 5
): Promise<Array<{ title: string; description: string }>> {
  try {
    const url = `https://${language}.wikipedia.org/w/api.php`;

    const response = await axios.get(url, {
      params: {
        action: 'query',
        list: 'search',
        srsearch: query,
        format: 'json',
        srlimit: limit,
        origin: '*'
      },
      headers: {
        'User-Agent': 'CulturalX-App/1.0'
      }
    });

    const results = response.data.query.search;

    return results.map((result: any) => ({
      title: result.title,
      description: result.snippet.replace(/<\/?[^>]+(>|$)/g, '') // Remove HTML tags
    }));
  } catch (error) {
    console.error('Wikipedia search error:', error);
    return [];
  }
}

/**
 * Get Wikipedia article in multiple languages
 * Useful for showing content in user's preferred language
 */
export async function getMultiLanguageSummary(
  title: string,
  languages: string[] = ['en', 'ja', 'es', 'fr']
): Promise<Record<string, WikipediaSummary | null>> {
  const results: Record<string, WikipediaSummary | null> = {};

  await Promise.all(
    languages.map(async (lang) => {
      try {
        results[lang] = await getWikipediaSummary(title, lang);
      } catch (error) {
        results[lang] = null;
      }
    })
  );

  return results;
}
