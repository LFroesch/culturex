import axios from 'axios';

// Wikipedia API
export const getWikipediaInfo = async (cityName: string) => {
  try {
    // Get both summary and full HTML content using Action API
    const [summaryResponse, htmlResponse] = await Promise.all([
      axios.get(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cityName)}`,
        {
          headers: {
            'User-Agent': 'CulturalExchangeApp/1.0 (Educational Project)',
            'Api-User-Agent': 'CulturalExchangeApp/1.0 (Educational Project)'
          }
        }
      ),
      axios.get(
        `https://en.wikipedia.org/w/api.php`,
        {
          params: {
            action: 'parse',
            page: cityName,
            format: 'json',
            prop: 'text',
            disableeditsection: true,
            disabletoc: true
          },
          headers: {
            'User-Agent': 'CulturalExchangeApp/1.0 (Educational Project)',
            'Api-User-Agent': 'CulturalExchangeApp/1.0 (Educational Project)'
          }
        }
      )
    ]);

    return {
      title: summaryResponse.data.title,
      extract: summaryResponse.data.extract,
      thumbnail: summaryResponse.data.thumbnail?.source,
      url: summaryResponse.data.content_urls?.desktop?.page,
      fullHtml: htmlResponse.data.parse?.text?.['*']
    };
  } catch (error) {
    console.error('Wikipedia API error:', error);
    return { error: 'No information available' };
  }
};

// YouTube API
export const getYouTubeVideos = async (cityName: string) => {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return { error: 'YouTube API key not configured' };
    }

    const searchQuery = `${cityName} travel culture documentary`;
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        key: apiKey,
        q: searchQuery,
        part: 'snippet',
        type: 'video',
        maxResults: 10
      }
    });

    return response.data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt
    }));
  } catch (error) {
    console.error('YouTube API error:', error);
    return { error: 'Failed to fetch videos' };
  }
};

// News API
export const getNews = async (cityName: string, countryCode?: string) => {
  try {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
      return { error: 'News API key not configured' };
    }

    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        apiKey,
        q: cityName,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 10
      }
    });

    return response.data.articles.map((article: any) => ({
      title: article.title,
      description: article.description,
      url: article.url,
      urlToImage: article.urlToImage,
      publishedAt: article.publishedAt,
      source: article.source.name
    }));
  } catch (error) {
    console.error('News API error:', error);
    return { error: 'Failed to fetch news' };
  }
};
