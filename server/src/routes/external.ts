import express, { Response } from 'express';
import City from '../models/City';
import { getWikipediaInfo, getYouTubeVideos, getNews } from '../services/externalAPIs';

const router = express.Router();

// Get Wikipedia info for city
router.get('/wiki/:cityId', async (req, res: Response) => {
  try {
    const city = await City.findById(req.params.cityId);
    if (!city) {
      res.status(404).json({ error: 'City not found' });
      return;
    }

    const wikiData = await getWikipediaInfo(city.name);
    res.json(wikiData);
  } catch (error) {
    console.error('Wikipedia fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch Wikipedia data' });
  }
});

// Get YouTube videos for city
router.get('/youtube/:cityId', async (req, res: Response) => {
  try {
    const city = await City.findById(req.params.cityId);
    if (!city) {
      res.status(404).json({ error: 'City not found' });
      return;
    }

    const videos = await getYouTubeVideos(`${city.name} ${city.country}`);
    res.json(videos);
  } catch (error) {
    console.error('YouTube fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch YouTube data' });
  }
});

// Get news for city
router.get('/news/:cityId', async (req, res: Response) => {
  try {
    const city = await City.findById(req.params.cityId);
    if (!city) {
      res.status(404).json({ error: 'City not found' });
      return;
    }

    const news = await getNews(`${city.name} ${city.country}`);
    res.json(news);
  } catch (error) {
    console.error('News fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

export default router;
