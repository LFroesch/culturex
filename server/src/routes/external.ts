import express, { Response } from 'express';
import City from '../models/City';
import { getWikipediaInfo, getYouTubeVideos, getNews } from '../services/externalAPIs';
import { cacheWrapper } from '../utils/cache';

const router = express.Router();

// Cache TTLs (in seconds)
const CACHE_TTL = {
  WIKIPEDIA: 86400,  // 24 hours (city info rarely changes)
  YOUTUBE: 3600,     // 1 hour (videos update frequently)
  NEWS: 1800         // 30 minutes (news is time-sensitive)
};

// Get Wikipedia info for city (cached for 24h)
router.get('/wiki/:cityId', async (req, res: Response) => {
  try {
    const city = await City.findById(req.params.cityId);
    if (!city) {
      res.status(404).json({ error: 'City not found' });
      return;
    }

    const cacheKey = `wiki:${city.name}:${city.country}`;
    const wikiData = await cacheWrapper(
      cacheKey,
      CACHE_TTL.WIKIPEDIA,
      () => getWikipediaInfo(city.name)
    );

    res.json(wikiData);
  } catch (error) {
    console.error('Wikipedia fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch Wikipedia data' });
  }
});

// Get YouTube videos for city (cached for 1h)
router.get('/youtube/:cityId', async (req, res: Response) => {
  try {
    const city = await City.findById(req.params.cityId);
    if (!city) {
      res.status(404).json({ error: 'City not found' });
      return;
    }

    const cacheKey = `youtube:${city.name}:${city.country}`;
    const videos = await cacheWrapper(
      cacheKey,
      CACHE_TTL.YOUTUBE,
      () => getYouTubeVideos(`${city.name} ${city.country}`)
    );

    res.json(videos);
  } catch (error) {
    console.error('YouTube fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch YouTube data' });
  }
});

// Get news for city (cached for 30min)
router.get('/news/:cityId', async (req, res: Response) => {
  try {
    const city = await City.findById(req.params.cityId);
    if (!city) {
      res.status(404).json({ error: 'City not found' });
      return;
    }

    const cacheKey = `news:${city.name}:${city.country}`;
    const news = await cacheWrapper(
      cacheKey,
      CACHE_TTL.NEWS,
      () => getNews(`${city.name} ${city.country}`)
    );

    res.json(news);
  } catch (error) {
    console.error('News fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

export default router;
